import { useState, useEffect } from 'react';
import { Layout, Typography, Space, Button, Tag, Modal, message, Alert, Input, Select, Row, Col } from 'antd';
import { LogoutOutlined, HistoryOutlined, PlusOutlined, BarcodeOutlined, InboxOutlined, LineChartOutlined } from '@ant-design/icons';
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

export default function MainApp() {
    const { t, i18n } = useTranslation();
    const [role, setRole] = useState<Role>('sender');
    const [activeBatch, setActiveBatch] = useState<Batch | null>(null);
    const [activeBarcode, setActiveBarcode] = useState<string | null>(null);
    const [ambiguousResults, setAmbiguousResults] = useState<any[]>([]);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('mock_user_id') || 'U001');
    const [currentUserNickname, setCurrentUserNickname] = useState('操作员A');
    const [systemRole, setSystemRole] = useState('operator');
    const [canEdit, setCanEdit] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => { syncUser(); }, [currentUserId]);

    const syncUser = async () => {
        if (!currentUserId) return;
        await supabase.from('users').upsert({
            id: currentUserId,
            nickname: currentUserId === 'U001' ? '初始管理员' : `用户_${currentUserId.slice(-4)}`,
            last_login_at: new Date().toISOString()
        }, { onConflict: 'id' });

        const { data: user } = await supabase.from('users').select('*').eq('id', currentUserId).single();
        if (user) {
            setCurrentUserNickname(user.nickname);
            setSystemRole(user.system_role);
        }
    };

    useEffect(() => { checkPermission(); }, [activeBatch, role, currentUserId]);

    const checkPermission = async () => {
        if (!activeBatch) return;
        if (activeBatch.status === 'completed') {
            setCanEdit(false);
            return;
        }
        const { data } = await supabase.from('batch_user_roles').select('*')
            .eq('batch_id', activeBatch.id).eq('user_id', currentUserId).eq('role', role).eq('is_active', true).maybeSingle();
        setCanEdit(!!data);
    };

    const handleScan = async (barcode: string) => { setActiveBarcode(barcode); };
    const handleSaveWeight = () => { setActiveBarcode(null); };

    useEffect(() => {
        const unsubscribe = scannerAdapter.onScan(async (result) => {
            const actionResult = await scanEngine.processScan(result.raw, {
                userId: currentUserId, role, activeBatchId: activeBatch?.id || null, currentPath: window.location.pathname
            });

            switch (actionResult.type) {
                case 'OPEN_PARCEL':
                    if (actionResult.payload) {
                        setActiveBarcode(actionResult.payload.barcode);
                        if (actionResult.payload.readOnly) message.info(actionResult.message || 'View Only');
                        else message.success('Parcel Found');
                    }
                    break;
                case 'SWITCH_BATCH':
                    notification.warning({
                        message: 'Batch Mismatch',
                        description: actionResult.message,
                        btn: (
                            <Button type="primary" size="small" onClick={() => { handleSwitchBatch(actionResult.payload.id); notification.destroy('batch_mismatch'); }}>
                                Switch
                            </Button>
                        ),
                        key: 'batch_mismatch'
                    });
                    break;
                case 'NEW_PARCEL_PROMPT':
                    if (role === 'sender') message.info('Please create new parcel manually');
                    else message.error('Unknown Parcel');
                    break;
                case 'SHOW_ERROR': message.error(actionResult.message); break;
                case 'IGNORE':
                    if (actionResult.results && actionResult.results.length > 0) {
                        setAmbiguousResults(actionResult.results);
                        setShowResultsModal(true);
                    } else if (actionResult.message) message.info(actionResult.message);
                    break;
            }
        });
        return () => { unsubscribe(); };
    }, [currentUserId, role, activeBatch]);

    const handleSwitchBatch = async (batchId: string) => {
        const { data } = await supabase.from('batches').select('*').eq('id', batchId).single();
        if (data) setActiveBatch(data);
    };

    if (!activeBatch) {
        return (
            <AppLayout activeTitle={t('common.app_title')}>
                <BatchSelector onSelect={setActiveBatch} />
            </AppLayout>
        );
    }

    return (
        <AppLayout activeTitle={`${t('common.app_title')} - ${activeBatch.batch_number}`}>
            {isMobile ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    <MobileRoleSwitcher role={role} setRole={setRole} t={t} batchNumber={activeBatch.batch_number} />
                    <div className="glass-card neon-border" style={{ padding: '0px', overflow: 'hidden' }}>
                        <Scanner onScan={handleScan} disabled={!canEdit} activeBarcode={activeBarcode} />
                    </div>
                    <WeightEditor role={role} barcode={activeBarcode} activeBatchId={activeBatch?.id} onSave={handleSaveWeight} readOnly={!canEdit} currentUserId={currentUserId} />
                    <div className="glass-card" style={{ padding: '16px', minHeight: '300px' }}>
                        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography.Title level={5} style={{ margin: 0, color: 'white' }}>{t('parcel.recent_activity')}</Typography.Title>
                            <LanguageSelect i18n={i18n} />
                        </div>
                        <ParcelTable role={role} activeBarcode={activeBarcode} activeBatchId={activeBatch?.id} readOnly={!canEdit} />
                    </div>
                </div>
            ) : (
                <div className="bento-grid">
                    {/* Left Column: Stats & Batch Info */}
                    <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <Typography.Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{t('common.current_role')}</Typography.Text>
                                <Typography.Title level={2} style={{ margin: 0, color: 'white', fontWeight: 800 }}>{t(`roles.${role}`)}</Typography.Title>
                            </div>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {(['sender', 'transit', 'receiver'] as Role[]).map(r => (
                                    <Button key={r} block type={role === r ? 'primary' : 'text'} onClick={() => setRole(r)}
                                        style={{ textAlign: 'left', padding: '12px 16px', height: 'auto', borderRadius: '12px', color: role === r ? 'white' : 'var(--text-sub)' }}>
                                        {t(`roles.${r}`)}
                                    </Button>
                                ))}
                            </Space>
                        </div>

                        <div className="glass-card" style={{ padding: '24px' }}>
                            <Typography.Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{t('batch.number')}</Typography.Text>
                            <Typography.Title level={4} style={{ margin: '4px 0 20px', color: 'var(--primary)' }}>{activeBatch.batch_number}</Typography.Title>
                            <Row gutter={[16, 16]}>
                                <Col span={12}><StatItem icon={<InboxOutlined />} label="Total" value="--" /></Col>
                                <Col span={12}><StatItem icon={<LineChartOutlined />} label="Analyzed" value="--" /></Col>
                            </Row>
                        </div>
                    </div>

                    {/* Center Column: Scanner & Editor */}
                    <div style={{ gridColumn: 'span 9', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
                            <div className="glass-card neon-border" style={{ padding: '0px', overflow: 'hidden', height: '400px' }}>
                                <Scanner onScan={handleScan} disabled={!canEdit} activeBarcode={activeBarcode} />
                            </div>
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <WeightEditor role={role} barcode={activeBarcode} activeBatchId={activeBatch?.id} onSave={handleSaveWeight} readOnly={!canEdit} currentUserId={currentUserId} />
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '24px', flex: 1 }}>
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography.Title level={4} style={{ margin: 0, color: 'white' }}>{t('parcel.recent_activity')}</Typography.Title>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <LanguageSelect i18n={i18n} />
                                    {canEdit && <Button type="primary" icon={<PlusOutlined />} onClick={() => createNewParcel(activeBatch, currentUserId, setActiveBarcode, message, t)}>Add Parcel</Button>}
                                </div>
                            </div>
                            <ParcelTable role={role} activeBarcode={activeBarcode} activeBatchId={activeBatch?.id} readOnly={!canEdit} />
                        </div>
                    </div>
                </div>
            )}
            <DebugRoleSwitcher currentUserId={currentUserId} activeBatchId={activeBatch.id} />
        </AppLayout>
    );
}

function StatItem({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px' }}>
            <div style={{ color: 'var(--text-sub)', fontSize: '10px', marginBottom: '4px' }}>{icon} {label}</div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 700 }}>{value}</div>
        </div>
    );
}

function MobileRoleSwitcher({ role, setRole, t, batchNumber }: any) {
    return (
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <Typography.Text type="secondary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>{t('common.current_role')}</Typography.Text>
                    <Typography.Title level={3} style={{ margin: 0, color: 'white', fontWeight: 800 }}>{t(`roles.${role}`)}</Typography.Title>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Typography.Text type="secondary" style={{ fontSize: '10px' }}>{t('batch.number')}</Typography.Text>
                    <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{batchNumber}</div>
                </div>
            </div>
            <Button.Group style={{ width: '100%' }}>
                {(['sender', 'transit', 'receiver'] as Role[]).map(r => (
                    <Button key={r} type={role === r ? 'primary' : 'default'} onClick={() => setRole(r)} style={{ flex: 1, height: '40px', background: role === r ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: 'white' }}>
                        {t(`roles.${r}`)}
                    </Button>
                ))}
            </Button.Group>
        </div>
    );
}

function LanguageSelect({ i18n }: any) {
    return (
        <Select size="small" value={i18n.language.split('-')[0]} onChange={(lng: string) => i18n.changeLanguage(lng)} style={{ width: 60 }} bordered={false}
            options={[{ value: 'zh', label: 'CN' }, { value: 'vi', label: 'VN' }, { value: 'th', label: 'TH' }, { value: 'mm', label: 'MM' }]} />
    );
}

async function createNewParcel(activeBatch: any, currentUserId: string, setActiveBarcode: any, message: any, t: any) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const { count } = await supabase.from('parcels').select('*', { count: 'exact', head: true }).eq('batch_id', activeBatch.id);
    const seq = (count || 0) + 1;
    const stNum = `ST${dateStr}-${String(seq).padStart(3, '0')}`;
    const { error } = await supabase.from('parcels').insert({ batch_id: activeBatch.id, barcode: stNum, custom_id: stNum, sender_user_id: currentUserId, status: 'pending' });
    if (error) message.error(t('common.error') + ': ' + error.message);
    else { message.success(t('parcel.create_success', { barcode: stNum })); setActiveBarcode(stNum); }
}
