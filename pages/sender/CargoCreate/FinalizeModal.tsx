import React from 'react';
import { Shipment } from '../../../services/shipment.service';

interface FinalizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeBatch: any;
    totalCount: number;
    totalChargeableWeight: number;
    shipments: Shipment[] | undefined;
    handleEditClick: (shipment: Shipment) => void;
    confirmDelete: (id: string) => void;
    handleFinalize: () => void;
    isFinalizing: boolean;
}

const FinalizeModal: React.FC<FinalizeModalProps> = ({
    isOpen,
    onClose,
    activeBatch,
    totalCount,
    totalChargeableWeight,
    shipments,
    handleEditClick,
    confirmDelete,
    handleFinalize,
    isFinalizing
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <header className="flex items-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="text-slate-900 dark:text-white p-2 -ml-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <span className="material-icons-round block">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-8 dark:text-white">查验完成 & 批次封存</h1>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar pb-8">
                    {/* Hero Status Section */}
                    <div className="flex flex-col items-center py-8 px-4 bg-gradient-to-b from-primary/5 to-transparent">
                        <div className="relative mb-4">
                            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="material-icons-round text-primary text-6xl">inventory_2</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg">
                                <span className="material-icons-round text-white text-2xl">check</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-mono font-bold tracking-tight text-slate-900 dark:text-white">{activeBatch?.batch_no}</h2>
                        <p className="text-primary font-semibold mt-1">本批次已全部查验完毕</p>
                    </div>

                    {/* Statistics Dashboard */}
                    <div className="grid grid-cols-2 gap-3 px-6 mb-8">
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                            <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">总票数</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</span>
                                <span className="text-xs text-slate-400">Pcs</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                            <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">计费重量</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-primary">{totalChargeableWeight.toFixed(2)}</span>
                                <span className="text-xs text-slate-400">kg</span>
                            </div>
                        </div>
                    </div>

                    {/* Parcel Summary List */}
                    <div className="px-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-icons-round text-slate-400 text-lg">list_alt</span>
                                包裹摘要列表
                            </h3>
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                共 {totalCount} 件
                            </span>
                        </div>

                        <div className="space-y-3">
                            {shipments && shipments.length > 0 ? (
                                shipments.slice(-5).reverse().map((s) => (
                                    <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:border-primary/30 transition-colors">
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0 mt-0.5">
                                                <span className="material-icons-round text-sm">check</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">{s.tracking_no}</span>
                                                <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tight">
                                                    Time: {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {s.weight}kg
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEditClick(s)}
                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                            >
                                                <span className="material-icons-round text-xl">edit</span>
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(s.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            >
                                                <span className="material-icons-round text-xl">delete_outline</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <span className="material-icons-round text-4xl opacity-20 block mb-2">dashboard_customize</span>
                                    <p className="text-xs">暂无同步数据</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Actions */}
                <footer className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
                    <button
                        onClick={handleFinalize}
                        disabled={isFinalizing}
                        className="w-full bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                    >
                        <span className="material-icons-round group-active:rotate-12 transition-transform">lock_person</span>
                        <span className="text-lg">{isFinalizing ? '提交中...' : '确认封存并提交'}</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold py-3 rounded-xl transition-all active:scale-[0.98] border border-slate-100 dark:border-slate-700"
                    >
                        返回修改
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default FinalizeModal;
