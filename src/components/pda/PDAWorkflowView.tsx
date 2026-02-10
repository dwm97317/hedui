import { useState, useEffect, useRef } from 'react';
import { Typography, Button, Space, Card, Divider, Tag, Input, message, List, Badge } from 'antd';
import {
    BarcodeOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    WarningFilled,
    ScanOutlined,
    EditOutlined,
    CheckOutlined
} from '@ant-design/icons';
import { Role, Batch, Parcel } from '../../types';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

interface PDAWorkflowViewProps {
    role: Role;
    activeBatch: Batch;
    onScan: (barcode: string) => void;
    currentUserId: string;
    canEdit: boolean;
    activeBarcode: string | null;
    onReset: () => void;
}

export default function PDAWorkflowView({
    role,
    activeBatch,
    onScan,
    currentUserId,
    canEdit,
    activeBarcode,
    onReset
}: PDAWorkflowViewProps) {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');
    const [batchParcels, setBatchParcels] = useState<Parcel[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<any>(null);

    // Fetch parcels in this batch
    const fetchBatchData = async () => {
        if (!activeBatch?.id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('parcels')
            .select('*')
            .eq('batch_id', activeBatch.id)
            .order('updated_at', { ascending: false });

        if (!error && data) setBatchParcels(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchBatchData();
        // Subscribe to changes
        const channel = supabase.channel('pda-batch-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'parcels', filter: `batch_id=eq.${activeBatch.id}` }, () => fetchBatchData())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [activeBatch.id]);

    const handleManualVerify = () => {
        if (inputValue.trim()) {
            onScan(inputValue.trim());
            setInputValue('');
        }
    };

    const toggleStatus = async (parcel: Parcel) => {
        if (!canEdit) return;
        // Cycle status: pending -> verified (sent/received/in_transit) -> anomaly -> pending
        let nextStatus = 'pending';
        const currentStatus = parcel.status;

        if (currentStatus === 'pending') {
            nextStatus = role === 'sender' ? 'sent' : (role === 'transit' ? 'in_transit' : 'received');
        } else if (currentStatus === 'sent' || currentStatus === 'in_transit' || currentStatus === 'received') {
            nextStatus = 'anomaly';
        } else {
            nextStatus = 'pending';
        }

        const { error } = await supabase
            .from('parcels')
            .update({ status: nextStatus, updated_at: new Date().toISOString() })
            .eq('id', parcel.id);

        if (error) message.error(t('common.error'));
        else message.success(t('parcel.save_success'));
    };

    const getStatusTag = (status: string) => {
        switch (status) {
            case 'sent':
            case 'received':
            case 'in_transit':
                return <Tag color="success" icon={<CheckCircleFilled />} style={{ fontWeight: 700 }}>{t('pda.status_passed')}</Tag>;
            case 'anomaly':
                return <Tag color="error" icon={<WarningFilled />} style={{ fontWeight: 700 }}>{t('pda.status_anomaly')}</Tag>;
            default:
                return <Tag color="default" style={{ fontWeight: 700 }}>{t('pda.status_unverified')}</Tag>;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
            {/* 1️⃣ Header */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'var(--shadow-pro)'
            }}>
                <Typography.Title level={4} style={{ margin: 0, color: 'var(--primary)' }}>
                    {t('pda.verify_title')}
                </Typography.Title>
                <Tag color="purple" style={{ margin: 0, fontWeight: 800 }}>{t(`roles.${role}`)}</Tag>
            </div>

            {/* 2️⃣ Verification Input Area */}
            <Card className="glass-card" styles={{ body: { padding: '16px' } }}>
                <Input
                    ref={inputRef}
                    size="large"
                    placeholder={t('parcel.scanner_placeholder_full') || '请输入 / 扫描 单号'}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onPressEnter={handleManualVerify}
                    prefix={<BarcodeOutlined style={{ color: 'var(--primary)' }} />}
                    style={{
                        height: '54px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: 700,
                        border: '2px solid var(--border-light)'
                    }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<ScanOutlined />}
                        style={{ height: '56px', borderRadius: '12px', fontWeight: 800 }}
                        onClick={() => inputRef.current?.focus()}
                    >
                        {t('pda.scan_verify')}
                    </Button>
                    <Button
                        size="large"
                        icon={<EditOutlined />}
                        style={{ height: '56px', borderRadius: '12px', fontWeight: 800, border: '2px solid var(--primary)', color: 'var(--primary)' }}
                        onClick={handleManualVerify}
                    >
                        {t('pda.manual_verify')}
                    </Button>
                </div>

                <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: '12px', fontSize: '12px', fontWeight: 600 }}>
                    📌 {t('pda.double_click_hint')}
                </Typography.Text>
            </Card>

            {/* 3️⃣ Verification Result Area (List) */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'white', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <List
                    loading={loading}
                    dataSource={batchParcels}
                    renderItem={(item) => (
                        <List.Item
                            onDoubleClick={() => toggleStatus(item)}
                            style={{
                                padding: '16px',
                                borderBottom: '1px solid var(--bg-app)',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                background: item.barcode === activeBarcode ? 'rgba(139, 92, 246, 0.05)' : 'transparent'
                            }}
                            className="pda-list-item"
                        >
                            <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <Typography.Text style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)' }}>
                                        {item.barcode}
                                    </Typography.Text>
                                    {getStatusTag(item.status)}
                                </div>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    <Badge color="blue" text={<span style={{ fontWeight: 600, color: 'var(--text-sub)' }}>{t('parcel.weight_label')}: {item.sender_weight || item.transit_weight || item.receiver_weight || '-'}kg</span>} />
                                    <Badge color="purple" text={<span style={{ fontWeight: 600, color: 'var(--text-sub)' }}>{t('batch.number')}: {activeBatch.batch_number}</span>} />
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
            </div>

            {/* 4️⃣ Bottom Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', paddingBottom: '8px' }}>
                <Button
                    type="primary"
                    size="large"
                    block
                    icon={<CheckOutlined />}
                    style={{ height: '64px', borderRadius: '16px', fontSize: '18px', fontWeight: 900 }}
                    onClick={() => message.success(t('parcel.save_success'))}
                >
                    {t('pda.verify_complete')}
                </Button>
                <Button
                    danger
                    size="large"
                    block
                    style={{ height: '64px', borderRadius: '16px', fontWeight: 800 }}
                >
                    {t('pda.skip_item')}
                </Button>
            </div>

            <style>{`
                .pda-list-item:active {
                    background: var(--bg-app) !important;
                }
            `}</style>
        </div>
    );
}
