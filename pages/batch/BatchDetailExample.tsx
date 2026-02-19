import React, { useState } from 'react';
import { useBatches, useBatchDetail, useCreateBatch, useUpdateBatchStatus } from '../../hooks/useBatches';
import { useShipments, useAddShipment } from '../../hooks/useShipments';
import { useBillDetail } from '../../hooks/useBilling';
import { useUserStore } from '../../store/user.store';

/**
 * Example Page: Batch Detail & Workflow
 */
export const BatchDetail: React.FC<{ batchId: string }> = ({ batchId }) => {
    const { data: batch, isLoading: loadingBatch, error: batchError } = useBatchDetail(batchId);
    const { data: shipments, isLoading: loadingShipments } = useShipments(batchId);
    const { data: bill, isLoading: loadingBill } = useBillDetail(batchId);
    const user = useUserStore((state) => state.user);

    const addShipment = useAddShipment();
    const updateStatus = useUpdateBatchStatus();

    const [trackingInput, setTracking] = useState('');
    const [weightInput, setWeight] = useState('');

    if (loadingBatch) return <div>Loading Batch...</div>;
    if (!batch) return <div>Batch Not Found</div>;

    const isSender = user?.role === 'sender';
    const isTransit = user?.role === 'transit';
    const isReceiver = user?.role === 'receiver';

    // State Machine Buttons
    const renderActions = () => {
        if (batch.status === 'draft' && isSender) {
            return <button onClick={() => updateStatus.mutate({ id: batchId, status: 'sealed' })}>Seal & Send</button>;
        }
        if (batch.status === 'sealed' && isTransit) {
            return <button onClick={() => updateStatus.mutate({ id: batchId, status: 'in_transit' })}>Start Transit</button>;
        }
        if (batch.status === 'in_transit' && isReceiver) {
            return <button onClick={() => updateStatus.mutate({ id: batchId, status: 'received' })}>Receive Batch</button>;
        }
        if (batch.status === 'received' && isReceiver) {
            return <button onClick={() => updateStatus.mutate({ id: batchId, status: 'completed' })}>Complete & Generate Bill</button>;
        }
        if (batch.status === 'completed') {
            return <span className="completed-badge">Batch Completed</span>;
        }
        return null;
    };

    return (
        <div className="batch-page">
            <header>
                <h1>Batch: {batch.batch_no}</h1>
                <div className="status-pill">{batch.status}</div>
                <div className="summary">
                    <span>Items: {batch.item_count}</span>
                    <span>Weight: {batch.total_weight} kg</span>
                </div>
            </header>

            {/* Action Bar */}
            <section className="actions">
                {renderActions()}
            </section>

            {/* Bill View (Auto-Shows when completed) */}
            {batch.status === 'completed' && bill && (
                <section className="bill-card">
                    <h3>Generated Bill</h3>
                    <p>Bill No: {bill.bill_no}</p>
                    <p>Prepare to Pay: {bill.total_amount} {bill.currency}</p>
                    <p>Status: {bill.status}</p>
                </section>
            )}

            {/* Shipment Adding (Only if active) */}
            {batch.status === 'draft' && isSender && (
                <section className="add-shipment">
                    <input
                        placeholder="Tracking No"
                        value={trackingInput}
                        onChange={e => setTracking(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Weight (kg)"
                        value={weightInput}
                        onChange={e => setWeight(e.target.value)}
                    />
                    <button onClick={() => {
                        addShipment.mutate({
                            batch_id: batchId,
                            tracking_no: trackingInput,
                            weight: parseFloat(weightInput)
                        });
                        setTracking(''); setWeight('');
                    }}>
                        Add Parcel
                    </button>
                </section>
            )}

            {/* Shipment List */}
            <section className="shipment-list">
                <h3>Contents</h3>
                <ul>
                    {shipments?.map(s => (
                        <li key={s.id}>
                            {s.tracking_no} - {s.weight}kg <span className="status">{s.status}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
};
