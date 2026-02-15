import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../../store/user.store';
import { useBatches, useUpdateBatchStatus } from '../../../hooks/useBatches';
import { useBatchStore } from '../../../store/batch.store';
import { useShipments, useAddShipment, useRemoveShipment, useUpdateShipment } from '../../../hooks/useShipments';
import { toast } from 'react-hot-toast';
import { Shipment } from '../../../services/shipment.service';

// Sub-components
// mini-app ui is extracted to components for better maintainability.
import CargoCreateHeader from './CargoCreateHeader';
import RecentRecords from './RecentRecords';
import CargoCreateForm from './CargoCreateForm';
import CargoCreateFooter from './CargoCreateFooter';
import FinalizeModal from './FinalizeModal';
import EditShipmentModal from './EditShipmentModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const CargoCreate: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { data: batches, isLoading: batchesLoading } = useBatches();
    const { activeBatchId, setActiveBatchId } = useBatchStore();

    // State for the form
    const [waybillNo, setWaybillNo] = useState('');
    const [weight, setWeight] = useState('12.85');
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [shipperName, setShipperName] = useState('');
    const [isArchivedOpen, setIsArchivedOpen] = useState(true);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
    const [deleteShipmentId, setDeleteShipmentId] = useState<string | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    // Form states for editing
    const [editWaybill, setEditWaybill] = useState('');
    const [editWeight, setEditWeight] = useState('');
    const [editLength, setEditLength] = useState('');
    const [editWidth, setEditWidth] = useState('');
    const [editHeight, setEditHeight] = useState('');
    const [editShipperName, setEditShipperName] = useState('');

    // Fetch shipments for the current batch
    const { data: shipments, isLoading: shipmentsLoading } = useShipments(activeBatchId || '');
    const addShipment = useAddShipment();
    const removeShipment = useRemoveShipment();
    const updateShipment = useUpdateShipment();
    const updateBatchStatus = useUpdateBatchStatus();

    // Auto-select first active batch if none selected
    useEffect(() => {
        if (!activeBatchId && batches && batches.length > 0) {
            const firstActive = batches.find(b => b.status === 'sender_processing' || b.status === 'draft');
            if (firstActive) setActiveBatchId(firstActive.id);
        }
    }, [batches, activeBatchId, setActiveBatchId]);

    // Handle Scan
    useEffect(() => {
        const handleScan = (e: any) => {
            setWaybillNo(e.detail);
            toast.success(`已扫描: ${e.detail}`);
        };
        const handleWaybillGen = () => {
            const randomID = 'WA' + Math.random().toString(36).substring(2, 10).toUpperCase();
            setWaybillNo(randomID);
            toast.success('单号已生成');
        };

        window.addEventListener('pda-scan', handleScan);
        window.addEventListener('generate-waybill', handleWaybillGen);
        return () => {
            window.removeEventListener('pda-scan', handleScan);
            window.removeEventListener('generate-waybill', handleWaybillGen);
        };
    }, []);

    const handleCreate = async () => {
        if (!activeBatchId) {
            toast.error('请先选择或创建一个批次');
            return;
        }
        if (!waybillNo) {
            toast.error('请输入或扫描运单号');
            return;
        }

        try {
            await addShipment.mutateAsync({
                batch_id: activeBatchId,
                tracking_no: waybillNo,
                weight: parseFloat(weight),
                length: length ? parseFloat(length) : null,
                width: width ? parseFloat(width) : null,
                height: height ? parseFloat(height) : null,
                shipper_name: shipperName || null,
            });

            // Clear form
            setWaybillNo('');
            setLength('');
            setWidth('');
            setHeight('');
            setShipperName('');
            toast.success('建档成功');
        } catch (err: any) {
            toast.error('创建失败: ' + err.message);
        }
    };

    const handlePrint = async () => {
        await handleCreate();
        // Simulate printing
        toast.success('正在发送打印任务...', { icon: '🖨️' });
    };

    const handleDelete = async (id: string) => {
        await removeShipment.mutateAsync({ id });
    };

    const handleEditClick = (shipment: Shipment) => {
        setEditingShipment(shipment);
        setEditWaybill(shipment.tracking_no || '');
        setEditWeight((shipment.weight || 0).toString());
        setEditLength((shipment.length || 0).toString());
        setEditWidth((shipment.width || 0).toString());
        setEditHeight((shipment.height || 0).toString());
        setEditShipperName(shipment.shipper_name || '');
    };

    const handleUpdateShipment = async () => {
        if (!editingShipment) return;
        try {
            await updateShipment.mutateAsync({
                id: editingShipment.id,
                updates: {
                    tracking_no: editWaybill,
                    weight: parseFloat(editWeight),
                    length: parseFloat(editLength),
                    width: parseFloat(editWidth),
                    height: parseFloat(editHeight),
                    shipper_name: editShipperName || null
                }
            });
            setEditingShipment(null);
            toast.success('更新成功');
        } catch (err: any) {
            toast.error('更新失败: ' + err.message);
        }
    };

    const confirmDelete = (id: string) => {
        setDeleteShipmentId(id);
        setIsDeleteConfirmOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteShipmentId) return;
        try {
            await removeShipment.mutateAsync({ id: deleteShipmentId });
            setIsDeleteConfirmOpen(false);
            setDeleteShipmentId(null);
        } catch (err: any) {
            // Error handled by hook
        }
    };

    const volumetricWeight = (parseFloat(length || '0') * parseFloat(width || '0') * parseFloat(height || '0')) / 6000;
    const chargeableWeight = Math.max(parseFloat(weight || '0'), volumetricWeight);

    // Summary calculations for modal
    const totalCount = shipments?.length || 0;
    const totalChargeableWeight = shipments?.reduce((sum, s) => {
        const v = ((s.length || 0) * (s.width || 0) * (s.height || 0)) / 6000;
        return sum + Math.max(s.weight || 0, v);
    }, 0) || 0;

    const activeBatch = batches?.find(b => b.id === activeBatchId);

    const handleFinalize = async () => {
        if (!activeBatchId) return;
        try {
            await updateBatchStatus.mutateAsync({ id: activeBatchId, status: 'sender_sealed' });
            setIsConfirmModalOpen(false);
            navigate('/batch-list');
            toast.success('批次已封箱并发出');
        } catch (e: any) {
            // Error handled by hook toast
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-gray-100 min-h-screen flex flex-col relative overflow-hidden">
            <CargoCreateHeader batchNo={activeBatch?.batch_no} />

            <main className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5 pb-40">
                <RecentRecords
                    shipments={shipments}
                    isArchivedOpen={isArchivedOpen}
                    setIsArchivedOpen={setIsArchivedOpen}
                    handleDelete={handleDelete}
                />

                <CargoCreateForm
                    waybillNo={waybillNo}
                    setWaybillNo={setWaybillNo}
                    weight={weight}
                    setWeight={setWeight}
                    length={length}
                    setLength={setLength}
                    width={width}
                    setWidth={setWidth}
                    height={height}
                    setHeight={setHeight}
                    shipperName={shipperName}
                    setShipperName={setShipperName}
                    volumetricWeight={volumetricWeight}
                    chargeableWeight={chargeableWeight}
                />
            </main>

            <CargoCreateFooter
                handleCreate={handleCreate}
                handlePrint={handlePrint}
                isCreating={addShipment.isPending}
                isPrinting={false} // Would be tied to print hook if available
                openConfirmModal={() => setIsConfirmModalOpen(true)}
            />

            <FinalizeModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                activeBatch={activeBatch}
                totalCount={totalCount}
                totalChargeableWeight={totalChargeableWeight}
                shipments={shipments}
                handleEditClick={handleEditClick}
                confirmDelete={confirmDelete}
                handleFinalize={handleFinalize}
                isFinalizing={updateBatchStatus.isPending}
            />

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
                handleUpdateShipment={handleUpdateShipment}
            />

            <DeleteConfirmDialog
                isOpen={isDeleteConfirmOpen}
                onConfirm={executeDelete}
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />
        </div>
    );
};

export default CargoCreate;
