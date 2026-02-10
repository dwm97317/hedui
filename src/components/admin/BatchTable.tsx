
import { Table, Tag, Space, Button } from 'antd';

interface BatchTableProps {
    batches: any[];
    onManageRole: (batch: any) => void;
    onRevokeRole: (roleId: string) => void;
}

export default function BatchTable({ batches, onManageRole, onRevokeRole }: BatchTableProps) {
    const columns = [
        { title: '批次号', dataIndex: 'batch_number', key: 'batch_number' },
        { title: '日期', dataIndex: 'business_date', key: 'business_date' },
        { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'gray'}>{s.toUpperCase()}</Tag> },
        {
            title: '经办人 (Assigned Staff)',
            key: 'roles',
            render: (_: any, record: any) => (
                <Space direction="vertical" size="small">
                    {['sender', 'transit', 'receiver'].map(role => {
                        const assigned = record.batch_user_roles?.find((r: any) => r.role === role && r.is_active);
                        return (
                            <div key={role} style={{ fontSize: '12px' }}>
                                <Tag bordered={false}>{role.toUpperCase()}:</Tag>
                                {assigned ? (
                                    <Tag color="cyan" closable onClose={() => onRevokeRole(assigned.id)}>
                                        {assigned.user?.nickname || assigned.user_id}
                                    </Tag>
                                ) : (
                                    <span style={{ color: '#999' }}>未分配</span>
                                )}
                            </div>
                        );
                    })}
                    <Button type="link" size="small" onClick={() => onManageRole(record)}>
                        管理权限
                    </Button>
                </Space>
            )
        }
    ];

    return <Table dataSource={batches} columns={columns} rowKey="id" pagination={{ pageSize: 5 }} />;
}
