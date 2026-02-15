import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBatchStore } from '../../store/batch.store';
import { useSplitShipment } from '../../hooks/useShipments';
import { toast } from 'react-hot-toast';
import { Shipment, ShipmentService } from '../../services/shipment.service';

const ReceiverSplit: React.FC = () => {
  const navigate = useNavigate();
  const { activeBatchId } = useBatchStore();

  const [parentInput, setParentInput] = useState('');
  const [parentShipment, setParentShipment] = useState<Shipment | null>(null);
  const [splitCount, setSplitCount] = useState(2);
  const [childData, setChildData] = useState<Array<{ tracking_no: string; weight: number; volume?: number }>>([]);

  const splitMutation = useSplitShipment();

  // Initialize/Update child data when splitCount or parent changes
  useEffect(() => {
    const parentWeight = Number(parentShipment?.weight) || 0;
    const avgWeight = parentWeight / splitCount;

    const newChildren = Array.from({ length: splitCount }, (_, i) => {
      const existing = childData[i];
      return {
        tracking_no: existing?.tracking_no || `RS-${parentShipment?.tracking_no || 'P'}-${i + 1}`,
        weight: Number(avgWeight.toFixed(2)),
        volume: parentShipment?.volume ? Number((parentShipment.volume / splitCount).toFixed(4)) : undefined
      };
    });
    setChildData(newChildren);
  }, [splitCount, parentShipment]);

  const handleParentScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!parentInput) return;

    try {
      const response = await ShipmentService.findByTracking(parentInput);
      if (response.success) {
        setParentShipment(response.data);
        toast.success('Parent Parcel Scanned');
      } else {
        toast.error('Shipment not found');
      }
    } catch (err) {
      toast.error('Scan error');
    }
    setParentInput('');
  };

  const handleChildWeightChange = (index: number, val: string) => {
    const newVal = Number(val);
    const updated = [...childData];
    updated[index].weight = newVal;
    setChildData(updated);
  };

  const increment = () => setSplitCount(prev => prev + 1);
  const decrement = () => setSplitCount(prev => Math.max(2, prev - 1));

  const totalChildWeight = childData.reduce((sum, c) => sum + (c.weight || 0), 0);
  const parentWeight = Number(parentShipment?.weight) || 0;
  const weightDiff = Number((parentWeight - totalChildWeight).toFixed(2));

  const handleSplit = async () => {
    if (!parentShipment) {
      toast.error('Please scan a parent parcel first');
      return;
    }

    if (Math.abs(weightDiff) > 0.01) {
      if (!window.confirm(`Weight mismatch! Total children: ${totalChildWeight}kg, Parent: ${parentWeight}kg. Proceed?`)) {
        return;
      }
    }

    if (!activeBatchId) {
      toast.error('No active batch selected');
      return;
    }

    try {
      await splitMutation.mutateAsync({
        parent_id: parentShipment.id,
        children: childData,
        batch_id: activeBatchId,
        role: 'receiver'
      });
      setParentShipment(null);
      setChildData([]);
      setSplitCount(2);
    } catch (err) {
      // Error handled in hook
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-display antialiased h-screen flex flex-col overflow-hidden relative">
      <header className="flex-none bg-white dark:bg-surface-dark px-4 pt-4 pb-4 shadow-sm z-10 sticky top-0 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
            <span className="material-icons-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">接收方：货物拆分 (Split)</h1>
          <button className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
            <span className="material-icons-outlined text-2xl">help_outline</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-4 pb-32">
        {/* Parent Scan Input */}
        <div className="mb-6">
          <form onSubmit={handleParentScan} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-icons text-primary text-2xl">qr_code_scanner</span>
            </div>
            <input
              autoFocus
              value={parentInput}
              onChange={(e) => setParentInput(e.target.value)}
              className="block w-full pl-12 pr-12 py-4 bg-white dark:bg-surface-dark border-2 border-primary focus:border-primary focus:ring-0 rounded-2xl text-lg font-medium placeholder-slate-400 dark:text-white transition-all shadow-sm"
              placeholder="扫描母单号进行拆分..."
              type="text"
            />
          </form>
        </div>

        {/* Parent Parcel Info */}
        {parentShipment && (
          <div className="relative z-10 mb-2">
            <div className="bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">母单号 (PARENT ID)</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{parentShipment.tracking_no}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    {parentShipment.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-background-light dark:bg-black/20 p-3 rounded-lg">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">总重量</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{parentShipment.weight} kg</div>
                </div>
                <div className="bg-background-light dark:bg-black/20 p-3 rounded-lg">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">体积</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{parentShipment.volume || 0} m³</div>
                </div>
              </div>
            </div>
            <div className="absolute left-1/2 -ml-[1px] -bottom-8 w-[1px] h-8 bg-slate-300 dark:bg-slate-600"></div>
          </div>
        )}

        {/* Split Controls */}
        {parentShipment && (
          <>
            <div className="mt-8 mb-6 flex flex-col items-center">
              <div className="bg-white dark:bg-surface-dark rounded-full shadow-sm border border-slate-200 dark:border-white/5 px-1 py-1 flex items-center gap-2 mb-6 z-10 min-w-[240px] justify-between">
                <button onClick={decrement} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-primary transition-colors">
                  <span className="material-icons-outlined text-lg">remove</span>
                </button>
                <div className="flex flex-col items-center px-4">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase">拆分数量</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{splitCount}</span>
                </div>
                <button onClick={increment} className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white hover:bg-primary/90 shadow-md transition-colors">
                  <span className="material-icons-outlined text-lg">add</span>
                </button>
              </div>

              <div className="w-full relative">
                <div className="absolute left-1/2 -ml-[1px] -top-6 h-6 w-[1px] bg-slate-300 dark:bg-slate-600"></div>
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-3/4 h-[1px] bg-slate-300 dark:bg-slate-600"></div>
                <div className="grid grid-cols-1 gap-6 pt-6">
                  {childData.map((child, i) => (
                    <div key={i} className="relative">
                      <div className="absolute left-1/2 -ml-[1px] -top-6 h-6 w-[1px] bg-slate-300 dark:bg-slate-600"></div>
                      <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-200 dark:border-white/5">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{i + 1}</div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">子单-{i + 1}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{child.tracking_no}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">重量 (kg)</label>
                            <div className="relative">
                              <input
                                className="w-full bg-slate-50 dark:bg-black/20 border-transparent rounded-lg text-sm font-semibold text-slate-900 dark:text-white py-2.5 px-3 pr-8 focus:ring-1 focus:ring-primary"
                                value={child.weight}
                                onChange={(e) => handleChildWeightChange(i, e.target.value)}
                                type="number"
                              />
                              <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">kg</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">体积 (m³)</label>
                            <div className="relative">
                              <input
                                className="w-full bg-slate-50 dark:bg-black/20 border-transparent rounded-lg text-sm font-semibold text-slate-900 dark:text-white py-2.5 px-3 focus:ring-1 focus:ring-primary"
                                value={child.volume || ''}
                                onChange={(e) => {
                                  const updated = [...childData];
                                  updated[i].volume = Number(e.target.value);
                                  setChildData(updated);
                                }}
                                type="number"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`mt-6 rounded-lg p-4 border transition-colors ${Math.abs(weightDiff) < 0.01 ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-900/30' : 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30'}`}>
              <div className="flex items-start gap-3">
                <span className={`material-icons-outlined text-xl mt-0.5 ${Math.abs(weightDiff) < 0.01 ? 'text-green-600' : 'text-primary'}`}>{Math.abs(weightDiff) < 0.01 ? 'check_circle' : 'info'}</span>
                <div>
                  <h4 className={`text-sm font-bold mb-1 ${Math.abs(weightDiff) < 0.01 ? 'text-green-600' : 'text-primary'}`}>
                    {Math.abs(weightDiff) < 0.01 ? '重量均衡' : '拆分提示'}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    当前已拆分总重: <span className="font-bold text-slate-800 dark:text-white">{totalChildWeight.toFixed(2)} kg</span> <br />
                    母单标称重量: <span className="font-bold text-slate-800 dark:text-white">{parentWeight.toFixed(2)} kg</span> <br />
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <div className="flex-none bg-white dark:bg-surface-dark p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 border-t border-slate-100 dark:border-slate-800 safe-area-pb">
        <button
          disabled={!parentShipment || splitMutation.isPending}
          onClick={handleSplit}
          className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50"
        >
          <span className="material-icons-outlined">call_split</span>
          {splitMutation.isPending ? '正在处理...' : '确认拆分并同步'}
        </button>
      </div>
    </div>
  );
};

export default ReceiverSplit;