import React, { useState, useEffect } from 'react';
import { Shipment } from '../../../services/shipment.service';
import { toast } from 'react-hot-toast';

interface SplitModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentShipment: Shipment | null;
    onConfirm: (data: { parent_id: string; children: any[] }) => Promise<void>;
    isPending: boolean;
}

export const SplitModal: React.FC<SplitModalProps> = ({ isOpen, onClose, parentShipment, onConfirm, isPending }) => {
    const [splitCount, setSplitCount] = useState(2);
    const [childData, setChildData] = useState<Array<{ tracking_no: string; weight: number }>>([]);

    useEffect(() => {
        if (isOpen && parentShipment) {
            const parentWeight = (parseFloat(parentShipment.weight as any) || 0);
            const avgWeight = (parentWeight / splitCount).toFixed(2);

            setChildData(Array.from({ length: splitCount }, (_, i) => ({
                tracking_no: `S-${parentShipment.tracking_no}-${i + 1}`,
                weight: Number(avgWeight)
            })));
        }
    }, [isOpen, parentShipment, splitCount]);

    const totalChildWeight = childData.reduce((sum, c) => sum + (c.weight || 0), 0);
    const parentWeight = (parseFloat(parentShipment?.weight as any) || 0);

    if (!isOpen || !parentShipment) return null;

    const handleSplit = () => {
        onConfirm({
            parent_id: parentShipment.id,
            children: childData
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-[#1c2433] rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-icons text-primary">call_split</span>
                        包裹拆分: {parentShipment.tracking_no}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-xs font-black text-slate-400 uppercase">拆分数量</span>
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 active:scale-90 transition-all">
                                <span className="material-icons">remove_circle_outline</span>
                            </button>
                            <span className="text-xl font-black font-mono w-8 text-center">{splitCount}</span>
                            <button onClick={() => setSplitCount(splitCount + 1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-primary active:scale-90 transition-all">
                                <span className="material-icons text-primary">add_circle_outline</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {childData.map((child, idx) => (
                            <div key={idx} className="bg-white dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-primary uppercase">子单 #{idx + 1}</span>
                                    {idx === 0 && <span className="text-[10px] text-slate-400 font-bold italic">Auto-generated Tracking No.</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        value={child.tracking_no}
                                        onChange={e => {
                                            const updated = [...childData];
                                            updated[idx].tracking_no = e.target.value;
                                            setChildData(updated);
                                        }}
                                        className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 font-mono font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                                        placeholder="Tracking No."
                                    />
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={child.weight}
                                            onChange={e => {
                                                const updated = [...childData];
                                                updated[idx].weight = Number(e.target.value);
                                                setChildData(updated);
                                            }}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 font-mono font-bold text-sm text-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Weight"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold uppercase">KG</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex justify-between items-center text-xs">
                        <span className="text-amber-600 font-bold">总重量校验:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-500 line-through decoration-slate-300">{parentWeight.toFixed(2)}kg</span>
                            <span className="material-icons text-sm text-slate-300">east</span>
                            <span className={`font-black font-mono ${Math.abs(parentWeight - totalChildWeight) < 0.01 ? 'text-emerald-500' : 'text-amber-600'}`}>
                                {totalChildWeight.toFixed(2)}kg
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5">
                    <button
                        disabled={isPending}
                        onClick={handleSplit}
                        className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isPending ? '正在拆分...' : '确认执行拆分'}
                    </button>
                </div>
            </div>
        </div>
    );
};
