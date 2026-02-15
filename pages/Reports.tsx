import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBatches } from '../hooks/useBatches';
import { useShipments } from '../hooks/useShipments';
import { useUserStore } from '../store/user.store';
import { useBatchStore } from '../store/batch.store';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';

const Reports: React.FC = () => {
    const navigate = useNavigate();
    const { activeBatchId } = useBatchStore();
    const { data: batches, isLoading: batchesLoading } = useBatches(undefined, { includeInspections: true });
    const { data: shipments, isLoading: shipmentsLoading } = useShipments(activeBatchId || '');
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
        return sortedShipments.filter(s =>
            s.tracking_no.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 100);
    }, [sortedShipments, searchQuery]);

    if (batchesLoading || shipmentsLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Batch Specific Stats
    const batchTotalCount = shipments?.length || 0;
    const batchTotalWeight = shipments?.reduce((acc, s) => acc + (parseFloat(s.weight as any) || 0), 0).toFixed(2) || '0.00';

    // --- Export Logic ---
    const handleExportExcel = () => {
        const data = filteredShipments.map(s => {
            const insp = shipmentInspectionMap[s.id];
            const senderAtVN = formatVN(s.sender_at || s.created_at, true);
            const transitAtVN = formatVN(s.transit_at || insp?.transit_time, true);
            const receiverAtVN = formatVN(s.receiver_at || insp?.check_time, true);

            return {
                '单号': s.tracking_no,
                '发出重量(kg)': s.weight,
                '发出尺寸(cm)': `${s.length || 0}x${s.width || 0}x${s.height || 0}`,
                '发出时间(VN)': senderAtVN || '-',
                '中转重量(kg)': insp?.transit_weight || '-',
                '中转尺寸(cm)': (s.transit_at || insp?.transit_time) ? `${insp.transit_length || 0}x${insp.transit_width || 0}x${insp.transit_height || 0}` : '0x0x0',
                '中转时间(VN)': transitAtVN || '-',
                '接收重量(kg)': insp?.check_weight || '-',
                '接收尺寸(cm)': (s.receiver_at || insp?.check_time) ? `${insp.check_length || 0}x${insp.check_width || 0}x${insp.check_height || 0}` : '0x0x0',
                '接收时间(VN)': receiverAtVN || '-',
                '最终状态': s.status
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "全环节时间审计");
        XLSX.writeFile(wb, `越南时区审计_${activeBatch?.batch_no || '未命名'}.xlsx`);
        toast.success('Excel 导出成功 (VN Time)');
    };

    const handleExportPNG = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        try {
            const dataUrl = await toPng(reportRef.current, { cacheBust: true, backgroundColor: '#f8fafc' });
            const link = document.createElement('a');
            link.download = `报表_${activeBatch?.batch_no || '未命名'}_VN.png`;
            link.href = dataUrl;
            link.click();
            toast.success('PNG 图片导出成功');
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
            pdf.save(`报表_${activeBatch?.batch_no || '未命名'}_VN.pdf`);
            toast.success('PDF 导出成功');
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
                            {activeBatch ? `批次: ${activeBatch.batch_no}` : '报表中心'}
                        </h1>
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-tighter font-semibold">Vietnam Timezone Audit Logic</p>
                    </div>
                    <div className="flex items-center gap-2">
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
                    <div className="bg-surface-dark rounded-2xl p-6 mb-4 shadow-2xl border border-white/5 flex justify-between items-center gap-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 transition-transform group-hover:scale-110"></div>
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-400 mb-1 font-black uppercase tracking-[0.2em]">Shipment Totol</p>
                            <p className="text-4xl font-black text-white">{batchTotalCount}</p>
                        </div>
                        <div className="w-px h-12 bg-white/10"></div>
                        <div className="flex-1 text-right">
                            <p className="text-[10px] text-gray-400 mb-1 font-black uppercase tracking-[0.2em]">G.W Total (KG)</p>
                            <p className="text-4xl font-black text-red-500">{batchTotalWeight}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {filteredShipments.map((s) => {
                            const batch = s.batch_id ? batchMap[s.batch_id] : null;
                            const insp = shipmentInspectionMap[s.id];

                            const senderTimeFormatted = formatVN(s.sender_at || s.created_at);
                            const transitTimeFormatted = formatVN(s.transit_at || insp?.transit_time);
                            const receiverTimeFormatted = formatVN(s.receiver_at || insp?.check_time);

                            const getStatusInfo = (status: string) => {
                                switch (status) {
                                    case 'received':
                                    case 'completed':
                                        return { label: '账单已锁', classes: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
                                    default:
                                        return { label: '查验中', classes: 'bg-primary/10 text-primary border-primary/20' };
                                };
                            };

                            const statusInfo = getStatusInfo(batch?.status || s.status);

                            return (
                                <div key={s.id} className="bg-white dark:bg-[#1a212e] rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-white/5 relative transition-all overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-red-500/80"></div>

                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Audit Tracking</span>
                                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono break-all">{s.tracking_no}</span>
                                        </div>
                                        <span className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-full border-2 ${statusInfo.classes}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {/* Sender Column */}
                                        <div className="flex flex-col gap-2">
                                            <div className="p-3 bg-red-500/5 dark:bg-red-500/10 rounded-2xl border border-red-500/10 text-center min-h-[100px] flex flex-col justify-center">
                                                <span className="block text-[10px] text-red-600/60 font-black uppercase mb-1">发出时刻</span>
                                                <span className="block text-lg font-black text-red-600 font-mono italic">{parseFloat(s.weight as any)?.toFixed(2)}kg</span>
                                                <span className="block text-[10px] font-bold text-red-500/80 bg-red-500/10 rounded-full mt-2 py-0.5 font-mono">{senderTimeFormatted}</span>
                                            </div>
                                            <div className="px-2 py-1.5 bg-slate-50 dark:bg-black/20 rounded-lg text-center">
                                                <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-tighter">S. Size</span>
                                                <span className="text-[10px] font-black font-mono text-gray-600 dark:text-gray-400">
                                                    {s.length || 0}x{s.width || 0}x{s.height || 0}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Transit Column */}
                                        <div className="flex flex-col gap-2">
                                            <div className={`p-3 rounded-2xl border text-center min-h-[100px] flex flex-col justify-center ${(s.transit_at || insp?.transit_time) ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/10' : 'bg-gray-500/5 dark:bg-white/5 border-white/5 grayscale'}`}>
                                                <span className="block text-[10px] text-blue-600/60 font-black uppercase mb-1">中转时刻</span>
                                                <span className={`block text-lg font-black font-mono italic ${insp?.transit_weight ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {insp?.transit_weight ? `${insp.transit_weight.toFixed(2)}kg` : '---'}
                                                </span>
                                                {transitTimeFormatted && <span className="block text-[10px] font-bold text-blue-500/80 bg-blue-500/10 rounded-full mt-2 py-0.5 font-mono">{transitTimeFormatted}</span>}
                                            </div>
                                            <div className="px-2 py-1.5 bg-slate-50 dark:bg-black/20 rounded-lg text-center">
                                                <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-tighter">T. Size</span>
                                                <span className="text-[10px] font-black font-mono text-gray-600 dark:text-gray-400">
                                                    {(s.transit_at || insp?.transit_time) ? `${insp.transit_length || 0}x${insp.transit_width || 0}x${insp.transit_height || 0}` : '0x0x0'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Receiver Column */}
                                        <div className="flex flex-col gap-2">
                                            <div className={`p-3 rounded-2xl border text-center min-h-[100px] flex flex-col justify-center ${(s.receiver_at || insp?.check_time) ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10 shadow-lg shadow-emerald-500/5' : 'bg-gray-500/5 dark:bg-white/5 border-white/5 grayscale'}`}>
                                                <span className="block text-[10px] text-emerald-600/60 font-black uppercase mb-1">接收时刻</span>
                                                <span className={`block text-lg font-black font-mono italic ${insp?.check_weight ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                    {insp?.check_weight ? `${insp.check_weight.toFixed(2)}kg` : '---'}
                                                </span>
                                                {receiverTimeFormatted && <span className="block text-[10px] font-bold text-emerald-500/80 bg-emerald-500/10 rounded-full mt-2 py-0.5 font-mono">{receiverTimeFormatted}</span>}
                                            </div>
                                            <div className="px-2 py-1.5 bg-slate-50 dark:bg-black/20 rounded-lg text-center">
                                                <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-tighter">R. Size</span>
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
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter italic">Verified Audit Record</div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredShipments.length === 0 && (
                            <div className="text-center py-24 opacity-20">
                                <span className="material-icons-round text-8xl block mb-4 scale-150 text-gray-500">travel_explore</span>
                                <p className="text-lg font-black tracking-widest uppercase">No Match Found</p>
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
                    <p className="text-white font-black mt-6 tracking-[0.3em] uppercase text-sm">Audit Data Export (UTC+7)</p>
                    <p className="text-gray-500 text-[10px] mt-2 font-mono italic">Syncing Vietnam Timezone Markers...</p>
                </div>
            )}
        </div>
    );
};

export default Reports;
