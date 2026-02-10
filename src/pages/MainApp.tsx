import { useState, useEffect } from 'react';
import { Layout, Typography, Space, Button, Tag, Modal, message, Alert, Input, Select } from 'antd';
import { LogoutOutlined, HistoryOutlined, PlusOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import Scanner from '../components/Scanner';
import ParcelTable from '../components/ParcelTable';
import WeightEditor from '../components/WeightEditor';
import BatchSelector from '../components/BatchSelector';
import DebugRoleSwitcher from '../components/DebugRoleSwitcher';
import { Role, Batch } from '../types';
import { useTranslation } from 'react-i18next';
import '../index.css';
import { scannerAdapter } from '../services/scanner';
import { scanEngine } from '../services/scanEngine';
import AppLayout from '../components/AppLayout';
import { notification } from 'antd';

const { Header, Content } = Layout;

export default function MainApp() {
    const { t, i18n } = useTranslation();
    const [role, setRole] = useState<Role>('sender');
    const [activeBatch, setActiveBatch] = useState<Batch | null>(null);
    const [activeBarcode, setActiveBarcode] = useState<string | null>(null);
    const [ambiguousResults, setAmbiguousResults] = useState<any[]>([]);
    const [showResultsModal, setShowResultsModal] = useState(false);

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
            .maybeSingle();

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
                                notification.destroy('batch_mismatch');
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
                case 'IGNORE':
                    if (actionResult.results && actionResult.results.length > 0) {
                        setAmbiguousResults(actionResult.results);
                        setShowResultsModal(true);
                    } else if (actionResult.message) {
                        message.info(actionResult.message);
                    }
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
        <AppLayout activeTitle={activeBatch ? `${t('common.app_title')} - ${activeBatch.batch_number}` : t('common.app_title')}>
            {!activeBatch ? (
                <BatchSelector onSelect={setActiveBatch} />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    {/* Role Header Bento Card */}
                    <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Typography.Text type="secondary" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    {t('common.current_role')}
                                </Typography.Text>
                                <Typography.Title level={3} style={{ margin: 0, color: 'white', fontWeight: 800 }}>
                                    {t(`roles.${role}`)}
                                </Typography.Title>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <Typography.Text type="secondary" style={{ fontSize: '10px' }}>
                                    {t('batch.number')}
                                </Typography.Text>
                                <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{activeBatch?.batch_number}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '16px' }}>
                            <Button.Group style={{ width: '100%' }}>
                                {(['sender', 'transit', 'receiver'] as Role[]).map(r => (
                                    <Button
                                        key={r}
                                        type={role === r ? 'primary' : 'default'}
                                        onClick={() => setRole(r)}
                                        style={{
                                            flex: 1,
                                            height: '40px',
                                            background: role === r ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                            borderColor: 'transparent',
                                            color: 'white',
                                            fontSize: '13px'
                                        }}
                                    >
                                        {t(`roles.${r}`)}
                                    </Button>
                                ))}
                            </Button.Group>
                        </div>
                    </div>

                    {/* Operational Bento Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        {/* Area 1: Scanner (Always visible/Primary) */}
                        <div className="glass-card neon-border" style={{ padding: '0px', overflow: 'hidden' }}>
                            <Scanner onScan={handleScan} disabled={!canEdit} activeBarcode={activeBarcode} />
                        </div>

                        {/* Area 2: Main Editor */}
                        <WeightEditor
                            role={role}
                            barcode={activeBarcode}
                            activeBatchId={activeBatch?.id}
                            onSave={handleSaveWeight}
                            readOnly={!canEdit}
                            currentUserId={currentUserId}
                        />

                        {/* Area 3: Recent Activity / Table */}
                        <div className="glass-card" style={{ padding: '16px', minHeight: '300px' }}>
                            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography.Title level={5} style={{ margin: 0, color: 'white' }}>
                                    {t('parcel.recent_activity') || '最近活动'}
                                </Typography.Title>
                                <Select
                                    size="small"
                                    value={i18n.language.split('-')[0]}
                                    onChange={(lng: string) => i18n.changeLanguage(lng)}
                                    style={{ width: 60 }}
                                    bordered={false}
                                    options={[
                                        { value: 'zh', label: 'CN' },
                                        { value: 'vi', label: 'VN' },
                                        { value: 'th', label: 'TH' },
                                        { value: 'mm', label: 'MM' }
                                    ]}
                                />
                            </div>
                            <ParcelTable
                                role={role}
                                activeBarcode={activeBarcode}
                                activeBatchId={activeBatch?.id}
                                readOnly={!canEdit}
                            />
                        </div>
                    </div>

                    {/* Footer Actions Bento */}
                    {(canEdit || systemRole === 'admin') && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {role === 'sender' && activeBatch?.status === 'active' && canEdit && (
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    style={{ height: '54px', borderRadius: '12px', background: 'linear-gradient(to right, #3B82F6, #2563EB)', border: 'none' }}
                                    onClick={async () => {
                                        if (!activeBatch) return;
                                        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
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
                            )}
                            {activeBatch.status === 'active' && canEdit && (
                                <Button
                                    icon={<LogoutOutlined />}
                                    style={{ height: '54px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                    onClick={() => {
                                        Modal.confirm({
                                            title: t('batch.confirm_finish_title'),
                                            content: t('batch.confirm_finish_content'),
                                            onOk: async () => {
                                                const { error } = await supabase
                                                    .from('batches')
                                                    .update({ status: 'completed' })
                                                    .eq('id', activeBatch?.id);
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
                    )}
                </div>
            )}

            {/* Ambiguous Results Modal */}
            <Modal
                title={t('parcel.multiple_results_found') || '发现多个匹配单号'}
                open={showResultsModal}
                onCancel={() => setShowResultsModal(false)}
                footer={null}
                className="neon-modal"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {ambiguousResults.map(p => (
                        <Button
                            key={p.id}
                            block
                            className="glass-card"
                            style={{ textAlign: 'left', height: 'auto', padding: '10px' }}
                            onClick={() => {
                                setActiveBarcode(p.barcode);
                                setShowResultsModal(false);
                            }}
                        >
                            <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{p.barcode}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-sub)' }}>
                                {t('parcel.sender_weight')}: {p.sender_weight || '-'}kg | {t('parcel.status')}: {p.status}
                            </div>
                        </Button>
                    ))}
                </div>
            </Modal>

            {/* Debug User Switcher - Simplified */}
            <DebugRoleSwitcher currentUserId={currentUserId} activeBatchId={activeBatch ? activeBatch.id : null} />
        </AppLayout>
    );
}
