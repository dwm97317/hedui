import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBatchDetail, useUpdateBatchStatus } from '../../hooks/useBatches';
import { useShipments, useUpdateShipment } from '../../hooks/useShipments';
import { useCreateInspection } from '../../hooks/useInspections';
import { toast } from 'react-hot-toast';

const ReceiverCheck: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batchId');

  const { data: batch, isLoading: loadingBatch } = useBatchDetail(batchId || '');
  const { data: shipments, isLoading: loadingShipments } = useShipments(batchId || '');
  const updateStatus = useUpdateBatchStatus();
  const updateShipment = useUpdateShipment();
  const createInspection = useCreateInspection();

  const [scanValue, setScanValue] = useState('');
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
        handleScan(undefined, code);
      }
    };
    window.addEventListener('pda-scan', handleScanEvent);
    return () => window.removeEventListener('pda-scan', handleScanEvent);
  }, [shipments]);

  if (loadingBatch || loadingShipments) return <div className="text-white p-8">Loading for arrival...</div>;
  if (!batch || !batchId) return <div className="text-white p-8">Batch Not Found</div>;

  const handleScan = async (e?: React.FormEvent, code?: string) => {
    if (e) e.preventDefault();
    const trackingNo = code || scanValue;
    if (!trackingNo) return;

    const shipment = shipments?.find(s => s.tracking_no === trackingNo);
    if (!shipment) {
      toast.error('Shipment not found in this batch!');
      setScanValue('');
      return;
    }

    if (shipment.status === 'received') {
      toast('Item already received', { icon: 'ℹ️' });
    } else {
      await updateShipment.mutateAsync({
        id: shipment.id,
        updates: { status: 'received' }
      });
      toast.success(`Received: ${trackingNo}`);
    }
    setScanValue('');
  };

  const handleFinish = async () => {
    try {
      if (receivedCount < (shipments?.length || 0)) {
        if (!window.confirm('Some items are still pending. Close batch anyway?')) return;
      }

      // Logic: Transition to 'received' first, then 'completed' to trigger bill
      // or jump directly if business allows. The state machine allows received -> completed.
      const currentCheckWeight = shipments?.filter(s => s.status === 'received').reduce((acc, s) => acc + (s.weight || 0), 0) || 0;

      await createInspection.mutateAsync({
        batch_id: batchId,
        result: 'passed',
        check_weight: currentCheckWeight,
        notes: `Receiver Weight Check: ${currentCheckWeight}kg`,
        photos: []
      });

      if (batch.status !== 'received') {
        await updateStatus.mutateAsync({ id: batchId, status: 'received' });
      }

      await updateStatus.mutateAsync({ id: batchId, status: 'completed' });

      toast.success('Batch Completed! Bill Generated.');
      // Special redirection to bill detail
      navigate(`/finance/bill/completed?batchId=${batchId}`);
    } catch (e: any) {
      toast.error('Failed to complete: ' + e.message);
    }
  };

  const totalCount = shipments?.length || 0;
  const progress = totalCount > 0 ? (receivedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-white font-display min-h-screen flex flex-col overflow-hidden antialiased">
      <header className="px-4 py-3 flex items-center justify-between bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-white/5 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10">
          <span className="material-icons">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">接收查验 (Receiver Check)</h1>
        <div className="w-10 text-right">
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase">{batch.status}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="bg-gradient-to-r px-4 py-3 border-b from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-icons text-primary text-xl">inventory_2</span>
              <div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">批次号 (Batch No)</div>
                <div className="text-lg font-bold text-gray-800 dark:text-white font-mono tracking-tight leading-none mt-0.5">{batch.batch_no}</div>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-black/40 px-2 py-1 rounded text-xs font-medium text-primary border border-white/50 dark:border-white/10">
              共 {totalCount} 件
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-4 shadow-sm z-10">
          <form onSubmit={handleScan} className="relative mb-4">
            <input
              autoFocus
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              className="w-full h-16 pl-14 pr-12 rounded-xl border-2 border-primary text-xl font-bold placeholder:text-gray-400 dark:text-white focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-green-50/50 dark:bg-green-900/10"
              placeholder="正扫描运单号..."
              type="text"
            />
            <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-primary text-3xl">qr_code_scanner</span>
            <button
              id="scan-submit-btn"
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md active:scale-95"
            >
              <span className="material-icons text-lg">search</span>
            </button>
          </form>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2 mb-1">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
            <span>Progress</span>
            <span>{receivedCount} / {totalCount} ({Math.round(progress)}%)</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white dark:bg-black/20 p-2 pb-24 space-y-2">
          {shipments?.map((s) => (
            <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg border shadow-sm relative overflow-hidden ${s.status === 'received' ? 'border-success/20 bg-green-50/10' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-surface-dark'
              }`}>
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.status === 'received' ? 'bg-success' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s.status === 'received' ? 'bg-green-100 dark:bg-green-900/30 text-success' : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                  }`}>
                  <span className="material-icons text-lg">{s.status === 'received' ? 'check_circle' : 'pending_actions'}</span>
                </div>
                <div>
                  <div className={`font-mono font-bold text-base ${s.status === 'received' ? 'text-slate-800 dark:text-white' : 'text-gray-400'}`}>
                    {s.tracking_no}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Weight: {s.weight}kg</div>
                </div>
              </div>
              <div className={`text-xs font-bold px-2 py-1 rounded ${s.status === 'received' ? 'text-success bg-green-50 dark:bg-green-900/20' : 'text-gray-400 bg-gray-50 dark:bg-white/5'
                }`}>
                {s.status === 'received' ? '已收' : '待收'}
              </div>
            </div>
          ))}

          {shipments?.length === 0 && <div className="text-center py-10 text-gray-500">No items in this batch.</div>}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-white/5 p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <button
            onClick={handleFinish}
            disabled={updateStatus.isPending}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold h-14 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {updateStatus.isPending ? 'Processing...' : (
              <>
                <span className="material-icons">done_all</span>
                完成查验并生成账单 (Complete & Bill)
              </>
            )}
          </button>
        </div>
      </main >
    </div >
  );
};

export default ReceiverCheck;