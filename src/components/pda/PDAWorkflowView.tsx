import { useState, useEffect, useRef } from 'react';
import { Typography, Button, Space, Card, Tag, Input, message, List, Badge } from 'antd';
import {
    BarcodeOutlined,
    CheckCircleFilled,
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
    canEdit,
    activeBarcode,
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
                return <Tag color="#10B981" icon={<CheckCircleFilled />} style={{ fontWeight: 700, padding: '4px 8px' }}>{t('pda.status_passed')}</Tag>;
            case 'anomaly':
                return <Tag color="#EF4444" icon={<WarningFilled />} style={{ fontWeight: 700, padding: '4px 8px' }}>{t('pda.status_anomaly')}</Tag>;
            default:
                return <Tag color="default" style={{ fontWeight: 700, padding: '4px 8px' }}>{t('pda.status_unverified')}</Tag>;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', background: 'var(--color-background)', padding: '8px' }}>
            {/* 1️⃣ Header */}
            <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography.Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        {t('batch.number')}
                    </Typography.Text>
                    <Typography.Text style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-code)' }}>
                        {activeBatch.batch_number}
                    </Typography.Text>
                </div>
                <Tag color="geekblue" style={{ margin: 0, fontWeight: 800, fontSize: '14px', padding: '4px 10px' }}>
                    {t(`roles.${role}`)}
                </Tag>
            </div>

            {/* 2️⃣ Verification Input Area */}
            <Card
                className="glass-card"
                styles={{ body: { padding: '20px' } }}
                style={{ border: '1px solid rgba(37, 99, 235, 0.2)', boxShadow: 'var(--shadow-md)' }}
            >
                <div style={{ marginBottom: '16px' }}>
                    <Input
                        ref={inputRef}
                        size="large"
                        placeholder={t('parcel.scanner_placeholder_full') || 'SCAN BARCODE'}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onPressEnter={handleManualVerify}
                        prefix={<BarcodeOutlined style={{ color: 'var(--color-primary)', fontSize: '24px' }} />}
                        style={{
                            height: '64px',
                            borderRadius: '12px',
                            fontSize: '20px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-code)',
                            border: '2px solid var(--color-primary)'
                        }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<ScanOutlined />}
                        style={{ height: '56px', borderRadius: '12px', fontWeight: 800, background: 'var(--color-primary)' }}
                        onClick={() => inputRef.current?.focus()}
                        className="btn-primary"
                    >
                        {t('pda.scan_verify')}
                    </Button>
                    <Button
                        size="large"
                        icon={<EditOutlined />}
                        style={{ height: '56px', borderRadius: '12px', fontWeight: 800, border: '2px solid var(--color-primary)', color: 'var(--color-primary)' }}
                        onClick={handleManualVerify}
                        className="btn-secondary"
                    >
                        {t('pda.manual_verify')}
                    </Button>
                </div>
            </Card>

            {/* 3️⃣ Verification Result Area (List) */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'var(--shadow-inner)' }}>
                <List
                    loading={loading}
                    dataSource={batchParcels}
                    renderItem={(item) => (
                        <List.Item
                            onDoubleClick={() => toggleStatus(item)}
                            style={{
                                padding: '20px',
                                borderBottom: '1px solid #F3F4F6',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: item.barcode === activeBarcode ? '#EFF6FF' : 'transparent',
                                borderLeft: item.barcode === activeBarcode ? '4px solid var(--color-primary)' : '4px solid transparent'
                            }}
                            className="pda-list-item"
                        >
                            <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <Typography.Text style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-text)', fontFamily: 'var(--font-code)' }}>
                                            {item.barcode}
                                        </Typography.Text>
                                        <Space size="small" style={{ marginTop: '4px' }}>
                                            {item.custom_id && <Badge color="purple" text={<span style={{ fontWeight: 600, color: '#6B7280', fontSize: '12px' }}>ID: {item.custom_id}</span>} />}
                                        </Space>
                                    </div>
                                    {getStatusTag(item.status)}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div style={{ background: '#F9FAFB', padding: '8px', borderRadius: '8px' }}>
                                        <Typography.Text type="secondary" style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>WEIGHT</Typography.Text>
                                        <Typography.Text style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                                            {item.sender_weight || item.transit_weight || item.receiver_weight || '-'} <span style={{ fontSize: '12px', color: '#9CA3AF' }}>kg</span>
                                        </Typography.Text>
                                    </div>
                                    <div style={{ background: '#F9FAFB', padding: '8px', borderRadius: '8px' }}>
                                        <Typography.Text type="secondary" style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>DIMS</Typography.Text>
                                        <Typography.Text style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                                            {item.length_cm ? `${item.length_cm}x${item.width_cm}x${item.height_cm}` : '-'}
                                        </Typography.Text>
                                    </div>
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
            </div>

            {/* 4️⃣ Bottom Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', paddingBottom: '8px' }}>
                <Button
                    type="primary"
                    size="large"
                    block
                    icon={<CheckOutlined />}
                    style={{ height: '64px', borderRadius: '16px', fontSize: '18px', fontWeight: 900, background: 'var(--color-cta)', border: 'none', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)' }}
                    onClick={() => message.success(t('parcel.save_success'))}
                    className="pda-action-btn"
                >
                    {t('pda.verify_complete')}
                </Button>
                <Button
                    danger
                    size="large"
                    block
                    style={{ height: '64px', borderRadius: '16px', fontWeight: 800, border: '2px solid #FEE2E2', color: '#EF4444', background: '#FEF2F2' }}
                    className="pda-skip-btn"
                >
                    {t('pda.skip_item')}
                </Button>
            </div>

            <style>{`
                .pda-list-item:active {
                    background: #F3F4F6 !important;
                }
                .pda-action-btn:active {
                    transform: scale(0.98);
                }
            `}</style>
        </div>
    );
}
