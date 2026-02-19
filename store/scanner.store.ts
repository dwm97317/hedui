import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PDAModel = 'NT20' | 'DT50' | 'i6310' | 'Standard' | 'Custom' | 'None';

interface ScannerState {
    model: PDAModel;
    scanAction: string;
    scanExtra: string;
    reprintMode: 'copy' | 'update';
    weightAuditAbs: number;
    weightAuditPercent: number;
    exportMode: 'anomaly' | 'all';
    setModel: (model: PDAModel) => void;
    setConfig: (action: string, extra: string) => void;
    setReprintMode: (mode: 'copy' | 'update') => void;
    setWeightAuditAbs: (val: number) => void;
    setWeightAuditPercent: (val: number) => void;
    setExportMode: (mode: 'anomaly' | 'all') => void;
    syncWithNative: () => void;
}

export const useScannerStore = create<ScannerState>()(
    persist(
        (set, get) => ({
            model: 'None',
            scanAction: 'android.intent.action.RECEIVE_SCANDATA_BROADCAST',
            scanExtra: 'android.intent.extra.SCAN_BROADCAST_DATA',
            reprintMode: 'copy',
            weightAuditAbs: 0.5,
            weightAuditPercent: 5,
            exportMode: 'all',

            setModel: (model) => {
                let action = get().scanAction;
                let extra = get().scanExtra;

                // Common defaults for these models
                if (model === 'NT20') {
                    action = 'android.intent.action.SCAN_RESULT';
                    extra = 'android.intent.extra.SCAN_BROADCAST_DATA';
                } else if (model === 'DT50') {
                    action = 'android.intent.action.SCAN_RESULT';
                    extra = 'android.intent.extra.SCAN_BROADCAST_DATA';
                } else if (model === 'i6310') {
                    action = 'android.intent.action.SCAN_RESULT';
                    extra = 'android.intent.extra.SCAN_BROADCAST_DATA';
                } else if (model === 'Standard') {
                    action = 'android.intent.action.RECEIVE_SCANDATA_BROADCAST';
                    extra = 'android.intent.extra.SCAN_BROADCAST_DATA';
                }

                set({ model, scanAction: action, scanExtra: extra });
                get().syncWithNative();
            },

            setConfig: (action, extra) => {
                set({ scanAction: action, scanExtra: extra, model: 'Custom' });
                get().syncWithNative();
            },

            setReprintMode: (mode) => {
                set({ reprintMode: mode });
            },

            setWeightAuditAbs: (val) => set({ weightAuditAbs: val }),
            setWeightAuditPercent: (val) => set({ weightAuditPercent: val }),
            setExportMode: (mode) => set({ exportMode: mode }),

            syncWithNative: () => {
                const { scanAction, scanExtra } = get();
                if ((window as any).Android && (window as any).Android.updateScannerConfig) {
                    (window as any).Android.updateScannerConfig(scanAction, scanExtra);
                }
            },
        }),
        {
            name: 'pda-scanner-storage',
        }
    )
);
