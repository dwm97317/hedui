import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBatchDetail, useUpdateBatchStatus } from '../../hooks/useBatches';
import { useShipments, useAddShipment } from '../../hooks/useShipments';
import { toast } from 'react-hot-toast';

const BatchDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: batch, isLoading, error } = useBatchDetail(id || '');
    const { data: shipments, isLoading: loadingShipments } = useShipments(id || '');
    const addShipment = useAddShipment();
    const updateStatus = useUpdateBatchStatus();

    const [trackingNo, setTrackingNo] = useState('');
    const [weight, setWeight] = useState('');

    if (isLoading) return <div className="p-8 text-white text-center">Loading batch details...</div>;
    if (error || !batch) return <div className="p-8 text-red-400 text-center">Failed to load batch.</div>;

    const handleAddShipment = () => {
        if (!trackingNo || !weight) {
            toast.error('Please enter tracking number and weight');
            return;
        }

        addShipment.mutate(
            {
                batch_id: batch.id,
                tracking_no: trackingNo,
                weight: parseFloat(weight),
                volume: 0 // Optional
            },
            {
                onSuccess: () => {
                    setTrackingNo('');
                    setWeight('');
                }
            }
        );
    };

    const handleSealBatch = () => {
        if (!shipments || shipments.length === 0) {
            toast.error('Cannot seal an empty batch!');
            return;
        }
        updateStatus.mutate({ id: batch.id, status: 'sealed' });
    };

    return (
        <div className="bg-background-dark font-display text-gray-100 min-h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-surface-dark/95 backdrop-blur shadow-md z-50 sticky top-0">
                <div className="px-5 py-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-white/10">
                        <span className="material-icons text-white">arrow_back_ios_new</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-wide">批次详情</h1>
                        <p className="text-xs text-gray-400 font-mono">{batch.batch_no}</p>
                    </div>
                    <div className="ml-auto">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${batch.status === 'draft' ? 'bg-blue-500/20 text-blue-400' :
                                batch.status === 'sealed' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-green-500/20 text-green-400'
                            }`}>
                            {batch.status}
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-5 overflow-y-auto space-y-6 pb-32">
                {/* Stats Card */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-5 shadow-lg grid grid-cols-2 gap-4">
                    <div className="text-center p-2 border-r border-white/5">
                        <p className="text-gray-400 text-xs mb-1">总件数 (Items)</p>
                        <p className="text-2xl font-bold text-white">{batch.item_count || 0}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-gray-400 text-xs mb-1">总重量 (Weight)</p>
                        <p className="text-2xl font-bold text-primary">{batch.total_weight || 0} <span className="text-sm text-gray-500">kg</span></p>
                    </div>
                </div>

                {/* Add Cargo Form (Only if Draft) */}
                {batch.status === 'draft' && (
                    <div className="bg-surface-dark/50 border border-white/5 rounded-xl p-4 space-y-4">
                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <span className="material-icons text-primary text-sm">add_box</span>
                            添加货物
                        </h3>
                        <div className="flex flex-col gap-3">
                            <input
                                className="bg-input-bg border border-white/10 rounded-lg px-3 py-3 text-white focus:border-primary outline-none"
                                placeholder="快递单号 (Tracking No)"
                                value={trackingNo}
                                onChange={(e) => setTrackingNo(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <input
                                    className="bg-input-bg border border-white/10 rounded-lg px-3 py-3 text-white focus:border-primary outline-none flex-1"
                                    placeholder="重量 (kg)"
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                />
                                <button
                                    onClick={handleAddShipment}
                                    disabled={addShipment.isPending}
                                    className="bg-primary hover:bg-blue-600 text-white px-6 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                >
                                    {addShipment.isPending ? '...' : <span className="material-icons">add</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cargo List */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-400 ml-1">货物清单 ({shipments?.length || 0})</h3>
                    {loadingShipments ? (
                        <div className="text-center py-4 text-gray-500">Loading parcels...</div>
                    ) : shipments?.length === 0 ? (
                        <div className="text-center py-8 bg-surface-dark/30 rounded-xl border border-dashed border-white/10">
                            <span className="material-icons text-gray-600 text-4xl mb-2">inventory_2</span>
                            <p className="text-gray-500 text-sm">暂无货物</p>
                        </div>
                    ) : (
                        shipments?.map((item) => (
                            <div key={item.id} className="bg-surface-dark border border-white/5 rounded-xl p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                        <span className="material-icons text-sm">local_shipping</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-mono text-sm tracking-wide">{item.tracking_no}</p>
                                        <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-bold">{item.weight} kg</p>
                                    <p className="text-xs text-green-400">{item.status}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Footer Action */}
            {batch.status === 'draft' && (
                <footer className="fixed bottom-0 left-0 right-0 p-5 bg-surface-dark border-t border-white/5 backdrop-blur safe-area-pb">
                    <button
                        onClick={handleSealBatch}
                        disabled={updateStatus.isPending}
                        className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {updateStatus.isPending ? 'Thinking...' : (
                            <>
                                <span className="material-icons">lock</span>
                                封箱并发送 (Seal & Send)
                            </>
                        )}
                    </button>
                </footer>
            )}
        </div>
    );
};

export default BatchDetailPage;
