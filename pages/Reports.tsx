import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBatches } from '../hooks/useBatches';
import { useShipments } from '../hooks/useShipments';
import { useUserStore } from '../store/user.store';
import { useBatchStore } from '../store/batch.store';

const Reports: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { activeBatchId } = useBatchStore();
    const { data: batches, isLoading: batchesLoading } = useBatches();
    const { data: shipments, isLoading: shipmentsLoading } = useShipments(activeBatchId || '');
    const [searchQuery, setSearchQuery] = useState('');

    const activeBatch = batches?.find(b => b.id === activeBatchId);

    if (batchesLoading || shipmentsLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Batch Specific Stats
    const batchTotalCount = shipments?.length || 0;
    const batchTotalWeight = shipments?.reduce((acc, s) => acc + (s.weight || 0), 0).toFixed(1) || '0.0';

    // Prepare Maps (BatchId -> Batch)
    const batchMap = batches?.reduce((acc: any, b) => {
        acc[b.id] = b;
        return acc;
    }, {});

    const inspectionMap = batches?.reduce((acc: any, b) => {
        if (b.inspections && b.inspections.length > 0) {
            // Sort by created_at ascending so later records' values overwrite earlier ones
            const sorted = [...b.inspections].sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );

            acc[b.id] = sorted.reduce((merged: any, insp: any) => {
                const result = { ...merged, ...insp };
                // If the current record doesn't have a weight, keep the one from previous records
                if (insp.transit_weight === null || insp.transit_weight === undefined) {
                    result.transit_weight = merged.transit_weight;
                }
                if (insp.check_weight === null || insp.check_weight === undefined) {
                    result.check_weight = merged.check_weight;
                }
                return result;
            }, {});
        }
        return acc;
    }, {});

    // Filter shipments for search
    const filteredShipments = shipments?.filter(s =>
        s.tracking_no.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 50) || [];

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
            <header className="bg-surface-dark/95 backdrop-blur shadow-md z-50 flex-none sticky top-0">
                <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-400 border-b border-white/5">
                    <span className="font-mono tracking-wider">设备号: NT20-001</span>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <span className="material-icons-round text-[14px] text-primary">bluetooth_connected</span>
                            <span className="text-primary font-medium">蓝牙秤: 已连接</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="material-icons-round text-[14px]">wifi</span>
                            <span>5G</span>
                        </span>
                        <span className="flex items-center gap-1 text-green-400">
                            <span className="material-icons-round text-[14px]">battery_std</span>
                            <span>85%</span>
                        </span>
                    </div>
                </div>
                <div className="px-5 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold leading-tight text-white">
                            {activeBatch ? `批次: ${activeBatch.batch_no}` : '请先选择批次'}
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">发件报表 / 包裹明细</p>
                    </div>
                    <button
                        onClick={() => navigate('/sender')}
                        className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 relative"
                    >
                        <span className="material-icons-round text-primary text-xl">home</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col min-h-0">
                <div className="sticky top-0 z-30 bg-background-dark px-4 py-3 border-b border-white/5 shadow-sm flex-none">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-icons-round text-gray-400">search</span>
                        </span>
                        <input
                            className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg leading-5 bg-surface-dark text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="在该批次中搜索..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-24">
                    <div className="bg-surface-dark rounded-lg p-4 mb-4 shadow-lg border border-white/5 flex justify-between gap-4">
                        <div className="flex-1 text-center border-r border-white/10 last:border-0">
                            <p className="text-xs text-gray-400 mb-1">本批次票数</p>
                            <p className="text-2xl font-bold text-white">{batchTotalCount}</p>
                        </div>
                        <div className="flex-1 text-center">
                            <p className="text-xs text-gray-400 mb-1">总计发出重量 (kg)</p>
                            <p className="text-2xl font-bold text-primary">{batchTotalWeight}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-3 px-1">
                        <h2 className="text-gray-400 font-bold text-sm uppercase tracking-wider">包裹明细</h2>
                        <div className="flex items-center gap-2">
                            <button className="text-gray-400 hover:text-white transition-colors">
                                <span className="material-icons-round text-sm">filter_list</span>
                            </button>
                            <span className="text-xs text-gray-500">按扫描顺序</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredShipments.map((s) => {
                            const batch = s.batch_id ? batchMap[s.batch_id] : null;
                            const inspection = s.batch_id ? inspectionMap[s.batch_id] : null;

                            // Map batch status to user requested labels
                            const getStatusInfo = (status: string) => {
                                switch (status) {
                                    case 'in_transit':
                                    case 'inspected':
                                        return { label: '中转中', classes: 'bg-blue-50 text-blue-700 border border-blue-200' };
                                    case 'received':
                                    case 'completed':
                                        return { label: '已完成', classes: 'bg-green-50 text-green-700 border border-green-200' };
                                    default:
                                        return { label: '已发送', classes: 'bg-[#F3E8FF] text-[#9333ea] border border-[#e9d5ff]' };
                                };
                            };

                            const statusInfo = getStatusInfo(batch?.status || s.status);

                            return (
                                <div key={s.id} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-primary relative active:bg-gray-50 transition-colors">
                                    <div className="absolute top-3 right-3">
                                        <span className="material-icons-outlined text-gray-300 text-lg cursor-pointer hover:text-yellow-400">star_border</span>
                                    </div>
                                    <div className="flex items-start justify-between mb-2 pr-6">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-0.5">单号</div>
                                            <div className="text-lg font-bold text-gray-900 tracking-tight font-mono">{s.tracking_no}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-2 mb-2">
                                        <div>
                                            <span className="block text-[10px] text-gray-500 uppercase">发出重量</span>
                                            <span className="block text-sm font-bold text-primary-light">{s.weight?.toFixed(1) || '0.0'} kg</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-[10px] text-gray-500 uppercase">中转重量</span>
                                            <span className={`block text-sm font-bold ${inspection?.transit_weight ? 'text-blue-600' : 'text-gray-400'}`}>
                                                {inspection?.transit_weight ? `${(inspection.transit_weight / (batch?.item_count || 1)).toFixed(1)} kg` : '-'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[10px] text-gray-500 uppercase">接收重量</span>
                                            <span className={`block text-sm font-bold ${inspection?.check_weight ? 'text-green-600' : 'text-gray-400'}`}>
                                                {inspection?.check_weight ? `${(inspection.check_weight / (batch?.item_count || 1)).toFixed(1)} kg` : '-'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-100 pt-2 mb-2">
                                        <span className="block text-[10px] text-gray-500 uppercase mb-0.5">尺寸信息 (cm)</span>
                                        <span className="block text-sm font-medium text-gray-700 font-mono">
                                            {s.length || 0} x {s.width || 0} x {s.height || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-0.5 inline-flex text-[10px] leading-tight font-semibold rounded ${statusInfo.classes}`}>
                                            {statusInfo.label}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-mono">
                                            {new Date(s.created_at).toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="py-6 flex flex-col items-center justify-center">
                        <button className="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <span className="material-icons-outlined text-2xl animate-pulse">expand_more</span>
                            <span className="text-xs">加载更多记录</span>
                        </button>
                    </div>

                    <div className="pb-6 px-2">
                        <button className="w-full bg-surface-hover hover:bg-primary border border-white/10 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]">
                            <span className="material-icons-round">download</span>
                            导出批次报表 (Excel)
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Reports;
