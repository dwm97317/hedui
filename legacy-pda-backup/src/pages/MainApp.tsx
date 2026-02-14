import { useState, useEffect } from 'react';
import { Button, message, notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { scanEngine } from '../services/scanEngine';
import { scannerAdapter } from '../services/scanner';
import { Role, Batch } from '../types';

import AppLayout from '../components/AppLayout';
import BatchSelector from '../components/BatchSelector';
import DebugRoleSwitcher from '../components/DebugRoleSwitcher';
import PDAWorkflowView from '../components/pda/PDAWorkflowView';

import DesktopLayout from '../components/main/DesktopLayout';
import MobileLayout from '../components/main/MobileLayout';
import { useDevice } from '../hooks/useDevice';
import { useAppUser } from '../hooks/useAppUser';
import { usePermissions } from '../hooks/usePermissions';

export default function MainApp() {
    const { t } = useTranslation();
    const { isMobile, isPDA } = useDevice();
    const { currentUserId, systemRole } = useAppUser();

    const [role, setRole] = useState<Role>('sender');
    const [activeBatch, setActiveBatch] = useState<Batch | null>(null);
    const [activeBarcode, setActiveBarcode] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [ambiguousResults, setAmbiguousResults] = useState<any[]>([]);
    const [showResultsModal, setShowResultsModal] = useState(false);

    const canEdit = usePermissions(activeBatch, role, currentUserId);

    const handleScan = async (barcode: string) => { setActiveBarcode(barcode); };

    const handleSaveWeight = () => {
        setActiveBarcode(null);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleSwitchBatch = async (batchId: string) => {
        const { data } = await supabase.from('batches').select('*').eq('id', batchId).single();
        if (data) setActiveBatch(data);
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

    const handleCreateParcel = async () => {
        if (!activeBatch) return;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const { count } = await supabase.from('parcels').select('*', { count: 'exact', head: true }).eq('batch_id', activeBatch.id);
        const seq = (count || 0) + 1;
        const stNum = `ST${dateStr}-${String(seq).padStart(3, '0')}`;
        const { error } = await supabase.from('parcels').insert({ batch_id: activeBatch.id, barcode: stNum, custom_id: stNum, sender_user_id: currentUserId, status: 'pending' });
        if (error) message.error(t('common.error') + ': ' + error.message);
        else {
            message.success(t('parcel.create_success', { barcode: stNum }));
            setActiveBarcode(stNum);
            setRefreshTrigger(prev => prev + 1);
        }
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
                    <MobileLayout
                        role={role}
                        setRole={setRole}
                        activeBatch={activeBatch}
                        canEdit={canEdit}
                        activeBarcode={activeBarcode}
                        handleScan={handleScan}
                        handleSaveWeight={handleSaveWeight}
                        currentUserId={currentUserId}
                        refreshTrigger={refreshTrigger}
                    />
                ) : (
                    <DesktopLayout
                        role={role}
                        setRole={setRole}
                        activeBatch={activeBatch}
                        canEdit={canEdit}
                        activeBarcode={activeBarcode}
                        setActiveBarcode={setActiveBarcode}
                        handleScan={handleScan}
                        handleSaveWeight={handleSaveWeight}
                        onCreateParcel={handleCreateParcel}
                        currentUserId={currentUserId}
                        refreshTrigger={refreshTrigger}
                    />
                )}
            </div>
            <DebugRoleSwitcher currentUserId={currentUserId} activeBatchId={activeBatch.id} />
        </AppLayout>
    );
}
