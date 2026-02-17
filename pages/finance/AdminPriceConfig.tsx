import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../store/finance.store';
import BatchUnitPriceModal from '../../components/finance/BatchUnitPriceModal';

const AdminPriceConfig: React.FC = () => {
    const navigate = useNavigate();
    const batches = useFinanceStore(state => state.batches);
    const fetchBatches = useFinanceStore(state => state.fetchBatches);
    const loading = useFinanceStore(state => state.loading);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

    useEffect(() => {
        fetchBatches();
    }, [fetchBatches]);

    const handleEditClick = (batchId: string) => {
        setSelectedBatchId(batchId);
        setIsModalOpen(true);
    };

    const selectedBatch = batches.find(b => b.id === selectedBatchId);

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sealed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'in_transit': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'new': return '新建';
            case 'sealed': return '已封车';
            case 'in_transit': return '运输中';
            case 'arrived': return '已到达';
            case 'completed': return '已完成';
            default: return status;
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-800 dark:text-slate-100 flex flex-col font-display">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <span className="material-icons">arrow_back_ios_new</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">平台价格策略</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">批次单价管理中心</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchBatches()}
                    className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                >
                    <span className="material-icons">refresh</span>
                </button>
            </header>

            {/* Content */}
            <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">

                {/* Info Card */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <span className="material-icons">info</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                            批次定价说明
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            系统采用"单批次单价"策略。您可以为每个批次分别设置3份账单的单价。
                            <br />
                            修改单价后，对应批次的所有相关账单金额将自动重新计算。
                        </p>
                    </div>
                </div>

                {/* Batch List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <span className="material-icons animate-spin text-3xl text-primary">refresh</span>
                        </div>
                    ) : batches.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            暂无批次数据
                        </div>
                    ) : (
                        batches.map(batch => (
                            <div
                                key={batch.id}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-all"
                            >
                                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    {/* Batch Info */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                            {batch.batchCode.substring(batch.batchCode.length - 2)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                                    {batch.batchCode}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getStatusColor(batch.status)}`}>
                                                    {getStatusLabel(batch.status)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-icons text-[14px]">scale</span>
                                                    {batch.totalWeight} kg
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-icons text-[14px]">event</span>
                                                    {formatDate(batch.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Prices Grid */}
                                    <div className="flex-1 grid grid-cols-3 gap-2 max-w-xl">
                                        {/* Price A */}
                                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center border border-slate-100 dark:border-slate-700">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">账单A (物流)</div>
                                            <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                                {batch.unitPriceA?.toLocaleString()}
                                                <span className="text-[10px] ml-1 font-normal text-slate-400">VND</span>
                                            </div>
                                        </div>
                                        {/* Price B */}
                                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center border border-slate-100 dark:border-slate-700">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">账单B (运输)</div>
                                            <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                                {batch.unitPriceB?.toLocaleString()}
                                                <span className="text-[10px] ml-1 font-normal text-slate-400">VND</span>
                                            </div>
                                        </div>
                                        {/* Price C */}
                                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center border border-slate-100 dark:border-slate-700">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">账单C (货款)</div>
                                            <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                                {batch.unitPriceC?.toLocaleString()}
                                                <span className="text-[10px] ml-1 font-normal text-slate-400">CNY</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <button
                                        onClick={() => handleEditClick(batch.id)}
                                        className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons text-sm">edit</span>
                                        <span>调价</span>
                                    </button>
                                </div>

                                {/* Profit Bar */}
                                <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">平台毛利:</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {((batch.unitPriceA || 0) - (batch.unitPriceB || 0)).toLocaleString()} VND/kg
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">总毛利预估:</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {(((batch.unitPriceA || 0) - (batch.unitPriceB || 0)) * batch.totalWeight).toLocaleString()} VND
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Edit Modal */}
            {selectedBatch && (
                <BatchUnitPriceModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedBatchId(null);
                    }}
                    batchId={selectedBatch.id}
                    batchNo={selectedBatch.batchCode}
                    currentPrices={{
                        unit_price_a: selectedBatch.unitPriceA || 0,
                        unit_price_b: selectedBatch.unitPriceB || 0,
                        unit_price_c: selectedBatch.unitPriceC || 0
                    }}
                    onSave={async (priceA, priceB, priceC) => {
                        if (selectedBatch) {
                            await useFinanceStore.getState().updateBatchUnitPrices(
                                selectedBatch.id,
                                priceA,
                                priceB,
                                priceC
                            );
                        }
                    }}
                />
            )}
        </div>
    );
};

export default AdminPriceConfig;
