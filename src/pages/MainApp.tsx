import { useState, useEffect } from 'react';
import { Layout, Typography, Space, Button, Tag, Modal, message, Alert, Input, Select } from 'antd';
import { LogoutOutlined, HistoryOutlined, PlusOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import Scanner from '../components/Scanner';
import ParcelTable from '../components/ParcelTable';
import WeightEditor from '../components/WeightEditor';
import BatchSelector from '../components/BatchSelector';
import { Role, Batch } from '../types';
import { useTranslation } from 'react-i18next';
import '../index.css';
import { scannerAdapter } from '../services/scanner';
import { scanEngine } from '../services/scanEngine';
import { notification } from 'antd';

const { Header, Content } = Layout;

export default function MainApp() {
    const { t, i18n } = useTranslation();
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

    // Unified Scanner Integration
    useEffect(() => {
        const unsubscribe = scannerAdapter.onScan(async (result) => {
            console.log('MainApp Scanned:', result);

            // 1. Process via Intelligent Scan Engine
            const actionResult = await scanEngine.processScan(result.raw, {
                userId: currentUserId,
                role: role,
                activeBatchId: activeBatch ? activeBatch.id : null,
                currentPath: window.location.pathname
            });

            console.log('Scan Engine Action:', actionResult);

            // 2. Handle Actions
            switch (actionResult.type) {
                case 'OPEN_PARCEL':
                    if (actionResult.payload) {
                        // If parcel belongs to another batch, engine would return SWITCH_BATCH
                        // So here we are safe to just view it
                        setActiveBarcode(actionResult.payload.barcode);
                        if (actionResult.payload.readOnly) {
                            message.info(actionResult.message || 'View Only');
                        } else {
                            message.success('Parcel Found');
                        }
                    }
                    break;
                case 'SWITCH_BATCH':
                    notification.warning({
                        message: 'Batch Mismatch',
                        description: actionResult.message,
                        btn: (
                            <Button type="primary" size="small" onClick={() => {
                                // Logic to switch batch (Payload should have batch info)
                                // We need to fetch the batch details or just set ID if that's enough for Selector?
                                // BatchSelector uses ID? No, MainApp uses full Batch object.
                                // We might need to fetch the batch first.
                                handleSwitchBatch(actionResult.payload.id);
                                notification.close('batch_mismatch');
                            }}>
                                Switch
                            </Button>
                        ),
                        key: 'batch_mismatch'
                    });
                    break;
                case 'NEW_PARCEL_PROMPT':
                    if (role === 'sender') {
                        if (window.confirm(actionResult.message)) {
                            // Pre-fill create? 
                            // For now just set active barcode to let user Create?
                            // Actually, ST flow requires ST number generation. 
                            // If they scanned a random barcode, maybe they want to associate it?
                            // Current requirement: "Unknown -> Prompt + New Parcel".
                            // Let's just notify for now or trigger the "New Parcel" logic?
                            message.info('Please create new parcel manually');
                        }
                    } else {
                        message.error('Unknown Parcel');
                    }
                    break;
                case 'SHOW_ERROR':
                    message.error(actionResult.message);
                    break;
            }
        });

        return () => { unsubscribe(); };
    }, [currentUserId, role, activeBatch]);

    const handleSwitchBatch = async (batchId: string) => {
        const { data } = await supabase.from('batches').select('*').eq('id', batchId).single();
        if (data) setActiveBatch(data);
    };

    return (
        <Layout className="app-container">
            <Header style={{
                background: 'rgba(0,0,0,0.8)',
                padding: '0 15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                lineHeight: 'initial',
                height: 'auto',
                paddingTop: '10px',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography.Text strong style={{ color: 'var(--primary)', fontSize: '16px', lineHeight: 1 }}>
                        {t('common.app_title')}
                    </Typography.Text>
                    <Space size={4} style={{ marginTop: '4px' }}>
                        <Tag color="blue" style={{ fontSize: '10px', padding: '0 4px', margin: 0 }}>{t(`roles.${role}`)}</Tag>
                        {activeBatch && <Tag color="gold" style={{ fontSize: '10px', padding: '0 4px', margin: 0 }}>{activeBatch.batch_number}</Tag>}
                    </Space>
                </div>

                <Space size="middle">
                    <Select
                        size="small"
                        value={i18n.language.split('-')[0]}
                        onChange={(lng: string) => i18n.changeLanguage(lng)}
                        style={{ width: 80 }}
                        className="glass-card"
                        options={[
                            { value: 'zh', label: 'CN' },
                            { value: 'vi', label: 'VN' },
                            { value: 'th', label: 'TH' },
                            { value: 'mm', label: 'MM' }
                        ]}
                    />
                    {activeBatch && (
                        <Button
                            icon={<LogoutOutlined />}
                            size="small"
                            type="text"
                            style={{ color: 'white' }}
                            onClick={() => {
                                setActiveBatch(null);
                                setActiveBarcode(null);
                            }}
                        />
                    )}
                </Space>
            </Header>

            <Content style={{ padding: '15px' }}>
                {!activeBatch ? (
                    <BatchSelector onSelect={setActiveBatch} />
                ) : (
                    <div className="grid-layout">
                        {/* Area 1: Operational Controls */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* Role Switcher (Compact for Mobile) */}
                            <div className="neon-card" style={{ padding: '12px' }}>
                                <div style={{ color: 'var(--text-sub)', fontSize: '12px', marginBottom: '8px' }}>{t('common.role')}:</div>
                                <Button.Group style={{ width: '100%' }}>
                                    {(['sender', 'transit', 'receiver'] as Role[]).map(r => (
                                        <Button
                                            key={r}
                                            type={role === r ? 'primary' : 'default'}
                                            onClick={() => setRole(r)}
                                            size="middle"
                                            style={{ flex: 1, fontSize: '12px', padding: 0 }}
                                        >
                                            {t(`roles.${r}`)}
                                        </Button>
                                    ))}
                                </Button.Group>
                            </div>

                            {/* Status Notifications */}
                            {!canEdit && activeBatch.status !== 'completed' && (
                                <Alert
                                    message={t('parcel.permission_denied', { nickname: currentUserNickname, role: t(`roles.${role}`) })}
                                    type="warning"
                                    showIcon
                                    style={{ background: 'rgba(250, 173, 20, 0.1)', border: '1px solid rgba(250, 173, 20, 0.2)', color: '#faad14' }}
                                />
                            )}
                            {activeBatch.status === 'completed' && (
                                <Alert
                                    message={t('batch.readonly_alert')}
                                    type="info"
                                    showIcon
                                    style={{ background: 'rgba(24, 144, 255, 0.1)', border: '1px solid rgba(24, 144, 255, 0.2)', color: '#1890ff' }}
                                />
                            )}

                            {/* Scan & Weight */}
                            <div className="neon-card" style={{ padding: '15px' }}>
                                <Scanner onScan={handleScan} disabled={!canEdit} activeBarcode={activeBarcode} />
                            </div>

                            <WeightEditor
                                role={role}
                                barcode={activeBarcode}
                                activeBatchId={activeBatch.id}
                                onSave={handleSaveWeight}
                                readOnly={!canEdit}
                                currentUserId={currentUserId}
                            />

                            {/* Admin Actions (Desktop Only placement choice or just conditional) */}
                            {role === 'sender' && activeBatch.status === 'active' && canEdit && (
                                <div className="neon-card" style={{ padding: '12px', marginBottom: '15px', border: '1px dashed var(--primary)' }}>
                                    <Button
                                        type="primary"
                                        block
                                        icon={<PlusOutlined />}
                                        onClick={async () => {
                                            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                                            // Simple count for now, in prod use a DB sequence or count
                                            const { count } = await supabase.from('parcels').select('*', { count: 'exact', head: true }).eq('batch_id', activeBatch.id);
                                            const seq = (count || 0) + 1;
                                            const stNum = `ST${dateStr}-${String(seq).padStart(3, '0')}`;

                                            const { data, error } = await supabase.from('parcels').insert({
                                                batch_id: activeBatch.id,
                                                barcode: stNum,
                                                custom_id: stNum,
                                                sender_user_id: currentUserId,
                                                status: 'pending'
                                            }).select().single();

                                            if (error) message.error(t('common.error') + ': ' + error.message);
                                            else {
                                                message.success(t('parcel.create_success', { barcode: stNum }));
                                                setActiveBarcode(stNum);
                                            }
                                        }}
                                    >
                                        {t('parcel.create_new')}
                                    </Button>
                                    <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-sub)', marginTop: 5 }}>
                                        {t('parcel.create_tip')}
                                    </div>
                                </div>
                            )}

                            {activeBatch.status === 'active' && canEdit && systemRole === 'admin' && (
                                <div className="desktop-only">
                                    <Button
                                        block
                                        type="primary"
                                        danger
                                        onClick={() => {
                                            Modal.confirm({
                                                title: t('batch.confirm_finish_title'),
                                                content: t('batch.confirm_finish_content'),
                                                onOk: async () => {
                                                    const { error } = await supabase
                                                        .from('batches')
                                                        .update({ status: 'completed' })
                                                        .eq('id', activeBatch.id);
                                                    if (error) return message.error(t('common.error') + ': ' + error.message);
                                                    message.success(t('batch.finish_success'));
                                                    setActiveBatch({ ...activeBatch, status: 'completed' });
                                                }
                                            });
                                        }}
                                    >
                                        {t('batch.finish')}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Area 2: Data Table */}
                        <div className="neon-card" style={{ padding: '15px', overflow: 'hidden' }}>
                            <ParcelTable
                                role={role}
                                activeBarcode={activeBarcode}
                                activeBatchId={activeBatch.id}
                                readOnly={!canEdit}
                            />
                        </div>

                        {/* Mobile Only: Finish Batch Button at bottom */}
                        <div className="mobile-only" style={{ marginTop: '10px' }}>
                            {activeBatch.status === 'active' && canEdit && (
                                <Button
                                    block
                                    size="large"
                                    type="primary"
                                    danger
                                    onClick={() => {
                                        Modal.confirm({
                                            title: t('batch.confirm_finish_title'),
                                            content: t('batch.confirm_finish_content'),
                                            onOk: async () => {
                                                const { error } = await supabase
                                                    .from('batches')
                                                    .update({ status: 'completed' })
                                                    .eq('id', activeBatch.id);
                                                if (error) return message.error(t('common.error') + ': ' + error.message);
                                                message.success(t('batch.finish_success'));
                                                setActiveBatch({ ...activeBatch, status: 'completed' });
                                            }
                                        });
                                    }}
                                >
                                    {t('batch.finish')}
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Debug User Switcher - Simplified */}
                <div style={{ position: 'fixed', bottom: 10, right: 10, opacity: 0.1, zIndex: 9999 }} className="mobile-only">
                    <Button size="small" type="text" onClick={() => {
                        const next = currentUserId === 'U001' ? 'U002' : 'U001';
                        setCurrentUserId(next);
                        localStorage.setItem('mock_user_id', next);
                        window.location.reload();
                    }}>SW</Button>
                </div>
            </Content>
        </Layout>
    );
}
