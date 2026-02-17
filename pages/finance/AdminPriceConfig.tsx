import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../store/finance.store';
import ExchangeRateModal from '../../components/finance/ExchangeRateModal';

const AdminPriceConfig: React.FC = () => {
    const navigate = useNavigate();
    const batches = useFinanceStore(state => state.batches);
    const fetchBatches = useFinanceStore(state => state.fetchBatches);

    const [selectedBatchId, setSelectedBatchId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'billA' | 'billB'>('billA');
    const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);

    useEffect(() => {
        fetchBatches();
    }, [fetchBatches]);

    useEffect(() => {
        if (batches.length > 0 && !selectedBatchId) {
            setSelectedBatchId(batches[0].id);
        }
    }, [batches, selectedBatchId]);

    const selectedBatch = batches.find(b => b.id === selectedBatchId);

    const updateBillUnitPrice = useFinanceStore(state => state.updateBillUnitPrice);
    const updateExchangeRate = useFinanceStore(state => state.updateExchangeRate);

    const handleSave = async () => {
        if (!selectedBatch) return;

        // In a real app, we'd loop through categories and update items,
        // but here we'll update the main bill unit price for demonstration.
        const billId = activeTab === 'billA' ? selectedBatch.billA.id : selectedBatch.billB.id;

        // Let's just pick the '普货' price as the main unit price for this demo
        const demoPrice = activeTab === 'billA' ? 3800 : 3200;

        await updateBillUnitPrice(billId, demoPrice);
        alert(`${activeTab === 'billA' ? '账单A' : '账单B'} 价格已更新`);
    };

    const mockPricingRules = [
        { category: '普货', billA: 3800, billB: 3200 },
        { category: '电子产品', billA: 5500, billB: 4800 },
        { category: '化妆品', billA: 8000, billB: 7200 },
        { category: '液体/粉末', billA: 12000, billB: 10500 },
    ];

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col font-sans">
            {/* Header omitted for brevity in replace, but keeping it same */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
                        <span className="material-icons">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter">BATCH PRICING</h1>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">平台结算策略配置</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsExchangeModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/50 rounded-full text-blue-400 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                >
                    <span className="material-icons text-sm">currency_exchange</span>
                    <span>调整结算汇率</span>
                </button>
            </header>

            <main className="flex-1 p-6 space-y-6 max-w-lg mx-auto w-full">
                {/* Batch Selector */}
                <div className="group relative">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-2 block">当前生效批次</label>
                    <div className="relative">
                        <select
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 text-lg font-bold text-white focus:border-blue-500 outline-none appearance-none transition-all shadow-xl"
                        >
                            <option value="" disabled>选择批次...</option>
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.batchCode}</option>
                            ))}
                        </select>
                        <span className="material-icons absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">expand_more</span>
                    </div>
                    {selectedBatch && (
                        <div className="mt-3 flex gap-4 text-[10px] font-bold text-slate-500 px-1 uppercase tracking-tighter">
                            <span>重量: {selectedBatch.totalWeight}kg</span>
                            <span className="text-slate-700">|</span>
                            <span>创建于: {new Date(selectedBatch.createdAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
                    <button
                        onClick={() => setActiveTab('billA')}
                        className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'billA' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        账单A (发货方 → 平台)
                    </button>
                    <button
                        onClick={() => setActiveTab('billB')}
                        className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'billB' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        账单B (平台 → 中转方)
                    </button>
                </div>

                {/* Price List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-4 mb-2">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">CATEGORY / ITEM</span>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">UNIT PRICE (VND)</span>
                    </div>
                    {mockPricingRules.map((rule) => {
                        const price = activeTab === 'billA' ? rule.billA : rule.billB;
                        return (
                            <div key={rule.category} className="group flex items-center justify-between p-5 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-all">
                                <div>
                                    <h4 className="font-bold text-white mb-0.5">{rule.category}</h4>
                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Global Route Base</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black text-white font-mono">{price.toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">VND/KG</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info Card */}
                <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-4">
                    <span className="material-icons text-blue-500">verified_user</span>
                    <div>
                        <h4 className="text-xs font-black uppercase text-blue-400 mb-1 tracking-wider">3-账单逻辑声明</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                            当前页面配置直接影响该批次的财务利润核算。系统将自动计算 账单A(营收) 与 账单B(支出的) 差额作为平台利润。
                        </p>
                    </div>
                </div>
            </main>

            <footer className="p-6 border-t border-slate-800 bg-slate-900/50 sticky bottom-0 z-50 flex gap-4">
                <button className="flex-1 py-4 rounded-2xl border-2 border-slate-800 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-800 hover:text-white transition-all active:scale-95">
                    重置默认
                </button>
                <button
                    onClick={handleSave}
                    disabled={!selectedBatchId}
                    className="flex-[2] py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-50"
                >
                    保存当前批次定价
                </button>
            </footer>

            {/* Modals */}
            <ExchangeRateModal
                isOpen={isExchangeModalOpen}
                onClose={() => setIsExchangeModalOpen(false)}
                onConfirm={async (rate) => {
                    await updateExchangeRate('CNY', 'VND', rate);
                    setIsExchangeModalOpen(false);
                    alert('核心汇率已同步至云端');
                }}
            />
        </div>
    );
};

export default AdminPriceConfig;
