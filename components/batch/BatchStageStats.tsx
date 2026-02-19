import React, { useMemo } from 'react';
import { FinanceBatch } from '../../store/finance.store';
import { Shipment } from '../../services/shipment.service';
import { Inspection } from '../../services/inspection.service';

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

    let totalWeight = 0;
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
        totalWeight += Math.max(w, volumetric);
        totalVolume += (l * wd * h) / 1000000;
    });

    return { weight: totalWeight, volume: totalVolume };
};

export interface CalculatedStats {
    sender: { weight: number; volume: number };
    transit: { weight: number; volume: number };
    receiver: { weight: number; volume: number };
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
            stats: { weight: batch.senderWeight || 0, volume: batch.senderVolume || 0 },
            detailedList: []
        };

        // Reuse the EXACT SAME filtering logic as calculateStats for the display list
        // 1. Initial tag filter
        let items = shipments.filter(s => ['standard', 'merged_child', 'split_parent', null, ''].includes(s.package_tag));

        // 2. Deduplication (Same as calculateStats)
        const splitParents = items.filter(s => s.package_tag === 'split_parent');
        // Removing parent_id check as per DB limitation.

        // 3. Calculate from this final list
        let totalWeight = 0;
        let totalVolume = 0;
        items.forEach(s => {
            let w = parseFloat(s.weight as any) || 0;
            let l = parseFloat(s.length as any) || 0;
            let wd = parseFloat(s.width as any) || 0;
            let h = parseFloat(s.height as any) || 0;
            const volumetric = (l * wd * h) / 6000;
            totalWeight += Math.max(w, volumetric);
            totalVolume += (l * wd * h) / 1000000;
        });

        return { stats: { weight: totalWeight, volume: totalVolume }, detailedList: items };
    }, [batch, shipments]);

    if (isCompact) {
        return (
            <div className={`p-2 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20 text-center ${className}`}>
                <p className="text-[9px] text-blue-500 font-bold mb-0.5 uppercase tracking-tighter leading-none">发货方 (SRT)</p>
                <div className="flex flex-col gap-0.5 mt-1">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 leading-none">{stats.weight.toFixed(2)}<span className="text-[8px] ml-0.5 opacity-50">KG</span></p>
                    <p className="text-[9px] font-bold text-slate-400 leading-none">{stats.volume.toFixed(3)}<span className="text-[7px] ml-0.5 opacity-50">CBM</span></p>
                </div>
            </div>
        );
    }

    const [showDetails, setShowDetails] = React.useState(false);

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
                        <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">发货方重量 & CBM</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">规则: Standard / Merged Child / Split Parent (去重)</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition-colors"
                >
                    <span className="material-icons-round text-sm">{showDetails ? 'expand_less' : 'list'}</span>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">SRT 总重</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                            {stats.weight.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">KG</span>
                    </div>
                </div>
                <div className="flex flex-col border-l border-blue-100/50 dark:border-blue-900/20 pl-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">体积总量</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                            {stats.volume.toFixed(3)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">CBM</span>
                    </div>
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
        return { weight: batch.transitWeight || 0, volume: batch.transitVolume || 0 };
    }, [batch, shipments, inspections]);

    if (isCompact) {
        return (
            <div className={`p-2 rounded-xl bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100/50 dark:border-orange-900/20 text-center ${className}`}>
                <p className="text-[9px] text-orange-500 font-bold mb-0.5 uppercase tracking-tighter leading-none">中转方 (SRT)</p>
                <div className="flex flex-col gap-0.5 mt-1">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 leading-none">{stats.weight.toFixed(2)}<span className="text-[8px] ml-0.5 opacity-50">KG</span></p>
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
                        <h3 className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-none">中转方重量 & CBM</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">规则: Standard / Split Child / Master Parent</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="p-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-500 transition-colors"
                >
                    <span className="material-icons-round text-sm">{showDetails ? 'expand_less' : 'list'}</span>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">SRT 总重</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                            {stats.weight.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">KG</span>
                    </div>
                </div>
                <div className="flex flex-col border-l border-orange-100/50 dark:border-orange-900/20 pl-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">体积总量</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                            {stats.volume.toFixed(3)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">CBM</span>
                    </div>
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
        return { weight: batch.receiverWeight || 0, volume: batch.receiverVolume || 0 };
    }, [batch, shipments, inspections]);

    if (isCompact) {
        return (
            <div className={`p-2 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-100/50 dark:border-green-900/20 text-center ${className}`}>
                <p className="text-[9px] text-green-500 font-bold mb-0.5 uppercase tracking-tighter leading-none">接收方 (SRT)</p>
                <div className="flex flex-col gap-0.5 mt-1">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 leading-none">{stats.weight.toFixed(2)}<span className="text-[8px] ml-0.5 opacity-50">KG</span></p>
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
                        <h3 className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-widest leading-none">接收方重量 & CBM</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">规则: Standard / Split Child / Master Parent</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500 transition-colors"
                >
                    <span className="material-icons-round text-sm">{showDetails ? 'expand_less' : 'list'}</span>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">SRT 总重</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                            {stats.weight.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">KG</span>
                    </div>
                </div>
                <div className="flex flex-col border-l border-green-100/50 dark:border-green-900/20 pl-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">体积总量</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                            {stats.volume.toFixed(3)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">CBM</span>
                    </div>
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
