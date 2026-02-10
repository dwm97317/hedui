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
        <Card className="neon-card" style={{ maxWidth: '600px', margin: '40px auto' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Typography.Title level={4} style={{ color: 'var(--primary)', textAlign: 'center', marginBottom: 0 }}>
                    {t('batch.selector_title')}
                </Typography.Title>
                <Typography.Text type="secondary" style={{ textAlign: 'center', display: 'block', fontSize: '13px' }}>
                    {t('batch.selector_desc')}
                </Typography.Text>

                <Select
                    placeholder={t('batch.placeholder')}
                    style={{ width: '100%' }}
                    size="large"
                    loading={loading}
                    onChange={(id) => {
                        const b = batches.find(x => x.id === id);
                        if (b) onSelect(b);
                    }}
                >
                    {batches.map(b => (
                        <Select.Option key={b.id} value={b.id}>
                            {b.batch_number} ({b.business_date})
                        </Select.Option>
                    ))}
                </Select>

                <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }}>{t('batch.or')}</Divider>

                <Button
                    type="dashed"
                    block
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                    style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                >
                    {t('batch.create_button')}
                </Button>
            </Space >

            <Modal
                title={t('batch.create_title')}
                open={isModalOpen}
                onOk={handleCreate}
                onCancel={() => setIsModalOpen(false)}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
            >
                <Space direction="vertical" style={{ width: '100%', marginTop: '10px' }}>
                    <Typography.Text>{t('batch.create_label')}</Typography.Text>
                    <Input
                        placeholder={t('batch.create_placeholder')}
                        value={newBatchNumber}
                        onChange={e => setNewBatchNumber(e.target.value)}
                    />
                </Space>
            </Modal>
        </Card >
    );
}
