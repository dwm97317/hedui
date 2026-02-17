import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore, BillStatus, Currency } from '../../store/finance.store';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, AlertCircle, Settings } from 'lucide-react';

const SenderFinance = () => {
    const navigate = useNavigate();
    const fetchBatches = useFinanceStore(state => state.fetchBatches);
    const getSenderBatches = useFinanceStore(state => state.getSenderBatches);
    const loading = useFinanceStore(state => state.loading);

    const batches = getSenderBatches();

    useEffect(() => {
        fetchBatches();
    }, []);

    // Calculate Totals
    const totalPayableVND = batches.reduce((sum, b) => b.billA.status === BillStatus.PENDING ? sum + b.billA.amount : sum, 0);
    const totalPayableCNY = batches.reduce((sum, b) => b.billC.status === BillStatus.PENDING ? sum + b.billC.amount : sum, 0);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'zh-CN', { style: 'currency', currency }).format(amount);
    };

    if (loading) return <div className="p-8 text-white">正在加载财务数据...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 font-sans">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">结算中心</h1>
                    <p className="text-slate-400 text-sm mt-1">发货方门户 • 应付账款</p>
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
                        <span className="text-xs text-slate-400 uppercase tracking-wider">当前结算期</span>
                        <div className="text-white font-mono">2026年2月</div>
                    </div>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ArrowUpRight size={64} />
                    </div>
                    <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">应付总额 (物流费)</h3>
                    <div className="text-3xl font-bold text-orange-400 font-mono mb-1">
                        {formatCurrency(totalPayableVND, 'VND')}
                    </div>
                    <div className="text-xs text-slate-500">支付给平台 (账单 A)</div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ArrowUpRight size={64} />
                    </div>
                    <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">应付总额 (货款)</h3>
                    <div className="text-3xl font-bold text-red-400 font-mono mb-1">
                        {formatCurrency(totalPayableCNY, 'CNY')}
                    </div>
                    <div className="text-xs text-slate-500">支付给接收方 (账单 C)</div>
                </div>
            </div>

            {/* Batch List - 3-Bill Logic Focus */}
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={18} className="text-blue-400" />
                结算批次
            </h2>

            <div className="space-y-4">
                {batches.map((batch) => (
                    <div key={batch.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
                        {/* Batch Header */}
                        <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-blue-400 font-mono font-bold bg-blue-400/10 px-2 py-1 rounded text-xs">
                                        {batch.batchCode}
                                    </span>
                                    <span className="text-slate-400 text-xs">{new Date(batch.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-sm text-slate-300">
                                    总重量: <span className="text-white font-medium">{batch.totalWeight} kg</span>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${batch.status === 'Completed' || batch.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                {batch.status === 'completed' ? '已完成' : batch.status === 'in_transit' ? '运输中' : batch.status}
                            </div>
                        </div>

                        {/* Bills Section */}
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/50">

                            {/* Bill A: To Admin */}
                            <div className="bg-slate-800 p-4 rounded border border-slate-700/50 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 uppercase">账单 A (物流费)</span>
                                        <div className="text-sm text-slate-300 mt-1">收款方：平台管理</div>
                                    </div>
                                    <StatusBadge status={batch.billA.status} />
                                </div>
                                <div className="text-xl font-bold text-white font-mono mt-2">
                                    {formatCurrency(batch.billA.amount, 'VND')}
                                </div>
                                <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    单价已隐藏
                                </div>
                            </div>

                            {/* Bill C: To Receiver */}
                            <div className="bg-slate-800 p-4 rounded border border-slate-700/50 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 uppercase">账单 C (货款)</span>
                                        <div className="text-sm text-slate-300 mt-1">收款方：{batch.receiverName}</div>
                                    </div>
                                    <StatusBadge status={batch.billC.status} />
                                </div>
                                <div className="text-xl font-bold text-white font-mono mt-2">
                                    {formatCurrency(batch.billC.amount, 'CNY')}
                                </div>
                                {batch.billC.status === BillStatus.PENDING && (
                                    <div className="mt-3 w-full bg-slate-800 text-slate-500 text-[10px] text-center py-2 rounded border border-slate-700">
                                        待平台确认支付
                                    </div>
                                )}
                            </div>

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
            <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded text-xs font-bold ring-1 ring-inset ring-green-400/20">
                <CheckCircle size={10} /> 已支付
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-2 py-1 rounded text-xs font-bold ring-1 ring-inset ring-orange-400/20">
            <Clock size={10} /> 待处理
        </span>
    );
};

export default SenderFinance;
