import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBatchDetail, useUpdateBatchStatus } from '../../hooks/useBatches';
import { useShipments, useUpdateShipment } from '../../hooks/useShipments';
import { useCreateInspection } from '../../hooks/useInspections';
import { useBatchStore } from '../../store/batch.store';
import { toast } from 'react-hot-toast';

const ReceiverCheck: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeBatchId: storeBatchId } = useBatchStore();
  const batchId = searchParams.get('batchId') || storeBatchId;

  const { data: batch, isLoading: loadingBatch } = useBatchDetail(batchId || '');
  const { data: shipments, isLoading: loadingShipments } = useShipments(batchId || '');
  const updateStatus = useUpdateBatchStatus();
  const updateShipment = useUpdateShipment();
  const createInspection = useCreateInspection();

  const [scanValue, setScanValue] = useState('');
  const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);
  const [checkWeight, setCheckWeight] = useState<string>('');
  const [checkL, setCheckL] = useState<string>('');
  const [checkW, setCheckW] = useState<string>('');
  const [checkH, setCheckH] = useState<string>('');

  const [receivedCount, setReceivedCount] = useState(0);

  useEffect(() => {
    if (shipments) {
      setReceivedCount(shipments.filter(s => s.status === 'received').length);
    }
  }, [shipments]);

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

  const processScan = (trackingNo: string) => {
    const shipment = shipments?.find(s => s.tracking_no === trackingNo);
    if (!shipment) {
      toast.error('本批次中未找到该单号!');
      return;
    }

    setActiveShipmentId(shipment.id);
    setCheckWeight(shipment.weight?.toString() || '');
    setCheckL(shipment.length?.toString() || '');
    setCheckW(shipment.width?.toString() || '');
    setCheckH(shipment.height?.toString() || '');
    toast.success(`识别单号: ${trackingNo.slice(-6)}`);
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

      if (receivedCount < (shipments?.length || 0)) {
        if (!window.confirm('尚有包裹未收货，确定要强制完成整个批次吗？')) return;
      }

      // If progress is skipping, just jump to completed directly.
      // The state machine now accepts draft -> completed or in_transit -> completed.
      await updateStatus.mutateAsync({ id: batchId!, status: 'completed' });

      toast.success('批次查验完成！账单已生成。');
      navigate(`/finance/bill/completed?batchId=${batchId}`);
    } catch (e: any) {
      toast.error('完成批次失败: ' + e.message);
    }
  };

  if (loadingBatch || loadingShipments) return <div className="text-white p-8 bg-background-dark min-h-screen flex items-center justify-center italic">接收数据加载中...</div>;
  if (!batch || !batchId) return <div className="text-white p-8 bg-background-dark min-h-screen flex flex-col items-center justify-center gap-4">
    <span>未找到批次信息</span>
    <button onClick={() => navigate('/receiver')} className="bg-primary px-6 py-2 rounded-xl text-sm font-bold">返回首页</button>
  </div>;

  const totalCount = shipments?.length || 0;
  const progress = totalCount > 0 ? (receivedCount / totalCount) * 100 : 0;
  const activeShipment = shipments?.find(s => s.id === activeShipmentId);

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

        {/* Scan Input Area */}
        <div className="p-4">
          <form onSubmit={handleManualScan} className="relative">
            <input
              autoFocus
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              className="w-full h-16 pl-14 pr-12 rounded-2xl border-2 border-primary text-xl font-bold placeholder:text-gray-500 dark:text-white focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white dark:bg-surface-dark shadow-lg"
              placeholder="扫描接收单号..."
              type="text"
            />
            <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-primary text-3xl">qr_code_scanner</span>
          </form>
        </div>

        {/* Active Verification Card */}
        {activeShipment ? (
          <div className="px-4 animate-in slide-in-from-bottom-4 duration-300 mb-6">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl border-l-4 border-primary p-5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase block mb-1">正在查重数据</span>
                  <h2 className="text-xl font-black font-mono break-all">{activeShipment.tracking_no}</h2>
                </div>
                <button onClick={() => setActiveShipmentId(null)} className="text-gray-400 hover:text-gray-600">
                  <span className="material-icons-round">cancel</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-slate-50 dark:bg-black/20 rounded-xl">
                <div>
                  <span className="text-[10px] text-gray-500 block">原始数据 (Origin)</span>
                  <div className="font-bold text-sm">{(activeShipment.weight || 0).toFixed(2)}kg | {activeShipment.length}x{activeShipment.width}x{activeShipment.height}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-primary block">当前核对 (Checking)</span>
                  <div className="font-bold text-sm text-primary">{(parseFloat(checkWeight) || 0).toFixed(2)}kg | {checkL || '0'}x{checkW || '0'}x{checkH || '0'}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-widest">实际收货重量 (KG)</label>
                  <input
                    className="w-full bg-yellow-50 dark:bg-yellow-900/10 border-2 border-primary rounded-xl text-3xl font-black p-3 text-center focus:ring-4 focus:ring-primary/20 outline-none"
                    type="number"
                    step="0.01"
                    value={checkWeight}
                    onChange={(e) => setCheckWeight(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">长 (L)</label>
                    <input
                      className="w-full bg-slate-50 dark:bg-black/20 border-b-2 border-slate-200 dark:border-slate-700 p-2 text-center font-bold text-sm outline-none"
                      type="number"
                      value={checkL}
                      onChange={(e) => setCheckL(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">宽 (W)</label>
                    <input
                      className="w-full bg-slate-50 dark:bg-black/20 border-b-2 border-slate-200 dark:border-slate-700 p-2 text-center font-bold text-sm outline-none"
                      type="number"
                      value={checkW}
                      onChange={(e) => setCheckW(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">高 (H)</label>
                    <input
                      className="w-full bg-slate-50 dark:bg-black/20 border-b-2 border-slate-200 dark:border-slate-700 p-2 text-center font-bold text-sm outline-none"
                      type="number"
                      value={checkH}
                      onChange={(e) => setCheckH(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={handleItemConfirm}
                  className="w-full h-14 bg-primary text-white rounded-xl font-black text-lg shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-icons-round">check_circle</span>
                  确认单件接收
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 mb-4">
            <div className="py-10 bg-white/20 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center opacity-60">
              <span className="material-icons-round text-4xl text-slate-300 mb-2">move_to_inbox</span>
              <p className="text-sm">等待扫描运单以核实接收...</p>
            </div>
          </div>
        )}

        {/* Shipment List */}
        <div className="px-4 space-y-2 pb-10">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <span className="material-icons-round text-sm">view_list</span>
            批次包裹详情
          </h3>
          {shipments?.map((s) => {
            const isReceived = s.status === 'received';
            const isActive = activeShipmentId === s.id;

            return (
              <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl border shadow-sm transition-all ${isActive ? 'border-primary ring-2 ring-primary/10' :
                isReceived ? 'border-green-100 bg-green-50/20' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-surface-dark'
                }`}>
                <div className="flex items-center gap-3">
                  <span className={`material-icons-round text-lg ${isReceived ? 'text-green-500' : 'text-slate-300'}`}>
                    {isReceived ? 'check_circle' : 'circle'}
                  </span>
                  <div>
                    <div className={`font-mono font-bold text-xs ${isReceived ? 'text-slate-800 dark:text-white' : 'text-gray-400'}`}>
                      {s.tracking_no}
                    </div>
                    <div className="text-[10px] text-gray-500">{(s.weight || 0).toFixed(2)}kg | {s.length}x{s.width}x{s.height} cm</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isReceived ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                  {isReceived ? '已收' : '待处理'}
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
      </main >
    </div >
  );
};

export default ReceiverCheck;