import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBatchDetail, useUpdateBatchStatus } from '../../hooks/useBatches';
import { useShipments, useUpdateShipment, useMergeShipments, useSplitShipment } from '../../hooks/useShipments';
import { useInspections, useCreateInspection } from '../../hooks/useInspections';
import { useBatchStore } from '../../store/batch.store';
import { toast } from 'react-hot-toast';
import { MergeModal } from '../batch-detail/components/MergeModal';
import { SplitModal } from '../batch-detail/components/SplitModal';
import { CameraScanButton } from '../../components/CameraScanner';
import { useLabelPrint } from '../../hooks/useLabelPrint';

const TransitCheck: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { activeBatchId: storeBatchId } = useBatchStore();
    const batchId = searchParams.get('batchId') || storeBatchId;

    const { data: batch, isLoading: isBatchLoading } = useBatchDetail(batchId || '');
    const { data: rawShipments, isLoading: isShipmentsLoading } = useShipments(batchId || '');
    const { data: inspections, isLoading: isInspectionsLoading } = useInspections(batchId || '');

    // Common Filter for active shipments
    const shipments = useMemo(() =>
        (rawShipments || []).filter(s => !['merged_child', 'split_parent'].includes(s.package_tag || '')),
        [rawShipments]);

    const updateStatus = useUpdateBatchStatus();
    const createInspection = useCreateInspection();
    const updateShipment = useUpdateShipment();
    const mergeMutation = useMergeShipments();
    const splitMutation = useSplitShipment();

    // Bluetooth label printing
    const { printShipmentLabel, isPrinting: isLabelPrinting } = useLabelPrint({ silent: true });

    const [scanInput, setScanInput] = useState('');
    const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);
    const [measuredWeight, setMeasuredWeight] = useState<string>('');
    const [dimL, setDimL] = useState<string>('');
    const [dimW, setDimW] = useState<string>('');
    const [dimH, setDimH] = useState<string>('');

    // Workflow Actions State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [splitTarget, setSplitTarget] = useState<any | null>(null);

    const isLoading = isBatchLoading || isShipmentsLoading || isInspectionsLoading;

    const handleMergeConfirm = async (data: { tracking_no: string, total_weight: number }) => {
        try {
            await mergeMutation.mutateAsync({
                parent_tracking_no: data.tracking_no,
                child_ids: Array.from(selectedForMerge),
                batch_id: batchId!,
                total_weight: data.total_weight
            });
            if (batch?.status === 'sender_sealed' || batch?.status === 'sealed') {
                await updateStatus.mutateAsync({ id: batchId!, status: 'transit_processing' });
            }

            setShowMergeModal(false);
            setIsSelectionMode(false);
            setSelectedForMerge(new Set());
            toast.success('合并成功');
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleSplitConfirm = async (data: { parent_id: string, children: any[] }) => {
        try {
            await splitMutation.mutateAsync({
                parent_id: data.parent_id,
                batch_id: batchId!,
                children: data.children,
                role: 'transit'
            });
            if (batch?.status === 'sender_sealed' || batch?.status === 'sealed') {
                await updateStatus.mutateAsync({ id: batchId!, status: 'transit_processing' });
            }

            setSplitTarget(null);
            setActiveShipmentId(null);
            toast.success('拆分成功');
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    // Handle PDA Scan logic
    useEffect(() => {
        const handleScan = (e: any) => {
            const code = e.detail;
            processScan(code);
        };
        window.addEventListener('pda-scan', handleScan);
        return () => window.removeEventListener('pda-scan', handleScan);
    }, [shipments]);

    const processScan = async (code_raw: string) => {
        const code = code_raw.trim().toUpperCase();
        const found = shipments.find(s => s.tracking_no?.trim().toUpperCase() === code);

        if (found) {
            // Check if already processed (Manual inspection or Auto-restructuring)
            const isDone = processedShipmentIds.has(found.id);

            if (isSelectionMode) {
                if (isDone) {
                    toast.error(`单号 ${code.slice(-6)} 已查验，不可重复合并`);
                    return;
                }
                const newSet = new Set(selectedForMerge);
                if (newSet.has(found.id)) newSet.delete(found.id);
                else newSet.add(found.id);
                setSelectedForMerge(newSet);
                toast.success(`已选: ${code.slice(-6)}`);
                return;
            }

            if (isDone) {
                toast.success(`单号 ${code.slice(-6)}: 已核验完毕`, { icon: '✅' });
                return;
            }

            setActiveShipmentId(found.id);
            setMeasuredWeight(found.weight?.toString() || '');
            setDimL(found.length?.toString() || '');
            setDimW(found.width?.toString() || '');
            setDimH(found.height?.toString() || '');
            toast.dismiss();
            toast.success(`识别单号: ${code.slice(-6)}`, { icon: '⚖️' });
            return;
        }

        // Deep check for invalid statuses
        try {
            toast.loading('正在查询...', { id: 'scan-lookup' });
            const { ShipmentService } = await import('../../services/shipment.service');
            const { data: remoteShipment } = await ShipmentService.findByTracking(code);
            toast.dismiss('scan-lookup');

            if (remoteShipment) {
                if (remoteShipment.package_tag === 'merged_child' || remoteShipment.parent_id) {
                    toast.error(`此包裹已并入合包！不可单独操作。\n请扫描父单号。`, { duration: 4000, icon: '🔗' });
                    return;
                }
                if (remoteShipment.package_tag === 'split_parent') {
                    toast.error(`此包裹已拆分！不可操作。\n请扫描拆出的子单号。`, { duration: 4000, icon: '✂️' });
                    return;
                }
                if (remoteShipment.batch_id !== batchId) {
                    toast.error(`非本批次包裹！\n所属批次: ${remoteShipment.batch_id}`, { duration: 4000 });
                    return;
                }
            }
            toast.error(`无效单号: ${code}`, { id: 'invalid-scan' });
        } catch (e) {
            toast.dismiss('scan-lookup');
            toast.error(`有效性检查失败: ${code}`, { id: 'scan-error' });
        }
    };

    const handleManualScan = (e: React.FormEvent) => {
        e.preventDefault();
        if (scanInput) {
            processScan(scanInput);
            setScanInput('');
        }
    };

    const processedShipmentIds = new Set(inspections?.filter(i => i.notes?.includes('WeighCheck')).map(i => {
        return i.notes?.includes('ShipmentID:') ? i.notes.split('ShipmentID:')[1].split(' ')[0] : null;
    }).filter(Boolean));

    const activeShipment = shipments.find(s => s.id === activeShipmentId);

    const totalCount = shipments.length || 0;
    const doneCount = shipments.filter(s => processedShipmentIds.has(s.id)).length || 0;
    const pendingCount = totalCount - doneCount;

    if (isLoading) return <div className="text-white p-5 bg-background-dark h-screen flex items-center justify-center italic">数据同步中...</div>;

    if (!batchId || !batch) {
        return (
            <div className="bg-background-dark h-screen flex flex-col items-center justify-center p-6 text-center">
                <span className="material-icons-round text-6xl text-gray-700 mb-4">inventory_2</span>
                <h3 className="text-xl font-bold text-white mb-2">未发现待检批次</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-xs">请先在首页选择或扫描一个正在中转中的批次再进行重量查验。</p>
                <button
                    onClick={() => navigate('/transit')}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold active:scale-95 transition-transform"
                >
                    回到首页
                </button>
            </div>
        );
    }

    const handleConfirm = async () => {
        if (!activeShipment || !measuredWeight) return;

        try {
            await createInspection.mutateAsync({
                batch_id: batchId!,
                result: 'passed',
                transit_weight: parseFloat(measuredWeight),
                transit_length: parseFloat(dimL) || 0,
                transit_width: parseFloat(dimW) || 0,
                transit_height: parseFloat(dimH) || 0,
                notes: `ShipmentID:${activeShipment.id} Tracking:${activeShipment.tracking_no} WeighCheck:${measuredWeight}kg Dim:${dimL}x${dimW}x${dimH}`,
                photos: []
            });

            await updateShipment.mutateAsync({
                id: activeShipment.id,
                updates: { transit_at: new Date().toISOString() } as any
            });

            if (batch?.status === 'sender_sealed' || batch?.status === 'sealed') {
                await updateStatus.mutateAsync({ id: batchId!, status: 'transit_processing' });
            }

            /* 
            // Commented out: Print label via Bluetooth after successful verification
            await printShipmentLabel({
                tracking_no: activeShipment.tracking_no,
                weight: parseFloat(measuredWeight),
                length: parseFloat(dimL) || undefined,
                width: parseFloat(dimW) || undefined,
                height: parseFloat(dimH) || undefined,
                batch_no: batch?.batch_no,
            });
            */

            setActiveShipmentId(null);
            setMeasuredWeight('');
            setDimL('');
            setDimW('');
            setDimH('');
        } catch (e: any) {
            toast.error('保存失败');
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark h-full w-full flex flex-col text-slate-800 dark:text-slate-100 font-display overflow-hidden">
            {/* Header */}
            <header className="px-5 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark z-10 shrink-0">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-bold leading-none">中转扫码查验</h1>
                    <span className="text-[10px] text-gray-500 font-mono mt-1 block">{batch.batch_no}</span>
                </div>
                <div className="w-8"></div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-40">
                {/* Batch No-Seal Warning */}
                {(batch.status === 'draft' || batch.status === 'sender_processing') && (
                    <section className="px-4 mb-2 mt-4">
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/30 rounded-xl p-3 flex items-start gap-3 shadow-sm">
                            <span className="material-icons-round text-orange-500 mt-0.5">warning_amber</span>
                            <div>
                                <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400">批次尚未封箱</h4>
                                <p className="text-[10px] text-orange-600 dark:text-orange-300">发出方尚未完成封箱操作。在此状态下查验，系统将自动录入查验数据并推进状态。</p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Scan Box & Operation Switche */}
                <section className="p-4 space-y-3">
                    <form onSubmit={handleManualScan} className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className={`material-icons-round text-2xl animate-pulse ${isSelectionMode ? 'text-amber-500' : 'text-primary'}`}>
                                {isSelectionMode ? 'playlist_add_check' : 'qr_code_scanner'}
                            </span>
                        </div>
                        <input
                            autoFocus
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            className={`block w-full pl-12 pr-16 py-6 bg-white dark:bg-surface-dark border-2 focus:ring-0 rounded-2xl text-xl font-bold placeholder-gray-500 shadow-lg active:scale-[0.99] transition-all
                                ${isSelectionMode ? 'border-amber-500' : 'border-primary focus:border-blue-600'}`}
                            placeholder={isSelectionMode ? "扫描单号以加入合并..." : "请扫描单号或手动输入..."}
                            type="text"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <CameraScanButton onScan={(code) => { processScan(code); }} size="md" />
                        </div>
                    </form>

                    <div className="flex gap-2">
                        {!isSelectionMode ? (
                            <button
                                onClick={() => setIsSelectionMode(true)}
                                className="flex-1 bg-amber-500/10 text-amber-600 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-amber-500/20 active:scale-95 transition-all"
                            >
                                <span className="material-icons text-sm">merge_type</span>
                                开启合并模式 (Merge)
                            </button>
                        ) : (
                            <div className="flex-1 flex gap-2 animate-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => {
                                        setIsSelectionMode(false);
                                        setSelectedForMerge(new Set());
                                    }}
                                    className="px-4 bg-slate-100 dark:bg-white/5 text-slate-500 py-3 rounded-xl font-bold text-[10px] uppercase active:scale-95"
                                >
                                    取消
                                </button>
                                <button
                                    disabled={selectedForMerge.size < 2 || mergeMutation.isPending}
                                    onClick={() => setShowMergeModal(true)}
                                    className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {mergeMutation.isPending ? '正在处理...' : `完成合并 (${selectedForMerge.size})`}
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Progress Stats */}
                {!isSelectionMode && (
                    <section className="px-4 grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white dark:bg-surface-dark p-3 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col items-center">
                            <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">未查验项</span>
                            <span className="text-2xl font-black text-orange-500">{pendingCount}</span>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-3 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col items-center">
                            <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">已查验项</span>
                            <span className="text-2xl font-black text-green-500">{doneCount} <small className="text-[10px] text-gray-400 font-normal">/ {totalCount}</small></span>
                        </div>
                    </section>
                )}

                {/* Active Check Area */}
                {activeShipment && !isSelectionMode ? (
                    <section className="px-4 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl border-t-4 border-primary p-5 relative overflow-hidden">
                            <div className="absolute right-[-20px] top-[-20px] opacity-10">
                                <span className="material-icons-round text-[120px]">scale</span>
                            </div>

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">正在核验 (Active)</span>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono break-all">{activeShipment.tracking_no}</h2>
                                </div>
                                <button
                                    onClick={() => setSplitTarget(activeShipment)}
                                    className="bg-red-500/10 text-red-600 p-2 rounded-xl flex items-center gap-1 hover:bg-red-500/20 transition-all active:scale-95"
                                >
                                    <span className="material-icons text-sm">call_split</span>
                                    <span className="text-[10px] font-black uppercase">拆分</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                                <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-xl">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">发出方录入</span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{(activeShipment.weight || 0).toFixed(2)} kg</span>
                                        <span className="text-[10px] text-gray-500 font-medium">{activeShipment.length}x{activeShipment.width}x{activeShipment.height} cm</span>
                                    </div>
                                </div>
                                <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                                    <span className="text-[10px] font-bold text-primary/60 uppercase mb-1 block">中转实测值</span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-primary">{measuredWeight || '0'} kg</span>
                                        <span className="text-[10px] text-primary/60 font-medium">{dimL || '0'}x{dimW || '0'}x{dimH || '0'} cm</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-dashed border-slate-200 dark:border-white/10 relative z-10">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">实际称重 (KG)</label>
                                    <input
                                        className="w-full bg-yellow-50 dark:bg-yellow-900/10 border-2 border-primary rounded-xl text-3xl font-black p-3 text-center focus:ring-4 focus:ring-primary/20 animation-pulse-blue outline-none"
                                        type="number"
                                        step="0.01"
                                        value={measuredWeight}
                                        onChange={(e) => setMeasuredWeight(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {['L', 'W', 'H'].map((dim, i) => (
                                        <div key={dim}>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{dim}</label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/20 border-b-2 border-slate-200 dark:border-slate-700 p-2 text-center font-bold outline-none focus:border-primary"
                                                type="number"
                                                value={[dimL, dimW, dimH][i]}
                                                onChange={(e) => [setDimL, setDimW, setDimH][i](e.target.value)}
                                                placeholder={dim}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                ) : !isSelectionMode ? (
                    <section className="px-4">
                        {doneCount === totalCount && totalCount > 0 && ['transit_processing', 'sealed', 'sender_sealed'].includes(batch.status) ? (
                            <div className="bg-emerald-500 rounded-2xl p-6 text-white shadow-xl shadow-emerald-500/20 text-center animate-in zoom-in duration-500">
                                <span className="material-icons-round text-5xl mb-2">fact_check</span>
                                <h3 className="text-xl font-black mb-1">所有包裹查验完毕</h3>
                                <p className="text-emerald-100 text-xs mb-6 px-4">查验数据已实时保存。请确认无误后点击下方按钮完成该批次的中转封存。</p>
                                <button
                                    onClick={() => {
                                        updateStatus.mutate({ id: batchId!, status: 'transit_sealed' });
                                        toast.success('批次已成功封存', { icon: '🔒' });
                                    }}
                                    disabled={updateStatus.isPending}
                                    className="w-full bg-white text-emerald-600 py-4 rounded-xl font-bold text-lg active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {updateStatus.isPending ? '正在封存...' : '立即封存批次'}
                                </button>
                            </div>
                        ) : batch.status === 'transit_sealed' || batch.status === 'inspected' ? (
                            <div className="bg-blue-500 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20 text-center">
                                <span className="material-icons-round text-5xl mb-2">task_alt</span>
                                <h3 className="text-xl font-black mb-1">批次已封存</h3>
                                <button onClick={() => navigate('/transit')} className="w-full bg-white text-blue-600 py-4 rounded-xl font-bold text-lg mt-4">回到中转首页</button>
                            </div>
                        ) : (
                            <div className="py-12 bg-white/30 dark:bg-white/5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center opacity-60">
                                <span className="material-icons-round text-5xl mb-3 text-slate-300">qr_code_2</span>
                                <p className="text-sm font-medium">请扫描单号开始查验数据</p>
                            </div>
                        )}
                    </section>
                ) : null}

                {/* List Summary */}
                <section className="p-4 mt-2">
                    <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-sm text-gray-400">list_alt</span>
                            本批次包裹清单
                        </div>
                        {isSelectionMode && <span className="text-[10px] text-amber-600 font-black animate-pulse">选择模式中...</span>}
                    </h3>
                    <div className="space-y-2">
                        {shipments.map(s => {
                            const isDone = processedShipmentIds.has(s.id);
                            const isActive = activeShipmentId === s.id;
                            const isSelected = selectedForMerge.has(s.id);

                            return (
                                <div
                                    key={s.id}
                                    onClick={() => {
                                        if (isSelectionMode && !isDone) {
                                            const newSet = new Set(selectedForMerge);
                                            if (newSet.has(s.id)) newSet.delete(s.id);
                                            else newSet.add(s.id);
                                            setSelectedForMerge(newSet);
                                        } else if (!isSelectionMode) {
                                            setActiveShipmentId(s.id);
                                        }
                                    }}
                                    className={`p-3 rounded-xl border transition-all flex items-center justify-between relative overflow-hidden active:scale-[0.98] ${isSelectionMode && isSelected ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20' :
                                        isActive ? 'border-primary ring-2 ring-primary/20 bg-primary/5' :
                                            isDone ? 'border-green-100 bg-green-50/30 dark:bg-green-900/5 opacity-60' :
                                                'border-slate-100 dark:border-white/5 bg-white dark:bg-surface-dark'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {isSelectionMode ? (
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-300'}`}>
                                                {isSelected && <span className="material-icons text-white text-[10px]">check</span>}
                                            </div>
                                        ) : (
                                            <span className={`material-icons-round text-sm ${isDone ? 'text-green-500' : 'text-gray-300'}`}>
                                                {isDone ? 'check_circle' : 'circle'}
                                            </span>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs font-bold">{s.tracking_no}</span>
                                            <div className="flex gap-2">
                                                <span className="text-[9px] text-gray-400">{s.length}x{s.width}x{s.height} cm</span>
                                                {s.package_tag === 'merge_parent' && <span className="text-[8px] font-black text-primary uppercase">Merged</span>}
                                                {s.package_tag === 'split_child' && <span className="text-[8px] font-black text-indigo-500 uppercase">Split</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 block">{(s.weight || 0).toFixed(2)}kg</span>
                                        {isDone && <span className="text-[8px] bg-green-500/10 text-green-500 px-1 rounded font-bold">已检</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

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

            {/* Bottom Finalize Button Placeholder */}
            {activeShipment && !isSelectionMode && (
                <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 p-4 pb-8 z-30 shadow-[0_-4px_15px_-1px_rgba(0,0,0,0.1)]">
                    <div className="flex gap-3 h-14">
                        <button onClick={() => setActiveShipmentId(null)} className="w-1/3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl font-bold active:scale-95 transition-transform">取消</button>
                        <button disabled={!measuredWeight || isLabelPrinting} onClick={handleConfirm} className="flex-1 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-3">
                            <span>{isLabelPrinting ? '正在打印...' : '完成核验'}</span>
                            <span className="material-icons-round">{isLabelPrinting ? 'hourglass_top' : 'check'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransitCheck;