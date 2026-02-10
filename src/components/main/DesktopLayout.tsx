
import { Row, Col, Space, Divider, Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Scanner from '../Scanner';
import WeightEditor from '../WeightEditor';
import ParcelTable from '../ParcelTable';
import LanguageSelect from '../common/LanguageSelect';
import { Role, Batch } from '../../types';

interface DesktopLayoutProps {
    role: Role;
    setRole: (role: Role) => void;
    activeBatch: Batch;
    canEdit: boolean;
    activeBarcode: string | null;
    setActiveBarcode: (code: string | null) => void;
    handleScan: (code: string) => void;
    handleSaveWeight: () => void;
    onCreateParcel: () => void;
    currentUserId: string;
    refreshTrigger: number;
}

export default function DesktopLayout({
    role, setRole, activeBatch, canEdit, activeBarcode,
    handleScan, handleSaveWeight, onCreateParcel, currentUserId, refreshTrigger
}: DesktopLayoutProps) {
    const { t } = useTranslation();

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
            {/* Top Area: Stats Dashboard */}
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
                <WeightEditor
                    role={role}
                    barcode={activeBarcode}
                    activeBatchId={activeBatch?.id}
                    onSave={handleSaveWeight}
                    readOnly={!canEdit}
                    currentUserId={currentUserId}
                />
            </div>

            {/* Bottom Area: Data Zone (Table) */}
            <div style={{ gridColumn: 'span 12' }} className="glass-card">
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="region-header" style={{ marginBottom: 0 }}>{t('parcel.recent_activity')}</div>
                    <Space size="large">
                        <LanguageSelect />
                        {canEdit && (
                            <Button
                                type="primary"
                                size="large"
                                icon={<PlusOutlined />}
                                onClick={onCreateParcel}
                                style={{ borderRadius: '8px', fontWeight: 700 }}
                            >
                                {t('parcel.create_new') || '新增包裹'}
                            </Button>
                        )}
                    </Space>
                </div>
                <ParcelTable
                    role={role}
                    activeBarcode={activeBarcode}
                    activeBatchId={activeBatch?.id}
                    readOnly={!canEdit}
                    refreshTrigger={refreshTrigger}
                />
            </div>
        </div>
    );
}
