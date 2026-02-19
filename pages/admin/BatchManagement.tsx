
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore, FinanceBatch } from '../../store/finance.store';
import { useAdminCompanies } from '../../hooks/useAdmin';
import { SenderStageStats, TransitStageStats, ReceiverStageStats } from '../../components/batch/BatchStageStats';
import toast from 'react-hot-toast';

const BatchManagement: React.FC = () => {
    const navigate = useNavigate();
    const { batches, loading, fetchBatches, createBatch, updateBatch, deleteBatch } = useFinanceStore();
    const { data: companies } = useAdminCompanies();

    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // UI Local State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState<FinanceBatch | null>(null);
    const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    useEffect(() => {
        fetchBatches();
    }, [fetchBatches]);

    const filteredBatches = batches.filter(b => {
        const matchesStatus = statusFilter === 'All' || b.status.toLowerCase() === statusFilter.toLowerCase();
        const matchesSearch = b.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.receiverName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleOpenCreateModal = () => {
        setEditingBatch(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (e: React.MouseEvent, batch: FinanceBatch) => {
        e.stopPropagation();
        setEditingBatch(batch);
        setIsModalOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, batchId: string) => {
        e.stopPropagation();
        if (window.confirm('确定要删除（逻辑删除）此批次吗？')) {
            try {
                await deleteBatch(batchId);
                toast.success('批次已移至取消列表');
            } catch (error) {
                toast.error('操作失败');
            }
        }
    };

    const handleToggleSelection = (e: React.MouseEvent, batchId: string) => {
        e.stopPropagation();
        setSelectedBatchIds(prev =>
            prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
        );
    };

    const handleBatchStatusUpdate = async (status: string) => {
        if (selectedBatchIds.length === 0) return;
        try {
            const promises = selectedBatchIds.map(id => updateBatch(id, { status }));
            await Promise.all(promises);
            toast.success(`已批量更新为 ${status}`);
            setSelectedBatchIds([]);
            setIsSelectionMode(false);
        } catch (error) {
            toast.error('批量更新失败');
        }
    };

    const getStatusStyle = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'completed' || s === 'received') return 'bg-green-500/10 text-green-500 border-green-500/20';
        if (s === 'in_transit' || s === 'sealed' || s === 'sender_sealed' || s === 'transit_processing') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        if (s === 'inspected' || s === 'transit_sealed') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        if (s === 'completed' || s === 'received') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        if (s === 'cancelled') return 'bg-red-500/10 text-red-500 border-red-500/20';
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    };

    const getStatusText = (status: string) => {
        const s = status.toLowerCase();
        switch (s) {
            case 'created':
            case 'draft':
            case 'sender_processing': return '发出方处理中';
            case 'sender_sealed':
            case 'sealed': return '待发货';
            case 'in_transit':
            case 'transit_processing': return '中转查验中';
            case 'transit_sealed': return '中转已查验';
            case 'inspected': return '已查验';
            case 'receiver_processing':
            case 'received': return '已签收';
            case 'completed': return '已完成';
            case 'cancelled': return '已取消';
            default: return status;
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display pb-32">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 flex items-center justify-between bg-slate-900 px-4 py-4 shadow-lg border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <span className="material-icons text-white">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold tracking-tight text-white">
                        {isSelectionMode ? `已选 ${selectedBatchIds.length}` : '批次管理'}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            setSelectedBatchIds([]);
                        }}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isSelectionMode ? 'bg-primary text-white' : 'bg-white/5 text-white'}`}
                    >
                        <span className="material-icons">{isSelectionMode ? 'close' : 'checklist'}</span>
                    </button>
                    <button onClick={handleOpenCreateModal} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30">
                        <span className="material-icons">add</span>
                    </button>
                </div>
            </nav>

            {/* Stats Area */}
            <section className="mt-2">
                <div className="flex gap-3 overflow-x-auto px-4 py-2 hide-scrollbar">
                    <div className="flex min-w-[140px] flex-col gap-1 rounded-2xl p-4 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">总计</p>
                        <p className="text-xl font-black">{batches.length}</p>
                    </div>
                    <div className="flex min-w-[140px] flex-col gap-1 rounded-2xl p-4 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50">
                        <p className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">转运中</p>
                        <p className="text-xl font-black">{batches.filter(b => b.status === 'in_transit').length}</p>
                    </div>
                    <div className="flex min-w-[140px] flex-col gap-1 rounded-2xl p-4 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50">
                        <p className="text-green-500 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">已完成</p>
                        <p className="text-xl font-black">{batches.filter(b => b.status === 'completed').length}</p>
                    </div>
                </div>
            </section>

            {/* Filters */}
            <div className="mt-4 px-4 sticky top-[72px] z-40 py-2 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="relative mb-3 group">
                    <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-primary">search</span>
                    <input
                        className="w-full rounded-2xl border-none bg-white dark:bg-slate-800 py-3 pl-12 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-primary/50 outline-none"
                        placeholder="搜索批次号、厂商..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                    {['All', 'Created', 'Sealed', 'In_Transit', 'Inspected', 'Received', 'Completed', 'Cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`flex h-9 shrink-0 items-center justify-center px-4 rounded-xl text-xs font-bold transition-all ${statusFilter === status ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 text-slate-500 shadow-sm'
                                }`}
                        >
                            {status === 'All' ? '全部' : getStatusText(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Batch List */}
            <main className="flex-1 space-y-4 p-4">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : filteredBatches.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                        <span className="material-icons text-4xl mb-2 opacity-20">inventory_2</span>
                        <p>暂无相关批次数据</p>
                    </div>
                ) : (
                    filteredBatches.map(batch => (
                        <div
                            key={batch.id}
                            onClick={() => !isSelectionMode && navigate(`/batch-detail/${batch.id}`)}
                            className={`relative p-5 rounded-3xl bg-white dark:bg-slate-800 border-2 transition-all ${isSelectionMode && selectedBatchIds.includes(batch.id)
                                ? 'border-primary shadow-xl scale-[1.02]'
                                : 'border-transparent shadow-sm hover:border-slate-100 dark:hover:border-slate-700'
                                }`}
                        >
                            {isSelectionMode && (
                                <div
                                    onClick={(e) => handleToggleSelection(e, batch.id)}
                                    className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-lg transition-all ${selectedBatchIds.includes(batch.id) ? 'bg-primary text-white scale-110' : 'bg-white dark:bg-slate-700 text-slate-300'}`}
                                >
                                    <span className="material-icons text-sm">{selectedBatchIds.includes(batch.id) ? 'check' : 'add'}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                        <span className="material-icons text-primary text-xl">dataset</span>
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-slate-900 dark:text-white font-mono tracking-tight">#{batch.batchCode}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(batch.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusStyle(batch.status)}`}>
                                        {getStatusText(batch.status)}
                                    </span>
                                    {!isSelectionMode && (
                                        <div className="relative group/menu">
                                            <button className="p-1 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-400">
                                                <span className="material-icons">more_vert</span>
                                            </button>
                                            <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-2xl z-20 min-w-[120px] overflow-hidden">
                                                <button onClick={(e) => handleOpenEditModal(e, batch)} className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2">
                                                    <span className="material-icons text-sm">edit</span> 编辑
                                                </button>
                                                <button onClick={(e) => handleDelete(e, batch.id)} className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
                                                    <span className="material-icons text-sm">delete</span> 删除
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/30 mb-4">
                                <span className="text-[11px] font-bold text-slate-500 truncate">{batch.senderName}</span>
                                <span className="material-icons text-[12px] text-slate-300">arrow_forward</span>
                                <span className="text-[11px] font-bold text-slate-500 truncate">{batch.transitName || '未分配'}</span>
                                <span className="material-icons text-[12px] text-slate-300">arrow_forward</span>
                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate">{batch.receiverName}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <SenderStageStats batch={batch} isCompact />
                                <TransitStageStats batch={batch} isCompact />
                                <ReceiverStageStats batch={batch} isCompact />
                            </div>

                            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold">账单 A (入)</span>
                                    <span className="font-black text-emerald-500">{batch.billA.amount.toLocaleString()} {batch.billA.currency}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold">账单 B (支)</span>
                                    <span className="font-black text-red-400">{batch.billB.amount.toLocaleString()} {batch.billB.currency}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold">账单 C (结)</span>
                                    <span className="font-black text-blue-400">{batch.billC.amount.toLocaleString()} {batch.billC.currency}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Selection Action Bar */}
            {isSelectionMode && selectedBatchIds.length > 0 && (
                <div className="fixed bottom-24 left-4 right-4 z-[60] animate-drawer-up">
                    <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-2xl border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3 px-2">
                            <span className="text-sm font-black">{selectedBatchIds.length} 项已选</span>
                        </div>
                        <div className="flex gap-2">
                            <select
                                onChange={(e) => handleBatchStatusUpdate(e.target.value)}
                                className="bg-white/10 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                defaultValue=""
                            >
                                <option value="" disabled>修改状态...</option>
                                <option value="created">待发货</option>
                                <option value="sealed">已封箱</option>
                                <option value="in_transit">转运中</option>
                                <option value="completed">已完成</option>
                                <option value="cancelled">逻辑删除</option>
                            </select>
                            <button
                                onClick={() => handleBatchStatusUpdate('cancelled')}
                                className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-red-500/20"
                            >
                                批量取消
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Modal */}
            {isModalOpen && (
                <BatchModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={async (data) => {
                        try {
                            if (editingBatch) {
                                await updateBatch(editingBatch.id, data);
                                toast.success('批次已更新');
                            } else {
                                await createBatch(data);
                                toast.success('新批次已创建');
                            }
                            setIsModalOpen(false);
                        } catch (e) {
                            toast.error('保存失败');
                        }
                    }}
                    initialData={editingBatch}
                    companies={companies || []}
                />
            )}

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700/50 px-6 py-2 pb-8 flex justify-between items-center z-50">
                <button onClick={() => navigate('/admin/dashboard')} className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="material-icons text-[24px]">dashboard</span>
                    <p className="text-[10px] font-medium">仪表盘</p>
                </button>
                <button onClick={() => navigate('/admin/users')} className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="material-icons text-[24px]">group</span>
                    <p className="text-[10px] font-medium">用户</p>
                </button>
                <button onClick={() => navigate('/admin/companies')} className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="material-icons text-[24px]">corporate_fare</span>
                    <p className="text-[10px] font-medium">公司</p>
                </button>
                <button onClick={() => navigate('/admin/batches')} className="flex flex-col items-center gap-1 text-primary">
                    <span className="material-icons text-[24px]">inventory_2</span>
                    <p className="text-[10px] font-black">批次</p>
                </button>
                <button onClick={() => navigate('/admin/profile')} className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="material-icons text-[24px]">person</span>
                    <p className="text-[10px] font-medium">我的</p>
                </button>
            </nav>
        </div>
    );
};

interface BatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData: FinanceBatch | null;
    companies: any[];
}

const BatchModal: React.FC<BatchModalProps> = ({ isOpen, onClose, onSubmit, initialData, companies }) => {
    const [formData, setFormData] = useState({
        batch_no: initialData?.batchCode || '',
        sender_company_id: '', // Need to find ID if editing, but usually easier to pass IDs in FinanceBatch or use a lookup
        transit_company_id: '',
        receiver_company_id: '',
        status: initialData?.status || 'created',
        total_weight: initialData?.totalWeight || 0,
        sender_weight: initialData?.senderWeight || 0,
        transit_weight: initialData?.transitWeight || 0,
        receiver_weight: initialData?.receiverWeight || 0,
        total_volume: initialData?.totalVolume || 0
    });

    useEffect(() => {
        if (initialData && companies.length > 0) {
            const sender = companies.find(c => c.name === initialData.senderName);
            const transit = companies.find(c => c.name === initialData.transitName);
            const receiver = companies.find(c => c.name === initialData.receiverName);
            setFormData(f => ({
                ...f,
                sender_company_id: sender?.id || '',
                transit_company_id: transit?.id || '',
                receiver_company_id: receiver?.id || '',
                sender_weight: initialData.senderWeight || 0,
                transit_weight: initialData.transitWeight || 0,
                receiver_weight: initialData.receiverWeight || 0,
                total_volume: initialData.totalVolume || 0,
            }));
        }
    }, [initialData, companies]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.batch_no || !formData.sender_company_id || !formData.receiver_company_id) {
            toast.error('请填写必要字段');
            return;
        }
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-50 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">{initialData ? '编辑批次' : '创建新批次'}</h2>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">物流数据维护</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                        <span className="material-icons text-slate-500">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">批次编号</label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary shadow-inner"
                                value={formData.batch_no}
                                onChange={(e) => setFormData({ ...formData, batch_no: e.target.value })}
                                placeholder="BT-2024XXXX"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">发货商 (Sender)</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary"
                                value={formData.sender_company_id}
                                onChange={(e) => setFormData({ ...formData, sender_company_id: e.target.value })}
                            >
                                <option value="">选择发货商...</option>
                                {companies.filter(c => c.role === 'sender').map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">收货商 (Receiver)</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary"
                                value={formData.receiver_company_id}
                                onChange={(e) => setFormData({ ...formData, receiver_company_id: e.target.value })}
                            >
                                <option value="">选择收货商...</option>
                                {companies.filter(c => c.role === 'receiver').map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">转运商 (Transit - 可选)</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary"
                                value={formData.transit_company_id}
                                onChange={(e) => setFormData({ ...formData, transit_company_id: e.target.value })}
                            >
                                <option value="">选择转运商...</option>
                                {companies.filter(c => c.role === 'transit').map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">状态</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="created">待发货</option>
                                    <option value="sealed">已封箱</option>
                                    <option value="in_transit">转运中</option>
                                    <option value="inspected">已查验</option>
                                    <option value="received">已收货</option>
                                    <option value="completed">已完成</option>
                                    <option value="cancelled">已取消</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">总尺寸/体积 (m³)</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary shadow-inner"
                                    value={formData.total_volume}
                                    onChange={(e) => setFormData({ ...formData, total_volume: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        {/* 各方重量录入 */}
                        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/50">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-primary uppercase tracking-widest px-1">发货重 (S)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border-none bg-white dark:bg-slate-800 rounded-xl py-2 px-3 text-xs font-black shadow-sm"
                                    value={formData.sender_weight}
                                    onChange={(e) => setFormData({ ...formData, sender_weight: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-accent-yellow uppercase tracking-widest px-1">中转重 (T)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border-none bg-white dark:bg-slate-800 rounded-xl py-2 px-3 text-xs font-black shadow-sm"
                                    value={formData.transit_weight}
                                    onChange={(e) => setFormData({ ...formData, transit_weight: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-accent-green uppercase tracking-widest px-1">收货重 (R)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border-none bg-white dark:bg-slate-800 rounded-xl py-2 px-3 text-xs font-black shadow-sm"
                                    value={formData.receiver_weight}
                                    onChange={(e) => setFormData({ ...formData, receiver_weight: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-white rounded-[24px] py-4 text-sm font-black shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        {initialData ? '保存修改' : '立即创建批次'}
                    </button>

                    <div className="h-4"></div>
                </form>
            </div>
        </div>
    );
};

export default BatchManagement;
