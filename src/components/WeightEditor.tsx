import { useState, useEffect, useRef } from 'react';
import { Input, Button, Form, Typography, message } from 'antd';
import { SaveOutlined, ForwardOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { Role } from '../types';

interface WeightEditorProps {
    role: Role;
    barcode: string | null;
    activeBatchId?: string | null;
    onSave: () => void;
    readOnly?: boolean;
    currentUserId?: string;
}

const ROLE_LABELS: any = {
    sender: '发出重量 (Sender Weight)',
    transit: '中转重量 (Transit Weight)',
    receiver: '接收重量 (Receiver Weight)'
};

export default function WeightEditor({ role, barcode, activeBatchId, onSave, readOnly, currentUserId }: WeightEditorProps) {
    const [weight, setWeight] = useState('');
    const label = ROLE_LABELS[role];
    const [fetching, setFetching] = useState(false);
    const [isLockedByOther, setIsLockedByOther] = useState(false); // New state to track if locked by another user
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

                if (role === 'sender') {
                    existingWeight = data.sender_weight;
                    existingUserId = data.sender_user_id;
                } else if (role === 'transit') {
                    existingWeight = data.transit_weight;
                    existingUserId = data.transit_user_id;
                } else if (role === 'receiver') {
                    existingWeight = data.receiver_weight;
                    existingUserId = data.receiver_user_id;
                }

                // If data exists AND belongs to someone else, enforce Read-Only logic
                if (existingWeight !== null && existingUserId && existingUserId !== currentUserId) {
                    message.warning(`该包裹已由其他操作员 (${existingUserId}) 录入，您只能补充未填项。`);
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
        if (!barcode) return message.warning('请先扫码');
        if (!weight) return message.warning('请输入重量');

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

            message.success('保存成功');
            setWeight('');
            onSave();
        } catch (err: any) {
            message.error('保存失败: ' + err.message);
        } finally {
            setFetching(false);
        }
    };

    return (
        <Form layout="vertical" className="neon-card" style={{ padding: '15px' }}>
            <div style={{ marginBottom: '15px' }}>
                <Typography.Text type="secondary" style={{ fontSize: '12px' }}>录入责任: {label}</Typography.Text>
                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '18px' }}>
                    {barcode || '等待扫码...'}
                </div>
            </div>

            <Form.Item label={<span style={{ color: 'white' }}>录入重量 (kg)</span>}>
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
                保存并继续 (Enter)
            </Button>

            {!readOnly && (
                <Button
                    icon={<ForwardOutlined />}
                    style={{ marginTop: '10px', background: 'transparent', color: 'var(--text-sub)' }}
                    block
                    onClick={() => { setWeight(''); onSave(); }}
                >
                    跳过此件
                </Button>
            )}
        </Form>
    );
}
