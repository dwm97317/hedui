import React from 'react';
import { useBatchStore } from '../store/batch.store';
import { Batch } from '../services/batch.service';

interface BatchSwitchModalProps {
    isOpen: boolean;
    onClose: () => void;
    batches: Batch[];
    title?: string;
}

export const BatchSwitchModal: React.FC<BatchSwitchModalProps> = ({ isOpen, onClose, batches, title = "切换批次 (Switch Batch)" }) => {
    const { activeBatchId, setActiveBatchId } = useBatchStore();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <span className="material-icons text-slate-400">close</span>
                    </button>
                </div>

                {/* List */}
                <div className="p-4 overflow-y-auto no-scrollbar space-y-3">
                    {batches.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 italic font-light">暂无可选批次</div>
                    ) : (
                        batches.map((batch) => (
                            <button
                                key={batch.id}
                                onClick={() => {
                                    setActiveBatchId(batch.id);
                                    onClose();
                                }}
                                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${activeBatchId === batch.id
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : 'border-slate-100 dark:border-slate-800 hover:border-primary/50 bg-slate-50/50 dark:bg-slate-800/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeBatchId === batch.id ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                        }`}>
                                        <span className="material-icons text-xl">local_shipping</span>
                                    </div>
                                    <div>
                                        <div className="font-mono font-bold text-slate-800 dark:text-white">{batch.batch_no}</div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                                            {batch.status} • {batch.item_count}件 • {batch.total_weight}KG
                                        </div>
                                    </div>
                                </div>
                                {activeBatchId === batch.id && (
                                    <span className="material-icons text-primary">check_circle</span>
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 shadow-sm"
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    );
};
