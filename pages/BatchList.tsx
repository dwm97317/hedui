import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBatches, useDeleteBatch, useUpdateBatch } from '../hooks/useBatches';
import { Batch } from '../services/batch.service';
import { toast } from 'react-hot-toast';

const BatchList: React.FC = () => {
    const navigate = useNavigate();
    const { data: batches, isLoading } = useBatches();
    const deleteBatch = useDeleteBatch();
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
    const [newBatchNo, setNewBatchNo] = useState('');
    const updateBatch = useUpdateBatch();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const tabs = [
        { id: 'all', label: '全部批次' },
        { id: 'pending', label: '待发出' },
        { id: 'transit', label: '运输中' },
        { id: 'received', label: '已签收' }
    ];

    const filteredBatches = useMemo(() => {
        if (!batches) return [];
        let filtered = batches;

        // Tab Filter
        if (activeTab === 'pending') {
            filtered = filtered.filter(b => b.status === 'draft' || b.status === 'sender_processing');
        } else if (activeTab === 'transit') {
            filtered = filtered.filter(b =>
                ['sender_sealed', 'sealed', 'transit_processing', 'transit_sealed', 'inspected', 'receiver_processing', 'in_transit'].includes(b.status)
            );
        } else if (activeTab === 'received') {
            filtered = filtered.filter(b => b.status === 'completed');
        }

        // Search Filter
        if (searchQuery) {
            filtered = filtered.filter(b => b.batch_no.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [batches, activeTab, searchQuery]);

    const getBatchProgress = (status: Batch['status']) => {
        let s1: 'pending' | 'active' | 'complete' = 'pending';
        let s2: 'pending' | 'active' | 'complete' = 'pending';
        let s3: 'pending' | 'active' | 'complete' = 'pending';
        let lineWidth = '0%';
        let statusText = '未知';
        let statusColor = 'text-slate-400 bg-slate-400/10';

        switch (status) {
            case 'draft':
            case 'sender_processing':
                s1 = 'active';
                lineWidth = '0%';
                statusText = '进行中';
                statusColor = 'text-amber-500 bg-amber-500/10';
                break;
            case 'sender_sealed':
            case 'sealed':
                s1 = 'complete';
                s2 = 'pending';
                lineWidth = '50%';
                statusText = '待发出';
                statusColor = 'text-amber-500 bg-amber-500/10';
                break;
            case 'in_transit':
            case 'transit_processing':
                s1 = 'complete';
                s2 = 'active';
                lineWidth = '50%';
                statusText = '运输中';
                statusColor = 'text-primary bg-primary/10';
                break;
            case 'transit_sealed':
            case 'inspected':
                s1 = 'complete';
                s2 = 'complete';
                s3 = 'pending';
                lineWidth = '100%';
                statusText = '已中转';
                statusColor = 'text-primary bg-primary/10';
                break;
            case 'receiver_processing':
            case 'received':
                s1 = 'complete';
                s2 = 'complete';
                s3 = 'active';
                lineWidth = '100%';
                statusText = '到达中';
                statusColor = 'text-emerald-500 bg-emerald-500/10';
                break;
            case 'completed':
                s1 = 'complete';
                s2 = 'complete';
                s3 = 'complete';
                lineWidth = '100%';
                statusText = '已完成';
                statusColor = 'text-emerald-500 bg-emerald-500/10';
                break;
            case 'cancelled':
                statusText = '已取消';
                statusColor = 'text-red-500 bg-red-500/10';
                break;
        }

        return { s1, s2, s3, lineWidth, statusText, statusColor };
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
            d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('单号已复制');
    };

    const handleEdit = (batch: Batch) => {
        setEditingBatch(batch);
        setNewBatchNo(batch.batch_no);
    };

    const handleUpdate = async () => {
        if (!editingBatch || !newBatchNo) return;
        try {
            await updateBatch.mutateAsync({ id: editingBatch.id, data: { batch_no: newBatchNo } });
            setEditingBatch(null);
        } catch (err) { }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('确定要删除这个批次吗？该操作不可撤销。')) return;
        try {
            await deleteBatch.mutateAsync(id);
        } catch (err) {
            // Error handled by hook
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-400 bg-background-dark h-screen flex items-center justify-center italic">加载中...</div>;

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-light dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-4 h-16">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <span className="material-icons-round text-primary">arrow_back</span>
                        </button>
                        <h1 className="text-lg font-bold tracking-tight">批次列表</h1>
                    </div>
                </div>
                {/* Search Bar */}
                <div className="px-4 pb-2">
                    <div className="relative">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索批次号..."
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all"
                        />
                    </div>
                </div>
                {/* Tabs */}
                <div className="flex px-4 overflow-x-auto no-scrollbar gap-6 border-b border-slate-200 dark:border-slate-800">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 text-sm transition-all whitespace-nowrap border-b-2 ${activeTab === tab.id ? 'font-semibold border-primary text-primary' : 'font-medium text-slate-500 dark:text-slate-400 border-transparent'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main List */}
            <main className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
                {filteredBatches.map((batch) => {
                    const progress = getBatchProgress(batch.status);
                    const formattedDate = new Date(batch.created_at).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + new Date(batch.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

                    return (
                        <div key={batch.id} className="bg-white dark:bg-[#1c222d] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Card Header */}
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${progress.statusColor}`}>
                                        {progress.statusText}
                                    </span>
                                    <span className="text-sm font-bold tracking-wider font-mono">{batch.batch_no}</span>
                                    <button onClick={() => copyToClipboard(batch.batch_no)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <span className="material-icons-round text-sm text-slate-400">content_copy</span>
                                    </button>
                                </div>
                                <span className="text-[10px] text-slate-400">{formattedDate}</span>
                            </div>

                            {/* Card Content - Flow */}
                            <div className="p-4 space-y-6">
                                <div className="relative flex justify-between items-center px-2 pt-2">
                                    {/* Line Background */}
                                    <div className="absolute inset-x-8 top-[18px] flex items-center">
                                        <div className="w-full h-[2px] bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                                            <div
                                                className="absolute left-0 top-0 h-full bg-primary transition-all duration-700 ease-in-out"
                                                style={{ width: progress.lineWidth }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Node 1: Sender */}
                                    <div className="relative z-10 flex flex-col items-center gap-1 w-20">
                                        <div className={`size-8 rounded-full flex items-center justify-center transition-all ${progress.s1 === 'complete' ? 'bg-primary text-white' : progress.s1 === 'active' ? 'bg-primary border-4 border-white dark:border-[#1c222d] text-white ring-2 ring-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                            <span className="material-icons-round text-sm">
                                                {progress.s1 === 'complete' ? 'check' : 'box_edit'}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-bold ${progress.s1 !== 'pending' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>发出方</span>
                                        {batch.sealed_at && (
                                            <span className="text-[8px] text-slate-400 font-mono scale-[0.9] -mt-0.5">{formatTime(batch.sealed_at)}</span>
                                        )}
                                    </div>

                                    {/* Node 2: Transit */}
                                    <div className="relative z-10 flex flex-col items-center gap-1 w-20">
                                        <div className={`size-8 rounded-full flex items-center justify-center transition-all ${progress.s2 === 'complete' ? 'bg-primary text-white' : progress.s2 === 'active' ? 'bg-primary border-4 border-white dark:border-[#1c222d] text-white ring-2 ring-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                            <span className="material-icons-round text-sm">
                                                {progress.s2 === 'complete' ? 'check' : 'local_shipping'}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-bold ${progress.s2 !== 'pending' ? 'text-primary' : 'text-slate-400'}`}>中转方</span>
                                        {batch.transit_at && (
                                            <span className="text-[8px] text-slate-400 font-mono scale-[0.9] -mt-0.5">{formatTime(batch.transit_at)}</span>
                                        )}
                                    </div>

                                    {/* Node 3: Receiver */}
                                    <div className="relative z-10 flex flex-col items-center gap-1 w-20">
                                        <div className={`size-8 rounded-full flex items-center justify-center transition-all ${progress.s3 === 'complete' ? 'bg-primary text-white' : progress.s3 === 'active' ? 'bg-primary border-4 border-white dark:border-[#1c222d] text-white ring-2 ring-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                            <span className="material-icons-round text-sm">
                                                {progress.s3 === 'complete' ? 'check' : 'inventory_2'}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-bold ${progress.s3 !== 'pending' ? 'text-emerald-500' : 'text-slate-400'}`}>接收方</span>
                                        {batch.received_at && (
                                            <span className="text-[8px] text-slate-400 font-mono scale-[0.9] -mt-0.5">{formatTime(batch.received_at)}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Metrics Summary */}
                                <div className="grid grid-cols-3 gap-2 px-1">
                                    <div className="text-center">
                                        <p className={`text-[9px] mb-0.5 ${progress.s1 === 'complete' ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>{batch.item_count}件 / {(batch.total_weight || 0).toFixed(2)}kg</p>
                                        <p className={`text-[8px] font-bold ${progress.s1 === 'complete' ? 'text-emerald-500' : 'text-slate-400'}`}>发出方已封</p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-[9px] mb-0.5 ${progress.s2 !== 'pending' ? 'text-primary font-bold' : 'text-slate-400'}`}>{progress.s2 !== 'pending' ? `${batch.item_count}件 / ${(batch.total_weight || 0).toFixed(2)}kg` : '0件 / 0.00kg'}</p>
                                        <p className={`text-[8px] font-bold ${progress.s2 !== 'pending' ? 'text-primary' : 'text-slate-400'}`}>{progress.s2 === 'complete' ? '中转方已封' : '中转方处理'}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-[9px] mb-0.5 ${progress.s3 !== 'pending' ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>{progress.s3 !== 'pending' ? `${batch.item_count}件 / ${(batch.total_weight || 0).toFixed(2)}kg` : '0件 / 0.00kg'}</p>
                                        <p className={`text-[8px] font-bold ${progress.s3 !== 'pending' ? 'text-emerald-500' : 'text-slate-400'}`}>{progress.s3 === 'complete' ? '已收货核验' : '接收方处理'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                                <div className="flex gap-2">
                                    {(batch.status === 'draft' || batch.status === 'sender_processing') && (
                                        <>
                                            <button
                                                onClick={() => handleEdit(batch)}
                                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center"
                                                title="编辑批次"
                                            >
                                                <span className="material-icons-round text-lg">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(batch.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center"
                                                title="删除批次"
                                            >
                                                <span className="material-icons-round text-lg">delete_outline</span>
                                            </button>
                                        </>
                                    )}
                                    {/* Edit button could go here */}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/batch/${batch.id}`)}
                                        className="bg-primary hover:bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg transition-colors shadow-sm shadow-primary/20 active:scale-95 flex items-center gap-1"
                                    >
                                        <span className="material-icons-round text-[14px]">visibility</span>
                                        详情
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredBatches.length === 0 && (
                    <div className="py-20 text-center space-y-3 opacity-60">
                        <span className="material-icons-round text-6xl text-slate-300">inventory_2</span>
                        <p className="text-sm font-medium">暂无匹配的批次记录</p>
                    </div>
                )}
            </main>

            {/* Edit Modal */}
            {editingBatch && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-[#1c222d] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold">编辑批次信息</h3>
                            <button onClick={() => setEditingBatch(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                <span className="material-icons-round text-slate-400">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">批次号 (Batch Number)</label>
                                <input
                                    type="text"
                                    value={newBatchNo}
                                    onChange={(e) => setNewBatchNo(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl px-4 py-3 text-lg font-mono focus:ring-2 focus:ring-primary transition-all"
                                />
                            </div>
                            <p className="text-xs text-slate-500 italic">注意：仅支持修改批次显示编号。如需修改路线或仓库，请删除并重新创建。</p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 flex gap-3">
                            <button
                                onClick={() => setEditingBatch(null)}
                                className="flex-1 py-3 text-sm font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl active:scale-95 transition-all"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={updateBatch.isPending}
                                className="flex-1 py-3 text-sm font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {updateBatch.isPending ? '保存中...' : '提交修改'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchList;
