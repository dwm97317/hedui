import { useState, useEffect } from 'react';
import { Table, Tag, Empty, Typography, Button, Space, Modal, Input, message, Tooltip } from 'antd';
import { RetweetOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { Parcel, Role } from '../types';

interface ParcelTableProps {
    role: Role;
    activeBarcode: string | null;
    activeBatchId: string;
    readOnly?: boolean;
}

export default function ParcelTable({ role, activeBarcode, activeBatchId, readOnly }: ParcelTableProps) {
    const [data, setData] = useState<Parcel[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [relations, setRelations] = useState<any[]>([]);

    const fetchRelations = async () => {
        // Only fetch relations that involve packages in this batch
        const { data: rels } = await supabase
            .from('package_relations')
            .select('parent_id, child_id, parent:parcels!parent_id(*)');
        if (rels) setRelations(rels);
    };

    const fetchData = async () => {
        setLoading(true);
        const { data: parcels, error } = await supabase
            .from('parcels')
            .select('*, batches(batch_number)')
            .eq('batch_id', activeBatchId)
            .order('updated_at', { ascending: false });

        if (!error && parcels) {
            setData(parcels);
        }
        fetchRelations();
        setLoading(false);
    };

    useEffect(() => {
        if (!activeBatchId) return;
        fetchData();
        const channel = supabase
            .channel('table-sync-' + activeBatchId)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'parcels', filter: `batch_id=eq.${activeBatchId}` }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'package_relations' }, () => fetchData())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeBatchId]);

    const handleConsolidate = async () => {
        if (selectedRowKeys.length === 0) return message.warning('请先选择包裹');

        let newBarcode = '';
        Modal.confirm({
            title: '转单并换条码 (Consolidate & Relabel)',
            content: (
                <div style={{ marginTop: '10px' }}>
                    <Typography.Text>为选中的 {selectedRowKeys.length} 个包裹生成新条码：</Typography.Text>
                    <Input
                        placeholder="输入新包裹条码..."
                        onChange={(e) => newBarcode = e.target.value}
                        style={{ marginTop: '10px' }}
                    />
                </div>
            ),
            onOk: async () => {
                if (!newBarcode) return message.error('请输入新条码');
                try {
                    const { data: child, error: cError } = await supabase
                        .from('parcels')
                        .insert({
                            barcode: newBarcode,
                            package_type: 'derived',
                            batch_id: activeBatchId
                        })
                        .select().single();

                    if (cError) throw cError;

                    const { error: rError } = await supabase.from('package_relations').insert(
                        selectedRowKeys.map(pid => ({ parent_id: pid, child_id: child.id }))
                    );
                    if (rError) throw rError;

                    await supabase.from('parcels').update({ status: 'relabeled' }).in('id', selectedRowKeys);

                    message.success('转单完成');
                    setSelectedRowKeys([]);
                } catch (err: any) {
                    message.error('错误: ' + err.message);
                }
            }
        });
    };

    const getWeightStyle = (v: any, otherV: any, active: boolean) => {
        const style: any = { color: active ? 'var(--primary)' : 'inherit', fontWeight: active ? 600 : 400 };
        if (v && otherV && Math.abs(parseFloat(v) - parseFloat(otherV)) > 0.1) {
            style.color = '#ff4d4f';
            style.textShadow = '0 0 5px rgba(255, 77, 79, 0.3)';
        }
        return style;
    };

    const columns = [
        {
            title: '条码',
            dataIndex: 'barcode',
            key: 'barcode',
            render: (text: string, record: Parcel) => (
                <Space>
                    <Typography.Text style={{ color: record.id === activeBarcode ? 'var(--primary)' : 'white', fontWeight: 600 }}>
                        {text}
                    </Typography.Text>
                    {record.package_type === 'derived' && <Tag color="cyan">转单件</Tag>}
                    {record.status === 'relabeled' && <Tag color="purple">已转单</Tag>}
                </Space>
            )
        },
        {
            title: '发出重(kg)',
            dataIndex: 'sender_weight',
            key: 'sender_weight',
            render: (v: any, record: Parcel) => (
                <span style={getWeightStyle(v, record.receiver_weight, role === 'sender')}>
                    {v || '-'}
                </span>
            )
        },
        {
            title: '中转重(kg)',
            dataIndex: 'transit_weight',
            key: 'transit_weight',
            render: (v: any) => <span style={{ color: role === 'transit' ? 'var(--primary)' : 'inherit' }}>{v || '-'}</span>
        },
        {
            title: '接收重(kg)',
            dataIndex: 'receiver_weight',
            key: 'receiver_weight',
            render: (v: any, record: Parcel) => (
                <span style={getWeightStyle(v, record.sender_weight, role === 'receiver')}>
                    {v || '-'}
                </span>
            )
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => {
                const colors: any = { relabeled: 'purple', received: 'green', anomaly: 'red', in_transit: 'orange' };
                return <Tag color={colors[s] || 'blue'}>{s.toUpperCase()}</Tag>;
            }
        }
    ];

    const expandedRowRender = (record: Parcel) => {
        const parents = relations.filter(r => r.child_id === record.id).map(r => r.parent);
        if (parents.length === 0) return null;

        return (
            <Table
                columns={[
                    { title: '来源条码', dataIndex: 'barcode', key: 'barcode' },
                    { title: '原发出重', dataIndex: 'sender_weight', key: 'sender_weight' },
                    { title: '原中转重', dataIndex: 'transit_weight', key: 'transit_weight' },
                ]}
                dataSource={parents}
                pagination={false}
                size="small"
                rowKey="id"
                className="inner-table"
            />
        );
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                    {role === 'transit' && (
                        <Button
                            type="primary"
                            icon={<RetweetOutlined />}
                            disabled={selectedRowKeys.length === 0 || readOnly}
                            onClick={handleConsolidate}
                            className="neon-button"
                        >
                            合并并转单 ({selectedRowKeys.length})
                        </Button>
                    )}
                    <Tooltip title="当前视图展示该批次全生命周期数据">
                        <InfoCircleOutlined style={{ color: 'var(--text-sub)' }} />
                    </Tooltip>
                </Space>
            </div>

            <Table
                loading={loading}
                dataSource={data.filter(p => p.package_type !== 'original' || p.status !== 'relabeled')}
                columns={columns}
                rowKey="id"
                rowClassName={record => record.barcode === activeBarcode ? 'active-row' : ''}
                expandable={{
                    expandedRowRender,
                    rowExpandable: record => record.package_type === 'derived'
                }}
                rowSelection={role === 'transit' ? {
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys),
                    getCheckboxProps: (record) => ({ disabled: record.status === 'relabeled' || readOnly }),
                } : undefined}
            />
        </Space>
    );
}
