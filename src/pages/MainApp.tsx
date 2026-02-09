import { useState, useEffect } from 'react';
import { Layout, Typography, Space, Button, Tag, Modal, message, Alert, Input } from 'antd';
import { LogoutOutlined, HistoryOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import Scanner from '../components/Scanner';
import ParcelTable from '../components/ParcelTable';
import WeightEditor from '../components/WeightEditor';
import BatchSelector from '../components/BatchSelector';
import { Role, Batch } from '../types';
import '../index.css';

const { Header, Content } = Layout;

export default function MainApp() {
    const [role, setRole] = useState<Role>('sender');
    const [activeBatch, setActiveBatch] = useState<Batch | null>(null);
    const [activeBarcode, setActiveBarcode] = useState<string | null>(null);

    // Mock User Context (In real app, get from LINE/Auth)
    const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('mock_user_id') || 'U001');
    const [currentUserNickname, setCurrentUserNickname] = useState('操作员A');
    const [systemRole, setSystemRole] = useState('operator');
    const [isUserFetched, setIsUserFetched] = useState(false);

    // Permissions
    const [canEdit, setCanEdit] = useState(false);

    useEffect(() => {
        syncUser();
    }, [currentUserId]);

    const syncUser = async () => {
        if (!currentUserId) return;

        // 1. Upsert user (trigger will handle first admin)
        const { error: upsertError } = await supabase.from('users').upsert({
            id: currentUserId,
            nickname: currentUserId === 'U001' ? '初始管理员' : `用户_${currentUserId.slice(-4)}`,
            last_login_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (upsertError) {
            console.error('Sync user error:', upsertError);
            return;
        }

        // 2. Fetch official info (including role assigned by trigger/admin)
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUserId)
            .single();

        if (user) {
            setCurrentUserNickname(user.nickname);
            setSystemRole(user.system_role);
            setIsUserFetched(true);
        }
    };

    useEffect(() => {
        checkPermission();
    }, [activeBatch, role, currentUserId]);

    const checkPermission = async () => {
        if (!activeBatch) return;

        // 1. If batch is completed, NO ONE can edit
        if (activeBatch.status === 'completed') {
            setCanEdit(false);
            return;
        }

        // 2. Check if current user is assigned to this role in this batch
        const { data } = await supabase
            .from('batch_user_roles')
            .select('*')
            .eq('batch_id', activeBatch.id)
            .eq('user_id', currentUserId)
            .eq('role', role)
            .eq('is_active', true)
            .single();

        setCanEdit(!!data);
    };

    const handleScan = async (barcode: string) => {
        // In the new model, scanning always refers to a parcel within the active batch
        setActiveBarcode(barcode);
    };

    const handleSaveWeight = () => {
        setActiveBarcode(null);
    };

    return (
        <Layout style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
            <Header style={{ background: 'rgba(0,0,0,0.3)', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                    <Typography.Title level={4} style={{ color: 'var(--primary)', margin: 0 }}>
                        集运对账系统
                    </Typography.Title>
                    {activeBatch && (
                        <Tag color="gold" icon={<HistoryOutlined />}>
                            批次: {activeBatch.batch_number} ({activeBatch.business_date})
                        </Tag>
                    )}
                </Space>
                <Space>
                    <div style={{ color: 'white', marginRight: '10px' }}>当前角色:</div>
                    <Button.Group>
                        {(['sender', 'transit', 'receiver'] as Role[]).map(r => (
                            <Button
                                key={r}
                                type={role === r ? 'primary' : 'default'}
                                onClick={() => setRole(r)}
                                size="small"
                            >
                                {r === 'sender' ? '发出方' : r === 'transit' ? '中转方' : '接收方'}
                            </Button>
                        ))}
                    </Button.Group>
                    {activeBatch && (
                        <Space>
                            {activeBatch.status === 'active' && (
                                <Button
                                    type="primary"
                                    danger
                                    size="small"
                                    onClick={() => {
                                        Modal.confirm({
                                            title: '确认完成并锁定批次？',
                                            content: '完成后该批次将进入只读状态，无法再录入或修改数据。',
                                            onOk: async () => {
                                                const { error } = await supabase
                                                    .from('batches')
                                                    .update({ status: 'completed' })
                                                    .eq('id', activeBatch.id);
                                                if (error) return message.error('操作失败: ' + error.message);
                                                message.success('批次已锁定');
                                                setActiveBatch({ ...activeBatch, status: 'completed' });
                                            }
                                        });
                                    }}
                                >
                                    完成批次
                                </Button>
                            )}
                            <Button
                                icon={<LogoutOutlined />}
                                size="small"
                                ghost
                                onClick={() => {
                                    setActiveBatch(null);
                                    setActiveBarcode(null);
                                }}
                            >
                                退出批次
                            </Button>
                        </Space>
                    )}
                </Space>
            </Header>

            <Content style={{ padding: '24px' }}>
                {!activeBatch ? (
                    <BatchSelector onSelect={setActiveBatch} />
                ) : (
                    <div className="main-grid">
                        {/* Permission Warning */}
                        {!canEdit && activeBatch.status !== 'completed' && (
                            <Alert
                                message={`权限受限: 您 (${currentUserNickname}) 未被授权操作当前批次的【${role}】环节。仅可查看。`}
                                type="warning"
                                showIcon
                                style={{ marginBottom: '20px', gridColumn: 'span 2', background: 'rgba(250, 173, 20, 0.1)', border: '1px solid rgba(250, 173, 20, 0.2)', color: '#faad14' }}
                            />
                        )}
                        {activeBatch.status === 'completed' && (
                            <Alert
                                message="只读模式: 该批次已完成。所有数据已锁定，无法继续修改。"
                                type="info"
                                showIcon
                                style={{ marginBottom: '20px', gridColumn: 'span 2', background: 'rgba(24, 144, 255, 0.1)', border: '1px solid rgba(24, 144, 255, 0.2)', color: '#1890ff' }}
                            />
                        )}
                        <div className="left-panel">
                            <Space direction="vertical" style={{ width: '100%' }} size="large">
                                <Scanner onScan={handleScan} disabled={!canEdit} />
                                <WeightEditor
                                    role={role}
                                    barcode={activeBarcode}
                                    activeBatchId={activeBatch.id}
                                    onSave={handleSaveWeight}
                                    readOnly={!canEdit}
                                    currentUserId={currentUserId}
                                />
                            </Space>
                        </div>
                        <div className="right-panel">
                            <ParcelTable
                                role={role}
                                activeBarcode={activeBarcode}
                                activeBatchId={activeBatch.id}
                                readOnly={!canEdit}
                            />
                        </div>

                        {/* Debug User Switcher */}
                        <div style={{ position: 'fixed', bottom: 10, right: 10, opacity: 0.1, zIndex: 9999 }} className="hover:opacity-100">
                            <Input.Group compact>
                                <Input style={{ width: 100 }} size="small" value={currentUserId} onChange={e => { setCurrentUserId(e.target.value); localStorage.setItem('mock_user_id', e.target.value); }} />
                                <Button size="small" onClick={() => window.location.reload()}>Switch User</Button>
                            </Input.Group>
                        </div>
                    </div>
                )}
            </Content>
        </Layout>
    );
}
