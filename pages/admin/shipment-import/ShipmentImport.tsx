import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { useBatches } from '../../../hooks/useBatches';
import { ShipmentService } from '../../../services/shipment.service';
import { useQueryClient } from '@tanstack/react-query';

interface ImportedShipment {
    tracking_no: string;
    weight: number;
    length?: number;
    width?: number;
    height?: number;
    shipper_name?: string;
    transport_mode?: number;
    item_category?: string;
    status: string;
}

const ShipmentImport: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: batches } = useBatches();
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ImportedShipment[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseExcel(selectedFile);
        }
    };

    const parseExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // Assuming header is row 0.
                // Expected columns: tracking_no, weight, length, width, height, shipper_name, transport_mode, item_category
                // We'll map by index or try to find headers. For simplicity, let's assume specific order or create a robust mapper.
                // Let's try to map by header names if possible.

                const headers = (jsonData[0] as string[]).map(h => h.trim().toLowerCase());
                const rows = jsonData.slice(1);

                const getColIndex = (names: string[]) => headers.findIndex(h => names.some(n => h.includes(n)));

                const idxTracking = getColIndex(['tracking', '单号', '运单号']);
                const idxWeight = getColIndex(['weight', '重量']);
                const idxLength = getColIndex(['length', '长']);
                const idxWidth = getColIndex(['width', '宽']);
                const idxHeight = getColIndex(['height', '高']);
                const idxShipper = getColIndex(['shipper', '发货人']);
                const idxTransport = getColIndex(['transport', '运输方式']); // Expect 1, 2, 3 or names
                const idxCategory = getColIndex(['category', '物品类别', '品名']);

                if (idxTracking === -1) {
                    toast.error('未找到运单号列');
                    return;
                }

                const parsed: ImportedShipment[] = rows
                    .filter((row: any) => row[idxTracking]) // Must have tracking no
                    .map((row: any) => ({
                        tracking_no: String(row[idxTracking]),
                        weight: parseFloat(row[idxWeight]) || 0,
                        length: idxLength > -1 ? parseFloat(row[idxLength]) || 0 : undefined,
                        width: idxWidth > -1 ? parseFloat(row[idxWidth]) || 0 : undefined,
                        height: idxHeight > -1 ? parseFloat(row[idxHeight]) || 0 : undefined,
                        shipper_name: idxShipper > -1 ? String(row[idxShipper] || '') : undefined,
                        transport_mode: idxTransport > -1 ? parseTransportMode(row[idxTransport]) : 1,
                        item_category: idxCategory > -1 ? String(row[idxCategory] || '') : undefined,
                        status: 'pending'
                    }));

                setPreviewData(parsed);
                toast.success(`解析成功，共 ${parsed.length} 条数据`);
            } catch (err) {
                console.error(err);
                toast.error('解析Excel失败');
            }
        };
        reader.readAsBinaryString(file);
    };

    const parseTransportMode = (val: any): number => {
        if (typeof val === 'number') return val;
        const s = String(val).trim();
        if (s.includes('海')) return 2;
        if (s.includes('空')) return 3;
        return 1; // Default Land
    };

    const handleImport = async () => {
        if (!selectedBatchId) {
            toast.error('请选择批次');
            return;
        }
        if (previewData.length === 0) {
            toast.error('无数据可导入');
            return;
        }

        setIsProcessing(true);
        try {
            // Chunk insertion to avoid payload limits
            const chunkSize = 50;
            const chunks = [];
            for (let i = 0; i < previewData.length; i += chunkSize) {
                chunks.push(previewData.slice(i, i + chunkSize));
            }

            let successCount = 0;
            for (const chunk of chunks) {
                const payload = chunk.map(item => ({
                    ...item,
                    batch_id: selectedBatchId,
                    package_tag: 'original'
                }));
                const res = await ShipmentService.createMany(payload);
                if (res.success) {
                    successCount += (res.data || []).length;
                } else {
                    console.error('Batch import error', res.error);
                }
            }

            toast.success(`成功导入 ${successCount} 条数据`);
            queryClient.invalidateQueries({ queryKey: ['shipments', selectedBatchId] });
            queryClient.invalidateQueries({ queryKey: ['batch', selectedBatchId] });

            // Allow user to stay or go back
            setPreviewData([]);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err: any) {
            toast.error('导入失败: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <span className="material-icons text-slate-600 dark:text-slate-400">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white">导入发货单 (Excel)</h1>
            </header>

            <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">

                {/* 1. Select Batch */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <h2 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                        选择目标批次
                    </h2>
                    <select
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                        className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none text-slate-700 dark:text-slate-300 font-medium"
                    >
                        <option value="">-- 请选择批次 --</option>
                        {batches?.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.batch_no} ({b.status}) - {new Date(b.created_at).toLocaleDateString()}
                            </option>
                        ))}
                    </select>
                </section>

                {/* 2. Upload File */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                            上传Excel文件
                        </h2>
                        <button
                            onClick={() => {
                                const data = [
                                    ['运单号', '重量', '长', '宽', '高', '发货人', '物品类别', '运输方式'],
                                    ['SF123456789', 10.5, 50, 40, 30, '张三', '服装', '陆运'],
                                    ['JD987654321', 5.2, 30, 20, 10, '李四', '电子产品', '海运'],
                                    ['EMS456123789', 2.1, 15, 15, 10, '王五', '化妆品', '空运']
                                ];
                                const ws = XLSX.utils.aoa_to_sheet(data);
                                const wb = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wb, ws, "模板");
                                XLSX.writeFile(wb, "发货单导入模板.xlsx");
                            }}
                            className="text-xs font-bold text-primary hover:text-blue-600 flex items-center gap-1 transition-colors"
                        >
                            <span className="material-icons text-sm">download</span>
                            下载Excel模板
                        </button>
                    </div>

                    <div
                        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <span className="material-icons text-4xl text-slate-400 mb-2">upload_file</span>
                        <p className="text-sm text-slate-500 font-medium">
                            {file ? file.name : '点击上传 .xlsx / .xls 文件'}
                        </p>
                        <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-500/5 rounded-lg border border-blue-100/50 dark:border-blue-500/10 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-md text-center">
                            <p className="font-bold text-primary mb-1 uppercase tracking-wider">注意事项</p>
                            <p>1. 第一行为表头，包含：单号、重量、长、宽、高、发货人、类别、方式</p>
                            <p>2. 运输方式可选：陆运(1), 海运(2), 空运(3)</p>
                            <p>3. 每次导入建议不超过 200 条数据以保证处理速度</p>
                        </div>
                    </div>
                </section>

                {/* 3. Preview */}
                {previewData.length > 0 && (
                    <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
                                预览数据 ({previewData.length} 条)
                            </h2>
                            <button
                                onClick={handleImport}
                                disabled={isProcessing}
                                className={`px-6 py-2 rounded-xl text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-600'
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <span className="material-icons animate-spin text-sm">sync</span>
                                        处理中...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons text-sm">save_alt</span>
                                        确认导入
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl max-h-[400px]">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-medium sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3">单号</th>
                                        <th className="px-4 py-3">重量</th>
                                        <th className="px-4 py-3">尺寸(L*W*H)</th>
                                        <th className="px-4 py-3">发货人</th>
                                        <th className="px-4 py-3">类别</th>
                                        <th className="px-4 py-3">运输方式</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {previewData.slice(0, 100).map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3 font-mono">{row.tracking_no}</td>
                                            <td className="px-4 py-3">{row.weight}</td>
                                            <td className="px-4 py-3 text-slate-400">
                                                {row.length || '-'} x {row.width || '-'} x {row.height || '-'}
                                            </td>
                                            <td className="px-4 py-3">{row.shipper_name || '-'}</td>
                                            <td className="px-4 py-3">{row.item_category || '-'}</td>
                                            <td className="px-4 py-3">
                                                {row.transport_mode === 1 ? '陆运' : row.transport_mode === 2 ? '海运' : '空运'}
                                            </td>
                                        </tr>
                                    ))}
                                    {previewData.length > 100 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-3 text-center text-slate-400 italic">
                                                ... 还有 {previewData.length - 100} 条数据 ...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default ShipmentImport;
