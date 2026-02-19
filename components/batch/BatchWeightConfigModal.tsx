import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../../store/finance.store';

interface BatchWeightConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    batchId: string;
    currentModes: {
        a: string;
        b: string;
        c: string;
    };
    onUpdate?: () => void;
}

export const BatchWeightConfigModal: React.FC<BatchWeightConfigModalProps> = ({
    isOpen, onClose, batchId, currentModes, onUpdate
}) => {
    const [modes, setModes] = useState(currentModes);
    const [loading, setLoading] = useState(false);
    const updateBatch = useFinanceStore(state => state.updateBatch);

    useEffect(() => {
        setModes(currentModes);
    }, [currentModes]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateBatch(batchId, {
                billing_weight_mode_a: modes.a,
                billing_weight_mode_b: modes.b,
                billing_weight_mode_c: modes.c
            });

            if (onUpdate) onUpdate();
            onClose();
        } catch (e) {
            console.error('Error updating batch weight modes:', e);
            alert('Save failed');
        } finally {
            setLoading(false);
        }
    };

    const ModeSelector = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
        <div className="flex flex-col gap-2 mb-4">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</label>
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {[
                    { id: 'actual', label: '实重 (Actual)' },
                    { id: 'volumetric', label: '体积重 (Volumetric)' },
                    { id: 'chargeable', label: '计费重 (Chargeable)' }
                ].map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => onChange(opt.id)}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${value === opt.id
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-black text-lg text-slate-800 dark:text-white">计费重量设置</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-6 border border-blue-100 dark:border-blue-900/30">
                        <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                            <span className="font-bold">说明：</span> 设置账单自动计算时使用的重量依据。
                            修改后仅影响后续生成的账单，已生成账单需重新计算。
                        </p>
                    </div>

                    <ModeSelector
                        label="Bill A: Sender -> Admin"
                        value={modes.a}
                        onChange={(v) => setModes(m => ({ ...m, a: v }))}
                    />

                    <ModeSelector
                        label="Bill B: Admin -> Transit"
                        value={modes.b}
                        onChange={(v) => setModes(m => ({ ...m, b: v }))}
                    />

                    <ModeSelector
                        label="Bill C: Sender -> Receiver"
                        value={modes.c}
                        onChange={(v) => setModes(m => ({ ...m, c: v }))}
                    />
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justification-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>}
                        保存设置
                    </button>
                </div>
            </div>
        </div>
    );
};
