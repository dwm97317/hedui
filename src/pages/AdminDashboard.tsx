import { useState, useEffect } from 'react';
import { Layout, Typography, Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message, Avatar } from 'antd';
import { UserOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';

const { Header, Content } = Layout;

export default function AdminDashboard() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('users'); // users | batches
    const [users, setUsers] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Security Check: Admin Access Only
    useEffect(() => {
        const checkAuth = async () => {
            const userId = localStorage.getItem('mock_user_id') || 'U001';
            const { data: user } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (!user || !['admin', 'auditor'].includes(user.system_role)) {
                message.error('您无权访问后台管理系统');
                setTimeout(() => window.location.href = '/', 1500);
            } else {
                setCurrentUser(user);
                setLoading(false);
                fetchUsers();
                fetchBatches();
            }
        };
        checkAuth();
    }, []);

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    }

    const fetchUsers = async () => {
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data);
    };

    const fetchBatches = async () => {
        // Fetch batches with their assigned roles
        const { data } = await supabase
            .from('batches')
            .select(`
                *,
                batch_user_roles (
                    id, role, user_id, is_active,
                    user:users(nickname, avatar_url)
                )
            `)
            .order('created_at', { ascending: false });
        if (data) setBatches(data);
    };

    // User Management
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userForm] = Form.useForm();

    const handleCreateUser = async (values: any) => {
        const { error } = await supabase.from('users').insert({
            id: values.id,
            nickname: values.nickname,
            system_role: values.system_role
        });
        if (error) message.error(error.message);
        else {
            message.success('用户创建成功');
            setIsUserModalOpen(false);
            fetchUsers();
        }
    };

    // Batch Role Assignment
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignForm] = Form.useForm();
    const [selectedBatch, setSelectedBatch] = useState<any>(null);

    const handleAssignRole = async (values: any) => {
        // Deactivate existing active role for this batch/role combo first
        await supabase
            .from('batch_user_roles')
            .update({ is_active: false, revoked_at: new Date().toISOString() })
            .eq('batch_id', selectedBatch.id)
            .eq('role', values.role)
            .eq('is_active', true);

        // Insert new active record
        const { error } = await supabase.from('batch_user_roles').insert({
            batch_id: selectedBatch.id,
            user_id: values.user_id,
            role: values.role,
            assigned_by: currentUser.id
        });

        if (error) message.error(error.message);
        else {
            message.success('权限分配成功');
            setIsAssignModalOpen(false);
            fetchBatches();
        }
    };

    const handleRevokeRole = async (roleId: string) => {
        const { error } = await supabase
            .from('batch_user_roles')
            .update({ is_active: false, revoked_at: new Date().toISOString() })
            .eq('id', roleId);

        if (error) message.error(error.message);
        else {
            message.success('权限已撤销');
            fetchBatches();
        }
    };

    const columnsUsers = [
        { title: 'ID (LINE)', dataIndex: 'id', key: 'id' },
        { title: '昵称', dataIndex: 'nickname', key: 'nickname', render: (t: string) => <Tag color="blue">{t}</Tag> },
        { title: '系统角色', dataIndex: 'system_role', key: 'system_role', render: (t: string) => <Tag color={t === 'admin' ? 'red' : 'green'}>{t.toUpperCase()}</Tag> },
        { title: '最后登录', dataIndex: 'last_login_at', key: 'last_login_at', render: (t: string) => t ? new Date(t).toLocaleString() : '-' }
    ];

    const columnsBatches = [
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
                                    <Tag color="cyan" closable onClose={() => handleRevokeRole(assigned.id)}>
                                        {assigned.user?.nickname || assigned.user_id}
                                    </Tag>
                                ) : (
                                    <span style={{ color: '#999' }}>未分配</span>
                                )}
                            </div>
                        );
                    })}
                    <Button type="link" size="small" onClick={() => { setSelectedBatch(record); setIsAssignModalOpen(true); }}>
                        管理权限
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                    <SafetyCertificateOutlined /> 隐藏后台 (Hidden Backstage)
                </div>
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <span style={{ color: 'white' }}>{currentUser?.nickname} ({currentUser?.system_role})</span>
                </Space>
            </Header>
            <Content style={{ padding: '24px', background: '#f0f2f5' }}>
                <Space style={{ marginBottom: '20px' }}>
                    <Button type={activeTab === 'users' ? 'primary' : 'default'} onClick={() => setActiveTab('users')} icon={<UserOutlined />}>人员管理</Button>
                    <Button type={activeTab === 'batches' ? 'primary' : 'default'} onClick={() => setActiveTab('batches')} icon={<TeamOutlined />}>批次权限</Button>
                </Space>

                {activeTab === 'users' && (
                    <Card title="人员列表" extra={<Button type="primary" onClick={() => setIsUserModalOpen(true)}>新增人员</Button>}>
                        <Table dataSource={users} columns={columnsUsers} rowKey="id" pagination={false} />
                    </Card>
                )}

                {activeTab === 'batches' && (
                    <Card title="批次权限分配">
                        <Table dataSource={batches} columns={columnsBatches} rowKey="id" pagination={{ pageSize: 5 }} />
                    </Card>
                )}

                {/* Create User Modal */}
                <Modal title="新增人员" open={isUserModalOpen} onCancel={() => setIsUserModalOpen(false)} onOk={userForm.submit}>
                    <Form form={userForm} onFinish={handleCreateUser} layout="vertical">
                        <Form.Item name="id" label="LINE User ID" rules={[{ required: true }]}>
                            <Input placeholder="U123456..." />
                        </Form.Item>
                        <Form.Item name="nickname" label="昵称" rules={[{ required: true }]}>
                            <Input placeholder="张三" />
                        </Form.Item>
                        <Form.Item name="system_role" label="系统角色" initialValue="operator">
                            <Select>
                                <Select.Option value="operator">Operator (一线)</Select.Option>
                                <Select.Option value="admin">Admin (后台)</Select.Option>
                                <Select.Option value="auditor">Auditor (审计)</Select.Option>
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Assign Role Modal */}
                <Modal title={`分配权限: ${selectedBatch?.batch_number}`} open={isAssignModalOpen} onCancel={() => setIsAssignModalOpen(false)} onOk={assignForm.submit}>
                    <Form form={assignForm} onFinish={handleAssignRole} layout="vertical">
                        <Form.Item name="role" label="负责环节" rules={[{ required: true }]}>
                            <Select>
                                <Select.Option value="sender">发出方 (Sender)</Select.Option>
                                <Select.Option value="transit">中转方 (Transit)</Select.Option>
                                <Select.Option value="receiver">接收方 (Receiver)</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="user_id" label="指派人员" rules={[{ required: true }]}>
                            <Select showSearch optionFilterProp="children">
                                {users.map(u => (
                                    <Select.Option key={u.id} value={u.id}>{u.nickname} ({u.id})</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>
            </Content>
        </Layout>
    );
}
