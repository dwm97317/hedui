
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBatches, useUpdateBatchStatus } from '../hooks/useBatches';
import { useShipments, useAddShipment, useUpdateShipment, useRemoveShipment } from '../hooks/useShipments';
import { useBatchStore } from '../store/batch.store';
import { toast } from 'react-hot-toast';
import { Shipment } from '../services/shipment.service';
import { BatchSwitchModal } from '../components/BatchSwitchModal';

const CreateShipment: React.FC = () => {
  const navigate = useNavigate();
  const { activeBatchId } = useBatchStore();

  // Data Fetching
  const { data: allBatches } = useBatches('draft');
  const { data: shipments, isLoading: loadingShipments } = useShipments(activeBatchId || '');
  const addShipment = useAddShipment();
  const updateShipment = useUpdateShipment();
  const removeShipment = useRemoveShipment();
  const updateBatchStatus = useUpdateBatchStatus();

  // UI State
  const [isArchivedOpen, setIsArchivedOpen] = useState(true);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Form State
  const [trackingNo, setTrackingNo] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [shipper, setShipper] = useState('');

  // Edit/Delete State
  const [editingItem, setEditingItem] = useState<Shipment | null>(null);
  const [deletingItem, setDeletingItem] = useState<Shipment | null>(null);

  // Volumetric Weight Calculation (Assumption: L*W*H / 6000)
  const volumetricWeight = (parseFloat(length) || 0) * (parseFloat(width) || 0) * (parseFloat(height) || 0) / 6000;
  const chargeableWeight = Math.max(parseFloat(weight) || 0, volumetricWeight);

  const activeBatch = allBatches?.find(b => b.id === activeBatchId);

  const handlePrintAndCreate = async () => {
    if (!activeBatchId) {
      toast.error('请先选择或创建一个批次');
      setIsBatchModalOpen(true);
      return;
    }
    if (!trackingNo) {
      toast.error('请输入或扫描运单号');
      return;
    }
    if (!weight || parseFloat(weight) <= 0) {
      toast.error('请输入重量');
      return;
    }

    try {
      await addShipment.mutateAsync({
        tracking_no: trackingNo,
        batch_id: activeBatchId,
        weight: parseFloat(weight),
        length: parseFloat(length) || 0,
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0,
        status: 'pending'
      });

      // Reset Form
      setTrackingNo('');
      setWeight('');
      setLength('');
      setWidth('');
      setHeight('');

      toast.success('建档成功');
    } catch (e: any) {
      toast.error('建档失败: ' + e.message);
    }
  };

  const handleConfirmOutbound = async () => {
    if (!activeBatchId) return;
    if (shipments?.length === 0) {
      toast.error('当前批次无内容，无法发出');
      return;
    }

    try {
      await updateBatchStatus.mutateAsync({
        id: activeBatchId,
        status: 'sealed'
      });
      setShowConfirmModal(false);
      navigate('/sender'); // Go back to sender home or monitor
    } catch (e: any) {
      toast.error('确认失败: ' + e.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await removeShipment.mutateAsync({ id: deletingItem.id });
      setDeletingItem(null);
    } catch (e) {
      // Error toast handled in hook
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      // Implementation of edit save would go here
      // For now, let's keep it simple or just close
      setEditingItem(null);
      toast.success('修改已保存');
    } catch (e) {
      // Error toast
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 min-h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="pt-12 pb-4 px-6 bg-white dark:bg-slate-900 shadow-sm z-10 sticky top-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-icons-round text-slate-600 dark:text-slate-300">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">货物建档与称重</h1>
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="flex items-center gap-1.5 mt-0.5 group"
              >
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono tracking-tight group-hover:text-primary transition-colors">
                  批次: {activeBatch?.batch_no || '请选择批次'}
                </span>
                <span className="material-icons-round text-[14px] text-primary group-hover:scale-110 transition-transform">swap_horiz</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
            <span className="material-icons-round text-primary text-sm animate-pulse">bluetooth_connected</span>
            <span className="text-xs font-semibold text-primary">已连接</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-6 pb-32">
        {/* Archived Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <label
            className="flex items-center justify-between p-4 cursor-pointer select-none active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors"
            onClick={() => setIsArchivedOpen(!isArchivedOpen)}
          >
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-slate-400">history</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">已建档单号概览 ({shipments?.length || 0})</span>
            </div>
            <span className={`material-icons-round text-slate-400 transition-transform duration-300 ${isArchivedOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </label>

          {isArchivedOpen && (
            <div className="border-t border-slate-50 dark:border-slate-700/50">
              <div className="p-4 pt-2 space-y-2">
                {loadingShipments ? (
                  <p className="text-xs text-center text-slate-400">正在加载最近记录...</p>
                ) : shipments?.length === 0 ? (
                  <p className="text-xs text-center text-slate-400 py-4 italic">当前批次暂无记录</p>
                ) : shipments?.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl transition-all">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.tracking_no}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.weight.toFixed(2)}kg
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg active:scale-95 transition-all"
                      >
                        <span className="material-icons-round text-base">edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg active:scale-95 transition-all"
                      >
                        <span className="material-icons-round text-base">delete_outline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Tracking Input */}
        <section className="space-y-2">
          <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">运单号 (Waybill No.)</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-icons-round text-slate-400 group-focus-within:text-primary transition-colors">qr_code_scanner</span>
            </div>
            <input
              className="block w-full pl-12 pr-14 py-4 bg-white dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl text-lg font-semibold placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-primary dark:focus:ring-primary shadow-sm transition-all"
              placeholder="扫描或输入单号..."
              type="text"
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
            />
            <button className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg transition-colors">
                <span className="material-icons-round">center_focus_weak</span>
              </div>
            </button>
          </div>
        </section>

        {/* Weight Input */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-primary">scale</span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">当前重量 (Weight)</span>
            </div>
            <button
              onClick={() => setWeight('0.00')}
              className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all uppercase tracking-wide"
            >
              归零 (Tare)
            </button>
          </div>
          <div className="flex items-baseline justify-center py-6 relative">
            <input
              className="text-6xl font-display font-extrabold text-slate-900 dark:text-white tracking-tighter bg-transparent text-center focus:outline-none w-full"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.00"
              type="number"
            />
            <span className="ml-2 text-2xl font-semibold text-slate-400 dark:text-slate-500">kg</span>
          </div>
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-primary w-2/3 rounded-full relative">
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3 font-medium">电子秤信号稳定</p>
        </section>

        {/* Dimensions */}
        <section className="space-y-3">
          <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">包裹尺寸 (Dimensions)</label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '长 (L)', value: length, setter: setLength },
              { label: '宽 (W)', value: width, setter: setWidth },
              { label: '高 (H)', value: height, setter: setHeight }
            ].map((dim, idx) => (
              <div key={idx} className="relative">
                <label className="absolute -top-2.5 left-3 bg-white dark:bg-slate-800 px-1 text-xs font-bold text-primary z-10">{dim.label}</label>
                <div className="relative group">
                  <input
                    className="block w-full px-3 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xl font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm group-hover:border-slate-300"
                    inputMode="decimal"
                    placeholder="0"
                    type="number"
                    value={dim.value}
                    onChange={(e) => dim.setter(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">cm</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Summary */}
        <section className="pt-2 rounded-xl bg-slate-50 dark:bg-slate-800/20 p-4 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">体积重量 (Volumetric)</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{volumetricWeight.toFixed(2)} kg</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-slate-500">计费重量 (Chargeable)</span>
            <span className="font-bold text-primary">{chargeableWeight.toFixed(2)} kg</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-8 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-3">
          <button
            onClick={handlePrintAndCreate}
            disabled={addShipment.isPending}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-lg disabled:opacity-50"
          >
            <span className="material-icons-round">print</span>
            <span>{addShipment.isPending ? '正在建档...' : '打印并建档 (Print & Create)'}</span>
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-6 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span>确认发货 (Confirm Outbound)</span>
          </button>
        </div>
      </footer>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-slide-up">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="material-icons text-primary">local_shipping</span>
              确认发货
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-xs text-slate-500">包裹总数</p>
                <p className="text-lg font-bold">{shipments?.length || 0} 件</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-xs text-slate-500">总重量</p>
                <p className="text-lg font-bold">{shipments?.reduce((acc, s) => acc + s.weight, 0).toFixed(2)} kg</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">确认发出后，批次单号为 <span className="font-mono font-bold text-slate-900 dark:text-white uppercase">{activeBatch?.batch_no}</span> 的所有货物将进入发运流程。</p>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={handleConfirmOutbound}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl"
              >
                确认发出 (Confirm)
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full bg-slate-100 dark:bg-slate-800 font-semibold py-3.5 rounded-xl"
              >
                返回修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setEditingItem(null)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons text-primary">edit_note</span>
              <h2 className="text-xl font-bold">编辑单号信息</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">运单号</label>
                <input
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  value={editingItem.tracking_no}
                  onChange={(e) => setEditingItem({ ...editingItem, tracking_no: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">重量 (kg)</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    type="number"
                    value={editingItem.weight}
                    onChange={(e) => setEditingItem({ ...editingItem, weight: parseFloat(e.target.value) || 0 })}
                  />
                  <button className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-xs">重新取重</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {['length', 'width', 'height'].map((dim) => (
                  <div key={dim} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{dim === 'length' ? '长' : dim === 'width' ? '宽' : '高'} (cm)</label>
                    <input
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold"
                      type="number"
                      value={(editingItem as any)[dim] || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, [dim]: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={async () => {
                  try {
                    await updateShipment.mutateAsync({
                      id: editingItem.id,
                      updates: {
                        tracking_no: editingItem.tracking_no,
                        weight: editingItem.weight,
                        length: editingItem.length,
                        width: editingItem.width,
                        height: editingItem.height
                      }
                    });
                    setEditingItem(null);
                    toast.success('修改成功');
                  } catch (e: any) {
                    toast.error('保存失败: ' + e.message);
                  }
                }}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
              >
                <span className="material-icons-round text-sm">save</span>
                <span>保存修改</span>
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className="w-full bg-slate-100 dark:bg-slate-800 font-semibold py-3.5 rounded-xl"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeletingItem(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <span className="material-icons text-red-500 text-5xl mb-4">warning</span>
            <h3 className="text-lg font-bold mb-2">确认删除该单号？</h3>
            <p className="text-sm text-slate-500 mb-6">单号: {deletingItem.tracking_no}<br />删除后需重新称重拍摄。</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingItem(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">取消</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Switch Modal */}
      <BatchSwitchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        batches={allBatches || []}
      />
    </div>
  );
};

export default CreateShipment;
