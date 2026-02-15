import React, { useMemo, useState } from 'react';
import { Shipment } from '../../../services/shipment.service';
import { Batch } from '../../../services/batch.service';
import { Inspection } from '../../../services/inspection.service';
import { useUserStore } from '../../../store/user.store';
import { useUpdateInspection } from '../../../hooks/useInspections';
import { ShipmentEditModal } from './ShipmentEditModal';

interface ReceiverStageProps {
    batch: Batch;
    shipments: Shipment[];
    inspections: Inspection[];
}

export const ReceiverStage: React.FC<ReceiverStageProps> = ({ batch, shipments, inspections }) => {
    const { user } = useUserStore();
    const isReceiver = user?.role === 'receiver';
    const updateInspection = useUpdateInspection();
    const [selectedId, setSelectedId] = useState<string | null>(null);

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

    const totalSenderWeight = shipments.reduce((sum, s) => sum + (parseFloat(s.weight as any) || 0), 0);
    const totalTransitWeight = Object.values(parsedData.transitMap).reduce((sum, i) => sum + (parseFloat(i.transit_weight as any) || 0), 0);
    const totalCheckWeight = Object.values(parsedData.checkMap).reduce((sum, i) => sum + (parseFloat(i.check_weight as any) || 0), 0);

    const receivedCount = shipments.filter(s => s.status === 'received').length;
    const totalCount = shipments.length;
    const anomalies = shipments.filter(s => {
        const check = parsedData.checkMap[s.id];
        if (!check) return false;
        return Math.abs((check.check_weight || 0) - (s.weight || 0)) > 0.1;
    }).length;

    const diff = totalCheckWeight - totalSenderWeight;

    const handleSave = async (data: any) => {
        if (!selectedId) return;
        const insp = parsedData.checkMap[selectedId];
        if (!insp) return;

        await updateInspection.mutateAsync({
            id: insp.id,
            updates: {
                check_weight: data.weight,
                check_length: data.length,
                check_width: data.width,
                check_height: data.height
            }
        });
    };

    const selectedShipment = selectedId ? shipments.find(s => s.id === selectedId) : null;
    const selectedInspection = selectedId ? parsedData.checkMap[selectedId] : null;

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
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">{totalSenderWeight.toFixed(2)} kg</span>
                        </div>
                        <div className="flex flex-col items-center pl-1">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide">中转总重</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">{totalTransitWeight > 0 ? totalTransitWeight.toFixed(2) : '--'} kg</span>
                        </div>
                        <div className="flex flex-col items-center pl-1">
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wide">接收总重</span>
                            <span className="text-lg font-bold text-primary mt-0.5">{totalCheckWeight.toFixed(2)} kg</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">总件数: <span className="text-slate-900 dark:text-white font-black">{totalCount}</span></span>
                        <span className={`font-black px-2 py-0.5 rounded-full ${diff < 0 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'}`}>
                            差异: {diff > 0 ? '+' : ''}{diff.toFixed(2)}kg
                        </span>
                    </div>
                    {isReceiver && (
                        <div className="mt-4 text-[10px] text-primary dark:text-blue-400 flex items-center gap-1 bg-primary/5 p-2 rounded-lg border border-primary/10">
                            <span className="material-icons text-sm">edit_note</span>
                            <span>作为接收员，您可以点击下方列表对【接收实测】数据进行修正。</span>
                        </div>
                    )}
                </div>
            </div>

            {/* List Header */}
            <div className="px-4 pb-2 flex justify-between items-center">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">接收明细 ({totalCount})</h3>
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
                            onClick={() => isReceiver && check && setSelectedId(s.id)}
                            className={`bg-white dark:bg-[#1c2433] p-3 rounded-lg border shadow-sm transition-all ${isReceiver && check ? 'cursor-pointer hover:border-primary/50 active:scale-[0.99]' : ''} ${isAnomalous || isMissing ? 'border-l-4 border-l-red-500 border-y-slate-100 border-r-slate-100 dark:border-y-slate-700/50 dark:border-r-slate-700/50' : 'border-slate-100 dark:border-slate-700/50'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`material-icons text-lg ${isAnomalous || isMissing ? 'text-red-500' : 'text-slate-400'}`}>
                                        {isMissing ? 'warning' : 'qr_code_2'}
                                    </span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white font-mono leading-none">{s.tracking_no}</span>
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
                                    <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">{s.weight.toFixed(2)} kg</span>
                                </div>
                                <div className="flex flex-col border-r border-slate-200 dark:border-slate-700 px-2">
                                    <span className="text-[10px] text-slate-400 scale-90 origin-left">中转</span>
                                    <span className="font-mono text-slate-600 dark:text-slate-300">{transit ? transit.transit_weight?.toFixed(2) : '--'} kg</span>
                                </div>
                                <div className="flex flex-col pl-2">
                                    <span className={`text-[10px] ${isAnomalous || isMissing ? 'text-red-500' : 'text-primary'} font-bold scale-90 origin-left`}>接收</span>
                                    <span className={`font-mono font-black ${isAnomalous || isMissing ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                        {check ? `${check.check_weight?.toFixed(2)} kg` : (isMissing ? '未扫描' : '--')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-2 px-1 text-xs">
                                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono">
                                    <span className="material-icons text-[14px]">straighten</span>
                                    {check ? (
                                        <span>{check.check_length}x{check.check_width}x{check.check_height} cm</span>
                                    ) : (
                                        <span>{s.length}x{s.width}x{s.height} cm</span>
                                    )}
                                </div>
                                {isAnomalous && (
                                    <span className="text-red-500 font-bold bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded text-[10px]">
                                        {((check?.check_weight || 0) - s.weight) > 0 ? '+' : ''}{((check?.check_weight || 0) - s.weight).toFixed(2)}kg 差异
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedShipment && (
                <ShipmentEditModal
                    isOpen={!!selectedShipment}
                    onClose={() => setSelectedId(null)}
                    shipment={selectedShipment}
                    inspection={selectedInspection || undefined}
                    role="receiver"
                    onSave={handleSave}
                />
            )}

            {/* Footer */}
            <footer className="flex-none bg-slate-50 dark:bg-[#1c2433] border-t border-slate-200 dark:border-slate-800 px-6 py-3 pb-8 z-30 mb-safe">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">批次完成度</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
                                {Math.round((receivedCount / (totalCount || 1)) * 100)}%
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
                                {diff > 0 ? '+' : ''}{diff.toFixed(2)} kg
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
