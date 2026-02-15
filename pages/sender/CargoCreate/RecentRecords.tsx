import React from 'react';
import { Shipment } from '../../../services/shipment.service';

interface RecentRecordsProps {
    shipments: Shipment[] | undefined;
    isArchivedOpen: boolean;
    setIsArchivedOpen: (open: boolean) => void;
    handleDelete: (id: string) => void;
}

const RecentRecords: React.FC<RecentRecordsProps> = ({
    shipments,
    isArchivedOpen,
    setIsArchivedOpen,
    handleDelete
}) => {
    return (
        <section className="space-y-2">
            <div
                className="flex items-center justify-between px-1 cursor-pointer group"
                onClick={() => setIsArchivedOpen(!isArchivedOpen)}
            >
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">最近操作记录 ({shipments?.length || 0})</label>
                <span className={`material-icons text-gray-400 text-sm transition-transform duration-300 ${isArchivedOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </div>
            {isArchivedOpen && (
                <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar py-1">
                    {shipments && shipments.length > 0 ? (
                        shipments.slice(0, 3).map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3.5 bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm hover:border-primary/30 transition-all">
                                <div className="flex flex-col gap-1">
                                    <span className="font-mono text-xs font-black text-slate-800 dark:text-gray-200 tracking-wider uppercase">{s.tracking_no}</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{s.weight} kg</span>
                                        <span className="text-[10px] font-medium text-slate-400">@ {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {(s.length || s.width || s.height) && (
                                            <span className="text-[10px] text-gray-500 font-medium">
                                                • {s.length || 0}*{s.width || 0}*{s.height || 0}cm
                                            </span>
                                        )}
                                        {s.shipper_name && (
                                            <span className="text-[10px] text-gray-500 font-bold ml-1">
                                                ({s.shipper_name})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(s.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                                >
                                    <span className="material-icons text-lg">delete_outline</span>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="py-4 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">暂无记录</span>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default RecentRecords;
