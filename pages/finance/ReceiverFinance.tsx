import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore, BillStatus, Currency } from '../../store/finance.store';
import { ArrowDownLeft, Clock, CheckCircle, Package, Receipt, Settings } from 'lucide-react';

const ReceiverFinance = () => {
    const navigate = useNavigate();
    const fetchBatches = useFinanceStore(state => state.fetchBatches);
    const getReceiverBatches = useFinanceStore(state => state.getReceiverBatches);
    const loading = useFinanceStore(state => state.loading);

    const batches = getReceiverBatches();

    useEffect(() => {
        fetchBatches();
    }, []);

    const totalReceivableCNY = batches.reduce((sum, b) => b.billC.status === BillStatus.PENDING ? sum + b.billC.amount : sum, 0);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(amount);
    };

    if (loading) return <div className="p-8 text-white">正在加载财务数据...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 font-sans">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">收款中心</h1>
                    <p className="text-slate-400 text-sm mt-1">接收方门户 • 应收货款结算</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/finance/admin/pricing')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/50 rounded-lg text-blue-400 text-sm font-semibold hover:bg-blue-600 hover:text-white transition-all"
                    >
                        <Settings size={16} />
                        <span>价格策略</span>
                    </button>
                    <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">币种</span>
                        <div className="text-white font-mono">人民币 (CNY)</div>
                    </div>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Receipt size={64} />
                    </div>
                    <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">应收总额 (货款)</h3>
                    <div className="text-3xl font-bold text-blue-400 font-mono mb-1">
                        {formatCurrency(totalReceivableCNY, 'CNY')}
                    </div>
                    <div className="text-xs text-slate-500">来自发货方 (账单 C)</div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex items-center justify-between">
                    <div>
                        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">待处理批次</h3>
                        <div className="text-3xl font-bold text-white font-mono">
                            {batches.filter(b => b.billC.status === BillStatus.PENDING).length}
                        </div>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-full">
                        <Package size={24} className="text-blue-400" />
                    </div>
                </div>
            </div>

            {/* Batch List - Bill C Focus */}
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Package size={18} className="text-purple-400" />
                待收货款
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {batches.map((batch) => (
                    <div key={batch.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors p-4 relative group">

                        <div className="absolute top-4 right-4">
                            <StatusBadge status={batch.billC.status} />
                        </div>

                        <div className="flex items-start gap-4 mb-4">
                            <div className="bg-slate-700 p-3 rounded-lg">
                                <Receipt size={24} className="text-slate-300" />
                            </div>
                            <div>
                                <div className="text-blue-400 font-mono font-bold text-lg mb-1">{batch.batchCode}</div>
                                <div className="text-xs text-slate-400">付款方: {batch.senderName}</div>
                                <div className="text-xs text-slate-500 mt-1">重量: {batch.totalWeight} kg</div>
                            </div>
                        </div>

                        <div className="border-t border-slate-700 pt-3 flex justify-between items-end">
                            <div>
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">账单 C 金额</div>
                                <div className="text-2xl font-bold text-white font-mono">
                                    {formatCurrency(batch.billC.amount, 'CNY')}
                                </div>
                            </div>

                            {batch.billC.status === BillStatus.PENDING && (
                                <div className="text-slate-500 text-[10px]">
                                    待平台确认收款
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: BillStatus }) => {
    if (status === BillStatus.PAID) {
        return (
            <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded-full text-xs font-bold ring-1 ring-inset ring-green-400/20">
                <CheckCircle size={10} /> 已收到
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full text-xs font-bold ring-1 ring-inset ring-orange-400/20">
            <Clock size={10} /> 待确认
        </span>
    );
};

export default ReceiverFinance;
