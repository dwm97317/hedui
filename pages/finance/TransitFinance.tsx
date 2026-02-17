import React, { useEffect } from 'react';
import { useFinanceStore, BillStatus, Currency } from '../../store/finance.store';
import { ArrowUpRight, Clock, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';

const TransitFinance = () => {
    const fetchBatches = useFinanceStore(state => state.fetchBatches);
    const getTransitBatches = useFinanceStore(state => state.getTransitBatches);
    const loading = useFinanceStore(state => state.loading);

    const batches = getTransitBatches();

    useEffect(() => {
        fetchBatches();
    }, []);

    const totalReceivableVND = batches.reduce((sum, b) => b.billB.status === BillStatus.PENDING ? sum + b.billB.amount : sum, 0);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
    };

    if (loading) return <div className="p-8 text-white">正在加载财务数据...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 font-sans">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">收益中心</h1>
                    <p className="text-slate-400 text-sm mt-1">中转方门户 • 应收账款</p>
                </div>
                <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 font-mono text-sm text-green-400">
                    <span className="text-slate-500 mr-2">状态：</span> 活跃
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp size={64} />
                    </div>
                    <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">应收总额 (运输费)</h3>
                    <div className="text-3xl font-bold text-green-400 font-mono mb-1">
                        {formatCurrency(totalReceivableVND, 'VND')}
                    </div>
                    <div className="text-xs text-slate-500">来自平台 (账单 B)</div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex items-center justify-between">
                    <div>
                        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">待处理批次</h3>
                        <div className="text-3xl font-bold text-white font-mono">
                            {batches.filter(b => b.billB.status === BillStatus.PENDING).length}
                        </div>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-full">
                        <Clock size={24} className="text-orange-400" />
                    </div>
                </div>
            </div>

            {/* Batch List - Bill B Focus */}
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-green-400" />
                运输结算
            </h2>

            <div className="space-y-4">
                {batches.map((batch) => (
                    <div key={batch.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
                        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">

                            {/* Left Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-blue-400 font-mono font-bold bg-blue-400/10 px-2 py-1 rounded text-xs">
                                        {batch.batchCode}
                                    </span>
                                    <StatusBadge status={batch.billB.status} />
                                </div>
                                <div className="text-sm text-slate-400 mt-1">
                                    线路: {batch.senderName} → {batch.receiverName}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    重量: {batch.totalWeight} kg
                                </div>
                            </div>

                            {/* Right Amount (Bill B) */}
                            <div className="text-right">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">账单 B 金额</div>
                                <div className="text-2xl font-bold text-white font-mono">
                                    {formatCurrency(batch.billB.amount, 'VND')}
                                </div>
                                {/* Unit Price hidden as per requirement, but total is visible */}
                            </div>

                        </div>

                        {/* Progress Bar (Visual Flair) */}
                        <div className="h-1 w-full bg-slate-700 mt-2">
                            <div
                                className={`h-full ${batch.status === 'Completed' || batch.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: (batch.status === 'Completed' || batch.status === 'completed') ? '100%' : '60%' }}
                            ></div>
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
                <CheckCircle size={10} /> 已结算
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full text-xs font-bold ring-1 ring-inset ring-orange-400/20">
            <Clock size={10} /> 待结算
        </span>
    );
};

export default TransitFinance;
