import { useState, useEffect } from 'react';
import { Card, Space, Button, Select, Input, Typography, message, Modal, Divider } from 'antd';
import { PlusOutlined, SelectOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { Batch } from '../types';

interface BatchSelectorProps {
    onSelect: (batch: Batch) => void;
}

export default function BatchSelector({ onSelect }: BatchSelectorProps) {
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
        if (!newBatchNumber) return message.warning('请输入批次号');

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
                message.error('该批次号已存在，请在下拉框中直接选择');
            } else {
                message.error('创建失败: ' + error.message);
            }
        } else {
            message.success('批次创建成功');
            setIsModalOpen(false);
            onSelect(data);
        }
    };

    return (
        <Card className="neon-card" title="任务批次选择 (Batch Selection)" style={{ maxWidth: '600px', margin: '40px auto' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Typography.Text type="secondary">
                    所有操作（扫描、称重、转单）必须在指定批次内进行，以确保账务一致性。
                </Typography.Text>

                <Select
                    placeholder="选择一个进行中的批次..."
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

                <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }}>或者</Divider>

                <Button
                    type="dashed"
                    block
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                    style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                >
                    创建新的一票货 (New Batch)
                </Button>
            </Space>

            <Modal
                title="创建新批次"
                open={isModalOpen}
                onOk={handleCreate}
                onCancel={() => setIsModalOpen(false)}
                okText="创建"
                cancelText="取消"
            >
                <Space direction="vertical" style={{ width: '100%', marginTop: '10px' }}>
                    <Typography.Text>设定批次号（通常为日期或船名）：</Typography.Text>
                    <Input
                        placeholder="例如: 20260209-HK-01"
                        value={newBatchNumber}
                        onChange={e => setNewBatchNumber(e.target.value)}
                    />
                </Space>
            </Modal>
        </Card>
    );
}
