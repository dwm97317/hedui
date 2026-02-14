
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBatches } from '../hooks/useBatches';

const History: React.FC = () => {
    const navigate = useNavigate();
    const { data: batches, isLoading } = useBatches();
    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <header className="bg-surface-dark/95 backdrop-blur shadow-md z-50 flex-none sticky top-0">
                <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-400 border-b border-white/5">
                    <span className="font-mono tracking-wider">设备号: NT20-001</span>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <span className="material-icons text-[14px] text-primary">bluetooth_connected</span>
                            <span className="text-primary font-medium">蓝牙秤: 已连接</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="material-icons text-[14px]">wifi</span>
                            <span>5G</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="material-icons text-[14px]">battery_std</span>
                            <span>85%</span>
                        </span>
                    </div>
                </div>
                <div className="px-5 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold leading-tight text-white">近期扫描记录与报表</h1>
                        <p className="text-xs text-gray-400 mt-1">发出方 / 历史记录</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 relative">
                        <span className="material-icons text-primary text-xl">person</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col min-h-0 bg-background-dark">
                {/* Search */}
                <div className="z-30 bg-background-dark px-4 py-3 border-b border-white/5 shadow-sm flex-none">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-icons text-gray-400">search</span>
                        </span>
                        <input
                            className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg leading-5 bg-surface-dark text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="搜索单号..." type="text"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-24">
                    {/* Stats */}
                    <div className="bg-surface-dark rounded-lg p-4 mb-4 shadow-lg border border-white/5 flex justify-between gap-4">
                        <div className="flex-1 text-center border-r border-white/10 last:border-0">
                            <p className="text-xs text-gray-400 mb-1">今日总票数</p>
                            <p className="text-2xl font-bold text-white">128</p>
                        </div>
                        <div className="flex-1 text-center">
                            <p className="text-xs text-gray-400 mb-1">今日总重量 (kg)</p>
                            <p className="text-2xl font-bold text-primary-light">1,245.5</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-3 px-1">
                        <h2 className="text-gray-400 font-bold text-sm uppercase tracking-wider">最近扫描</h2>
                        <div className="flex items-center gap-2">
                            <button className="text-gray-400 hover:text-white transition-colors">
                                <span className="material-icons text-sm">filter_list</span>
                            </button>
                            <span className="text-xs text-gray-500">按时间排序</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {batches?.map((batch) => (
                            <div
                                key={batch.id}
                                onClick={() => navigate(`/batch/${batch.id}`)}
                                className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-primary relative active:bg-gray-50 transition-colors cursor-pointer"
                            >
                                <div className="absolute top-3 right-3">
                                    <span className="material-icons-outlined text-gray-300 text-lg hover:text-yellow-400">arrow_forward</span>
                                </div>
                                <div className="flex items-start justify-between mb-2 pr-6">
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold">批次号</div>
                                        <div className="text-lg font-bold text-gray-900 tracking-tight font-mono">{batch.batch_no}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3 mb-3">
                                    <div>
                                        <span className="block text-[10px] text-gray-500 uppercase">总重量</span>
                                        <span className="block text-sm font-bold text-primary-light">{batch.total_weight} kg</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[10px] text-gray-500 uppercase">货物件数</span>
                                        <span className="block text-sm font-bold text-gray-700">{batch.item_count} 件</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 inline-flex text-[10px] leading-tight font-semibold rounded ${batch.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                                        batch.status === 'sealed' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                            'bg-blue-50 text-blue-700 border border-blue-200'
                                        }`}>
                                        {batch.status.toUpperCase()}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        {new Date(batch.created_at).toLocaleDateString()} {new Date(batch.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(!batches || batches.length === 0) && (
                            <div className="text-center py-12 text-gray-500">
                                <span className="material-icons text-4xl block mb-2 opacity-20">inventory_2</span>
                                暂无历史记录
                            </div>
                        )}
                    </div>

                    <div className="py-6 flex flex-col items-center justify-center">
                        <button className="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <span className="material-icons-outlined text-2xl animate-pulse">expand_more</span>
                            <span className="text-xs">加载更多记录</span>
                        </button>
                    </div>

                    <div className="pb-6 px-2">
                        <button className="w-full bg-surface-hover hover:bg-primary border border-white/10 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg">
                            <span className="material-icons">download</span>
                            导出报表 (Excel)
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default History;
