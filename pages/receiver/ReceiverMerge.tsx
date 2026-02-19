import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBatchStore } from '../../store/batch.store';
import { useShipmentByNo, useMergeShipments } from '../../hooks/useShipments';
import { toast } from 'react-hot-toast';
import { Shipment, ShipmentService } from '../../services/shipment.service';
import { CameraScanButton } from '../../components/CameraScanner';

const ReceiverMerge: React.FC = () => {
  const navigate = useNavigate();
  const { activeBatchId } = useBatchStore();

  const [scanInput, setScanInput] = useState('');
  const [scannedShipments, setScannedShipments] = useState<Shipment[]>([]);
  const [newTrackingNo, setNewTrackingNo] = useState('');
  const [showGenModal, setShowGenModal] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [autoGen, setAutoGen] = useState(true);

  const mergeMutation = useMergeShipments();

  // Handle Scan Submit
  const handleScan = async (e?: React.FormEvent, code?: string) => {
    if (e) e.preventDefault();
    const trackingNo = (code || scanInput).trim().toUpperCase();
    if (!trackingNo) return;

    if (scannedShipments.some(s => s.tracking_no.toUpperCase() === trackingNo)) {
      toast.error('Parcel already in list');
      setScanInput('');
      return;
    }

    try {
      const response = await ShipmentService.findByTracking(trackingNo);
      if (!response.success) {
        toast.error('Shipment not found: ' + trackingNo);
      } else {
        const shipment = response.data!;
        if (activeBatchId && shipment.batch_id !== activeBatchId) {
          if (!window.confirm('This shipment belongs to another batch. Add anyway?')) {
            setScanInput('');
            return;
          }
        }
        setScannedShipments(prev => [shipment, ...prev]);
        toast.success('Parcel Added');
      }
    } catch (err) {
      toast.error('Scanning error');
    }
    setScanInput('');
  };

  const handleRemove = (id: string) => {
    setScannedShipments(prev => prev.filter(s => s.id !== id));
  };

  const handleMerge = async () => {
    if (scannedShipments.length < 2) {
      toast.error('Need at least 2 parcels to merge');
      return;
    }

    if (!activeBatchId) {
      toast.error('No active batch selected');
      return;
    }

    let parentNo = newTrackingNo;
    if (autoGen || !parentNo) {
      parentNo = 'RM-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    const totalWeight = scannedShipments.reduce((sum, s) => sum + (Number(s.weight) || 0), 0);

    try {
      await mergeMutation.mutateAsync({
        parent_tracking_no: parentNo,
        child_ids: scannedShipments.map(s => s.id),
        batch_id: activeBatchId,
        total_weight: totalWeight
      });
      setScannedShipments([]);
      setShowGenModal(false);
      setNewTrackingNo('');
      toast.success('Merge Successful');
    } catch (err) {
      // Error handled in hook
    }
  };

  const totalWeight = scannedShipments.reduce((sum, s) => sum + (Number(s.weight) || 0), 0);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-800 dark:text-white font-display overflow-hidden flex flex-col relative">
      <header className="bg-white dark:bg-surface-dark px-4 py-3 flex items-center justify-between shadow-sm z-20 shrink-0 border-b border-gray-100 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300">
          <span className="material-icons">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">接收方：合并货物 (Merge)</h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 relative">
          <span className="material-icons">history</span>
        </button>
      </header>

      <div className="p-4 bg-white dark:bg-surface-dark border-b border-slate-100 dark:border-white/5 shrink-0 z-10">
        <form onSubmit={handleScan} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-icons text-primary text-2xl">qr_code_scanner</span>
          </div>
          <input
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            className="block w-full pl-12 pr-16 py-4 bg-[#f8faff] dark:bg-slate-900 border-2 border-primary focus:border-primary focus:ring-0 rounded-2xl text-lg font-medium placeholder-slate-400 dark:text-white transition-all shadow-sm"
            placeholder="请扫描单号进行合并..."
            type="text"
            autoFocus
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <CameraScanButton onScan={(code) => handleScan(undefined, code)} size="md" />
          </div>
        </form>
        <div className="mt-4 flex gap-3">
          <div className="flex-1 bg-blue-50 dark:bg-primary/10 rounded-2xl p-4 border border-blue-100 dark:border-primary/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">已扫数量</p>
              <p className="text-3xl font-bold text-primary mt-0.5">{scannedShipments.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-icons text-xl">inventory_2</span>
            </div>
          </div>
          <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between relative overflow-hidden group">
            <div className="z-10 w-full pr-12">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">总重量 (kg)</p>
              <p className="text-3xl font-bold text-slate-700 dark:text-white mt-0.5">{totalWeight.toFixed(2)}</p>
            </div>
            <div className="absolute right-4 top-4 bottom-4 flex flex-col justify-center">
              <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <span className="material-icons-round text-xl">scale</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative p-4 pb-48">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-base font-bold text-slate-600 dark:text-slate-400">已扫描货物清单</h2>
          <button className="text-sm font-medium text-primary hover:underline" onClick={() => setShowSelectModal(true)}>选择列表</button>
        </div>
        <div className="space-y-4">
          {scannedShipments.map(shipment => (
            <div key={shipment.id} className="bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                <span className="material-icons text-primary text-2xl">local_shipping</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-lg font-bold text-slate-800 dark:text-white font-mono truncate">{shipment.tracking_no}</p>
                  <span className="text-xs font-medium px-2 py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{shipment.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{shipment.weight} kg</span>
                  {shipment.volume && (
                    <>
                      <span className="text-xs text-slate-300 dark:text-slate-600">|</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{shipment.volume} m³</span>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => handleRemove(shipment.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <span className="material-icons">delete_outline</span>
              </button>
            </div>
          ))}
          {scannedShipments.length === 0 && (
            <div className="py-12 text-center">
              <span className="material-icons text-slate-200 dark:text-slate-700 text-6xl block mb-2">qr_code_2</span>
              <p className="text-sm text-slate-400 dark:text-slate-500">等待扫描货物...</p>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-slate-800 p-6 z-30 shadow-2xl safe-area-pb">
        <button
          disabled={scannedShipments.length < 2 || mergeMutation.isPending}
          onClick={() => setShowGenModal(true)}
          className="w-full bg-primary hover:bg-primary-dark active:bg-primary/90 text-white font-bold text-xl py-4.5 rounded-2xl shadow-xl shadow-primary/25 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] disabled:opacity-50"
        >
          <span className="material-icons">segment</span>
          {mergeMutation.isPending ? '正在处理...' : '合并并打印'}
        </button>
      </div>

      {/* Generate Order Modal */}
      {showGenModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl transform transition-all animate-scale">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white text-center mb-6">生成合并单号</h3>
            <div className="mb-5 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-icons text-slate-400 text-xl">edit_note</span>
              </div>
              <input
                disabled={autoGen}
                value={newTrackingNo}
                onChange={(e) => setNewTrackingNo(e.target.value)}
                autoFocus
                className="block w-full pl-11 pr-12 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-0 rounded-2xl text-base font-medium placeholder-slate-400 dark:text-white transition-all disabled:opacity-50"
                placeholder="输入合并单号..."
                type="text"
              />
            </div>
            <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <label className="flex items-center justify-between w-full cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                    <span className="material-icons-round text-xl">autorenew</span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">自动生成单号</span>
                    <span className="block text-xs text-slate-400 mt-0.5">RM-XXXXXX</span>
                  </div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only peer" type="checkbox" checked={autoGen} onChange={() => setAutoGen(!autoGen)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </div>
              </label>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleMerge}
                className="w-full bg-primary hover:bg-primary-dark active:bg-primary/90 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center transition-all transform active:scale-[0.98]"
              >
                确认合并
              </button>
              <button onClick={() => setShowGenModal(false)} className="w-full bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-lg py-4 rounded-2xl flex items-center justify-center transition-colors">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiverMerge;