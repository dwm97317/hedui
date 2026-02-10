import { useState, useEffect } from 'react';
import { Card, Space, Button, Select, Input, Typography, message, Modal, Divider } from 'antd';
import { PlusOutlined, SelectOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { Batch } from '../types';
import { useTranslation } from 'react-i18next';

interface BatchSelectorProps {
    onSelect: (batch: Batch) => void;
}

export default function BatchSelector({ onSelect }: BatchSelectorProps) {
    const { t } = useTranslation();
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBatchNumber, setNewBatchNumber] = useState('');

    const fetchBatches = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('batches')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setBatches(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    const handleCreate = async () => {
        if (!newBatchNumber) return message.warning(t('batch.input_error'));

        const { data, error } = await supabase
            .from('batches')
            .insert({
                batch_number: newBatchNumber,
                business_date: new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                message.error(t('batch.exists_error'));
            } else {
                message.error(t('common.error') + ': ' + error.message);
            }
        } else {
            message.success(t('batch.create_success'));
            setIsModalOpen(false);
            onSelect(data);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <Typography.Title level={2} style={{ color: 'white', marginBottom: '8px' }}>
                    {t('batch.selector_title')}
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: '14px' }}>
                    {t('batch.selector_desc')}
                </Typography.Text>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
                {batches.map(b => (
                    <div
                        key={b.id}
                        className="glass-card neon-border-hover"
                        style={{
                            padding: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.3s'
                        }}
                        onClick={() => onSelect(b)}
                    >
                        <div>
                            <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '18px' }}>
                                {b.batch_number}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '4px' }}>
                                {b.business_date}
                            </div>
                        </div>
                        <SelectOutlined style={{ color: 'var(--primary)', fontSize: '20px' }} />
                    </div>
                ))}

                {batches.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>
                        {t('common.no_data')}
                    </div>
                )}
            </div>

            <Button
                type="dashed"
                block
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setIsModalOpen(true)}
                style={{
                    height: '60px',
                    borderRadius: '16px',
                    color: 'var(--primary)',
                    borderColor: 'var(--primary)',
                    background: 'rgba(59, 130, 246, 0.05)',
                    fontWeight: 600
                }}
            >
                {t('batch.create_button')}
            </Button>

            <Modal
                title={t('batch.create_title')}
                open={isModalOpen}
                onOk={handleCreate}
                onCancel={() => setIsModalOpen(false)}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
                className="neon-modal"
                centered
            >
                <div style={{ padding: '10px 0' }}>
                    <Typography.Text style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '8px', display: 'block' }}>
                        {t('batch.create_label')}
                    </Typography.Text>
                    <Input
                        placeholder={t('batch.create_placeholder')}
                        size="large"
                        value={newBatchNumber}
                        onChange={e => setNewBatchNumber(e.target.value)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px'
                        }}
                    />
                </div>
            </Modal>
        </div>
    );
}
