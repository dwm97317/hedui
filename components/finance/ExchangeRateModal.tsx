import React, { useState } from 'react';

interface ExchangeRateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (rate: number) => void;
    currentRate?: number;
}

const ExchangeRateModal: React.FC<ExchangeRateModalProps> = ({ isOpen, onClose, onConfirm, currentRate = 3450 }) => {
    const [rate, setRate] = useState(currentRate);

    if (!isOpen) return null;

    const shortcuts = [3450, 3480, 3500, 3520];

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-300">
            <div className="bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden border border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-8 duration-500">
                {/* Visual Header */}
                <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-900 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter">SETTLEMENT RATE</h3>
                    <p className="text-blue-200/80 text-xs font-bold uppercase tracking-widest mt-1">结算汇率调整</p>
                    <span className="absolute top-6 right-6 text-white/20 select-none">
                        <span className="material-icons text-6xl">currency_exchange</span>
                    </span>
                </div>

                <div className="p-6 -mt-8">
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">CNY</span>
                                <span className="material-icons text-slate-500">east</span>
                                <span className="text-2xl">VND</span>
                            </div>
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/30">
                                实时锁汇
                            </span>
                        </div>

                        <div className="relative mb-6">
                            <input
                                type="number"
                                value={rate}
                                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-5 text-4xl font-black text-blue-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end">
                                <span className="text-slate-500 text-[10px] font-bold uppercase">Standard Rate</span>
                                <span className="text-slate-400 text-sm font-mono tracking-tighter">1:3,xxx</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-6">
                            {shortcuts.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setRate(s)}
                                    className={`py-2 rounded-lg text-xs font-bold font-mono transition-all ${rate === s ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700/50 text-slate-400 border-slate-600 border hover:border-slate-400'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 mb-6">
                            <span className="material-icons text-blue-500 text-lg">info</span>
                            <p className="text-[10px] text-slate-400 leading-tight">
                                此汇率将直接影响当前批次所有待结算账单的金额换算，请谨慎操作。
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 rounded-xl text-slate-400 font-bold hover:bg-slate-700/50 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => onConfirm(rate)}
                                className="flex-[2] py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-lg shadow-blue-900/40 active:scale-95 transition-all text-center"
                            >
                                确认应用
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 text-center">
                    <p className="text-[10px] text-slate-600 font-medium uppercase tracking-[0.2em]">
                        Industrial Settlement System v2.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExchangeRateModal;
