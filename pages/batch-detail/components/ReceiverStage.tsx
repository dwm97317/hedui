import React, { useMemo } from 'react';
import { Shipment } from '../../../services/shipment.service';
import { Batch } from '../../../services/batch.service';
import { Inspection } from '../../../services/inspection.service';

interface ReceiverStageProps {
    batch: Batch;
    shipments: Shipment[];
    inspections: Inspection[];
}

export const ReceiverStage: React.FC<ReceiverStageProps> = ({ batch, shipments, inspections }) => {
    const parsedData = useMemo(() => {
        const transitMap: Record<string, Inspection> = {};
        const checkMap: Record<string, Inspection> = {};

        inspections.forEach(i => {
            if (i.notes?.includes('ShipmentID:')) {
                const id = i.notes.split('ShipmentID:')[1].split(' ')[0];
                if (i.notes.includes('WeighCheck:')) {
                    transitMap[id] = i;
                }
                if (i.notes.includes('ReceiverItemCheck')) {
                    checkMap[id] = i;
                }
            }
        });
        return { transitMap, checkMap };
    }, [inspections]);

    const totalSenderWeight = shipments.reduce((sum, s) => sum + (s.weight || 0), 0);
    const totalTransitWeight = Object.values(parsedData.transitMap).reduce((sum, i) => sum + (i.transit_weight || 0), 0);
    const totalCheckWeight = Object.values(parsedData.checkMap).reduce((sum, i) => sum + (i.check_weight || 0), 0);

    const receivedCount = shipments.filter(s => s.status === 'received').length;
    const totalCount = shipments.length;
    const anomalies = shipments.filter(s => {
        const check = parsedData.checkMap[s.id];
        if (!check) return false;
        return Math.abs((check.check_weight || 0) - (s.weight || 0)) > 0.1;
    }).length;

    const diff = totalCheckWeight - totalSenderWeight;

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Overview Card */}
            <div className="px-4 py-4 sticky top-0 bg-background-light dark:bg-background-dark z-10">
                <div className="bg-white dark:bg-[#1c2433] rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <span className="material-icons text-primary text-base">fact_check</span>
                            全链路数据审计
                        </h2>
                        <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full font-medium border border-slate-200 dark:border-slate-700">已锁定</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100 dark:divide-slate-700">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide">发出总重</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">{totalSenderWeight.toFixed(1)} kg</span>
                        </div>
                        <div className="flex flex-col items-center pl-1">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide">中转总重</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">{totalTransitWeight > 0 ? totalTransitWeight.toFixed(1) : '--'} kg</span>
                        </div>
                        <div className="flex flex-col items-center pl-1">
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wide">接收总重</span>
                            <span className="text-lg font-bold text-primary mt-0.5">{totalCheckWeight.toFixed(1)} kg</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400">总件数: <span className="text-slate-900 dark:text-white font-medium">{totalCount}</span></span>
                        <span className="text-slate-500 dark:text-slate-400">总体积: <span className="text-slate-900 dark:text-white font-medium">-- m³</span></span>
                        <span className={`font-medium px-1.5 py-0.5 rounded ${diff < 0 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'}`}>
                            差异: {diff > 0 ? '+' : ''}{diff.toFixed(1)}kg
                        </span>
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className="px-4 pb-2 flex justify-between items-center">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">接收明细 ({totalCount})</h3>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="material-icons text-sm">lock</span>
                    只读模式
                </span>
            </div>

            {/* Audit List */}
            <div className="px-4 space-y-3 pb-24">
                {shipments.map((s) => {
                    const transit = parsedData.transitMap[s.id];
                    const check = parsedData.checkMap[s.id];
                    const isAnomalous = check && Math.abs((check.check_weight || 0) - (s.weight || 0)) > 0.1;
                    const isMissing = s.status !== 'received' && batch.status === 'completed';

                    return (
                        <div
                            key={s.id}
                            className={`bg-white dark:bg-[#1c2433] p-3 rounded-lg border shadow-sm transition-all ${isAnomalous || isMissing ? 'border-l-4 border-l-red-500 border-y-slate-100 border-r-slate-100 dark:border-y-slate-700/50 dark:border-r-slate-700/50' : 'border-slate-100 dark:border-slate-700/50'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`material-icons text-lg ${isAnomalous || isMissing ? 'text-red-500' : 'text-slate-400'}`}>
                                        {isMissing ? 'warning' : 'qr_code_2'}
                                    </span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{s.tracking_no}</span>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${isMissing ? 'bg-red-50 text-red-700 border-red-200' :
                                    (isAnomalous ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800')
                                    }`}>
                                    {isMissing ? '缺失包裹' : (isAnomalous ? '入库异常' : '已确认接收')}
                                </span>
                            </div>

                            <div className={`grid grid-cols-3 gap-2 rounded p-2 text-xs border transition-colors ${isAnomalous || isMissing ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
                                }`}>
                                <div className="flex flex-col border-r border-slate-200 dark:border-slate-700 pr-2">
                                    <span className="text-[10px] text-slate-400 scale-90 origin-left">发出</span>
                                    <span className="font-mono text-slate-600 dark:text-slate-300">{s.weight.toFixed(1)} kg</span>
                                </div>
                                <div className="flex flex-col border-r border-slate-200 dark:border-slate-700 px-2">
                                    <span className="text-[10px] text-slate-400 scale-90 origin-left">中转</span>
                                    <span className="font-mono text-slate-600 dark:text-slate-300">{transit ? transit.transit_weight?.toFixed(1) : '--'} kg</span>
                                </div>
                                <div className="flex flex-col pl-2">
                                    <span className={`text-[10px] ${isAnomalous || isMissing ? 'text-red-500' : 'text-primary'} font-bold scale-90 origin-left`}>接收</span>
                                    <span className={`font-mono font-bold ${isAnomalous || isMissing ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                        {check ? `${check.check_weight?.toFixed(1)} kg` : (isMissing ? '未扫描' : '--')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-2 px-1 text-xs">
                                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                    <span className="material-icons text-[14px]">straighten</span>
                                    <span>{s.length}x{s.width}x{s.height} cm</span>
                                </div>
                                {isAnomalous && (
                                    <span className="text-red-500 font-medium bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded text-[10px]">
                                        {((check?.check_weight || 0) - s.weight) > 0 ? '+' : ''}{((check?.check_weight || 0) - s.weight).toFixed(1)}kg 差异
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <footer className="flex-none bg-slate-50 dark:bg-[#1c2433] border-t border-slate-200 dark:border-slate-800 px-6 py-3 pb-8 z-30 mb-safe">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">批次完成度</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
                                {Math.round((receivedCount / totalCount) * 100)}%
                            </span>
                            <span className="text-xs text-slate-400">({receivedCount}/{totalCount})</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">异常数</span>
                            <span className="text-sm font-mono font-bold text-amber-500">{anomalies} 件</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">总差异</span>
                            <span className={`text-sm font-mono font-bold ${diff < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
