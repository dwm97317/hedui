import { useState, useEffect, useRef } from 'react';
import { Input, Button, Form, Typography, message } from 'antd';
import { SaveOutlined, ForwardOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { Role } from '../types';
import { useTranslation } from 'react-i18next';

interface WeightEditorProps {
    role: Role;
    barcode: string | null;
    activeBatchId?: string | null;
    onSave: () => void;
    readOnly?: boolean;
    currentUserId?: string;
}

export default function WeightEditor({ role, barcode, activeBatchId, onSave, readOnly, currentUserId }: WeightEditorProps) {
    const { t } = useTranslation();
    const [weight, setWeight] = useState('');
    const [fetching, setFetching] = useState(false);
    const [isLockedByOther, setIsLockedByOther] = useState(false);
    const [auditInfo, setAuditInfo] = useState<{ user?: string; time?: string } | null>(null);
    const inputRef = useRef<any>(null);

    useEffect(() => {
        if (readOnly) return;

        const fetchExisting = async () => {
            if (!barcode || !activeBatchId) {
                setWeight('');
                setIsLockedByOther(false);
                return;
            }
            setFetching(true);

            // Fetch existing parcel data to check ownership
            const { data, error } = await supabase
                .from('parcels')
                .select('*')
                .eq('barcode', barcode)
                .eq('batch_id', activeBatchId)
                .single();

            let shouldLock = false;

            if (data) {
                // Check if current user owns the data for this role
                let existingWeight = null;
                let existingUserId = null;
                let existingTime = null;

                if (role === 'sender') {
                    existingWeight = data.sender_weight;
                    existingUserId = data.sender_user_id;
                    existingTime = data.sender_updated_at;
                } else if (role === 'transit') {
                    existingWeight = data.transit_weight;
                    existingUserId = data.transit_user_id;
                    existingTime = data.transit_updated_at;
                } else if (role === 'receiver') {
                    existingWeight = data.receiver_weight;
                    existingUserId = data.receiver_user_id;
                    existingTime = data.receiver_updated_at;
                }

                if (existingUserId) {
                    setAuditInfo({ user: existingUserId, time: existingTime });
                } else {
                    setAuditInfo(null);
                }

                // If data exists AND belongs to someone else, enforce Read-Only logic
                if (existingWeight !== null && existingUserId && existingUserId !== currentUserId) {
                    message.warning(t('parcel.ownership_lock_with_time', { userId: existingUserId, time: existingTime ? new Date(existingTime).toLocaleString() : '-' }));
                    setWeight(existingWeight.toString());
                    setIsLockedByOther(true);
                    shouldLock = true;
                } else if (existingWeight !== null) {
                    setWeight(existingWeight.toString());
                    setIsLockedByOther(false);
                } else {
                    setWeight('');
                    setIsLockedByOther(false);
                }
            } else {
                setWeight('');
                setIsLockedByOther(false);
                setAuditInfo(null);
            }
            setFetching(false);

            // Focus the weight input after fetching, if not locked
            if (inputRef.current && !shouldLock) {
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 100);
            }
        };
        fetchExisting();
    }, [barcode, activeBatchId, role, readOnly, currentUserId]);

    const handleSave = async () => {
        if (readOnly || isLockedByOther) return; // Block save if locked by another user
        if (!barcode) return message.warning(t('parcel.scanner_placeholder'));
        if (!weight) return message.warning(t('parcel.weight_label'));

        setFetching(true);
        try {
            const weightVal = parseFloat(weight);
            let updateData: any = { updated_at: new Date().toISOString() };

            const { data: parcel } = await supabase
                .from('parcels')
                .select('package_type')
                .eq('barcode', barcode)
                .single(); // Added .single() here, as it was missing in the original snippet context.

            if (role === 'sender') {
                updateData.sender_weight = weightVal;
                updateData.status = 'sent';
                updateData.sender_user_id = currentUserId;
            } else if (role === 'transit') {
                updateData.transit_weight = weightVal;
                updateData.status = 'in_transit';
                updateData.transit_user_id = currentUserId;
            } else if (role === 'receiver') {
                updateData.receiver_weight = weightVal;
                updateData.status = 'received';
                updateData.receiver_user_id = currentUserId;
            }

            const { error } = await supabase
                .from('parcels')
                .upsert({
                    barcode,
                    batch_id: activeBatchId,
                    ...updateData
                }, { onConflict: 'barcode' });

            if (error) throw error;

            message.success(t('parcel.save_success'));
            setWeight('');
            onSave();
        } catch (err: any) {
            message.error(t('parcel.save_failed') + ': ' + err.message);
        } finally {
            setFetching(false);
        }
    };

    return (
        <Form layout="vertical" className="neon-card" style={{ padding: '15px' }}>
            <div style={{ marginBottom: '15px' }}>
                <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{t('common.duty') || '录入责任'}: {t(`parcel.${role}_weight`)}</Typography.Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '18px' }}>
                        {barcode || t('parcel.waiting_scan')}
                    </div>
                    {auditInfo && (
                        <div style={{ fontSize: '10px', color: 'var(--text-sub)', textAlign: 'right' }}>
                            <div>{t('parcel.audit_who')}: {auditInfo.user}</div>
                            <div>{auditInfo.time ? new Date(auditInfo.time).toLocaleTimeString() : ''}</div>
                        </div>
                    )}
                </div>
            </div>

            <Form.Item label={<span style={{ color: 'white' }}>{t('parcel.weight_label')}</span>}>
                <Input
                    ref={inputRef}
                    size="large"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    onPressEnter={handleSave}
                    disabled={!barcode || readOnly || isLockedByOther}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                />
            </Form.Item>

            <Button
                type="primary"
                icon={<SaveOutlined />}
                size="large"
                block
                onClick={handleSave}
                loading={fetching}
                disabled={!barcode || readOnly}
            >
                {t('parcel.save_continue')}
            </Button>

            {!readOnly && (
                <Button
                    icon={<ForwardOutlined />}
                    style={{ marginTop: '10px', background: 'transparent', color: 'var(--text-sub)' }}
                    block
                    onClick={() => { setWeight(''); onSave(); }}
                >
                    {t('common.skip')}
                </Button>
            )}
        </Form>
    );
}
