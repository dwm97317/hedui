import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/user.store';
import { useBatches } from '../../hooks/useBatches';
import { useBatchStore } from '../../store/batch.store';
import { useShipments, useAddShipment, useRemoveShipment } from '../../hooks/useShipments';
import { toast } from 'react-hot-toast';

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

    // Fetch shipments for the current batch
    const { data: shipments, isLoading: shipmentsLoading } = useShipments(activeBatchId || '');
    const addShipment = useAddShipment();
    const removeShipment = useRemoveShipment();

    // Auto-select first active batch if none selected
    useEffect(() => {
        if (!activeBatchId && batches && batches.length > 0) {
            const firstActive = batches.find(b => b.status === 'draft' || b.status === 'sealed');
            if (firstActive) setActiveBatchId(firstActive.id);
        }
    }, [batches, activeBatchId, setActiveBatchId]);

    // Handle Scan
    useEffect(() => {
        const handleScan = (e: any) => {
            setWaybillNo(e.detail);
            toast.success(`已扫描: ${e.detail}`);
        };
        window.addEventListener('pda-scan', handleScan);
        return () => window.removeEventListener('pda-scan', handleScan);
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
                // shipper name could be a custom field in metadata if needed, 
                // but for now we'll just focus on core fields
            });

            // Clear form
            setWaybillNo('');
            setLength('');
            setWidth('');
            setHeight('');
            toast.success('建档成功');
        } catch (err: any) {
            toast.error('创建失败: ' + err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('确定要删除该单号吗？')) {
            await removeShipment.mutateAsync({ id });
        }
    };

    const volumetricWeight = (parseFloat(length || '0') * parseFloat(width || '0') * parseFloat(height || '0')) / 6000;
    const chargeableWeight = Math.max(parseFloat(weight || '0'), volumetricWeight);

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 min-h-screen flex flex-col relative overflow-hidden">
            {/* Header */}
            <header className="pt-8 pb-4 px-6 bg-white dark:bg-slate-900 shadow-sm z-10 sticky top-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-icons-round text-slate-600 dark:text-slate-300">arrow_back</span>
                        </button>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">货物建档与称重</h1>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                        <span className="material-icons-round text-primary text-sm animate-pulse">bluetooth_connected</span>
                        <span className="text-xs font-semibold text-primary">已连接</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-6 pb-40">
                {/* Archived Overview */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div
                        className="flex items-center justify-between p-4 cursor-pointer select-none active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors"
                        onClick={() => setIsArchivedOpen(!isArchivedOpen)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-slate-400">history</span>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">已建档单号概览 (Archived)</span>
                        </div>
                        <span className={`material-icons-round text-slate-400 transition-transform duration-300 ${isArchivedOpen ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </div>

                    {isArchivedOpen && (
                        <div className="border-t border-slate-50 dark:border-slate-700/50">
                            <div className="p-4 pt-2 space-y-2">
                                {shipmentsLoading ? (
                                    <p className="text-center text-xs text-slate-400 py-4">加载中...</p>
                                ) : shipments && shipments.length > 0 ? (
                                    shipments.slice(0, 3).map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl transition-all">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{s.tracking_no}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {s.weight}kg
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 active:scale-95 transition-all">
                                                    <span className="material-icons-round text-base">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s.id)}
                                                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95 transition-all"
                                                >
                                                    <span className="material-icons-round text-base">delete_outline</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-xs text-slate-400 py-4">暂无记录</p>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* Waybill Input */}
                <section className="space-y-2">
                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">运单号 (Waybill No.)</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-icons-round text-slate-400 group-focus-within:text-primary transition-colors">qr_code_scanner</span>
                        </div>
                        <input
                            value={waybillNo}
                            onChange={(e) => setWaybillNo(e.target.value)}
                            className="block w-full pl-12 pr-14 py-4 bg-white dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl text-lg font-semibold placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-primary dark:focus:ring-primary shadow-sm transition-all"
                            placeholder="扫描或输入单号..."
                            type="text"
                        />
                        <button className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <div className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg transition-colors">
                                <span className="material-icons-round">center_focus_weak</span>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Weight Display */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-primary">scale</span>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">当前重量 (Weight)</span>
                        </div>
                        <button
                            onClick={() => setWeight('0.00')}
                            className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 active:scale-95 transition-all uppercase tracking-wide"
                        >
                            归零 (Tare)
                        </button>
                    </div>
                    <div className="flex items-baseline justify-center py-6 relative">
                        <span className="text-7xl font-display font-extrabold text-slate-900 dark:text-white tracking-tighter">{weight}</span>
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
                        <div className="relative">
                            <label className="absolute -top-2.5 left-3 bg-white dark:bg-slate-800 px-1 text-xs font-bold text-primary z-10">长 (L)</label>
                            <div className="relative group">
                                <input
                                    value={length}
                                    onChange={(e) => setLength(e.target.value)}
                                    className="block w-full px-3 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xl font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm group-hover:border-slate-300"
                                    inputmode="decimal"
                                    placeholder="0"
                                    type="number"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">cm</span>
                            </div>
                        </div>
                        <div className="relative">
                            <label className="absolute -top-2.5 left-3 bg-white dark:bg-slate-800 px-1 text-xs font-bold text-primary z-10">宽 (W)</label>
                            <div className="relative group">
                                <input
                                    value={width}
                                    onChange={(e) => setWidth(e.target.value)}
                                    className="block w-full px-3 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xl font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm group-hover:border-slate-300"
                                    inputmode="decimal"
                                    placeholder="0"
                                    type="number"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">cm</span>
                            </div>
                        </div>
                        <div className="relative">
                            <label className="absolute -top-2.5 left-3 bg-white dark:bg-slate-800 px-1 text-xs font-bold text-primary z-10">高 (H)</label>
                            <div className="relative group">
                                <input
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className="block w-full px-3 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xl font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm group-hover:border-slate-300"
                                    inputmode="decimal"
                                    placeholder="0"
                                    type="number"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">cm</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Shipper */}
                <section className="space-y-2">
                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">发件人 (Shipper Name)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-icons-round text-slate-400">person_outline</span>
                        </div>
                        <input
                            value={shipperName}
                            onChange={(e) => setShipperName(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm transition-all"
                            placeholder="输入发件人姓名或ID..."
                            type="text"
                        />
                    </div>
                </section>

                {/* Summary */}
                <section className="pt-2">
                    <div className="flex items-center justify-between text-sm px-2">
                        <span className="text-slate-500">体积重量 (Volumetric)</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{volumetricWeight.toFixed(2)} kg</span>
                    </div>
                    <div className="flex items-center justify-between text-sm px-2 mt-1">
                        <span className="text-slate-500">计费重量 (Chargeable)</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{chargeableWeight.toFixed(2)} kg</span>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="fixed bottom-16 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col gap-3 max-w-lg mx-auto">
                    <button
                        onClick={handleCreate}
                        disabled={addShipment.isPending}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-lg disabled:opacity-50"
                    >
                        <span className="material-icons-round">print</span>
                        <span>{addShipment.isPending ? '正在创建...' : '打印并建档 (Print & Create)'}</span>
                    </button>
                    <button
                        onClick={() => navigate('/history')}
                        className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-6 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-all"
                    >
                        <span>确认发货 (Confirm Outbound)</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default CargoCreate;
