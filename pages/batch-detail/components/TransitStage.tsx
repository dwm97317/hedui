import React, { useMemo, useState } from 'react';
import { Shipment } from '../../../services/shipment.service';
import { Batch } from '../../../services/batch.service';
import { Inspection } from '../../../services/inspection.service';
import { useUserStore } from '../../../store/user.store';
import { useUpdateInspection } from '../../../hooks/useInspections';
import { ShipmentEditModal } from './ShipmentEditModal';

interface TransitStageProps {
    batch: Batch;
    shipments: Shipment[];
    inspections: Inspection[];
}

export const TransitStage: React.FC<TransitStageProps> = ({ batch, shipments, inspections }) => {
    const { user } = useUserStore();
    const isTransit = user?.role === 'transit';
    const updateInspection = useUpdateInspection();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const parsedInspections = useMemo(() => {
        const map: Record<string, Inspection> = {};
        inspections.forEach(i => {
            if (i.notes?.includes('ShipmentID:')) {
                const id = i.notes.split('ShipmentID:')[1].split(' ')[0];
                map[id] = i;
            }
        });
        return map;
    }, [inspections]);

    const totalTransitWeight = Object.values(parsedInspections).reduce((sum, i) => sum + (parseFloat(i.transit_weight as any) || 0), 0);
    const totalSenderWeight = shipments.reduce((sum, s) => sum + (parseFloat(s.weight as any) || 0), 0);
    const diff = totalTransitWeight - totalSenderWeight;

    const anomalies = shipments.filter(s => {
        const insp = parsedInspections[s.id];
        if (!insp) return false;
        return Math.abs((insp.transit_weight || 0) - (s.weight || 0)) > 0.1;
    }).length;

    const handleSave = async (data: any) => {
        if (!selectedId) return;
        const insp = parsedInspections[selectedId];
        if (!insp) return;

        await updateInspection.mutateAsync({
            id: insp.id,
            updates: {
                transit_weight: data.weight,
                transit_length: data.length,
                transit_width: data.width,
                transit_height: data.height
            }
        });
    };

    const selectedShipment = selectedId ? shipments.find(s => s.id === selectedId) : null;
    const selectedInspection = selectedId ? parsedInspections[selectedId] : null;

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Overview Card */}
            <div className="px-4 py-4 sticky top-0 bg-background-light dark:bg-background-dark z-10">
                <div className="bg-white dark:bg-[#1c2433] rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <span className="material-icons text-primary text-base">scale</span>
                            重量差异统计
                        </h2>
                        <span className={`text-xs ${anomalies > 0 ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'} px-2 py-1 rounded-full font-medium border border-current/20`}>
                            {anomalies > 0 ? `异常: ${anomalies}件` : '数据正常'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">中转实测总重 (kg)</p>
                            <div className="flex items-end gap-2 text-slate-900 dark:text-white">
                                <span className="text-2xl font-bold font-mono">{totalTransitWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                {diff !== 0 && (
                                    <span className={`text-xs font-medium ${diff > 0 ? 'text-amber-500' : 'text-emerald-500'} mb-1`}>
                                        {diff > 0 ? '+' : ''}{diff.toFixed(2)}kg
                                    </span>
                                )}
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-1 pl-4 border-l border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400">发出登记总重 (kg)</p>
                            <div className="flex items-end gap-2 text-slate-900 dark:text-white">
                                <span className="text-2xl font-bold font-mono">{totalSenderWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-primary h-full rounded-full" style={{ width: '98%' }}></div>
                            </div>
                        </div>
                    </div>
                    {isTransit && (
                        <div className="mt-4 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            <span className="material-icons text-sm">edit_note</span>
                            <span>作为中转员，您可以点击下方列表对【中转实测】数据进行修正。</span>
                        </div>
                    )}
                </div>
            </div>

            {/* List Header */}
            <div className="px-4 pb-2 flex justify-between items-center">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">数据对比清单 ({shipments.length})</h3>
            </div>

            {/* Comparison List */}
            <div className="px-4 space-y-3 pb-24">
                {shipments.map((s) => {
                    const insp = parsedInspections[s.id];
                    const weightDiff = insp ? (insp.transit_weight || 0) - (s.weight || 0) : 0;
                    const hasDiff = Math.abs(weightDiff) > 0.1;
                    const dimDiff = insp ? (insp.transit_length !== s.length || insp.transit_width !== s.width || insp.transit_height !== s.height) : false;

                    return (
                        <div
                            key={s.id}
                            onClick={() => isTransit && insp && setSelectedId(s.id)}
                            className={`bg-white dark:bg-[#1c2433] p-4 rounded-lg border shadow-sm relative overflow-hidden transition-all ${isTransit && insp ? 'cursor-pointer hover:border-primary/50 active:scale-[0.99]' : ''} ${(hasDiff || dimDiff)
                                ? 'border-l-4 border-l-amber-500 border-y-slate-100 border-r-slate-100 dark:border-y-slate-700/50 dark:border-r-slate-700/50'
                                : 'border-slate-100 dark:border-slate-700/50'
                                }`}
                        >
                            {(hasDiff || dimDiff) && (
                                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                                    <div className="absolute transform rotate-45 bg-amber-500 text-white text-[9px] font-bold py-1 right-[-35px] top-[15px] w-[120px] text-center shadow-sm">
                                        差异
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(hasDiff || dimDiff) ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' : 'bg-blue-50 dark:bg-blue-900/20 text-primary'
                                        }`}>
                                        <span className="material-icons text-base">
                                            {(hasDiff || dimDiff) ? 'priority_high' : 'sync_alt'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">{s.tracking_no}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mr-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${insp
                                        ? (hasDiff || dimDiff ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400')
                                        : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {insp ? (hasDiff || dimDiff ? '异常待核' : '已查验') : '未处理'}
                                    </span>
                                    {isTransit && insp && <span className="material-icons text-primary/30 text-xs">edit</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div className="text-slate-400 dark:text-slate-500 font-medium pb-1 border-b border-slate-100 dark:border-slate-700">发出数据</div>
                                <div className={`${hasDiff || dimDiff ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400 dark:text-slate-500'} font-medium pb-1 border-b border-current/20`}>中转实测</div>

                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400">重量</span>
                                    <span className="font-mono text-slate-600 dark:text-slate-300 font-black">{s.weight?.toFixed(2)} kg</span>
                                </div>
                                <div className={`flex flex-col ${hasDiff ? 'bg-amber-50 dark:bg-amber-900/10 -mx-2 px-2 rounded' : ''}`}>
                                    <span className={`text-[10px] ${hasDiff ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400'}`}>
                                        重量 {hasDiff ? `(${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(2)})` : ''}
                                    </span>
                                    <span className={`font-mono ${hasDiff ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-slate-900 dark:text-white font-black'}`}>
                                        {insp ? insp.transit_weight?.toFixed(2) : '--'} kg
                                    </span>
                                </div>

                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400">尺寸</span>
                                    <span className="font-mono text-slate-600 dark:text-slate-300">{s.length}x{s.width}x{s.height}</span>
                                </div>
                                <div className={`flex flex-col ${dimDiff ? 'bg-amber-50 dark:bg-amber-900/10 -mx-2 px-2 rounded' : ''}`}>
                                    <span className={`text-[10px] ${dimDiff ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400'}`}>尺寸</span>
                                    <span className={`font-mono ${dimDiff ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-900 dark:text-white font-semibold'}`}>
                                        {insp ? `${insp.transit_length}x${insp.transit_width}x${insp.transit_height}` : '--'}
                                    </span>
                                </div>
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
                    role="transit"
                    onSave={handleSave}
                />
            )}

            {/* Footer */}
            <footer className="flex-none bg-white dark:bg-[#1c2433] border-t border-slate-200 dark:border-slate-800 px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 mb-safe">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500 dark:text-slate-400">复核进度</span>
                        <span className="text-sm font-bold text-primary dark:text-blue-400">
                            {Object.keys(parsedInspections).length === shipments.length ? '已完成' : '查验中'}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-slate-500 dark:text-slate-400">已复核/总数</span>
                        <div className="text-sm font-mono font-medium text-slate-900 dark:text-white">
                            {Object.keys(parsedInspections).length} / {shipments.length}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
