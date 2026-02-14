
import { Table, Tag } from 'antd';
import { User } from '../../types';

interface UserTableProps {
    users: User[];
}

export default function UserTable({ users }: UserTableProps) {
    const columns = [
        { title: 'ID (LINE)', dataIndex: 'id', key: 'id' },
        { title: '昵称', dataIndex: 'nickname', key: 'nickname', render: (t: string) => <Tag color="blue">{t}</Tag> },
        { title: '系统角色', dataIndex: 'system_role', key: 'system_role', render: (t: string) => <Tag color={t === 'admin' ? 'red' : 'green'}>{t.toUpperCase()}</Tag> },
        { title: '最后登录', dataIndex: 'last_login_at', key: 'last_login_at', render: (t: string) => t ? new Date(t).toLocaleString() : '-' }
    ];

    return <Table dataSource={users} columns={columns} rowKey="id" pagination={false} />;
}
