import React, { useState, useEffect } from 'react';
import { Shipment } from '../../../services/shipment.service';

interface MergeModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedShipments: Shipment[];
    onConfirm: (data: { tracking_no: string; total_weight: number }) => Promise<void>;
    isPending: boolean;
}

export const MergeModal: React.FC<MergeModalProps> = ({ isOpen, onClose, selectedShipments, onConfirm, isPending }) => {
    const [trackingNo, setTrackingNo] = useState('');
    const [totalWeight, setTotalWeight] = useState(0);

    const sumWeight = selectedShipments.reduce((sum, s) => sum + (parseFloat(s.weight as any) || 0), 0);

    useEffect(() => {
        if (isOpen) {
            setTotalWeight(Number(sumWeight.toFixed(2)));
            setTrackingNo(`M-${Date.now().toString().slice(-6)}`);
        }
    }, [isOpen, sumWeight]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-[#1c2433] rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-icons text-primary">merge_type</span>
                        合并确认
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                        <p className="text-xs font-bold text-primary uppercase mb-2">已选包裹 ({selectedShipments.length}个)</p>
                        <div className="max-h-32 overflow-y-auto space-y-2 no-scrollbar">
                            {selectedShipments.map(s => (
                                <div key={s.id} className="flex justify-between items-center bg-white dark:bg-black/20 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{s.tracking_no}</span>
                                    <span className="text-xs font-mono text-slate-400">{s.weight} kg</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">新母单号</label>
                            <input
                                autoFocus
                                value={trackingNo}
                                onChange={e => setTrackingNo(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-black/40 border-2 border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 font-mono font-bold text-lg focus:border-primary focus:ring-0 transition-all dark:text-white"
                                placeholder="输入或扫描新单号"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">合并总重量 (kg)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={totalWeight}
                                    onChange={e => setTotalWeight(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-black/40 border-2 border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 font-mono font-bold text-2xl text-primary focus:border-primary focus:ring-0 transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">KG</span>
                            </div>
                            <p className="mt-2 text-[10px] text-slate-400">预估重量: {sumWeight.toFixed(2)} kg</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5">
                    <button
                        disabled={!trackingNo || isPending}
                        onClick={() => onConfirm({ tracking_no: trackingNo, total_weight: totalWeight })}
                        className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isPending ? <span className="animate-spin material-icons">sync</span> : <span className="material-icons">check_circle</span>}
                        确认合并并生成新单
                    </button>
                </div>
            </div>
        </div>
    );
};
