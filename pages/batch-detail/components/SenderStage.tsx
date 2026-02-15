import React, { useState } from 'react';
import { Shipment } from '../../../services/shipment.service';
import { Batch } from '../../../services/batch.service';
import { ShipmentEditModal } from './ShipmentEditModal';
import { useUpdateShipment } from '../../../hooks/useShipments';
import { useUserStore } from '../../../store/user.store';

interface SenderStageProps {
    batch: Batch;
    shipments: Shipment[];
}

export const SenderStage: React.FC<SenderStageProps> = ({ batch, shipments }) => {
    const { user } = useUserStore();
    const isSender = user?.role === 'sender';
    const updateShipment = useUpdateShipment();
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

    const totalWeight = shipments.reduce((sum, s) => sum + (parseFloat(s.weight as any) || 0), 0);
    const totalVolume = shipments.reduce((sum, s) => {
        const length = parseFloat(s.length as any) || 0;
        const width = parseFloat(s.width as any) || 0;
        const height = parseFloat(s.height as any) || 0;
        const v = (length * width * height) / 1000000; // cm3 to m3
        return sum + v;
    }, 0);

    const handleSave = async (data: any) => {
        if (!selectedShipment) return;
        await updateShipment.mutateAsync({
            id: selectedShipment.id,
            updates: data
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Overview Card */}
            <div className="px-4 py-4 text-slate-800 dark:text-slate-100">
                <div className="bg-white dark:bg-[#1c2433] rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <span className="material-icons text-primary text-base">local_shipping</span>
                            发出数据概览
                        </h2>
                        <span className="text-xs text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full font-medium">
                            {batch.status === 'draft' || batch.status === 'sender_processing' ? '进行中' : '已封箱'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">累计重量 (kg)</p>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-primary h-full rounded-full" style={{ width: '65%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-1 pl-4 border-l border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400">累计体积 (m³)</p>
                            <div className="flex items-end gap-2 text-slate-900 dark:text-white">
                                <span className="text-2xl font-bold font-mono">{totalVolume.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '72%' }}></div>
                            </div>
                        </div>
                    </div>
                    {isSender && (batch.status === 'draft' || batch.status === 'sender_processing') && (
                        <div className="mt-3 text-[10px] text-primary flex items-center gap-1 bg-primary/5 p-2 rounded-lg">
                            <span className="material-icons text-sm">info</span>
                            <span>您可以点击下方包裹清单进行发出重量修正。</span>
                        </div>
                    )}
                </div>
            </div>

            {/* List Header */}
            <div className="px-4 pb-2 flex justify-between items-center mt-2">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">包裹清单 ({shipments.length})</h3>
            </div>

            {/* Parcel List */}
            <div className="px-4 space-y-3 pb-24">
                {shipments.map((s) => (
                    <div
                        key={s.id}
                        onClick={() => isSender && (batch.status === 'draft' || batch.status === 'sender_processing') && setSelectedShipment(s)}
                        className={`bg-white dark:bg-[#1c2433] p-4 rounded-lg border border-slate-100 dark:border-slate-700/50 flex items-center justify-between shadow-sm transition-all ${isSender && (batch.status === 'draft' || batch.status === 'sender_processing') ? 'active:scale-[0.99] cursor-pointer hover:border-primary/50' : ''}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary">
                                <span className="material-icons text-xl">scale</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white font-mono leading-none">{s.tracking_no}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs text-slate-600 dark:text-slate-300 font-black">{(s.weight || 0).toFixed(2)} kg</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{s.length}x{s.width}x{s.height} cm</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            {isSender && (batch.status === 'draft' || batch.status === 'sender_processing') && (
                                <span className="material-icons text-primary/30 text-base mb-1">edit</span>
                            )}
                            <span className="text-[10px] text-slate-400">{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                ))}

                {shipments.length === 0 && (
                    <div className="text-center py-12 text-slate-400 italic">暂无包裹数据</div>
                )}

                <div className="text-center pt-4 pb-2 text-xs text-slate-400 dark:text-slate-500">
                    已显示全部数据
                </div>
            </div>

            {selectedShipment && (
                <ShipmentEditModal
                    isOpen={!!selectedShipment}
                    onClose={() => setSelectedShipment(null)}
                    shipment={selectedShipment}
                    role="sender"
                    onSave={handleSave}
                />
            )}

            {/* Footer */}
            <footer className="flex-none bg-white dark:bg-[#1c2433] border-t border-slate-200 dark:border-slate-800 px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 mb-safe">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500 dark:text-slate-400">发出进度</span>
                        <span className="text-sm font-bold text-primary dark:text-blue-400">进行中</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-slate-500 dark:text-slate-400">已扫描</span>
                        <div className="text-sm font-mono font-medium text-slate-900 dark:text-white">{shipments.length} / {batch.item_count || shipments.length}</div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
