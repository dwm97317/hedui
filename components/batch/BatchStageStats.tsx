import React, { useMemo } from 'react';
import { FinanceBatch } from '../../store/finance.store';
import { Shipment } from '../../services/shipment.service';
import { Inspection } from '../../services/inspection.service';
import { BatchWeightConfigModal } from './BatchWeightConfigModal';

/**
 * 核心逻辑：计费重量与体积计算
 */
const calculateStats = (items: Shipment[], inspections: Inspection[] = [], stage: 'sender' | 'transit' | 'receiver') => {
    let targetTags: (string | null)[] = [];

    if (stage === 'sender') {
        // 发货方：普通包裹 (Standard)，已合包子单 (Merged Child)，已拆分原单 (Split Parent)
        targetTags = ['standard', 'merged_child', 'split_parent', null, ''];
    } else {
        // 中转与接收：普通包裹 (Standard) 拆分后子单 (Split Child) 合包母单 (Master Parent)
        targetTags = ['standard', 'split_child', 'merge_parent', null, ''];
    }

    let filtered = items.filter(s => targetTags.includes(s.package_tag));

    // Deduplication Logic for Sender Stage
    // Prevent double counting: If we have a 'split_parent' (the original big box), 
    // we should NOT count its children if they also appear in this list (e.g. as 'merged_child').
    if (stage === 'sender') {
        const splitParents = filtered.filter(s => s.package_tag === 'split_parent');
        // Since parent_id column does not exist, we cannot link children by ID effectively here
        // without fetched data. We will rely on package_tag filtering logic primarily.
        // If we need deduplication, we might need another way or fix the DB schema.
        // For now, removing the parent_id check to prevent potential confusion/errors if types don't match.
    }

    let totalActualWeight = 0;
    let totalVolumetricWeight = 0;
    let totalChargeableWeight = 0;
    let totalVolume = 0;

    filtered.forEach(s => {
        let w = parseFloat(s.weight as any) || 0;
        let l = parseFloat(s.length as any) || 0;
        let wd = parseFloat(s.width as any) || 0;
        let h = parseFloat(s.height as any) || 0;

        // 如果是中转/接收，优先从 inspections 取值
        if (stage !== 'sender' && inspections.length > 0) {
            // Find inspection for this specific shipment
            const relevantInsp = inspections.find(i => i.notes && i.notes.includes(s.id));

            if (relevantInsp) {
                if (stage === 'transit') {
                    if (relevantInsp.transit_weight !== null && relevantInsp.transit_weight !== undefined) w = parseFloat(relevantInsp.transit_weight as any);
                    if (relevantInsp.transit_length) l = parseFloat(relevantInsp.transit_length as any);
                    if (relevantInsp.transit_width) wd = parseFloat(relevantInsp.transit_width as any);
                    if (relevantInsp.transit_height) h = parseFloat(relevantInsp.transit_height as any);
                } else if (stage === 'receiver') {
                    if (relevantInsp.check_weight !== null && relevantInsp.check_weight !== undefined) w = parseFloat(relevantInsp.check_weight as any);
                    if (relevantInsp.check_length) l = parseFloat(relevantInsp.check_length as any);
                    if (relevantInsp.check_width) wd = parseFloat(relevantInsp.check_width as any);
                    if (relevantInsp.check_height) h = parseFloat(relevantInsp.check_height as any);
                }
            }
        }

        const volumetric = (l * wd * h) / 6000;
        const chargeable = Math.max(w, volumetric);

        totalActualWeight += w;
        totalVolumetricWeight += volumetric;
        totalChargeableWeight += chargeable;
        totalVolume += (l * wd * h) / 1000000;
    });

    return {
        actualWeight: totalActualWeight,
        volumetricWeight: totalVolumetricWeight,
        chargeableWeight: totalChargeableWeight,
        volume: totalVolume
    };
};

export interface CalculatedStats {
    sender: { actualWeight: number; volumetricWeight: number; chargeableWeight: number; volume: number };
    transit: { actualWeight: number; volumetricWeight: number; chargeableWeight: number; volume: number };
    receiver: { actualWeight: number; volumetricWeight: number; chargeableWeight: number; volume: number };
}

interface StageStatsProps {
    batch: FinanceBatch;
    shipments?: Shipment[];      // 可选：传入即时计算
    inspections?: Inspection[]; // 可选：传入即时计算
    className?: string;
    isCompact?: boolean;
}

/**
 * 1. 发货方统计组件
 * 包含规则：普通包裹 (Standard)，已合包子单 (Merged Child)，已拆分原单 (Split Parent)
 */
export const SenderStageStats: React.FC<StageStatsProps> = ({ batch, shipments, className = '', isCompact = false }) => {
    // Memoize the calculation logic to ensure consistency
    const { stats, detailedList } = useMemo(() => {
        if (!shipments) return {
            stats: {
                actualWeight: batch.senderWeight || 0,
                volumetricWeight: 0,
                chargeableWeight: batch.senderWeight || 0,
                volume: batch.senderVolume || 0
            },
            detailedList: []
        };

        // Reuse the EXACT SAME filtering logic as calculateStats for the display list
        // 1. Initial tag filter
        let items = shipments.filter(s => ['standard', 'merged_child', 'split_parent', null, ''].includes(s.package_tag));

        // 2. Deduplication (Same as calculateStats)
        const splitParents = items.filter(s => s.package_tag === 'split_parent');
        // Removing parent_id check as per DB limitation.

        // 3. Calculate from this final list
        let totalActualWeight = 0;
        let totalVolumetricWeight = 0;
        let totalChargeableWeight = 0;
        let totalVolume = 0;

        items.forEach(s => {
            let w = parseFloat(s.weight as any) || 0;
            let l = parseFloat(s.length as any) || 0;
            let wd = parseFloat(s.width as any) || 0;
            let h = parseFloat(s.height as any) || 0;
            const volumetric = (l * wd * h) / 6000;
            const chargeable = Math.max(w, volumetric);

            totalActualWeight += w;
            totalVolumetricWeight += volumetric;
            totalChargeableWeight += chargeable;
            totalVolume += (l * wd * h) / 1000000;
        });

        return {
            stats: {
                actualWeight: totalActualWeight,
                volumetricWeight: totalVolumetricWeight,
                chargeableWeight: totalChargeableWeight,
                volume: totalVolume
            },
            detailedList: items
        };
    }, [batch, shipments]);

    if (isCompact) {
        return (
            <div className={`p-2 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20 text-center ${className}`}>
                <p className="text-[9px] text-blue-500 font-bold mb-0.5 uppercase tracking-tighter leading-none">发货方 (SRT)</p>
                <div className="flex flex-col gap-0.5 mt-1">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 leading-none">{stats.chargeableWeight.toFixed(2)}<span className="text-[8px] ml-0.5 opacity-50">KG</span></p>
                    <p className="text-[9px] font-bold text-slate-400 leading-none">{stats.volume.toFixed(3)}<span className="text-[7px] ml-0.5 opacity-50">CBM</span></p>
                </div>
            </div>
        );
    }

    const [showDetails, setShowDetails] = React.useState(false);
    const [showConfigModal, setShowConfigModal] = React.useState(false);

    return (
        <div className={`group relative p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-slate-900 border border-blue-100/50 dark:border-blue-900/20 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">发货方重量细号</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">含实重 / 体积重 / 计费重</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowConfigModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition-colors"
                        title="计费重量设置"
                    >
                        <span className="material-icons-round text-sm">settings</span>
                    </button>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition-colors"
                    >
                        <span className="material-icons-round text-sm">{showDetails ? 'expand_less' : 'list'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
                <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">实重 (Actual)</span>
                    <span className="text-xl font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {stats.actualWeight.toFixed(2)}
                    </span>
                </div>
                <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">体积重 (Vol.)</span>
                    <span className="text-xl font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {stats.volumetricWeight.toFixed(2)}
                    </span>
                </div>
                <div className="flex flex-col bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm relative overflow-hidden group/item">
                    <div className="absolute top-0 right-0 p-1">
                        <span className="material-icons-round text-blue-200 dark:text-blue-800/30 text-4xl -mr-2 -mt-2">paid</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest relative z-10">计费重 (Chg.)</span>
                    <span className="text-2xl font-mono font-black text-blue-600 dark:text-blue-400 mt-1 relative z-10">
                        {stats.chargeableWeight.toFixed(2)}
                    </span>
                </div>
                <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">体积 (CBM)</span>
                    <span className="text-xl font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {stats.volume.toFixed(3)}
                    </span>
                </div>
            </div>

            {showDetails && (
                <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/20 max-h-60 overflow-y-auto">
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="text-left text-slate-400">
                                <th className="pb-2">单号</th>
                                <th className="pb-2 text-right">实重</th>
                                <th className="pb-2 text-right">体积重</th>
                                <th className="pb-2 text-right">计费重</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detailedList.map(s => {
                                const vol = ((s.length || 0) * (s.width || 0) * (s.height || 0)) / 6000;
                                const chargeable = Math.max(s.weight || 0, vol);
                                return (
                                    <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                                        <td className="py-1 font-mono text-slate-600 dark:text-slate-400 truncate max-w-[80px]" title={s.tracking_no}>
                                            {s.tracking_no}
                                            <span className="block text-[8px] text-blue-400">{s.package_tag || 'Standard'}</span>
                                        </td>
                                        <td className="py-1 text-right text-slate-500">{s.weight?.toFixed(2)}</td>
                                        <td className="py-1 text-right text-slate-500">{vol.toFixed(2)}</td>
                                        <td className="py-1 text-right font-bold text-slate-700 dark:text-slate-300">{chargeable.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <BatchWeightConfigModal
                isOpen={showConfigModal}
                onClose={() => setShowConfigModal(false)}
                batchId={batch.id}
                currentModes={{
                    a: batch.billing_weight_mode_a || 'chargeable',
                    b: batch.billing_weight_mode_b || 'chargeable',
                    c: batch.billing_weight_mode_c || 'chargeable'
                }}
                onUpdate={() => {
                    // Logic to refresh data would go here
                    // Ideally pass a callback from parent or useQuery invalidation
                    window.location.reload(); // Simple refresh for now or use invalidateQueries if available
                }}
            />
        </div>
    );
};

/**
 * 2. 中转方统计组件
 * 规则：普通包裹 (Standard) 拆分后子单 (Split Child) 合包母单 (Master Parent)
 */
export const TransitStageStats: React.FC<StageStatsProps> = ({ batch, shipments, inspections, className = '', isCompact = false }) => {
    const stats = useMemo(() => {
        if (shipments) return calculateStats(shipments, inspections || [], 'transit');
        return {
            actualWeight: batch.transitWeight || 0,
            volumetricWeight: 0,
            chargeableWeight: batch.transitWeight || 0,
            volume: batch.transitVolume || 0
        };
    }, [batch, shipments, inspections]);

    if (isCompact) {
        return (
            <div className={`p-2 rounded-xl bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100/50 dark:border-orange-900/20 text-center ${className}`}>
                <p className="text-[9px] text-orange-500 font-bold mb-0.5 uppercase tracking-tighter leading-none">中转方 (SRT)</p>
                <div className="flex flex-col gap-0.5 mt-1">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 leading-none">{stats.chargeableWeight.toFixed(2)}<span className="text-[8px] ml-0.5 opacity-50">KG</span></p>
                    <p className="text-[9px] font-bold text-slate-400 leading-none">{stats.volume.toFixed(3)}<span className="text-[7px] ml-0.5 opacity-50">CBM</span></p>
                </div>
            </div>
        );
    }

    const [showDetails, setShowDetails] = React.useState(false);

    const detailedList = useMemo(() => {
        if (!shipments) return [];
        return shipments.filter(s => ['standard', 'split_child', 'merge_parent', null, ''].includes(s.package_tag));
    }, [shipments]);

    return (
        <div className={`group relative p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-slate-900 border border-orange-100/50 dark:border-orange-900/20 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-none">中转方重量细号</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">含实重 / 体积重 / 计费重</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="p-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-500 transition-colors"
                >
                    <span className="material-icons-round text-sm">{showDetails ? 'expand_less' : 'list'}</span>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
                <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">实重 (Actual)</span>
                    <span className="text-xl font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {stats.actualWeight.toFixed(2)}
                    </span>
                </div>
                <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">体积重 (Vol.)</span>
                    <span className="text-xl font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {stats.volumetricWeight.toFixed(2)}
                    </span>
                </div>
                <div className="flex flex-col bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30 shadow-sm relative overflow-hidden group/item">
                    <div className="absolute top-0 right-0 p-1">
                        <span className="material-icons-round text-orange-200 dark:text-orange-800/30 text-4xl -mr-2 -mt-2">paid</span>
                    </div>
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest relative z-10">计费重 (Chg.)</span>
                    <span className="text-2xl font-mono font-black text-orange-600 dark:text-orange-400 mt-1 relative z-10">
                        {stats.chargeableWeight.toFixed(2)}
                    </span>
                </div>
                <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">体积 (CBM)</span>
                    <span className="text-xl font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {stats.volume.toFixed(3)}
                    </span>
                </div>
            </div>

            {showDetails && (
                <div className="mt-4 pt-4 border-t border-orange-100 dark:border-orange-900/20 max-h-60 overflow-y-auto">
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="text-left text-slate-400">
                                <th className="pb-2">单号</th>
                                <th className="pb-2 text-right">实重</th>
                                <th className="pb-2 text-right">体积重</th>
                                <th className="pb-2 text-right">计费重</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detailedList.map(s => {
                                // Use inspection data simulation for display if needed, but for list simplicity we show base shipment data unless we want to map inspections again.
                                let w = parseFloat(s.weight as any) || 0;
                                let l = parseFloat(s.length as any) || 0;
                                let wd = parseFloat(s.width as any) || 0;
                                let h = parseFloat(s.height as any) || 0;

                                if (inspections && inspections.length > 0) {
                                    const relevantInsp = inspections.find(i => i.notes && i.notes.includes(s.id));
                                    if (relevantInsp) {
                                        if (relevantInsp.transit_weight !== null && relevantInsp.transit_weight !== undefined) w = parseFloat(relevantInsp.transit_weight as any);
                                        if (relevantInsp.transit_length) l = parseFloat(relevantInsp.transit_length as any);
                                        if (relevantInsp.transit_width) wd = parseFloat(relevantInsp.transit_width as any);
                                        if (relevantInsp.transit_height) h = parseFloat(relevantInsp.transit_height as any);
                                    }
                                }

                                const vol = (l * wd * h) / 6000;
                                const chargeable = Math.max(w, vol);
                                return (
                                    <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                                        <td className="py-1 font-mono text-slate-600 dark:text-slate-400 truncate max-w-[80px]" title={s.tracking_no}>
                                            {s.tracking_no}
                                            <span className="block text-[8px] text-orange-400">{s.package_tag || 'Standard'}</span>
                                        </td>
                                        <td className="py-1 text-right text-slate-500">{w.toFixed(2)}</td>
                                        <td className="py-1 text-right text-slate-500">{vol.toFixed(2)}</td>
                                        <td className="py-1 text-right font-bold text-slate-700 dark:text-slate-300">{chargeable.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

/**
 * 3. 接收方统计组件
 * 规则：普通包裹 (Standard) 拆分后子单 (Split Child) 合包母单 (Master Parent)
 */
export const ReceiverStageStats: React.FC<StageStatsProps> = ({ batch, shipments, inspections, className = '', isCompact = false }) => {
    const stats = useMemo(() => {
        if (shipments) return calculateStats(shipments, inspections || [], 'receiver');
        return {
            actualWeight: batch.receiverWeight || 0,
            volumetricWeight: 0,
            chargeableWeight: batch.receiverWeight || 0,
            volume: batch.receiverVolume || 0
        };
    }, [batch, shipments, inspections]);

    if (isCompact) {
        return (
            <div className={`p-2 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-100/50 dark:border-green-900/20 text-center ${className}`}>
                <p className="text-[9px] text-green-500 font-bold mb-0.5 uppercase tracking-tighter leading-none">接收方 (SRT)</p>
                <div className="flex flex-col gap-0.5 mt-1">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 leading-none">{stats.chargeableWeight.toFixed(2)}<span className="text-[8px] ml-0.5 opacity-50">KG</span></p>
                    <p className="text-[9px] font-bold text-slate-400 leading-none">{stats.volume.toFixed(3)}<span className="text-[7px] ml-0.5 opacity-50">CBM</span></p>
                </div>
            </div>
        );
    }

    const [showDetails, setShowDetails] = React.useState(false);
    const detailedList = useMemo(() => {
        if (!shipments) return [];
        return shipments.filter(s => ['standard', 'split_child', 'merge_parent', null, ''].includes(s.package_tag));
    }, [shipments]);

    return (
        <div className={`group relative p-4 rounded-2xl bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-slate-900 border border-green-100/50 dark:border-green-900/20 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-widest leading-none">接收方重量细号</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">含实重 / 体积重 / 计费重</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500 transition-colors"
                >
                    <span className="material-icons-round text-sm">{showDetails ? 'expand_less' : 'list'}</span>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
                <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">实重 (Actual)</span>
                    <span className="text-xl font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {stats.actualWeight.toFixed(2)}
                    </span>
                </div>
                <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">体积重 (Vol.)</span>
                    <span className="text-xl font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {stats.volumetricWeight.toFixed(2)}
                    </span>
                </div>
                <div className="flex flex-col bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm relative overflow-hidden group/item">
                    <div className="absolute top-0 right-0 p-1">
                        <span className="material-icons-round text-green-200 dark:text-green-800/30 text-4xl -mr-2 -mt-2">paid</span>
                    </div>
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest relative z-10">计费重 (Chg.)</span>
                    <span className="text-2xl font-mono font-black text-green-600 dark:text-green-400 mt-1 relative z-10">
                        {stats.chargeableWeight.toFixed(2)}
                    </span>
                </div>
                <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">体积 (CBM)</span>
                    <span className="text-xl font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {stats.volume.toFixed(3)}
                    </span>
                </div>
            </div>

            {showDetails && (
                <div className="mt-4 pt-4 border-t border-green-100 dark:border-green-900/20 max-h-60 overflow-y-auto">
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="text-left text-slate-400">
                                <th className="pb-2">单号</th>
                                <th className="pb-2 text-right">实重</th>
                                <th className="pb-2 text-right">体积重</th>
                                <th className="pb-2 text-right">计费重</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detailedList.map(s => {
                                // Use inspection data simulation for display
                                let w = parseFloat(s.weight as any) || 0;
                                let l = parseFloat(s.length as any) || 0;
                                let wd = parseFloat(s.width as any) || 0;
                                let h = parseFloat(s.height as any) || 0;

                                if (inspections && inspections.length > 0) {
                                    const relevantInsp = inspections.find(i => i.notes && i.notes.includes(s.id));
                                    if (relevantInsp) {

                                        if (relevantInsp.check_weight !== null && relevantInsp.check_weight !== undefined) w = parseFloat(relevantInsp.check_weight as any);
                                        if (relevantInsp.check_length) l = parseFloat(relevantInsp.check_length as any);
                                        if (relevantInsp.check_width) wd = parseFloat(relevantInsp.check_width as any);
                                        if (relevantInsp.check_height) h = parseFloat(relevantInsp.check_height as any);

                                    }
                                }

                                const vol = (l * wd * h) / 6000;
                                const chargeable = Math.max(w, vol);
                                return (
                                    <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                                        <td className="py-1 font-mono text-slate-600 dark:text-slate-400 truncate max-w-[80px]" title={s.tracking_no}>
                                            {s.tracking_no}
                                            <span className="block text-[8px] text-green-400">{s.package_tag || 'Standard'}</span>
                                        </td>
                                        <td className="py-1 text-right text-slate-500">{w.toFixed(2)}</td>
                                        <td className="py-1 text-right text-slate-500">{vol.toFixed(2)}</td>
                                        <td className="py-1 text-right font-bold text-slate-700 dark:text-slate-300">{chargeable.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
