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

export const ReceiverStage: React.FC<ReceiverStageProps> = ({ batch, shipments: rawShipments, inspections }) => {
    // Filter active shipments
    const shipments = useMemo(() =>
        (rawShipments || []).filter(s => !['merged_child', 'split_parent'].includes(s.package_tag || '')),
        [rawShipments]);
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
            {/* Overview Card - Financial & Operational Summary */}
            <div className="px-4 py-4 sticky top-0 bg-background-light dark:bg-background-dark z-10">
                <div className="bg-white dark:bg-[#1c2433] rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <span className="material-icons text-primary text-base">fact_check</span>
                            派送计费看板
                        </h2>
                        <span className={`text-xs ${diff < -0.5 ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10'} px-2 py-1 rounded-full font-medium border border-current/20`}>
                            {diff < -0.5 ? `缺失: ${diff.toFixed(2)}kg` : '到货正常'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">应收派送费 (Billable)</p>
                            <div className="flex items-end gap-2 text-slate-900 dark:text-white">
                                <span className="text-2xl font-black font-mono text-emerald-600">{totalCheckWeight.toFixed(2)}</span>
                                <span className="text-xs font-bold text-slate-400 mb-1.5">kg</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-1 pl-4 border-l border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">中转参考 (Ref)</p>
                            <div className="flex items-end gap-2 text-slate-900 dark:text-white">
                                <span className="text-xl font-bold font-mono text-slate-500">{totalTransitWeight > 0 ? totalTransitWeight.toFixed(2) : '--'}</span>
                                <span className="text-xs text-slate-400 mb-1.5">kg</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-slate-400 h-full rounded-full" style={{ width: `${Math.min((totalTransitWeight / (totalCheckWeight || 1)) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                    {isReceiver && (
                        <div className="mt-4 text-[10px] text-emerald-600/80 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                            <span className="material-icons text-sm">warning</span>
                            <span>如遇【合包破损】，请直接扫描内部小包ID。系统将自动拆分并记录异常。</span>
                        </div>
                    )}
                </div>
            </div>

            {/* List Header */}
            <div className="px-6 pb-2 flex justify-between items-center text-xs text-slate-400 uppercase font-bold tracking-wider">
                <span>Received Entity</span>
                <span>Actual Weight</span>
            </div>

            {/* Comparison List - Grouped by Parent logic but prioritizing Scanned Entity */}
            <div className="px-4 space-y-4 pb-24">
                {/* 1. Render Parents (Merged Groups) */}
                {shipments.filter(s => shipments.some(child => child.parent_id === s.id)).map(parent => {
                    const children = shipments.filter(child => child.parent_id === parent.id);
                    const check = parsedData.checkMap[parent.id];
                    const transit = parsedData.transitMap[parent.id];

                    // Logic: Has the PARENT been scanned?
                    const isParentScanned = !!check;
                    // Logic: Have any CHILDREN been scanned individually (Split/Break)?
                    const splitChildren = children.filter(c => parsedData.checkMap[c.id]);
                    const isPartialBreak = splitChildren.length > 0;

                    return (
                        <div key={parent.id} className={`bg-white dark:bg-[#1c2433] rounded-xl border shadow-md overflow-hidden relative ${isPartialBreak ? 'border-red-500/30' : 'border-emerald-500/20'}`}>
                            {isPartialBreak && <div className="absolute top-0 right-0 px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-bl-lg z-10">BROKEN / SPLIT</div>}

                            {/* Parent Header */}
                            <div
                                onClick={() => isReceiver && setSelectedId(parent.id)}
                                className={`p-4 cursor-pointer transition-colors border-b ${isParentScanned ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100' : 'bg-slate-50 dark:bg-black/20 border-slate-100'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${isParentScanned ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            <span className="material-icons text-sm">{isParentScanned ? 'check' : 'inventory_2'}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black font-mono text-slate-900 dark:text-white">{parent.tracking_no}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${isParentScanned ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                                    {isParentScanned ? 'Fully Received' : (isPartialBreak ? 'Partial / Error' : 'Pending Scan')}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="text-[10px] text-slate-500 truncate max-w-[60px]">{parent.shipper_name || '未填'}</span>
                                                <span className={`text-[9px] font-bold px-1 rounded ${parent.transport_mode === 1 ? 'bg-amber-50 text-amber-600' : parent.transport_mode === 2 ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                    {parent.transport_mode === 1 ? '陆' : parent.transport_mode === 2 ? '海' : '空'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xl font-black font-mono ${check ? 'text-emerald-600' : 'text-slate-300'}`}>
                                            {check ? check.check_weight?.toFixed(2) : '--'} <span className="text-xs text-slate-400">kg</span>
                                        </p>
                                        <p className="text-[10px] text-slate-400">Transit Ref: {transit?.transit_weight?.toFixed(2) || '--'} kg</p>
                                    </div>
                                </div>
                            </div>

                            {/* Children List - Show status of each child */}
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#1c2433]">
                                {children.map(child => {
                                    const childCheck = parsedData.checkMap[child.id];
                                    return (
                                        <div key={child.id}
                                            onClick={() => isReceiver && setSelectedId(child.id)}
                                            className={`px-4 py-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${childCheck ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}
                                        >
                                            <div className="flex items-center gap-3 pl-8 relative">
                                                <div className="absolute left-2 top-1/2 w-4 h-[1px] bg-slate-300"></div>
                                                <div className="absolute left-2 top-0 h-1/2 w-[1px] bg-slate-300"></div>

                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${childCheck ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                    <span className="material-icons text-[10px]">{childCheck ? 'priority_high' : 'arrow_forward'}</span>
                                                </div>

                                                <div>
                                                    <p className={`text-xs font-mono font-bold ${childCheck ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        {child.tracking_no}
                                                    </p>
                                                    {childCheck && <span className="text-[9px] text-red-500 font-bold uppercase">Anomalous Split Scan</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-xs font-mono font-bold ${childCheck ? 'text-red-500' : 'text-slate-400'}`}>
                                                    {childCheck ? `${childCheck.check_weight?.toFixed(2)} kg` : 'In Parent'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* 2. Render Independent Shipments */}
                {shipments.filter(s => !s.parent_id && !shipments.some(child => child.parent_id === s.id)).map(s => {
                    const check = parsedData.checkMap[s.id];
                    const transit = parsedData.transitMap[s.id];
                    return (
                        <div key={s.id} onClick={() => isReceiver && setSelectedId(s.id)} className={`bg-white dark:bg-[#1c2433] rounded-xl border shadow-sm p-4 relative overflow-hidden active:scale-[0.99] transition-all ${check ? 'border-emerald-500/30' : 'border-slate-100 dark:border-slate-800'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${check ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <span className="material-icons text-sm">{check ? 'check' : 'qr_code_Scanner'}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{s.tracking_no}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Standard</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="text-[10px] text-slate-500 truncate max-w-[80px]">{s.shipper_name || '未填'}</span>
                                            <span className={`text-[9px] font-bold px-1.5 rounded ${s.transport_mode === 1 ? 'bg-amber-50 text-amber-600' : s.transport_mode === 2 ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                {s.transport_mode === 1 ? '陆' : s.transport_mode === 2 ? '海' : '空'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-black font-mono ${check ? 'text-primary' : 'text-slate-300'}`}>
                                        {check ? check.check_weight?.toFixed(2) : '--'} <span className="text-[10px] text-slate-400">kg</span>
                                    </p>
                                    <p className="text-[10px] text-slate-400">Transit: {transit?.transit_weight?.toFixed(2) || '--'} kg</p>
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
                    role="receiver"
                    onSave={handleSave}
                />
            )}

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#1c2433]/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3 z-30">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Ready for Settlement</span>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${diff < -0.5 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{diff < -0.5 ? 'Audit Required' : 'Auto-Approve'}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};
