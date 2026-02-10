import { useState, useEffect } from 'react';
import { Layout, Typography, Space, Button, Tag, Modal, message, Alert, Input, Select, Row, Col, Divider } from 'antd';
import { LogoutOutlined, HistoryOutlined, PlusOutlined, BarcodeOutlined, InboxOutlined, LineChartOutlined, DashboardOutlined } from '@ant-design/icons';
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
import PDAWorkflowView from '../components/pda/PDAWorkflowView';

export default function MainApp() {
    const { t, i18n } = useTranslation();
    const [role, setRole] = useState<Role>('sender');
    const [activeBatch, setActiveBatch] = useState<Batch | null>(null);
    const [activeBarcode, setActiveBarcode] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [ambiguousResults, setAmbiguousResults] = useState<any[]>([]);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [isPDA, setIsPDA] = useState(window.innerWidth <= 720);

    const [currentUserId] = useState(() => localStorage.getItem('mock_user_id') || 'U001');
    const [systemRole, setSystemRole] = useState('operator');
    const [canEdit, setCanEdit] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
            setIsPDA(window.innerWidth <= 720);
        };
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
    const handleSaveWeight = () => {
        setActiveBarcode(null);
        setRefreshTrigger(prev => prev + 1);
    };

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
                                {t('common.switch') || '切换'}
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
            <div style={{ maxWidth: '1600px', margin: '0 auto', height: isPDA ? 'calc(100vh - 120px)' : 'auto' }}>
                {isPDA ? (
                    <PDAWorkflowView
                        role={role}
                        activeBatch={activeBatch}
                        onScan={handleScan}
                        currentUserId={currentUserId}
                        canEdit={canEdit}
                        activeBarcode={activeBarcode}
                        onReset={() => setActiveBarcode(null)}
                    />
                ) : isMobile ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        <MobileRoleSwitcher role={role} setRole={setRole} t={t} batchNumber={activeBatch.batch_number} />
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div className="region-header" style={{ margin: '16px 16px 0' }}>{t('nav.scan') || '扫描'}</div>
                            <Scanner onScan={handleScan} disabled={!canEdit} activeBarcode={activeBarcode} />
                        </div>
                        <div className="glass-card">
                            <div className="region-header">{t('parcel.weight_entry') || '重量输入'}</div>
                            <WeightEditor role={role} barcode={activeBarcode} activeBatchId={activeBatch?.id} onSave={handleSaveWeight} readOnly={!canEdit} currentUserId={currentUserId} />
                        </div>
                        <div className="glass-card">
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="region-header" style={{ marginBottom: 0 }}>{t('parcel.recent_activity')}</div>
                                <LanguageSelect i18n={i18n} />
                            </div>
                            <ParcelTable role={role} activeBarcode={activeBarcode} activeBatchId={activeBatch?.id} readOnly={!canEdit} refreshTrigger={refreshTrigger} />
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
                        {/* Top Area: Stats Dashboard (Full Width) */}
                        <div style={{ gridColumn: 'span 12' }} className="glass-card">
                            <Row align="middle" justify="space-between">
                                <Col>
                                    <Space size="large" split={<Divider type="vertical" style={{ height: '40px' }} />}>
                                        <div>
                                            <Typography.Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{t('common.current_role')}</Typography.Text>
                                            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{t(`roles.${role}`)}</div>
                                        </div>
                                        <div>
                                            <Typography.Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{t('batch.number')}</Typography.Text>
                                            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{activeBatch.batch_number}</div>
                                        </div>
                                    </Space>
                                </Col>
                                <Col>
                                    <Space size="middle">
                                        {(['sender', 'transit', 'receiver'] as Role[]).map(r => (
                                            <Button
                                                key={r}
                                                type={role === r ? 'primary' : 'default'}
                                                onClick={() => setRole(r)}
                                                style={{ height: '44px', borderRadius: '8px', fontWeight: 600, padding: '0 24px' }}
                                            >
                                                {t(`roles.${r}`)}
                                            </Button>
                                        ))}
                                    </Space>
                                </Col>
                            </Row>
                        </div>

                        {/* Left Side: Control Zone (Scanner) */}
                        <div style={{ gridColumn: 'span 4', padding: 0, overflow: 'hidden' }} className="glass-card">
                            <div style={{ padding: '24px 24px 0' }}>
                                <div className="region-header">{t('nav.scan') || '扫描控制'}</div>
                            </div>
                            <Scanner onScan={handleScan} disabled={!canEdit} activeBarcode={activeBarcode} />
                        </div>

                        {/* Right Side: Action Zone (Editor) */}
                        <div style={{ gridColumn: 'span 8' }} className="glass-card">
                            <div className="region-header">{t('parcel.weight_entry') || '详细信息录入'}</div>
                            <WeightEditor role={role} barcode={activeBarcode} activeBatchId={activeBatch?.id} onSave={handleSaveWeight} readOnly={!canEdit} currentUserId={currentUserId} />
                        </div>

                        {/* Bottom Area: Data Zone (Table) */}
                        <div style={{ gridColumn: 'span 12' }} className="glass-card">
                            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="region-header" style={{ marginBottom: 0 }}>{t('parcel.recent_activity')}</div>
                                <Space size="large">
                                    <LanguageSelect i18n={i18n} />
                                    {canEdit && (
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<PlusOutlined />}
                                            onClick={() => createNewParcel(activeBatch, currentUserId, setActiveBarcode, setRefreshTrigger, message, t)}
                                            style={{ borderRadius: '8px', fontWeight: 700 }}
                                        >
                                            {t('parcel.create_new') || '新增包裹'}
                                        </Button>
                                    )}
                                </Space>
                            </div>
                            <ParcelTable role={role} activeBarcode={activeBarcode} activeBatchId={activeBatch?.id} readOnly={!canEdit} refreshTrigger={refreshTrigger} />
                        </div>
                    </div>
                )}
            </div>
            <DebugRoleSwitcher currentUserId={currentUserId} activeBatchId={activeBatch.id} />
        </AppLayout>
    );
}

function MobileRoleSwitcher({ role, setRole, t, batchNumber }: any) {
    return (
        <div className="glass-card">
            <div style={{ marginBottom: '16px' }}>
                <Typography.Text type="secondary" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{t('common.app_title')}</Typography.Text>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{batchNumber}</div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '8px', fontWeight: 600 }}>{t('common.current_role')}</div>
            <Button.Group style={{ width: '100%' }}>
                {(['sender', 'transit', 'receiver'] as Role[]).map(r => (
                    <Button
                        key={r}
                        type={role === r ? 'primary' : 'default'}
                        onClick={() => setRole(r)}
                        style={{ flex: 1, height: '48px', fontWeight: 700 }}
                    >
                        {t(`roles.${r}`)}
                    </Button>
                ))}
            </Button.Group>
        </div>
    );
}

function LanguageSelect({ i18n }: any) {
    return (
        <Select
            size="large"
            value={i18n.language.split('-')[0]}
            onChange={(lng: string) => i18n.changeLanguage(lng)}
            style={{ width: 100 }}
            options={[{ value: 'zh', label: '中文' }, { value: 'vi', label: 'VN' }, { value: 'th', label: 'TH' }, { value: 'mm', label: 'MM' }]}
        />
    );
}

async function createNewParcel(activeBatch: any, currentUserId: string, setActiveBarcode: any, setRefreshTrigger: any, message: any, t: any) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const { count } = await supabase.from('parcels').select('*', { count: 'exact', head: true }).eq('batch_id', activeBatch.id);
    const seq = (count || 0) + 1;
    const stNum = `ST${dateStr}-${String(seq).padStart(3, '0')}`;
    const { error } = await supabase.from('parcels').insert({ batch_id: activeBatch.id, barcode: stNum, custom_id: stNum, sender_user_id: currentUserId, status: 'pending' });
    if (error) message.error(t('common.error') + ': ' + error.message);
    else {
        message.success(t('parcel.create_success', { barcode: stNum }));
        setActiveBarcode(stNum);
        // Force refresh for the new item
        setRefreshTrigger((prev: number) => prev + 1);
    }
}
