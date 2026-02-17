import React, { useState } from 'react';

interface BillCPriceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (prices: Record<string, number>) => void;
}

const BillCPriceModal: React.FC<BillCPriceModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [prices, setPrices] = useState<Record<string, number>>({
        '普货': 0.5,
        '电子产品': 1.2,
        '化妆品': 2.0,
        '液体/粉末': 3.5,
    });

    if (!isOpen) return null;

    const handlePriceChange = (category: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setPrices(prev => ({ ...prev, [category]: numValue }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden border border-slate-700 shadow-2xl shadow-blue-500/10 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <header className="p-6 border-b border-slate-800 bg-slate-800/50">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">账单C：货款结算单价设置</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                    <p className="text-sm text-blue-400 font-medium">结算币种：仅人民币 (CNY)</p>
                </header>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                    {Object.entries(prices).map(([category, price]) => (
                        <div key={category} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all group">
                            <div className="flex flex-col">
                                <span className="text-white font-semibold">{category}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Standard Category</span>
                            </div>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-bold">¥</span>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => handlePriceChange(category, e.target.value)}
                                    className="w-32 pl-8 pr-12 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                    placeholder="0.00"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-bold">元/kg</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <footer className="p-6 border-t border-slate-800 bg-slate-800/30 grid grid-cols-2 gap-4">
                    <button
                        onClick={onClose}
                        className="py-3 px-4 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 active:scale-95 transition-all"
                    >
                        取消
                    </button>
                    <button
                        onClick={() => onConfirm(prices)}
                        className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-icons text-sm">save</span>
                        确认保存
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default BillCPriceModal;
