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

const ReceiverCheck: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeBatchId: storeBatchId } = useBatchStore();
  const batchId = searchParams.get('batchId') || storeBatchId;

  const { data: batch, isLoading: loadingBatch } = useBatchDetail(batchId || '');
  const { data: rawShipments, isLoading: loadingShipments } = useShipments(batchId || '');
  const { data: inspections, isLoading: loadingInspections } = useInspections(batchId || '');

  const updateStatus = useUpdateBatchStatus();
  const updateShipment = useUpdateShipment();
  const createInspection = useCreateInspection();
  const mergeMutation = useMergeShipments();
  const splitMutation = useSplitShipment();

  // Shipments are pre-filtered to exclude invalid items
  const shipments = useMemo(() =>
    (rawShipments || []).filter(s => !['merged_child', 'split_parent'].includes(s.package_tag || '')),
    [rawShipments]);

  const [scanValue, setScanValue] = useState('');
  const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);
  const [checkWeight, setCheckWeight] = useState<string>('');
  const [checkL, setCheckL] = useState<string>('');
  const [checkW, setCheckW] = useState<string>('');
  const [checkH, setCheckH] = useState<string>('');

  // Workflow Actions State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [splitTarget, setSplitTarget] = useState<any | null>(null);

  const processedShipmentIds = useMemo(() => new Set(inspections?.filter(i => i.notes?.includes('ReceiverItemCheck')).map(i => {
    return i.notes?.includes('ShipmentID:') ? i.notes.split('ShipmentID:')[1].split(' ')[0] : null;
  }).filter(Boolean)), [inspections]);

  const receivedCount = useMemo(() =>
    shipments.filter(s => processedShipmentIds.has(s.id)).length,
    [shipments, processedShipmentIds]);

  const handleMergeConfirm = async (data: { tracking_no: string, total_weight: number }) => {
    try {
      await mergeMutation.mutateAsync({
        parent_tracking_no: data.tracking_no,
        child_ids: Array.from(selectedForMerge),
        batch_id: batchId!,
        total_weight: data.total_weight,
        role: 'receiver'
      });
      if (batch?.status === 'transit_sealed' || batch?.status === 'inspected' || batch?.status === 'in_transit') {
        await updateStatus.mutateAsync({ id: batchId!, status: 'receiver_processing' });
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
        role: 'receiver'
      });
      if (batch?.status === 'transit_sealed' || batch?.status === 'inspected' || batch?.status === 'in_transit') {
        await updateStatus.mutateAsync({ id: batchId!, status: 'receiver_processing' });
      }

      setSplitTarget(null);
      setActiveShipmentId(null);
      toast.success('拆分成功');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Handle PDA Broadcast Scan
  useEffect(() => {
    const handleScanEvent = (e: any) => {
      const code = e.detail;
      if (code) {
        processScan(code);
      }
    };
    window.addEventListener('pda-scan', handleScanEvent);
    return () => window.removeEventListener('pda-scan', handleScanEvent);
  }, [shipments]);

  const processScan = async (trackingNoInput: string) => {
    const trackingNo = trackingNoInput.trim().toUpperCase();
    // 1. Check local valid list first
    const shipment = shipments.find(s => s.tracking_no?.trim().toUpperCase() === trackingNo);

    if (shipment) {
      const isDone = processedShipmentIds.has(shipment.id);

      if (isSelectionMode) {
        if (isDone) {
          toast.error(`单号 ${trackingNo.slice(-6)} 已查验，不可重复合并`);
          return;
        }
        const newSet = new Set(selectedForMerge);
        if (newSet.has(shipment.id)) newSet.delete(shipment.id);
        else newSet.add(shipment.id);
        setSelectedForMerge(newSet);
        toast.success(`已选: ${trackingNo.slice(-6)}`);
        return;
      }

      if (isDone) {
        toast.success(`单号 ${trackingNo.slice(-6)}: 已核对完成`, { icon: '✅' });
        return;
      }

      setActiveShipmentId(shipment.id);
      setCheckWeight(shipment.weight?.toString() || '');
      setCheckL(shipment.length?.toString() || '');
      setCheckW(shipment.width?.toString() || '');
      setCheckH(shipment.height?.toString() || '');
      toast.success(`识别单号: ${trackingNo.slice(-6)}`, { icon: '⚖️' });
      return;
    }

    // 2. API Fallback for invalid/hidden items
    try {
      toast.loading('查询中...', { id: 'lookup' });
      const { ShipmentService } = await import('../../services/shipment.service');
      const { data: remote } = await ShipmentService.findByTracking(trackingNo);
      toast.dismiss('lookup');

      if (remote) {
        if (remote.package_tag === 'merged_child' || remote.parent_id) {
          toast.error(`此包裹已并入合包！不可单独核销。\n请扫描父单号。`, { duration: 4000, icon: '🔗' });
          return;
        }
        if (remote.package_tag === 'split_parent') {
          toast.error(`此包裹已拆分！不可核销。\n请扫描拆出的子单号。`, { duration: 4000, icon: '✂️' });
          return;
        }
        if (remote.batch_id !== batchId) {
          toast.error(`非本批次包裹！`, { duration: 3000 });
          return;
        }
      }
      toast.error('本批次中未找到该单号!');
    } catch (e) {
      toast.dismiss('lookup');
      toast.error('查询异常');
    }
  };

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanValue) {
      processScan(scanValue);
      setScanValue('');
    }
  };

  const handleItemConfirm = async () => {
    if (!activeShipmentId) return;
    const shipment = shipments?.find(s => s.id === activeShipmentId);
    if (!shipment) return;

    try {
      // 1. Update shipment status to received
      await updateShipment.mutateAsync({
        id: activeShipmentId,
        updates: {
          status: 'received',
          receiver_at: new Date().toISOString()
        } as any
      });

      // 2. Record individual check inspection
      await createInspection.mutateAsync({
        batch_id: batchId!,
        result: 'passed',
        check_weight: parseFloat(checkWeight) || 0,
        check_length: parseFloat(checkL) || 0,
        check_width: parseFloat(checkW) || 0,
        check_height: parseFloat(checkH) || 0,
        notes: `ReceiverItemCheck ShipmentID:${shipment.id} Tracking:${shipment.tracking_no} Weigh:${checkWeight}kg Dim:${checkL}x${checkW}x${checkH}`,
        photos: []
      });

      if (batch?.status === 'transit_sealed' || batch?.status === 'inspected' || batch?.status === 'in_transit') {
        await updateStatus.mutateAsync({ id: batchId!, status: 'receiver_processing' });
      }

      setActiveShipmentId(null);
      setCheckWeight('');
      toast.success('单件收货核验成功');
    } catch (e: any) {
      toast.error('收货失败: ' + e.message);
    }
  };

  const handleFinalizeBatch = async () => {
    try {
      if (!batch) return;

      if (receivedCount < (shipments.length || 0)) {
        if (!window.confirm('尚有包裹未收货，确定要强制完成整个批次吗？')) return;
      }

      // If progress is skipping, just jump to completed directly.
      await updateStatus.mutateAsync({ id: batchId!, status: 'completed' });

      toast.success('批次查验完成！账单已生成。');
      navigate(`/finance/bill/completed?batchId=${batchId}`);
    } catch (e: any) {
      toast.error('完成批次失败: ' + e.message);
    }
  };

  if (loadingBatch || loadingShipments || loadingInspections) return <div className="text-white p-8 bg-background-dark min-h-screen flex items-center justify-center italic">接收数据加载中...</div>;
  if (!batch || !batchId) return <div className="text-white p-8 bg-background-dark min-h-screen flex flex-col items-center justify-center gap-4">
    <span>未找到批次信息</span>
    <button onClick={() => navigate('/receiver')} className="bg-primary px-6 py-2 rounded-xl text-sm font-bold">返回首页</button>
  </div>;

  const totalCount = shipments.length || 0;
  const progress = totalCount > 0 ? (receivedCount / totalCount) * 100 : 0;
  const activeShipment = shipments.find(s => s.id === activeShipmentId);

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-white font-display min-h-screen flex flex-col overflow-hidden antialiased">
      <header className="px-4 py-3 flex items-center justify-between bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-white/5 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold leading-tight">到达接收核验</h1>
          <span className="text-[10px] text-gray-400 font-mono block">{batch.batch_no}</span>
        </div>
        <div className="w-10 text-right">
          <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 text-[9px] font-bold uppercase border border-green-500/20">{batch.status}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative pb-32">
        {/* Progress Stats Area */}
        <div className="p-4 bg-white dark:bg-surface-dark border-b border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">收货进度</span>
              <span className="text-2xl font-black text-primary">{receivedCount}<small className="text-gray-400 font-normal"> / {totalCount}</small></span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-slate-400">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Scan Input Area & Operations */}
        <div className="p-4 space-y-3">
          <form onSubmit={handleManualScan} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className={`material-icons-round text-2xl animate-pulse ${isSelectionMode ? 'text-amber-500' : 'text-primary'}`}>
                {isSelectionMode ? 'playlist_add_check' : 'qr_code_scanner'}
              </span>
            </div>
            <input
              autoFocus
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              className={`w-full h-16 pl-14 pr-16 rounded-2xl border-2 text-xl font-bold placeholder:text-gray-500 dark:text-white focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white dark:bg-surface-dark shadow-lg
                ${isSelectionMode ? 'border-amber-500' : 'border-primary'}`}
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
        </div>

        {/* Active Verification Card */}
        {activeShipment && !isSelectionMode ? (
          <div className="px-4 animate-in slide-in-from-bottom-4 duration-300 mb-6">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl border-l-4 border-primary p-5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase block mb-1">正在核对数据 (Active)</span>
                  <h2 className="text-xl font-black font-mono break-all">{activeShipment.tracking_no}</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSplitTarget(activeShipment)}
                    className="bg-red-500/10 text-red-600 p-2 rounded-xl flex items-center gap-1 hover:bg-red-500/20 transition-all active:scale-95"
                  >
                    <span className="material-icons text-sm">call_split</span>
                    <span className="text-[10px] font-black uppercase tracking-tight">拆分</span>
                  </button>
                  <button onClick={() => setActiveShipmentId(null)} className="text-gray-400 hover:text-gray-600 p-2">
                    <span className="material-icons-round">cancel</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-slate-50 dark:bg-black/20 rounded-xl">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-widest mb-1">原始数据 (Origin)</span>
                  {(() => {
                    const transitInfo = inspections?.find(i =>
                      i.notes?.includes('WeighCheck') &&
                      i.notes?.includes(`ShipmentID:${activeShipment.id}`)
                    );

                    if (transitInfo) {
                      return (
                        <div className="font-bold text-sm text-amber-600">
                          {(transitInfo.transit_weight || 0).toFixed(2)}kg | {transitInfo.transit_length || 0}x{transitInfo.transit_width || 0}x{transitInfo.transit_height || 0}
                          <span className="text-[8px] opacity-60 ml-1 font-normal">(中转)</span>
                        </div>
                      );
                    }

                    return (
                      <div className="font-bold text-sm">
                        {(activeShipment.weight || 0).toFixed(2)}kg | {activeShipment.length}x{activeShipment.width}x{activeShipment.height}
                      </div>
                    );
                  })()}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-primary block uppercase font-bold tracking-widest mb-1">实收核对 (Checking)</span>
                  <div className="font-bold text-sm text-primary">{(parseFloat(checkWeight) || 0).toFixed(2)}kg | {checkL || '0'}x{checkW || '0'}x{checkH || '0'}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-widest">实际收货重量 (KG)</label>
                  <input
                    className="w-full bg-yellow-50 dark:bg-yellow-900/10 border-2 border-primary rounded-xl text-3xl font-black p-3 text-center animate-pulse-blue outline-none"
                    type="number"
                    step="0.01"
                    value={checkWeight}
                    onChange={(e) => setCheckWeight(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['L', 'W', 'H'].map((dim, i) => (
                    <div key={dim}>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{dim}</label>
                      <input
                        className="w-full bg-slate-50 dark:bg-black/20 border-b-2 border-slate-200 dark:border-slate-700 p-2 text-center font-bold text-sm outline-none focus:border-primary transition-colors"
                        type="number"
                        value={[checkL, checkW, checkH][i]}
                        onChange={(e) => [setCheckL, setCheckW, setCheckH][i](e.target.value)}
                        placeholder={dim}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleItemConfirm}
                  disabled={!checkWeight}
                  className="w-full h-14 bg-primary text-white rounded-xl font-black text-lg shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-icons-round">check_circle</span>
                  确认单件接收
                </button>
              </div>
            </div>
          </div>
        ) : !isSelectionMode ? (
          <div className="px-4 mb-4">
            <div className="py-10 bg-white/20 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center opacity-60">
              <span className="material-icons-round text-4xl text-slate-300 mb-2">move_to_inbox</span>
              <p className="text-sm">等待扫描运单以核实接收...</p>
            </div>
          </div>
        ) : null}

        {/* Shipment List */}
        <div className="px-4 space-y-2 pb-10">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-sm">view_list</span>
              批次包裹详情
            </div>
            {isSelectionMode && <span className="text-[10px] text-amber-600 font-black animate-pulse">选择模式中...</span>}
          </h3>
          {shipments.map((s) => {
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
                className={`flex items-center justify-between p-3 rounded-xl border shadow-sm transition-all active:scale-[0.98] ${isSelectionMode && isSelected ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20' :
                  isActive ? 'border-primary ring-2 ring-primary/10' :
                    isDone ? 'border-green-100 bg-green-50/20 opacity-60' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-surface-dark'
                  }`}
              >
                <div className="flex items-center gap-3">
                  {isSelectionMode ? (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-300'}`}>
                      {isSelected && <span className="material-icons text-white text-[10px]">check</span>}
                    </div>
                  ) : (
                    <span className={`material-icons-round text-sm ${isDone ? 'text-green-500' : 'text-slate-300'}`}>
                      {isDone ? 'check_circle' : 'circle'}
                    </span>
                  )}
                  <div>
                    <div className={`font-mono font-bold text-xs ${isDone ? 'text-slate-800 dark:text-white' : 'text-gray-400'}`}>
                      {s.tracking_no}
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] text-gray-500">{(s.weight || 0).toFixed(2)}kg | {s.length}x{s.width}x{s.height} cm</span>
                      {s.package_tag === 'merge_parent' && <span className="text-[8px] font-black text-primary uppercase">Merged</span>}
                      {s.package_tag === 'split_child' && <span className="text-[8px] font-black text-indigo-500 uppercase">Split</span>}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDone ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                  {isDone ? '已核' : '待处理'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Global Action Button */}
        <div className="p-4 fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-area-pb z-30">
          <button
            onClick={handleFinalizeBatch}
            disabled={receivedCount === 0}
            className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all disabled:opacity-30"
          >
            <span className="material-icons-round">publish</span>
            完成批次核验并结费
          </button>
        </div>
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
    </div>
  );
};

export default ReceiverCheck;
