import React, { useMemo, useState } from 'react';
import { Shipment } from '../../../services/shipment.service';
import { Batch } from '../../../services/batch.service';
import { Inspection } from '../../../services/inspection.service';
import { useUserStore } from '../../../store/user.store';
import { useUpdateInspection } from '../../../hooks/useInspections';
import { useMergeShipments, useSplitShipment } from '../../../hooks/useShipments';
import { ShipmentEditModal } from './ShipmentEditModal';
import { MergeModal } from './MergeModal';
import { SplitModal } from './SplitModal';
import { toast } from 'react-hot-toast';

interface TransitStageProps {
    batch: Batch;
    shipments: Shipment[];
    inspections: Inspection[];
}

export const TransitStage: React.FC<TransitStageProps> = ({ batch, shipments: rawShipments, inspections }) => {
    // Filter active shipments only
    const shipments = useMemo(() =>
        (rawShipments || []).filter(s => !['merged_child', 'split_parent'].includes(s.package_tag || '')),
        [rawShipments]);

    const { user } = useUserStore();
    const isTransit = user?.role === 'transit';
    const updateInspection = useUpdateInspection();
    const mergeMutation = useMergeShipments();
    const splitMutation = useSplitShipment();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [splitTarget, setSplitTarget] = useState<Shipment | null>(null);

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

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedForMerge);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedForMerge(newSet);
    };

    const handleMergeConfirm = async (data: { tracking_no: string, total_weight: number }) => {
        try {
            await mergeMutation.mutateAsync({
                parent_tracking_no: data.tracking_no,
                child_ids: Array.from(selectedForMerge),
                batch_id: batch.id,
                total_weight: data.total_weight
            });
            setShowMergeModal(false);
            setIsSelectionMode(false);
            setSelectedForMerge(new Set());
        } catch (err) {
            console.error(err);
        }
    };

    const handleSplitConfirm = async (data: { parent_id: string, children: any[] }) => {
        try {
            await splitMutation.mutateAsync({
                parent_id: data.parent_id,
                batch_id: batch.id,
                children: data.children,
                role: 'transit'
            });
            setSplitTarget(null);
        } catch (err) {
            console.error(err);
        }
    };

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
            <div className="px-4 py-4 sticky top-0 bg-background-light dark:bg-background-dark z-10 space-y-3">
                <div className="bg-white dark:bg-[#1c2433] rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <span className="material-icons text-primary text-base">account_balance_wallet</span>
                            中转计费看板
                        </h2>
                        <span className={`text-xs ${Math.abs(diff) > 0.5 ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'} px-2 py-1 rounded-full font-medium border border-current/20`}>
                            {Math.abs(diff) > 0.5 ? `差异: ${diff.toFixed(2)}kg` : '账目平衡'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">应付中转费 (Billable)</p>
                            <div className="flex items-end gap-2 text-slate-900 dark:text-white">
                                <span className="text-2xl font-black font-mono text-primary">{totalTransitWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span className="text-xs font-bold text-slate-400 mb-1.5">kg</span>
                            </div>
                        </div>
                        <div className="space-y-1 pl-4 border-l border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">发出参考 (Ref)</p>
                            <div className="flex items-end gap-2 text-slate-900 dark:text-white">
                                <span className="text-xl font-bold font-mono text-slate-500">{totalSenderWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span className="text-xs text-slate-400 mb-1.5">kg</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Panel */}
                {isTransit && (
                    <div className="flex gap-2">
                        {!isSelectionMode ? (
                            <button
                                onClick={() => setIsSelectionMode(true)}
                                className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-primary/10 transition-all uppercase tracking-widest active:scale-95"
                            >
                                <span className="material-icons text-sm">merge_type</span>
                                开启合并模式 (Merge Mode)
                            </button>
                        ) : (
                            <div className="flex-1 flex gap-2 animate-in slide-in-from-top-2 duration-300">
                                <button
                                    onClick={() => {
                                        setIsSelectionMode(false);
                                        setSelectedForMerge(new Set());
                                    }}
                                    className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95"
                                >
                                    取消
                                </button>
                                <button
                                    disabled={selectedForMerge.size < 2 || mergeMutation.isPending}
                                    onClick={() => setShowMergeModal(true)}
                                    className="flex-[2] bg-primary text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                                >
                                    {mergeMutation.isPending ? '正在执行' : `合并已选 (${selectedForMerge.size})`}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Comparison List */}
            <div className="px-4 space-y-4 pb-32">
                {/* 1. Independent Shipments */}
                {shipments.filter(s => !s.parent_id && !shipments.some(child => child.parent_id === s.id)).map(s => {
                    const insp = parsedInspections[s.id];
                    const isSelected = selectedForMerge.has(s.id);

                    return (
                        <div
                            key={s.id}
                            onClick={() => {
                                if (isSelectionMode && !insp) {
                                    const e = { stopPropagation: () => { } } as React.MouseEvent;
                                    toggleSelection(s.id, e);
                                    return;
                                }
                                if (!isSelectionMode && isTransit && insp) setSelectedId(s.id);
                            }}
                            className={`bg-white dark:bg-[#1c2433] rounded-2xl border transition-all relative overflow-hidden active:scale-[0.99] group
                                ${isSelectionMode ? (isSelected ? 'border-primary ring-4 ring-primary/10' : 'border-slate-200 dark:border-slate-800') : (insp ? 'border-emerald-500/30' : 'border-slate-200 dark:border-slate-800')}
                                ${!insp && !isSelectionMode ? 'opacity-90' : ''}`}
                        >
                            {isSelectionMode && !insp && (
                                <div
                                    className="absolute top-4 right-4 z-20 w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center transition-all"
                                >
                                    {isSelected && <div className="w-3 h-3 rounded-full bg-primary animate-in zoom-in-50"></div>}
                                </div>
                            )}

                            <div className="p-4 flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                                        ${insp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                        <span className="material-icons">{insp ? 'task_alt' : 'inventory_2'}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{s.tracking_no}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Independent Package</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-black font-mono ${insp ? 'text-emerald-500' : 'text-slate-300'}`}>
                                        {insp?.transit_weight ? insp.transit_weight.toFixed(2) : '--'}
                                        <span className="text-[10px] text-slate-400 ml-1">kg</span>
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold italic">Sender: {s.weight} kg</p>
                                </div>
                            </div>

                            {/* Unverified Actions */}
                            {isTransit && !insp && !isSelectionMode && (
                                <div className="px-4 py-3 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSplitTarget(s);
                                        }}
                                        className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase text-slate-500 hover:bg-white dark:hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <span className="material-icons text-xs">call_split</span>
                                        快速拆分 (Split)
                                    </button>
                                    <button
                                        onClick={(e) => toggleSelection(s.id, e)}
                                        className="flex-1 py-1.5 rounded-lg border border-primary/20 text-[10px] font-black uppercase text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <span className="material-icons text-xs">merge_type</span>
                                        加入合并 (Add Merge)
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* 2. Parent Shipments */}
                {shipments.filter(s => shipments.some(child => child.parent_id === s.id)).map(parent => {
                    const children = shipments.filter(child => child.parent_id === parent.id);
                    const parentInsp = parsedInspections[parent.id];
                    const childrenTotalWeight = children.reduce((sum, c) => sum + (parseFloat(c.weight as any) || 0), 0);

                    return (
                        <div key={parent.id} className="bg-white dark:bg-[#1c2433] rounded-2xl border border-primary/20 shadow-lg overflow-hidden relative">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${parentInsp ? 'bg-emerald-500' : 'bg-primary'}`}></div>

                            {/* Parent Header */}
                            <div
                                onClick={() => isTransit && parentInsp && setSelectedId(parent.id)}
                                className={`p-4 cursor-pointer hover:bg-primary/5 transition-colors border-b border-slate-100 dark:border-white/5
                                    ${parentInsp ? 'bg-emerald-500/5' : 'bg-primary/5'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg
                                            ${parentInsp ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-primary shadow-primary/20'}`}>
                                            <span className="material-icons">{parentInsp ? 'done_all' : 'layers'}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black font-mono text-slate-900 dark:text-white">{parent.tracking_no}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-black bg-primary/20 text-primary-dark px-1.5 py-0.5 rounded uppercase">Merged Parent</span>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase">{children.length} Items</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xl font-black font-mono ${parentInsp ? 'text-emerald-500' : 'text-primary'}`}>
                                            {parentInsp?.transit_weight ? parentInsp.transit_weight.toFixed(2) : '--'}
                                            <span className="text-xs text-slate-400 ml-1">kg</span>
                                        </p>
                                        {!parentInsp && (
                                            <div className="flex justify-end gap-1.5 mt-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSplitTarget(parent);
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                                                >
                                                    <span className="material-icons text-sm">call_split</span>
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-[10px] font-bold text-slate-400 italic">Expected: {childrenTotalWeight.toFixed(2)} kg</p>
                                    </div>
                                </div>
                            </div>

                            {/* Children List */}
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-black/10">
                                {children.map(child => (
                                    <div key={child.id} className="px-4 py-3 flex justify-between items-center opacity-60">
                                        <div className="flex items-center gap-3 pl-8 relative">
                                            <div className="absolute left-2 top-0 h-full w-[1.5px] bg-slate-200 dark:bg-slate-800"></div>
                                            <div className="absolute left-2 top-1/2 w-4 h-[1.5px] bg-slate-200 dark:bg-slate-800"></div>
                                            <span className="material-icons text-[10px] text-slate-400">subdirectory_arrow_right</span>
                                            <span className="text-[10px] font-mono font-bold text-slate-500">{child.tracking_no}</span>
                                        </div>
                                        <span className="text-[10px] font-black font-mono text-slate-400">{child.weight} kg</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            <MergeModal
                isOpen={showMergeModal}
                onClose={() => setShowMergeModal(false)}
                selectedShipments={shipments.filter(s => selectedForMerge.has(s.id))}
                onConfirm={handleMergeConfirm}
                isPending={mergeMutation.isPending}
            />

            <SplitModal
                isOpen={!!splitTarget}
                onClose={() => setSplitTarget(null)}
                parentShipment={splitTarget}
                onConfirm={handleSplitConfirm}
                isPending={splitMutation.isPending}
            />

            {selectedShipment && (
                <ShipmentEditModal
                    isOpen={!!selectedId}
                    onClose={() => setSelectedId(null)}
                    shipment={selectedShipment}
                    inspection={selectedInspection || undefined}
                    role="transit"
                    onSave={handleSave}
                />
            )}
        </div>
    );
};
