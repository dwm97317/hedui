import React, { useState, useMemo } from 'react';
import { Shipment } from '../../../services/shipment.service';
import { Batch } from '../../../services/batch.service';
import { Inspection } from '../../../services/inspection.service';
import { ShipmentEditModal } from './ShipmentEditModal';
import { useUpdateShipment } from '../../../hooks/useShipments';
import { useUserStore } from '../../../store/user.store';
import { useScannerStore } from '../../../store/scanner.store';
import { toast } from 'react-hot-toast';

interface SenderStageProps {
    batch: Batch;
    shipments: Shipment[];
    inspections: Inspection[];
}

export const SenderStage: React.FC<SenderStageProps> = ({ batch, shipments: rawShipments, inspections }) => {
    // Show Full History for Sender
    const shipments = rawShipments || [];

    // Calculate totals using ONLY ACTIVE shipments (avoid double counting)
    const activeShipments = useMemo(() =>
        shipments.filter(s => !['merged_child', 'split_parent'].includes(s.package_tag || '')),
        [shipments]);

    const { user } = useUserStore();
    const isSender = user?.role === 'sender';
    const updateShipment = useUpdateShipment();
    const { weightAuditAbs, weightAuditPercent } = useScannerStore();
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
    const [showAudit, setShowAudit] = useState(false);

    const totalWeight = activeShipments.reduce((sum, s) => sum + (parseFloat(s.weight as any) || 0), 0);
    const totalVolume = activeShipments.reduce((sum, s) => {
        const length = parseFloat(s.length as any) || 0;
        const width = parseFloat(s.width as any) || 0;
        const height = parseFloat(s.height as any) || 0;
        const v = (length * width * height) / 1000000; // cm3 to m3
        return sum + v;
    }, 0);

    // Map Shipment ID -> Inspection Data
    const shipmentInspectionMap = useMemo(() => {
        const map: Record<string, {
            transit_weight?: number;
            check_weight?: number;
        }> = {};

        inspections.forEach((insp) => {
            if (insp.notes?.includes('ShipmentID:')) {
                const idPart = insp.notes.split('ShipmentID:')[1];
                if (idPart) {
                    const shipmentId = idPart.split(' ')[0];
                    if (!map[shipmentId]) map[shipmentId] = {};
                    if (insp.notes.includes('WeighCheck') && insp.transit_weight) {
                        map[shipmentId].transit_weight = parseFloat(insp.transit_weight as any);
                    }
                    if (insp.notes.includes('ReceiverItemCheck') && insp.check_weight) {
                        map[shipmentId].check_weight = parseFloat(insp.check_weight as any);
                    }
                }
            }
        });
        return map;
    }, [inspections]);

    // Calculate Discrepancies (On Active Shipments Only)
    const discrepancyCount = useMemo(() => {
        return activeShipments.filter(s => {
            const senderW = parseFloat(s.weight as any) || 0;
            const transitW = s.transit_weight;
            const receiverW = s.receiver_weight;

            const isAnom = (val?: number) => {
                if (val === undefined || val === null) return false;
                const diff = Math.abs(senderW - val);
                const percent = (diff / senderW) * 100;
                return diff > weightAuditAbs || percent > weightAuditPercent;
            };

            return isAnom(transitW) || isAnom(receiverW);
        }).length;
    }, [activeShipments, weightAuditAbs, weightAuditPercent]);

    const handleSave = async (data: any) => {
        if (!selectedShipment) return;
        await updateShipment.mutateAsync({
            id: selectedShipment.id,
            updates: data
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Overview Card */}
            <div className="px-4 py-4 text-slate-800 dark:text-slate-100">
                <div className="bg-white dark:bg-[#1c2433] rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <span className="material-icons text-primary text-base">local_shipping</span>
                            发出数据概览
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowAudit(!showAudit)}
                                className={`text-[10px] px-2 py-1 rounded-full font-bold border ${showAudit ? 'bg-primary text-white border-primary' : 'text-slate-500 border-slate-200 dark:border-slate-600'}`}
                            >
                                {showAudit ? '隐藏对账' : '显示对账'}
                            </button>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${batch.status === 'draft' || batch.status === 'sender_processing' ? 'text-blue-500 bg-blue-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                                {batch.status === 'draft' || batch.status === 'sender_processing' ? '进行中' : '已封箱'}
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">累计重量 (kg)</p>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-primary h-full rounded-full" style={{ width: '65%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-1 pl-4 border-l border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400">累计体积 (m³)</p>
                            <div className="flex items-end gap-2 text-slate-900 dark:text-white">
                                <span className="text-2xl font-bold font-mono">{totalVolume.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '72%' }}></div>
                            </div>
                        </div>
                    </div>
                    {discrepancyCount > 0 && (
                        <div className="mt-3 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg border border-amber-100 dark:border-amber-500/20">
                            <span className="material-icons text-sm">warning</span>
                            <span className="font-bold">注意:</span>
                            <span>发现 {discrepancyCount} 个包裹存在重量差异，请开启对账模式查看。</span>
                        </div>
                    )}
                    {isSender && (batch.status === 'draft' || batch.status === 'sender_processing') && (
                        <div className="mt-3 text-[10px] text-primary flex items-center gap-1 bg-primary/5 p-2 rounded-lg">
                            <span className="material-icons text-sm">info</span>
                            <span>您可以点击下方包裹清单进行发出重量修正。</span>
                        </div>
                    )}
                </div>
            </div>

            {/* List Header */}
            <div className="px-4 pb-2 flex justify-between items-center mt-2">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">包裹清单 ({shipments.length})</h3>
            </div>

            {/* Parcel List */}
            <div className="px-4 space-y-3 pb-24">
                {shipments.map((s) => {
                    const senderW = parseFloat(s.weight as any) || 0;
                    const transitW = s.transit_weight;
                    const receiverW = s.receiver_weight;

                    const isAnom = (val?: number) => {
                        if (val === undefined || val === null) return false;
                        const diff = Math.abs(senderW - val);
                        const percent = (diff / senderW) * 100;
                        return diff > weightAuditAbs || percent > weightAuditPercent;
                    };

                    const hasTransitDiff = isAnom(transitW);
                    const hasCheckDiff = isAnom(receiverW);

                    const isInvalid = ['merged_child', 'split_parent'].includes(s.package_tag || '');

                    return (
                        <div
                            key={s.id}
                            onClick={() => !isInvalid && isSender && (batch.status === 'draft' || batch.status === 'sender_processing') && setSelectedShipment(s)}
                            className={`p-4 rounded-lg border flex flex-col gap-3 shadow-sm transition-all relative overflow-hidden
                                ${isInvalid ? 'bg-slate-50 opacity-60 grayscale border-slate-100' : 'bg-white dark:bg-[#1c2433]'}
                                ${!isInvalid && isSender && (batch.status === 'draft' || batch.status === 'sender_processing') ? 'active:scale-[0.99] cursor-pointer hover:border-primary/50' : ''} 
                                ${!isInvalid && (hasTransitDiff || hasCheckDiff) ? 'border-amber-200 dark:border-amber-500/30' : 'border-slate-100 dark:border-slate-700/50'}`}
                        >
                            {isInvalid && (
                                <div className="absolute right-0 top-0 bg-slate-200 text-slate-500 text-[9px] px-2 py-0.5 rounded-bl">
                                    {s.package_tag === 'merged_child' ? '已合包' : '已拆分'}
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasTransitDiff || hasCheckDiff ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 dark:bg-blue-900/20 text-primary'}`}>
                                        <span className="material-icons text-xl">scale</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white font-mono leading-none">{s.tracking_no}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-xs text-slate-600 dark:text-slate-300 font-black">{(s.weight || 0).toFixed(2)} kg</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{s.length}x{s.width}x{s.height} cm</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    {isSender && (batch.status === 'draft' || batch.status === 'sender_processing') && (
                                        <span className="material-icons text-primary/30 text-base mb-1">edit</span>
                                    )}
                                    <span className="text-[10px] text-slate-400">{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 py-2 border-t border-slate-50 dark:border-slate-800/30">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="material-icons text-[14px] text-slate-400">person</span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                                        {s.shipper_name || '未填'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="material-icons text-[14px] text-slate-400">
                                        {s.transport_mode === 1 ? 'local_shipping' : s.transport_mode === 2 ? 'directions_boat' : 'flight'}
                                    </span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.transport_mode === 1 ? 'bg-amber-50 text-amber-600' : s.transport_mode === 2 ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                        }`}>
                                        {s.transport_mode === 1 ? '陆运' : s.transport_mode === 2 ? '海运' : '空运'}
                                    </span>
                                </div>
                            </div>

                            {/* Audit / Reconciliation View */}
                            {showAudit && (
                                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-3 gap-2 text-center">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-slate-400 uppercase tracking-wider">Sender</span>
                                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{senderW.toFixed(2)}</span>
                                    </div>
                                    <div className={`flex flex-col gap-1 rounded bg-slate-50 dark:bg-slate-800/50 py-1 ${hasTransitDiff ? 'bg-orange-50 dark:bg-orange-500/10' : ''}`}>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-wider">Transit</span>
                                        <span className={`text-xs font-mono font-bold ${hasTransitDiff ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {transitW ? transitW.toFixed(2) : '--'}
                                        </span>
                                        {hasTransitDiff && <span className="text-[8px] text-orange-500 font-bold">{(transitW! - senderW).toFixed(2)}</span>}
                                    </div>
                                    <div className={`flex flex-col gap-1 rounded bg-slate-50 dark:bg-slate-800/50 py-1 ${hasCheckDiff ? 'bg-red-50 dark:bg-red-500/10' : ''}`}>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-wider">Receiver</span>
                                        <span className={`text-xs font-mono font-bold ${hasCheckDiff ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {receiverW ? receiverW.toFixed(2) : '--'}
                                        </span>
                                        {hasCheckDiff && <span className="text-[8px] text-red-500 font-bold">{(receiverW! - senderW).toFixed(2)}</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {shipments.length === 0 && (
                    <div className="text-center py-12 text-slate-400 italic">暂无包裹数据</div>
                )}

                <div className="text-center pt-4 pb-2 text-xs text-slate-400 dark:text-slate-500">
                    已显示全部数据
                </div>
            </div>

            {selectedShipment && (
                <ShipmentEditModal
                    isOpen={!!selectedShipment}
                    onClose={() => setSelectedShipment(null)}
                    shipment={selectedShipment}
                    role="sender"
                    onSave={handleSave}
                />
            )}

            {/* Footer */}
            <footer className="flex-none bg-white dark:bg-[#1c2433] border-t border-slate-200 dark:border-slate-800 px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 mb-safe">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500 dark:text-slate-400">发出进度</span>
                        <span className="text-sm font-bold text-primary dark:text-blue-400">进行中</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-slate-500 dark:text-slate-400">已扫描</span>
                        <div className="text-sm font-mono font-medium text-slate-900 dark:text-white">{shipments.length} / {batch.item_count || shipments.length}</div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
