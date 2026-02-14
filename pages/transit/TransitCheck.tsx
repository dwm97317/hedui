import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBatchDetail, useUpdateBatchStatus } from '../../hooks/useBatches';
import { useCreateInspection } from '../../hooks/useInspections';
import { toast } from 'react-hot-toast';

const TransitCheck: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const batchId = searchParams.get('batchId');

    const { data: batch, isLoading, error } = useBatchDetail(batchId || '');
    const updateStatus = useUpdateBatchStatus();
    const createInspection = useCreateInspection();

    const [measuredWeight, setMeasuredWeight] = useState<string>('');
    const [discrepancy, setDiscrepancy] = useState<number>(0);

    useEffect(() => {
        if (batch && measuredWeight) {
            const measured = parseFloat(measuredWeight);
            const original = batch.total_weight;
            if (original > 0) {
                const diff = measured - original;
                setDiscrepancy(diff);
            }
        }
    }, [batch, measuredWeight]);

    if (isLoading) return <div className="text-white p-5">Loading Batch...</div>;
    if (!batchId || !batch) return <div className="text-white p-5">Batch Not Found</div>;

    const handleConfirm = async () => {
        if (!measuredWeight) {
            toast.error('Please enter measured weight');
            return;
        }

        try {
            // 1. Create Inspection Record
            await createInspection.mutateAsync({
                batch_id: batchId,
                result: 'passed',
                transit_weight: parseFloat(measuredWeight),
                notes: `Transit Weight Check: ${measuredWeight}kg. Discrepancy: ${discrepancy.toFixed(2)}kg`,
                photos: [] // TODO: Add photo capability
            });

            // 2. Update Batch Status to 'in_transit' (or 'inspected' based on flow)
            // User flow says: Transit Inspection -> "Pass" -> "In Transit"?
            // Wait, "to inspect" -> "inspected". But status enum has 'in_transit' or 'inspected'.
            // Let's use 'in_transit' as the next step for moving goods.
            await updateStatus.mutateAsync({
                id: batchId,
                status: 'in_transit'
            });

            toast.success('Inspection Completed. Batch in Transit.');
            navigate('/transit');
        } catch (e: any) {
            toast.error('Operation Failed: ' + e.message);
        }
    };

    const isDiscrepancyHigh = Math.abs(discrepancy / (batch.total_weight || 1)) > 0.05;

    return (
        <div className="bg-background-light dark:bg-background-dark h-full w-full flex flex-col text-slate-800 dark:text-slate-100 font-display overflow-hidden">
            {/* Header */}
            <header className="px-5 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark z-10 shrink-0">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <span className="material-icons">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">重量查验 (Transit Check)</h1>
                <div className="w-8"></div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
                {/* Batch Info */}
                <div className="p-5 bg-white dark:bg-surface-dark mb-2 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Batch No:</span>
                        <span className="font-mono font-bold text-lg">{batch.batch_no}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Current Status:</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-500 uppercase font-bold">{batch.status}</span>
                    </div>
                </div>

                {/* Verification Card */}
                <div className="p-5 space-y-4">
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-md border border-slate-100 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <span className="material-icons text-primary text-xl">scale</span>
                                重量核对
                            </h2>
                            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded font-medium">标准件</span>
                        </div>

                        <div className="flex items-stretch gap-4 mb-6">
                            <div className="flex-1 flex flex-col justify-center border-r border-slate-200 dark:border-slate-700 pr-4">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">发出方重量</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-slate-400">{batch.total_weight}</span>
                                    <span className="text-sm font-medium text-slate-400">kg</span>
                                </div>
                            </div>
                            <div className="flex-1 pl-2">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">中转称重</span>
                                <div className="relative">
                                    <input
                                        className="block w-full px-2 py-1 -ml-2 bg-yellow-50 dark:bg-yellow-900/10 border-b-2 border-primary text-3xl font-black text-slate-900 dark:text-white focus:outline-none focus:ring-0 focus:border-primary p-0 bg-transparent"
                                        type="number"
                                        value={measuredWeight}
                                        onChange={(e) => setMeasuredWeight(e.target.value)}
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                    <span className="absolute right-0 bottom-2 text-sm font-medium text-slate-500">kg</span>
                                </div>
                            </div>
                        </div>

                        {/* Discrepancy Alert */}
                        {measuredWeight && (
                            <div className={`rounded-lg p-3 flex items-center justify-between border ${isDiscrepancyHigh ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30'}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`material-icons text-lg ${isDiscrepancyHigh ? 'text-red-500' : 'text-green-500'}`}>
                                        {isDiscrepancyHigh ? 'warning' : 'check_circle'}
                                    </span>
                                    <span className={`text-sm font-bold ${isDiscrepancyHigh ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                        {isDiscrepancyHigh ? '偏差 > 5%' : '偏差正常'}
                                    </span>
                                </div>
                                <span className={`text-lg font-black ${isDiscrepancyHigh ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {discrepancy > 0 ? '+' : ''}{discrepancy.toFixed(2)} kg
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 w-full bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 p-4 pb-8 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="flex gap-3 h-14">
                    <button
                        onClick={() => toast('Feature Coming Soon: Exception Report', { icon: '🚧' })}
                        className="w-[30%] h-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg font-bold text-sm flex flex-col items-center justify-center active:scale-95 transition-transform border border-orange-200 dark:border-orange-800"
                    >
                        <span className="material-icons text-xl mb-0.5">report_problem</span>
                        <span className="leading-none">异常 (Exc)</span>
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={createInspection.isPending || updateStatus.isPending || !measuredWeight}
                        className="w-[70%] h-full bg-primary hover:bg-blue-600 text-white rounded-lg font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {(createInspection.isPending || updateStatus.isPending) ? 'Processing...' : (
                            <>
                                <span>确认并下一单</span>
                                <span className="material-icons">arrow_forward</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default TransitCheck;