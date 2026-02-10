import { useState } from 'react';
import { Layout, Space, Card, Button, Avatar } from 'antd';
import { UserOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons';
import { useAdminData } from '../hooks/useAdminData';
import UserTable from '../components/admin/UserTable';
import BatchTable from '../components/admin/BatchTable';
import CreateUserModal from '../components/admin/CreateUserModal';
import AssignRoleModal from '../components/admin/AssignRoleModal';

const { Header, Content } = Layout;

export default function AdminDashboard() {
    const { currentUser, users, batches, loading, fetchUsers, fetchBatches, revokeRole } = useAdminData();
    const [activeTab, setActiveTab] = useState('users'); // users | batches
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<any>(null);

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    }

    const openAssignModal = (batch: any) => {
        setSelectedBatch(batch);
        setIsAssignModalOpen(true);
    };

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
                        <UserTable users={users} />
                    </Card>
                )}

                {activeTab === 'batches' && (
                    <Card title="批次权限分配">
                        <BatchTable
                            batches={batches}
                            onManageRole={openAssignModal}
                            onRevokeRole={revokeRole}
                        />
                    </Card>
                )}

                <CreateUserModal
                    open={isUserModalOpen}
                    onCancel={() => setIsUserModalOpen(false)}
                    onSuccess={() => { setIsUserModalOpen(false); fetchUsers(); }}
                />

                <AssignRoleModal
                    open={isAssignModalOpen}
                    batch={selectedBatch}
                    currentUser={currentUser}
                    users={users}
                    onCancel={() => setIsAssignModalOpen(false)}
                    onSuccess={() => { setIsAssignModalOpen(false); fetchBatches(); }}
                />
            </Content>
        </Layout>
    );
}
