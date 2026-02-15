import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBatches } from '../../hooks/useBatches';
import { useBatchStore } from '../../store/batch.store';
import { useShipments, useRemoveShipment, useUpdateShipment } from '../../hooks/useShipments';
import { Shipment } from '../../services/shipment.service';
import { toast } from 'react-hot-toast';

// Sub-components
import EditShipmentModal from './CargoCreate/EditShipmentModal';
import DeleteConfirmDialog from './CargoCreate/DeleteConfirmDialog';

const SenderMonitor: React.FC = () => {
  const navigate = useNavigate();
  const { activeBatchId } = useBatchStore();
  const { data: batches } = useBatches();
  const activeBatch = batches?.find(b => b.id === activeBatchId);

  // Fetch shipments for the current batch
  const { data: shipments, isLoading } = useShipments(activeBatchId || '');
  const removeShipment = useRemoveShipment();
  const updateShipment = useUpdateShipment();

  // Modal states
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Edit form states
  const [editWaybill, setEditWaybill] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editLength, setEditLength] = useState('');
  const [editWidth, setEditWidth] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editShipperName, setEditShipperName] = useState('');

  const handleEditClick = (s: Shipment) => {
    setEditingShipment(s);
    setEditWaybill(s.tracking_no || '');
    setEditWeight((s.weight || 0).toString());
    setEditLength((s.length || 0).toString());
    setEditWidth((s.width || 0).toString());
    setEditHeight((s.height || 0).toString());
    setEditShipperName(s.shipper_name || '');
  };

  const handleUpdate = async () => {
    if (!editingShipment) return;
    try {
      await updateShipment.mutateAsync({
        id: editingShipment.id,
        updates: {
          tracking_no: editWaybill,
          weight: parseFloat(editWeight),
          length: parseFloat(editLength),
          width: parseFloat(editWidth),
          height: parseFloat(editHeight)
        }
      });
      setEditingShipment(null);
      toast.success('更新成功');
    } catch (err: any) {
      toast.error('更新失败');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await removeShipment.mutateAsync({ id: deleteId });
      setIsDeleteConfirmOpen(false);
      setDeleteId(null);
      toast.success('已删除');
    } catch (err: any) {
      // Handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background-dark text-white">
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">正在加载单号...</p>
      </div>
    );
  }

  return (
    <div className="bg-background-dark font-display min-h-screen flex flex-col overflow-hidden relative">
      {/* Background Graphic (Blurred Create Page Aesthetic) */}
      <div className="absolute inset-0 z-0 opacity-20 filter blur-[2px] pointer-events-none p-4 flex flex-col gap-6">
        <div className="h-20 bg-surface-dark rounded-2xl w-full"></div>
        <div className="h-40 bg-surface-dark rounded-2xl w-full"></div>
        <div className="h-24 bg-surface-dark rounded-2xl w-full"></div>
      </div>

      {/* Modal-style Content Container */}
      <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex-none bg-surface-dark border-b border-white/10 px-6 py-5 pt-12 flex justify-between items-center shadow-lg relative z-10">
          <div>
            <h2 className="text-xl font-black text-white tracking-wide uppercase">已建档单号概览</h2>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">
              共 <span className="text-primary">{shipments?.length || 0}</span> 个待同步单号
            </p>
          </div>
          <div className="bg-primary/20 p-2.5 rounded-2xl">
            <span className="material-icons text-primary text-2xl">inventory_2</span>
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {shipments && shipments.length > 0 ? (
            shipments.map((s) => (
              <div
                key={s.id}
                className="bg-surface-dark rounded-2xl p-4 border border-white/5 flex items-center justify-between shadow-xl active:scale-[0.98] transition-all group"
              >
                <div className="flex flex-col gap-1.5 flex-1">
                  <span className="font-mono text-white text-lg font-black tracking-wider uppercase group-hover:text-primary transition-colors">
                    {s.tracking_no}
                  </span>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="bg-white/5 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-white/5 text-slate-300">
                      {s.weight} kg
                    </span>
                    <span className="flex items-center">
                      <span className="material-icons text-[14px] mr-1 text-slate-600">aspect_ratio</span>
                      {s.length || 0}×{s.width || 0}×{s.height || 0} cm
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-5 border-l border-white/5">
                  <button
                    onClick={() => handleEditClick(s)}
                    className="p-2.5 text-primary hover:text-white hover:bg-primary rounded-xl transition-all active:scale-90"
                  >
                    <span className="material-icons text-2xl">edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(s.id)}
                    className="p-2.5 text-red-500 hover:text-white hover:bg-red-600 rounded-xl transition-all active:scale-90"
                  >
                    <span className="material-icons text-2xl">delete_outline</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600 border-2 border-dashed border-white/5 rounded-3xl">
              <span className="material-icons text-5xl mb-3 opacity-20">history_toggle_off</span>
              <p className="text-[10px] font-black uppercase tracking-widest">暂无已建档记录</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-none p-5 pb-10 bg-surface-dark border-t border-white/10 safe-area-pb">
          <button
            onClick={() => navigate('/sender/create')}
            className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-base border border-white/10 uppercase tracking-widest"
          >
            <span className="material-icons">arrow_back</span>
            <span>返回继续建档</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <EditShipmentModal
        editingShipment={editingShipment}
        onClose={() => setEditingShipment(null)}
        waybill={editWaybill}
        setWaybill={setEditWaybill}
        weight={editWeight}
        setWeight={setEditWeight}
        length={editLength}
        setLength={setEditLength}
        width={editWidth}
        setWidth={setEditWidth}
        height={editHeight}
        setHeight={setEditHeight}
        shipperName={editShipperName}
        setShipperName={setEditShipperName}
        handleUpdateShipment={handleUpdate}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
};

export default SenderMonitor;