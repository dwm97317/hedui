import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { useBatches } from '../../../hooks/useBatches';
import { ShipmentService, Shipment } from '../../../services/shipment.service';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Upload,
    Download,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Package,
    Truck,
    User,
    Tag,
    Calendar,
    Loader2,
    Info,
    FileWarning,
    History,
    Edit2,
    Trash2,
    X
} from 'lucide-react';

interface ImportedShipment {
    tracking_no: string;
    weight: number;
    length?: number;
    width?: number;
    height?: number;
    shipper_name?: string;
    transport_mode?: number;
    item_category?: string;
    sender_at?: string;
    status: 'pending' | 'shipped' | 'received';
}

const ShipmentImport: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: batches } = useBatches();
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ImportedShipment[]>([]);
    const [skippedRows, setSkippedRows] = useState<{ row: number, tracking?: string, reason: string }[]>([]);
    const [overwriteExisting, setOverwriteExisting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [editingItem, setEditingItem] = useState<ImportedShipment | null>(null);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseExcel(selectedFile);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            setFile(droppedFile);
            parseExcel(droppedFile);
        }
    };

    const parseExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellDates: false });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                if (jsonData.length <= 1) {
                    toast.error('表格内没有有效数据');
                    return;
                }

                const headers = (jsonData[0] as string[]).map(h => String(h || '').trim().toLowerCase());
                const rows = jsonData.slice(1);

                const getColIndex = (names: string[]) => headers.findIndex(h => names.some(n => h.includes(n)));

                const idxDate = getColIndex(['发运日期', '日期', 'date']);
                const idxTracking = getColIndex(['单号', '运单号', 'tracking']);
                const idxWeight = getColIndex(['实际重量', '重量', 'weight']);
                const idxShipper = getColIndex(['姓名', '发货人', 'shipper', 'name']);
                const idxTransport = getColIndex(['运输方式', '方式', 'transport']);
                const idxCategory = getColIndex(['物品类别', '品名', 'category']);

                if (idxTracking === -1) {
                    toast.error('未找到单号列，请检查表头是否包含：单号、运单号 或 Tracking');
                    return;
                }

                const groupedData: Record<string, ImportedShipment> = {};
                const localSkippedRows: { row: number, tracking?: string, reason: string }[] = [];
                const stats = {
                    totalRows: rows.length,
                    skippedNoDate: 0,
                    skippedChinese: 0,
                    skippedInvalidWeight: 0
                };

                let lastValidMetadata = {
                    date: undefined as string | undefined,
                    transport: 1,
                    shipper: undefined as string | undefined,
                    category: undefined as string | undefined,
                    tracking: undefined as string | undefined
                };

                rows.forEach((row: any, index: number) => {
                    const rowNum = index + 2; // 1-indexed + header row
                    const rawTracking = row[idxTracking] ? String(row[idxTracking]).trim() : undefined;
                    const rawWeightStr = String(row[idxWeight] || '').replace(/[^0-9.]/g, '');
                    const rawWeight = rawWeightStr ? parseFloat(rawWeightStr) : NaN;

                    // 1. 如果有新单号，更新元数据
                    if (rawTracking) {
                        // 校验：不支持中文单号
                        const hasChinese = /[\u4e00-\u9fa5]/.test(rawTracking);
                        const parsedDate = idxDate > -1 ? excelDateToISO(row[idxDate]) : undefined;

                        if (hasChinese) {
                            stats.skippedChinese++;
                            localSkippedRows.push({ row: rowNum, tracking: rawTracking, reason: '单号包含中文字符' });
                            lastValidMetadata.tracking = undefined; // 失效后续合包
                        } else if (!parsedDate) {
                            stats.skippedNoDate++;
                            localSkippedRows.push({ row: rowNum, tracking: rawTracking, reason: '未填写日期或日期格式错误' });
                            lastValidMetadata.tracking = undefined; // 失效后续合包
                        } else {
                            lastValidMetadata = {
                                tracking: rawTracking,
                                date: parsedDate,
                                transport: idxTransport > -1 ? parseTransportMode(row[idxTransport]) : 1,
                                shipper: idxShipper > -1 ? String(row[idxShipper] || '') : undefined,
                                category: idxCategory > -1 ? String(row[idxCategory] || '') : undefined
                            };
                        }
                    }

                    // 2. 如果当前有有效的单号元数据，则累加重量
                    if (lastValidMetadata.tracking) {
                        if (!isNaN(rawWeight) && rawWeight > 0) {
                            const tNo = lastValidMetadata.tracking;
                            if (!groupedData[tNo]) {
                                groupedData[tNo] = {
                                    tracking_no: tNo,
                                    weight: 0,
                                    shipper_name: lastValidMetadata.shipper,
                                    transport_mode: lastValidMetadata.transport,
                                    item_category: lastValidMetadata.category,
                                    sender_at: lastValidMetadata.date,
                                    status: 'pending'
                                };
                            }
                            groupedData[tNo].weight = Number((groupedData[tNo].weight + rawWeight).toFixed(2));
                        } else {
                            stats.skippedInvalidWeight++;
                            if (rawTracking) {
                                localSkippedRows.push({ row: rowNum, tracking: rawTracking, reason: '重量无效或小于等于0' });
                            }
                        }
                    }
                });

                const finalData = Object.values(groupedData);
                setPreviewData(finalData);
                setSkippedRows(localSkippedRows);

                // 反馈
                if (finalData.length > 0) {
                    const skipCount = stats.skippedNoDate + stats.skippedChinese;
                    let msg = `识别成功：${finalData.length} 个运单`;
                    if (skipCount > 0) {
                        msg += ` (跳过 ${skipCount} 个无效单号`;
                        const reasons = [];
                        if (stats.skippedNoDate > 0) reasons.push(`${stats.skippedNoDate}个缺日期`);
                        if (stats.skippedChinese > 0) reasons.push(`${stats.skippedChinese}个含中文`);
                        msg += `: ${reasons.join('、')})`;
                    }
                    toast.success(msg, { duration: 5000 });
                } else {
                    toast.error('未识别到有效运单，请检查是否填写了日期或单号是否包含中文');
                }
            } catch (err) {
                console.error(err);
                toast.error('解析Excel失败，文件可能已损坏或格式不支持');
            }
        };
        reader.readAsBinaryString(file);
    };

    const excelDateToISO = (val: any): string | undefined => {
        if (!val) return undefined;
        if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            return date.toISOString();
        }
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d.toISOString();
    };

    const parseTransportMode = (val: any): number => {
        if (val === null || val === undefined) return 1;
        if (typeof val === 'number') return [1, 2, 3].includes(val) ? val : 1;
        const s = String(val).trim();
        if (s === '1' || s.includes('陆')) return 1;
        if (s === '2' || s.includes('海')) return 2;
        if (s === '3' || s.includes('空')) return 3;
        return 1;
    };

    const handleImport = async () => {
        if (!selectedBatchId) {
            toast.error('请先选择目标批次');
            return;
        }
        if (previewData.length === 0) {
            toast.error('没有可导入的数据');
            return;
        }

        setIsProcessing(true);
        try {
            const existingRes = await ShipmentService.listByBatch(selectedBatchId, true);
            const existingTrackingNos = new Set((existingRes.data || []).map(s => s.tracking_no));

            let toImport = previewData;

            if (overwriteExisting) {
                // 如果开启覆盖，先删除存在的单号
                const foundExisting = previewData.filter(item => existingTrackingNos.has(item.tracking_no));
                if (foundExisting.length > 0) {
                    const trackingNosToDelete = foundExisting.map(i => i.tracking_no);
                    const delRes = await ShipmentService.removeInBatch(selectedBatchId, trackingNosToDelete);
                    if (!delRes.success) {
                        toast.error('覆盖原有数据失败: ' + delRes.error);
                        setIsProcessing(false);
                        return;
                    }
                    toast.success(`正在覆盖 ${foundExisting.length} 个已存在单号的原有信息...`);
                }
            } else {
                // 不开启覆盖，过滤掉已存在的
                toImport = previewData.filter(item => !existingTrackingNos.has(item.tracking_no));

                if (toImport.length === 0) {
                    toast.error('单号已全部存在，如需更新请勾选“覆盖原有数据”');
                    setIsProcessing(false);
                    return;
                }

                if (toImport.length < previewData.length) {
                    toast(`${previewData.length - toImport.length} 条已存在的单号已被自动跳过`);
                }
            }

            const chunkSize = 50;
            let successCount = 0;
            for (let i = 0; i < toImport.length; i += chunkSize) {
                const chunk = toImport.slice(i, i + chunkSize);
                const payload: Partial<Shipment>[] = chunk.map(item => ({
                    ...item,
                    batch_id: selectedBatchId,
                    package_tag: 'standard'
                }));
                const res = await ShipmentService.createMany(payload);
                if (res.success) {
                    successCount += (res.data || []).length;
                }
            }

            toast.success(`成功 ${overwriteExisting ? '覆盖/插入' : '导入'} ${successCount} 个运单`, { duration: 4000 });
            queryClient.invalidateQueries({ queryKey: ['shipments', selectedBatchId] });

            setPreviewData([]);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err: any) {
            toast.error('导入失败: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadFailureReport = () => {
        if (skippedRows.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(skippedRows.map(s => ({
            '行号': s.row,
            '涉及单号': s.tracking || '无',
            '异常原因': s.reason
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "异常记录");
        XLSX.writeFile(workbook, `导入异常报告_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleDeleteItem = (index: number) => {
        const newData = [...previewData];
        newData.splice(index, 1);
        setPreviewData(newData);
        toast.success('已移除该运单');
    };

    const handleSaveEdit = () => {
        if (editingItem && editIndex !== null) {
            const newData = [...previewData];
            newData[editIndex] = editingItem;
            setPreviewData(newData);
            setEditingItem(null);
            setEditIndex(null);
            toast.success('修该已保存');
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col font-sans selection:bg-blue-100 selection:text-blue-700">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-none">批量导入运单</h1>
                        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">支持 Excel 合包数据智能处理</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href="/shipment_import_template.xlsx"
                        download
                        className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                    >
                        <Download size={16} />
                        下载标准模板
                    </a>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8">
                {/* 1. Select Batch */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200/60 dark:border-slate-800/60"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                            1
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">选择目标批次</h2>
                    </div>
                    <div className="relative group">
                        <select
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            className="w-full appearance-none p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-700 dark:text-slate-200 font-semibold transition-all cursor-pointer pr-12"
                        >
                            <option value="">-- 请选择要导入到的批次 --</option>
                            {batches?.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.batch_no} [{b.status}] · {new Date(b.created_at).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
                            <span className="material-icons">expand_more</span>
                        </div>
                    </div>
                </motion.section>

                {/* 2. Upload File */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200/60 dark:border-slate-800/60"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                                2
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">上传解析文件</h2>
                        </div>
                        <a
                            href="/shipment_import_template.xlsx"
                            download
                            className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 sm:hidden transition-colors"
                        >
                            <Download size={14} />
                            下载模板
                        </a>
                    </div>

                    <div
                        className={`relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer group
                            ${dragActive
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/5'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 
                            ${file ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {file ? <FileSpreadsheet size={32} /> : <Upload size={32} />}
                        </div>

                        <p className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">
                            {file ? file.name : '将 Excel 文件拖拽至此或点击上传'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            支持 .xlsx / .xls / .csv 格式 (单次限 500 条)
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-3xl">
                            <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                                <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">智能合并</p>
                                    <p className="text-xs text-slate-500 leading-relaxed">检测相同单号下多行重量，自动累加总重量。</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                                <Info size={18} className="text-blue-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">日期识别</p>
                                    <p className="text-xs text-slate-500 leading-relaxed">支持 Excel 序列日期及常规日期文本格式读取。</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* 3. Preview */}
                <AnimatePresence>
                    {previewData.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden"
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-lg">
                                        3
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">数据预览</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">共识别到 {previewData.length} 条有效单号</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 cursor-pointer select-none group/check" onClick={() => setOverwriteExisting(!overwriteExisting)}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${overwriteExisting ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}>
                                            {overwriteExisting && <CheckCircle2 size={12} className="text-white" />}
                                        </div>
                                        <span className={`text-sm font-bold transition-colors ${overwriteExisting ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'}`}>覆盖同批次已存在单号</span>
                                    </div>
                                    <button
                                        onClick={handleImport}
                                        disabled={isProcessing}
                                        className={`group px-8 py-4 rounded-2xl text-white font-bold shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 overflow-hidden relative ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>正在同步数据...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={18} className="group-hover:rotate-12 transition-transform" />
                                                <span>确认导入有效运单</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {skippedRows.length > 0 && (
                                <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                            <FileWarning size={24} />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-amber-900 dark:text-amber-100">解析过程中发现部分异常行 ({skippedRows.length} 行)</p>
                                            <p className="text-sm text-amber-700/80 dark:text-amber-400/80">这些行因“缺日期”或“单号含中文”等原因已自动过滤，不会进入预览列表。</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={downloadFailureReport}
                                        className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-amber-600/20 active:scale-95 whitespace-nowrap"
                                    >
                                        <History size={16} />
                                        下载异常报告 (Excel)
                                    </button>
                                </div>
                            )}

                            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-900/30">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                                <div className="flex items-center gap-2"><Tag size={12} /> 运单号</div>
                                            </th>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                                <div className="flex items-center gap-2"><Package size={12} /> 重量 (kg)</div>
                                            </th>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                                <div className="flex items-center gap-2"><Calendar size={12} /> 发运日期</div>
                                            </th>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                                <div className="flex items-center gap-2"><User size={12} /> 发货人</div>
                                            </th>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                                <div className="flex items-center gap-2"><Truck size={12} /> 运输方式</div>
                                            </th>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[10px] text-right">
                                                <span>操作</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {previewData.slice(0, 50).map((row, idx) => (
                                            <motion.tr
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.01 }}
                                                className="hover:bg-white dark:hover:bg-slate-800 transition-colors group"
                                            >
                                                <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">
                                                    {row.tracking_no}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{row.weight}</span> kg
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                    {row.sender_at ? new Date(row.sender_at).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                    {row.shipper_name || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${row.transport_mode === 1 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                        row.transport_mode === 2 ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                            'bg-purple-50 text-purple-600 border border-purple-100'
                                                        }`}>
                                                        {row.transport_mode === 1 ? '陆运' : row.transport_mode === 2 ? '海运' : '空运'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem({ ...row });
                                                                setEditIndex(idx);
                                                            }}
                                                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                                                            title="编辑"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteItem(idx)}
                                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                                                            title="删除"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 50 && (
                                    <div className="p-6 text-center bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                        <p className="text-sm text-slate-400 italic">
                                            已折叠其余 {previewData.length - 50} 条记录 ...
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingItem(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg relative z-10"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Edit2 size={20} className="text-blue-500" />
                                    编辑运单信息
                                </h3>
                                <button
                                    onClick={() => setEditingItem(null)}
                                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-500 ml-1">运单号</label>
                                    <input
                                        type="text"
                                        value={editingItem.tracking_no}
                                        onChange={(e) => setEditingItem({ ...editingItem, tracking_no: e.target.value })}
                                        className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-500 ml-1">重量 (kg)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editingItem.weight}
                                            onChange={(e) => setEditingItem({ ...editingItem, weight: parseFloat(e.target.value) || 0 })}
                                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-500 ml-1">运输方式</label>
                                        <select
                                            value={editingItem.transport_mode}
                                            onChange={(e) => setEditingItem({ ...editingItem, transport_mode: parseInt(e.target.value) })}
                                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
                                        >
                                            <option value={1}>陆运</option>
                                            <option value={2}>海运</option>
                                            <option value={3}>空运</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-500 ml-1">发货人姓名</label>
                                    <input
                                        type="text"
                                        value={editingItem.shipper_name || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, shipper_name: e.target.value })}
                                        className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-10">
                                <button
                                    onClick={() => setEditingItem(null)}
                                    className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-500/20 transition-all"
                                >
                                    保存修改
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ShipmentImport;
