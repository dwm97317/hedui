
import { useTranslation } from 'react-i18next';
import Scanner from '../Scanner';
import WeightEditor from '../WeightEditor';
import ParcelTable from '../ParcelTable';
import LanguageSelect from '../common/LanguageSelect';
import MobileRoleSwitcher from './MobileRoleSwitcher';
import { Role, Batch } from '../../types';

interface MobileLayoutProps {
    role: Role;
    setRole: (role: Role) => void;
    activeBatch: Batch;
    canEdit: boolean;
    activeBarcode: string | null;
    handleScan: (code: string) => void;
    handleSaveWeight: () => void;
    currentUserId: string;
    refreshTrigger: number;
}

export default function MobileLayout({
    role, setRole, activeBatch, canEdit, activeBarcode,
    handleScan, handleSaveWeight, currentUserId, refreshTrigger
}: MobileLayoutProps) {
    const { t } = useTranslation();

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <MobileRoleSwitcher role={role} setRole={setRole} batchNumber={activeBatch.batch_number} />

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="region-header" style={{ margin: '16px 16px 0' }}>{t('nav.scan') || '扫描'}</div>
                <Scanner onScan={handleScan} disabled={!canEdit} activeBarcode={activeBarcode} />
            </div>

            <div className="glass-card">
                <div className="region-header">{t('parcel.weight_entry') || '重量输入'}</div>
                <WeightEditor
                    role={role}
                    barcode={activeBarcode}
                    activeBatchId={activeBatch?.id}
                    onSave={handleSaveWeight}
                    readOnly={!canEdit}
                    currentUserId={currentUserId}
                />
            </div>

            <div className="glass-card">
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="region-header" style={{ marginBottom: 0 }}>{t('parcel.recent_activity')}</div>
                    <LanguageSelect />
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
