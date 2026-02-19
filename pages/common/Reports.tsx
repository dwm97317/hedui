import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SenderStageStats, TransitStageStats, ReceiverStageStats } from '@/components/batch/BatchStageStats';
import { useBatches } from '../../hooks/useBatches';
import { useShipments, useShipmentRelations } from '../../hooks/useShipments';
import { useUserStore } from '../../store/user.store';
import { useBatchStore } from '../../store/batch.store';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';

const Reports: React.FC = () => {
    const navigate = useNavigate();
    const { activeBatchId } = useBatchStore();
    const { data: batches, isLoading: batchesLoading } = useBatches(undefined, { includeInspections: true });
    const { data: shipments, isLoading: shipmentsLoading } = useShipments(activeBatchId || '', { includeAll: true });
    const { data: relations } = useShipmentRelations(activeBatchId || '');

    // Map for Genealogy (Parent/Child links)
    const genealogy = useMemo(() => {
        const p2c: Record<string, string[]> = {};
        const c2p: Record<string, string> = {};
        const idToTracking: Record<string, string> = {};

        shipments?.forEach(s => { idToTracking[s.id] = s.tracking_no; });

        relations?.forEach(r => {
            const pTrack = idToTracking[r.parent_shipment_id] || 'N/A';
            const cTrack = idToTracking[r.child_shipment_id] || 'N/A';
            c2p[r.child_shipment_id] = pTrack;
            if (!p2c[r.parent_shipment_id]) p2c[r.parent_shipment_id] = [];
            p2c[r.parent_shipment_id].push(cTrack);
        });
        return { p2c, c2p };
    }, [relations, shipments]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortMode, setSortMode] = useState<'sender_time' | 'weight_desc' | 'transit_time' | 'receiver_time'>('sender_time');
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Helpers for Vietnam Timezone (+7)
    const formatVN = (dateStr?: string, showDate = false) => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            const options: Intl.DateTimeFormatOptions = {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            };
            if (showDate) {
                options.year = 'numeric';
                options.month = '2-digit';
                options.day = '2-digit';
            }
            return date.toLocaleString('en-GB', options).replace(/\//g, '-');
        } catch (e) {
            return dateStr;
        }
    };

    const activeBatch = batches?.find(b => b.id === activeBatchId);

    // Map from ShipmentID -> Full Audit Table (Inspection data might contain newer measurements)
    const shipmentInspectionMap = useMemo(() => {
        if (!activeBatchId || !batches) return {};
        const activeBatch = batches.find(b => b.id === activeBatchId);
        if (!activeBatch || !activeBatch.inspections) return {};

        const map: Record<string, {
            transit_weight?: number;
            transit_length?: number;
            transit_width?: number;
            transit_height?: number;
            transit_time?: string;
            check_weight?: number;
            check_length?: number;
            check_width?: number;
            check_height?: number;
            check_time?: string;
        }> = {};

        activeBatch.inspections.forEach((insp: any) => {
            if (insp.notes?.includes('ShipmentID:')) {
                const idPart = insp.notes.split('ShipmentID:')[1];
                if (idPart) {
                    const shipmentId = idPart.split(' ')[0];
                    if (!map[shipmentId]) map[shipmentId] = {};

                    if (insp.notes.includes('WeighCheck')) {
                        if (insp.transit_weight !== null) map[shipmentId].transit_weight = parseFloat(insp.transit_weight);
                        map[shipmentId].transit_length = insp.transit_length || 0;
                        map[shipmentId].transit_width = insp.transit_width || 0;
                        map[shipmentId].transit_height = insp.transit_height || 0;
                        map[shipmentId].transit_time = insp.created_at;
                    } else if (insp.notes.includes('ReceiverItemCheck')) {
                        if (insp.check_weight !== null) map[shipmentId].check_weight = parseFloat(insp.check_weight);
                        map[shipmentId].check_length = insp.check_length || 0;
                        map[shipmentId].check_width = insp.check_width || 0;
                        map[shipmentId].check_height = insp.check_height || 0;
                        map[shipmentId].check_time = insp.created_at;
                    }
                }
            }
        });
        return map;
    }, [activeBatchId, batches]);

    const batchMap = useMemo(() => {
        return batches?.reduce((acc: any, b) => {
            acc[b.id] = b;
            return acc;
        }, {}) || {};
    }, [batches]);

    const sortedShipments = useMemo(() => {
        if (!shipments) return [];
        let list = [...shipments];

        switch (sortMode) {
            case 'weight_desc':
                list.sort((a, b) => (parseFloat(b.weight as any) || 0) - (parseFloat(a.weight as any) || 0));
                break;
            case 'transit_time':
                list.sort((a, b) => {
                    const timeA = new Date(a.transit_at || shipmentInspectionMap[a.id]?.transit_time || 0).getTime();
                    const timeB = new Date(b.transit_at || shipmentInspectionMap[b.id]?.transit_time || 0).getTime();
                    return timeB - timeA;
                });
                break;
            case 'receiver_time':
                list.sort((a, b) => {
                    const timeA = new Date(a.receiver_at || shipmentInspectionMap[a.id]?.check_time || 0).getTime();
                    const timeB = new Date(b.receiver_at || shipmentInspectionMap[b.id]?.check_time || 0).getTime();
                    return timeB - timeA;
                });
                break;
            default: // sender_time
                list.sort((a, b) => new Date(b.sender_at || b.created_at).getTime() - new Date(a.sender_at || a.created_at).getTime());
        }

        return list;
    }, [shipments, sortMode, shipmentInspectionMap]);

    const filteredShipments = useMemo(() => {
        return (sortedShipments || []).filter(s =>
            s.tracking_no.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 100);
    }, [sortedShipments, searchQuery]);

    // Batch Specific Stats
    const batchTotalCount = shipments?.length || 0;
    // Calculate total weight using only active items to avoid double-counting
    const batchTotalWeight = useMemo(() => {
        if (!shipments) return '0.00';
        return shipments
            .filter(s => !['merged_child', 'split_parent'].includes(s.package_tag || ''))
            .reduce((acc, s) => acc + (parseFloat(s.weight as any) || 0), 0)
            .toFixed(2);
    }, [shipments]);

    if (batchesLoading || shipmentsLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // --- Export Logic ---
    const handleExportExcel = () => {
        const data = filteredShipments.map(s => {
            const insp = shipmentInspectionMap[s.id];
            const senderAtVN = formatVN(s.sender_at || s.created_at, true);
            const transitAtVN = formatVN(s.transit_at || insp?.transit_time, true);
            const receiverAtVN = formatVN(s.receiver_at || insp?.check_time, true);

            const tagMap: Record<string, string> = {
                'standard': '普通包裹 (Standard)',
                'merge_parent': '合包母单 (Master Parent)',
                'merged_child': '已合包子单 (Merged Child)',
                'split_parent': '已拆分原单 (Split Parent)',
                'split_child': '拆分后子单 (Split Child)'
            };

            let typeStr = tagMap[s.package_tag as string] || '普通 (Standard)';
            const myParentTracking = genealogy.c2p[s.id];
            const myChildrenTracking = genealogy.p2c[s.id];

            return {
                '单号': s.tracking_no,
                '关联主单 (父单环)': myParentTracking || '-',
                '关联子单 (子单环)': myChildrenTracking?.join(', ') || '-',
                '包裹类型': typeStr,
                '状态描述': s.package_tag === 'merged_child' ? `此包已并入大单: ${myParentTracking || '?'}` : (s.package_tag === 'split_parent' ? `此包已拆分为: ${myChildrenTracking?.join(', ') || '?'}` : '有效包裹'),
                '包含包裹数': myChildrenTracking?.length || '-',
                '发出重量(kg)': (s.package_tag === 'split_child' || s.package_tag === 'merge_parent') ? '-' : s.weight,
                '发出尺寸(cm)': `${s.length || 0}x${s.width || 0}x${s.height || 0}`,
                '发出时间(越南时区)': senderAtVN || '-',
                '中转重量(kg)': insp?.transit_weight || '-',
                '中转尺寸(cm)': (s.transit_at || insp?.transit_time) ? `${insp.transit_length || 0}x${insp.transit_width || 0}x${insp.transit_height || 0}` : '0x0x0',
                '中转时间(越南时区)': transitAtVN || '-',
                '接收重量(kg)': insp?.check_weight || '-',
                '接收尺寸(cm)': (s.receiver_at || insp?.check_time) ? `${insp.check_length || 0}x${insp.check_width || 0}x${insp.check_height || 0}` : '0x0x0',
                '接收时间(越南时区)': receiverAtVN || '-',
                '最终状态': s.status
            };
        });

        const ws = XLSX.utils.aoa_to_sheet([[`批次审计报告: ${activeBatch?.batch_no || '未命名'}`]]);
        XLSX.utils.sheet_add_json(ws, data, { origin: "A3" });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "全环节时间审计");

        const filename = `审计报表_${activeBatch?.batch_no || '未命名'}_VN.xlsx`;

        if ((window as any).Android) {
            // Android APK Environment
            const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
            (window as any).Android.saveFile(base64, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else {
            // Web Browser Environment
            XLSX.writeFile(wb, filename);
            toast.success('Excel 导出成功 (越南时间)');
        }
    };

    const handleExportPNG = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        try {
            const dataUrl = await toPng(reportRef.current, { cacheBust: true, backgroundColor: '#f8fafc' });
            const filename = `报表_${activeBatch?.batch_no || '未命名'}_VN.png`;

            if ((window as any).Android) {
                (window as any).Android.saveFile(dataUrl, filename, "image/png");
            } else {
                const link = document.createElement('a');
                link.download = filename;
                link.href = dataUrl;
                link.click();
                toast.success('PNG 图片导出成功');
            }
        } catch (err) {
            toast.error('图片导出失败');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            const filename = `报表_${activeBatch?.batch_no || '未命名'}_VN.pdf`;

            if ((window as any).Android) {
                const pdfBase64 = pdf.output('datauristring');
                (window as any).Android.saveFile(pdfBase64, filename, "application/pdf");
            } else {
                pdf.save(filename);
                toast.success('PDF 导出成功');
            }
        } catch (err) {
            toast.error('PDF 导出失败');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
            <header className="bg-surface-dark/95 backdrop-blur shadow-md z-50 flex-none sticky top-0">
                <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-400 border-b border-white/5">
                    <span className="font-mono tracking-wider">越南时区模式: UTC+7</span>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <span className="material-icons-round text-[14px] text-emerald-500">schedule</span>
                            <span className="text-emerald-500 font-medium">Local VN: {new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                        <button onClick={() => navigate('/sender')} className="text-gray-300 hover:text-white transition-colors">
                            <span className="material-icons-round text-lg">home</span>
                        </button>
                    </div>
                </div>
                <div className="px-5 py-3 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold leading-tight text-white">
                            {activeBatch ? `当前批次: ${activeBatch.batch_no}` : '审计报表中心'}
                        </h1>
                        <p className="text-[10px] font-bold mt-0.5 text-gray-400 uppercase tracking-widest font-semibold">越南时区审计逻辑 (UTC+7)</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/report-center')}
                            className="flex flex-col items-center justify-center transition-all text-slate-400 hover:text-white px-2"
                        >
                            <span className="material-icons-round text-sm">bar_chart</span>
                            <span className="text-[10px] font-bold mt-0.5 whitespace-nowrap">可视化趋势</span>
                        </button>
                        <button onClick={handleExportPNG} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-white border border-white/10 shadow-inner">
                            <span className="material-icons-round text-sm">image</span>
                        </button>
                        <button onClick={handleExportPDF} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-white border border-white/10 shadow-inner">
                            <span className="material-icons-round text-sm">picture_as_pdf</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col min-h-0 bg-background-dark/20">
                <div className="sticky top-0 z-30 bg-background-dark px-4 py-3 border-b border-white/5 shadow-sm flex-none flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-icons-round text-gray-400">search</span>
                            </span>
                            <input
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-600 rounded-xl leading-5 bg-surface-dark text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="全局追踪单号..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button onClick={handleExportExcel} className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg active:scale-95 text-xs whitespace-nowrap border border-emerald-400/20">
                            <span className="material-icons-round text-sm">table_view</span>
                            审计导出
                        </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button
                            onClick={() => setSortMode('sender_time')}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${sortMode === 'sender_time' ? 'bg-primary border-primary text-white' : 'bg-surface-dark border-white/10 text-gray-400'}`}
                        >
                            发出序 (VN)
                        </button>
                        <button
                            onClick={() => setSortMode('transit_time')}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${sortMode === 'transit_time' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-surface-dark border-white/10 text-gray-400'}`}
                        >
                            中转序 (VN)
                        </button>
                        <button
                            onClick={() => setSortMode('receiver_time')}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${sortMode === 'receiver_time' ? 'bg-green-600 border-green-600 text-white' : 'bg-surface-dark border-white/10 text-gray-400'}`}
                        >
                            接收序 (VN)
                        </button>
                        <button
                            onClick={() => setSortMode('weight_desc')}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${sortMode === 'weight_desc' ? 'bg-orange-600 border-orange-600 text-white' : 'bg-surface-dark border-white/10 text-gray-400'}`}
                        >
                            重量递减
                        </button>
                    </div>
                </div>

                <div ref={reportRef} className="flex-1 overflow-y-auto p-4 no-scrollbar pb-24 bg-background-light dark:bg-background-dark">
                    {/* Summary Card */}
                    <div className="bg-surface-dark rounded-2xl p-6 mb-4 shadow-2xl border border-white/5 relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div>
                                <p className="text-[10px] font-bold mt-0.5 text-gray-400 uppercase tracking-wider">当前分析批次</p>
                                <p className="text-xl font-bold text-white font-mono">{activeBatch?.batch_no || '未关联'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold mt-0.5 text-gray-400 uppercase tracking-wider">有效包裹统计</p>
                                <p className="text-2xl font-black text-white">{batchTotalCount} <span className="text-xs font-normal text-slate-500">PKGS</span></p>
                            </div>
                        </div>

                        {activeBatch && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <SenderStageStats batch={activeBatch as any} shipments={shipments || []} className="dark:bg-slate-800/50 border-none shadow-none" />
                                <TransitStageStats batch={activeBatch as any} shipments={shipments || []} inspections={activeBatch.inspections || []} className="dark:bg-slate-800/50 border-none shadow-none" />
                                <ReceiverStageStats batch={activeBatch as any} shipments={shipments || []} inspections={activeBatch.inspections || []} className="dark:bg-slate-800/50 border-none shadow-none" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {filteredShipments.map((s) => {
                            const batch = s.batch_id ? batchMap[s.batch_id] : null;
                            const insp = shipmentInspectionMap[s.id];

                            const senderTimeFormatted = formatVN(s.sender_at || s.created_at);
                            const transitTimeFormatted = formatVN(s.transit_at || insp?.transit_time);
                            const receiverTimeFormatted = formatVN(s.receiver_at || insp?.check_time);

                            // Traceability Logic
                            const myParentTracking = genealogy.c2p[s.id];
                            const myChildrenTracking = genealogy.p2c[s.id];

                            const getStatusInfo = (status: string) => {
                                switch (status) {
                                    case 'received':
                                    case 'completed':
                                        return { label: '账单已锁', classes: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
                                    case 'shipped':
                                        return { label: '已中转', classes: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
                                    default:
                                        return { label: '待处理', classes: 'bg-primary/10 text-primary border-primary/20' };
                                };
                            };

                            const statusInfo = getStatusInfo(s.status);

                            return (
                                <div key={s.id} className="bg-white dark:bg-[#1a212e] rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-white/5 relative transition-all overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-red-500/80"></div>

                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold mt-0.5 text-gray-400 uppercase tracking-widest opacity-80">全链路审计追踪 (Audit Tracking)</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-2xl font-black tracking-tight font-mono break-all ${s.package_tag === 'merged_child' || s.package_tag === 'split_parent' ? 'text-gray-400 line-through opacity-50' : 'text-slate-900 dark:text-white'}`}>
                                                    {s.tracking_no}
                                                </span>
                                                {s.package_tag === 'merge_parent' && <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 text-[10px] font-bold border border-purple-500/20 uppercase tracking-tighter">合包母单 (Master)</span>}
                                                {s.package_tag === 'merged_child' && <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[10px] font-bold border border-orange-500/20 uppercase tracking-tighter">合包历史单 (History)</span>}
                                                {s.package_tag === 'split_parent' && <span className="px-2 py-0.5 rounded bg-gray-500/10 text-gray-500 text-[10px] font-bold border border-gray-500/20 uppercase tracking-tighter">拆分历史单 (History)</span>}
                                                {s.package_tag === 'split_child' && <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20 uppercase tracking-tighter">拆分子包裹 (Split Child)</span>}
                                            </div>
                                        </div>
                                        <span className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-full border-2 ${statusInfo.classes}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    {/* Traceability Linkage Section */}
                                    {(myChildrenTracking || myParentTracking) && (
                                        <div className="mb-4 bg-slate-50 dark:bg-black/20 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-icons-round text-sm text-slate-400">link</span>
                                                <span className="text-[10px] font-bold mt-0.5 text-slate-500 uppercase tracking-wider">包裹关联关系 (Traceability)</span>
                                            </div>
                                            {myChildrenTracking && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">包含 <span className="font-bold text-primary">{myChildrenTracking.length}</span> 个子单包裹:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {myChildrenTracking.map(track => (
                                                            <span key={track} className="text-[10px] font-mono bg-white dark:bg-white/10 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 text-slate-500">{track}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {myParentTracking && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-600 dark:text-slate-400">归属于母单:</span>
                                                    <span className="text-xs font-mono font-bold text-purple-500 border-b border-purple-500/30">{myParentTracking}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {/* Sender Column */}
                                        <div className="flex flex-col gap-2">
                                            <div className="p-3 bg-red-500/5 dark:bg-red-500/10 rounded-2xl border border-red-500/10 text-center min-h-[100px] flex flex-col justify-center">
                                                <span className="block text-[10px] font-bold mt-0.5 text-red-600/60 uppercase mb-1">发出重量</span>
                                                <span className={`block text-lg font-black font-mono italic ${(s.package_tag === 'split_child' || s.package_tag === 'merge_parent') ? 'text-gray-400 opacity-50' : 'text-red-600'}`}>
                                                    {(s.package_tag === 'split_child' || s.package_tag === 'merge_parent') ? '---' : `${parseFloat(s.weight as any)?.toFixed(2)}kg`}
                                                </span>
                                                <span className="block text-[10px] font-bold text-red-500/80 bg-red-500/10 rounded-full mt-2 py-0.5 font-mono">{senderTimeFormatted}</span>
                                            </div>
                                            <div className="px-2 py-1.5 bg-slate-50 dark:bg-black/20 rounded-lg text-center">
                                                <span className="text-[10px] font-bold mt-0.5 text-gray-400 block uppercase">发出尺寸</span>
                                                <span className="text-[10px] font-black font-mono text-gray-600 dark:text-gray-400">
                                                    {s.length || 0}x{s.width || 0}x{s.height || 0}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Transit Column */}
                                        <div className="flex flex-col gap-2">
                                            <div className={`p-3 rounded-2xl border text-center min-h-[100px] flex flex-col justify-center ${(s.transit_at || insp?.transit_time) ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/10' : 'bg-gray-500/5 dark:bg-white/5 border-white/5 grayscale'}`}>
                                                <span className="block text-[10px] font-bold mt-0.5 text-blue-600/60 uppercase mb-1">中转重量</span>
                                                <span className={`block text-lg font-black font-mono italic ${insp?.transit_weight ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {insp?.transit_weight ? `${insp.transit_weight.toFixed(2)}kg` : '---'}
                                                </span>
                                                {transitTimeFormatted && <span className="block text-[10px] font-bold text-blue-500/80 bg-blue-500/10 rounded-full mt-2 py-0.5 font-mono">{transitTimeFormatted}</span>}
                                            </div>
                                            <div className="px-2 py-1.5 bg-slate-50 dark:bg-black/20 rounded-lg text-center">
                                                <span className="text-[10px] font-bold mt-0.5 text-gray-400 block uppercase">中转尺寸</span>
                                                <span className="text-[10px] font-black font-mono text-gray-600 dark:text-gray-400">
                                                    {(s.transit_at || insp?.transit_time) ? `${insp.transit_length || 0}x${insp.transit_width || 0}x${insp.transit_height || 0}` : '0x0x0'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Receiver Column */}
                                        <div className="flex flex-col gap-2">
                                            <div className={`p-3 rounded-2xl border text-center min-h-[100px] flex flex-col justify-center ${(s.receiver_at || insp?.check_time) ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10 shadow-lg shadow-emerald-500/5' : 'bg-gray-500/5 dark:bg-white/5 border-white/5 grayscale'}`}>
                                                <span className="block text-[10px] font-bold mt-0.5 text-emerald-600/60 uppercase mb-1">接收重量</span>
                                                <span className={`block text-lg font-black font-mono italic ${insp?.check_weight ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                    {insp?.check_weight ? `${insp.check_weight.toFixed(2)}kg` : '---'}
                                                </span>
                                                {receiverTimeFormatted && <span className="block text-[10px] font-bold text-emerald-500/80 bg-emerald-500/10 rounded-full mt-2 py-0.5 font-mono">{receiverTimeFormatted}</span>}
                                            </div>
                                            <div className="px-2 py-1.5 bg-slate-50 dark:bg-black/20 rounded-lg text-center">
                                                <span className="text-[10px] font-bold mt-0.5 text-gray-400 block uppercase">接收尺寸</span>
                                                <span className="text-[10px] font-black font-mono text-gray-600 dark:text-gray-400">
                                                    {(s.receiver_at || insp?.check_time) ? `${insp.check_length || 0}x${insp.check_width || 0}x${insp.check_height || 0}` : '0x0x0'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-white/5 opacity-80 group">
                                        <div className="flex items-center gap-6 text-gray-500">
                                            <div className="flex items-center gap-2 group-hover:text-primary transition-colors">
                                                <span className="material-icons-round text-sm">qr_code_2</span>
                                                <span className="text-[10px] font-black font-mono tracking-widest uppercase">{s.id.slice(0, 8)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons-round text-sm text-gray-400">public</span>
                                                <span className="text-[10px] font-black font-mono">TZ: Asia/Saigon</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-bold mt-0.5 text-gray-400 uppercase tracking-tighter italic">已验证的审计记录</div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredShipments.length === 0 && (
                            <div className="text-center py-24 opacity-20">
                                <span className="material-icons-round text-8xl block mb-4 scale-150 text-gray-500">travel_explore</span>
                                <p className="text-lg font-black tracking-widest uppercase">未找到匹配包裹 (No Match Found)</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {isExporting && (
                <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="relative">
                        <div className="w-20 h-20 border-8 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <span className="material-icons-round absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary text-3xl animate-pulse">file_download</span>
                    </div>
                    <p className="text-white font-black mt-6 tracking-[0.3em] uppercase text-sm">审计数据导出中 (UTC+7)</p>
                    <p className="text-gray-500 text-[10px] mt-2 font-mono italic">正在同步越南时区审计节点...</p>
                </div>
            )}
        </div>
    );
};

export default Reports;
