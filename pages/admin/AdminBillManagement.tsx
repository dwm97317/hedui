
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore, FinanceBatch, FinanceBill, BillStatus, Currency, FinancePayment } from '../../store/finance.store';
import { useFinanceStats } from '../../hooks/useFinanceStats';
import { useAdminCompanies } from '../../hooks/useAdmin';
import { SenderStageStats, TransitStageStats, ReceiverStageStats } from '../../components/batch/BatchStageStats';
import toast from 'react-hot-toast';

const AdminBillManagement: React.FC = () => {
    const navigate = useNavigate();
    const { batches, loading, fetchBatches } = useFinanceStore();
    const { data: stats } = useFinanceStats();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBatch, setSelectedBatch] = useState<FinanceBatch | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        fetchBatches();
    }, [fetchBatches]);

    const filteredBatches = batches.filter(batch => {
        const matchesSearch = batch.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            batch.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            batch.transitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            batch.receiverName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const openDrawer = (batch: FinanceBatch) => {
        setSelectedBatch(batch);
        setIsDrawerOpen(true);
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display pb-24">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 flex items-center justify-between bg-slate-900 px-4 py-4 shadow-lg border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <span className="material-icons text-white">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold tracking-tight text-white">账单管理</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => fetchBatches()} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <span className="material-icons text-white">refresh</span>
                    </button>
                </div>
            </nav>

            {/* Stats Grid */}
            <section className="grid grid-cols-2 gap-3 p-4">
                <div className="flex flex-col gap-1 rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm transition-all duration-300">
                    <div className="flex items-center justify-between mb-1">
                        <span className="material-icons text-yellow-500 text-xl">hourglass_empty</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">待结算 (VND)</span>
                    </div>
                    <span className="text-xl font-bold dark:text-white">₫{stats?.vnd.pending.toLocaleString() || '0'}</span>
                </div>
                <div className="flex flex-col gap-1 rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm transition-all duration-300">
                    <div className="flex items-center justify-between mb-1">
                        <span className="material-icons text-green-500 text-xl">check_circle</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">已结算 (VND)</span>
                    </div>
                    <span className="text-xl font-bold dark:text-white">₫{stats?.vnd.paid.toLocaleString() || '0'}</span>
                </div>
                <div className="flex flex-col gap-1 rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm transition-all duration-300">
                    <div className="flex items-center justify-between mb-1">
                        <span className="material-icons text-primary text-xl">payments</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">待结算 (CNY)</span>
                    </div>
                    <span className="text-xl font-bold dark:text-white">¥{stats?.cny.pending.toLocaleString() || '0'}</span>
                </div>
                <div className="flex flex-col gap-1 rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm transition-all duration-300">
                    <div className="flex items-center justify-between mb-1">
                        <span className="material-icons text-primary text-xl">check_circle</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">已结算 (CNY)</span>
                    </div>
                    <span className="text-xl font-bold dark:text-white">¥{stats?.cny.paid.toLocaleString() || '0'}</span>
                </div>
            </section>

            {/* Search Bar */}
            <section className="px-4 py-2">
                <div className="relative group">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-primary transition-colors">search</span>
                    <input
                        className="w-full rounded-2xl border-none bg-white dark:bg-slate-800 py-3 pl-10 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                        placeholder="搜索批次编号、商户名称..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </section>

            {/* Batch List Area */}
            <main className="flex flex-col gap-3 p-4">
                <h3 className="px-1 text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 mt-2">批次列表</h3>
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
                            onClick={() => openDrawer(batch)}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 active:scale-[0.98] transition-all relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-all group-hover:bg-primary/10"></div>

                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <span className="material-icons text-primary text-xl">dataset</span>
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-slate-900 dark:text-white font-mono tracking-tight">#{batch.batchCode}</p>
                                        <p className="text-[11px] text-slate-400">{new Date(batch.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${batch.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                    batch.status === 'in_transit' ? 'bg-blue-500/10 text-blue-500' :
                                        'bg-orange-500/10 text-orange-500'
                                    }`}>
                                    {batch.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 mb-3 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">计费重量 breakdown (KG)</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">账单进度</span>
                                            <div className="flex gap-1">
                                                {['A', 'B', 'C'].map(type => {
                                                    const bill = type === 'A' ? batch.billA : type === 'B' ? batch.billB : batch.billC;
                                                    const exists = bill && !bill.id.startsWith('missing-');
                                                    const isPaid = bill?.status === BillStatus.PAID;
                                                    return (
                                                        <div key={type} className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black transition-all ${isPaid ? 'bg-green-500 text-white shadow-sm' : exists ? 'bg-yellow-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                            {type}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <SenderStageStats batch={batch} isCompact />
                                        <TransitStageStats batch={batch} isCompact />
                                        <ReceiverStageStats batch={batch} isCompact />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/30">
                                <span className="material-icons text-slate-400 text-xs">business</span>
                                <p className="text-xs text-slate-500 truncate font-medium">
                                    {batch.senderName} → {batch.receiverName}
                                </p>
                                <div className="ml-auto">
                                    <span className="material-icons text-slate-300 text-sm">chevron_right</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Batch Bills Drawer */}
            {selectedBatch && (
                <BatchBillsDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    batch={batches.find(b => b.id === selectedBatch.id) || selectedBatch}
                />
            )}

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700/50 px-6 py-2 pb-8 flex justify-between items-center z-50">
                <button onClick={() => navigate('/admin/dashboard')} className="flex flex-col items-center gap-1 text-slate-400 group">
                    <span className="material-icons text-[24px] group-active:scale-110 transition-transform">dashboard</span>
                    <p className="text-[10px] font-medium">仪表盘</p>
                </button>
                <button onClick={() => navigate('/admin/users')} className="flex flex-col items-center gap-1 text-slate-400 group">
                    <span className="material-icons text-[24px] group-active:scale-110 transition-transform">group</span>
                    <p className="text-[10px] font-medium">用户</p>
                </button>
                <button onClick={() => navigate('/admin/companies')} className="flex flex-col items-center gap-1 text-slate-400 group">
                    <span className="material-icons text-[24px] group-active:scale-110 transition-transform">corporate_fare</span>
                    <p className="text-[10px] font-medium">公司</p>
                </button>
                <button onClick={() => navigate('/admin/batches')} className="flex flex-col items-center gap-1 text-slate-400 group">
                    <span className="material-icons text-[24px] group-active:scale-110 transition-transform">inventory_2</span>
                    <p className="text-[10px] font-medium">批次</p>
                </button>
                <button onClick={() => navigate('/admin/profile')} className="flex flex-col items-center gap-1 text-slate-400 group">
                    <span className="material-icons text-[24px] group-active:scale-110 transition-transform">person</span>
                    <p className="text-[10px] font-medium">我的</p>
                </button>
            </nav>
        </div>
    );
};

interface BatchBillsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    batch: FinanceBatch;
}

const BatchBillsDrawer: React.FC<BatchBillsDrawerProps> = ({ isOpen, onClose, batch }) => {
    const { deleteBill, updateBillUnitPrice, createBill, addBillPayment, deleteBillPayment } = useFinanceStore();
    const { data: companies } = useAdminCompanies();

    // UI Local State
    const [expandedBill, setExpandedBill] = useState<string | null>(null);
    const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
    const [paymentCurrencies, setPaymentCurrencies] = useState<Record<string, 'VND' | 'CNY'>>({});
    const exchangeRates = useFinanceStore(state => state.exchangeRates);

    if (!isOpen) return null;

    const handleDelete = async (billId: string) => {
        if (window.confirm('确定要彻底删除这张账单吗？')) {
            try {
                await deleteBill(billId);
                toast.success('账单已删除');
            } catch (error) {
                toast.error('删除失败');
            }
        }
    };

    const handleAddPayment = async (billId: string, item: FinanceBill) => {
        const amountStr = paymentAmounts[billId];
        const inputAmount = parseFloat(amountStr);
        const selectedCurrency = paymentCurrencies[billId] || item.currency;

        if (!inputAmount || inputAmount <= 0) {
            toast.error('请输入有效的付款金额');
            return;
        }

        let finalAmount = inputAmount;
        let method = 'Partial';

        // Dual currency logic for Bill A (VND bill paid in CNY)
        if (item.currency === 'VND' && selectedCurrency === 'CNY') {
            finalAmount = Math.round(inputAmount * exchangeRates.CNY_VND);
            method = `CNY_PAY (Ref Rate: ${exchangeRates.CNY_VND})`;
            if (!window.confirm(`即将按汇率 ${exchangeRates.CNY_VND} 将 ¥${inputAmount} 转换为 ₫${finalAmount.toLocaleString()} 录入，确定吗？`)) {
                return;
            }
        }

        try {
            await addBillPayment(billId, finalAmount, method);
            setPaymentAmounts(prev => ({ ...prev, [billId]: '' }));
            toast.success('付款记录已添加');
        } catch (error) {
            toast.error('记录添加失败');
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (window.confirm('确定要删除这笔付款记录吗？')) {
            try {
                await deleteBillPayment(paymentId);
                toast.success('付款记录已移除');
            } catch (error) {
                toast.error('移除失败');
            }
        }
    };

    const handleGenerateMissing = async (type: string) => {
        if (!companies) {
            toast.error('公司数据加载中，请稍后');
            return;
        }

        try {
            const adminCompany = companies.find(c => c.role === 'admin');
            const senderCompany = companies.find(c => c.name === batch.senderName);
            const transitCompany = companies.find(c => c.name === batch.transitName);
            const receiverCompany = companies.find(c => c.name === batch.receiverName);

            let payerId, payeeId;
            if (type === 'SENDER_TO_ADMIN') { payerId = senderCompany?.id; payeeId = adminCompany?.id; }
            else if (type === 'ADMIN_TO_TRANSIT') { payerId = adminCompany?.id; payeeId = transitCompany?.id; }
            else { payerId = senderCompany?.id; payeeId = receiverCompany?.id; }

            if (!payerId || !payeeId) {
                toast.error('未能匹配到付款或收款方公司');
                return;
            }

            await createBill({
                batch_id: batch.id,
                bill_type: type,
                currency: type === 'SENDER_TO_RECEIVER' ? 'CNY' : 'VND',
                total_weight: batch.totalWeight,
                unit_price: type === 'SENDER_TO_ADMIN' ? 50000 : type === 'ADMIN_TO_TRANSIT' ? 40000 : 15,
                payer_company_id: payerId,
                payee_company_id: payeeId,
                status: 'pending'
            });
            toast.success('账单已强制生成');
        } catch (error) {
            toast.error('生成失败');
        }
    };

    const renderBill = (type: 'A' | 'B' | 'C', bill: FinanceBill) => {
        const isMissing = bill.id.startsWith('missing-');
        const title = type === 'A' ? '账单A (发货商 -> 平台)' : type === 'B' ? '账单B (平台 -> 转运商)' : '账单C (发货商 -> 收货商)';
        const isExpanded = expandedBill === bill.id;

        const paid_amount = bill.paidAmount || 0;
        const total_amount = bill.amount || 0;
        const remaining = total_amount - paid_amount;
        const progress = Math.min((paid_amount / total_amount) * 100, 100);

        return (
            <div className={`rounded-3xl transition-all duration-300 border ${isExpanded ? 'bg-white dark:bg-slate-800 shadow-xl border-primary/20 scale-[1.02]' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                <div className="p-5 cursor-pointer" onClick={() => !isMissing && setExpandedBill(isExpanded ? null : bill.id)}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 max-w-[70%]">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isMissing ? 'bg-slate-200 dark:bg-slate-700' : 'bg-primary text-white shadow-sm shadow-primary/30'}`}>{type}</span>
                            <h4 className="text-sm font-bold truncate">{title}</h4>
                        </div>
                        {isMissing ? (
                            <button onClick={(e) => { e.stopPropagation(); handleGenerateMissing(bill.type); }} className="text-[10px] font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-full active:scale-90 transition-all">强制生成</button>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${bill.status === 'paid' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : bill.status === 'partially_paid' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-slate-400/10 text-slate-400 border border-slate-400/20'}`}>
                                    {bill.status === 'paid' ? '已付清' : bill.status === 'partially_paid' ? '部分付' : '未支付'}
                                </span>
                                <span className={`material-icons text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                            </div>
                        )}
                    </div>

                    {isMissing ? (
                        <div className="py-2 text-center opacity-30 italic text-[11px]">当前批次状态未触发此账单</div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-baseline">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">应付总额</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-mono font-black text-slate-900 dark:text-white leading-none">
                                            {bill.currency} {bill.amount.toLocaleString()}
                                        </span>
                                        {bill.currency === 'VND' && (
                                            <span className="text-[10px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded-md border border-primary/20">
                                                约 ¥{(bill.amount / exchangeRates.CNY_VND).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-4 text-right">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">计费重量</span>
                                        <span className="text-sm font-black opacity-90">{(bill.totalWeight || 0).toFixed(2)} <span className="text-[10px]">KG</span></span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">单价</span>
                                        <span className="text-sm font-black opacity-90">{bill.unitPrice}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Progress */}
                            {!isMissing && (
                                <div className="space-y-2 py-1">
                                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-300/10 dark:border-white/5">
                                        <div
                                            className={`h-full transition-all duration-1000 ease-out shadow-sm ${progress === 100 ? 'bg-green-500 shadow-green-500/20' : 'bg-primary shadow-primary/20'}`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <div className="flex flex-col">
                                            <span className="flex items-center gap-1">已付: <span className="text-slate-700 dark:text-slate-300">{paid_amount.toLocaleString()}</span></span>
                                            {bill.currency === 'VND' && paid_amount > 0 && (
                                                <span className="text-[9px] opacity-60 font-medium">≈ ¥{(paid_amount / exchangeRates.CNY_VND).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end text-right">
                                            <span className={remaining > 0 ? 'text-orange-500' : 'text-green-500'}>
                                                {remaining > 0 ? `待付: ${remaining.toLocaleString()}` : '已结清'}
                                            </span>
                                            {bill.currency === 'VND' && remaining > 0 && (
                                                <span className="text-[9px] opacity-60 font-medium">≈ ¥{(remaining / exchangeRates.CNY_VND).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Expanded Details: Payment History & Partial Payment */}
                {isExpanded && !isMissing && (
                    <div className="px-5 pb-6 pt-2 space-y-5 animate-fade-in border-t border-slate-100 dark:border-slate-800">
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button onClick={() => {
                                const newPrice = prompt('请输入新单价 (将重置此账单所有付款)', bill.unitPrice?.toString());
                                if (newPrice) updateBillUnitPrice(bill.id, parseFloat(newPrice));
                            }} className="flex-1 py-2 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors uppercase tracking-widest">账单调价</button>
                            <button onClick={() => handleDelete(bill.id)} className="px-4 py-2 text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">删除账单</button>
                        </div>

                        {/* Payment History */}
                        <div className="space-y-3">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">付款纪录 ({bill.payments.length})</h5>
                            {bill.payments.length === 0 ? (
                                <div className="py-6 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <p className="text-[11px] text-slate-400">暂无任何付款记录</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {bill.payments.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm group">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-mono font-black text-slate-700 dark:text-white">+{p.amount.toLocaleString()}</span>
                                                <span className="text-[9px] text-slate-400 uppercase font-bold">{new Date(p.payment_date).toLocaleString()}</span>
                                            </div>
                                            <button onClick={() => handleDeletePayment(p.id)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                                <span className="material-icons text-sm">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Partial Payment */}
                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                            <div className="flex items-center justify-between mb-3">
                                <h5 className="text-[10px] font-bold text-primary uppercase tracking-widest">录入新付款</h5>
                                {/* Bill A Dual Currency Toggle */}
                                {type === 'A' && (
                                    <div className="flex bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                        {(['VND', 'CNY'] as const).map(curr => (
                                            <button
                                                key={curr}
                                                onClick={() => setPaymentCurrencies(prev => ({ ...prev, [bill.id]: curr }))}
                                                className={`px-2 py-1 text-[9px] font-black rounded-md transition-all ${(paymentCurrencies[bill.id] || bill.currency) === curr
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                {curr}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-xs">
                                            {paymentCurrencies[bill.id] || bill.currency}
                                        </span>
                                        <input
                                            type="number"
                                            placeholder="金额"
                                            value={paymentAmounts[bill.id] || ''}
                                            onChange={(e) => setPaymentAmounts(prev => ({ ...prev, [bill.id]: e.target.value }))}
                                            className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-2.5 pl-12 pr-4 text-xs font-bold focus:ring-1 focus:ring-primary shadow-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleAddPayment(bill.id, bill)}
                                        className="px-5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        确认付款
                                    </button>
                                </div>

                                {/* Exchange Rate Hint for Bill A */}
                                {type === 'A' && paymentCurrencies[bill.id] === 'CNY' && paymentAmounts[bill.id] && (
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="material-icons text-primary text-[14px]">swap_horiz</span>
                                        <p className="text-[10px] text-slate-500 font-medium">
                                            约合 {bill.currency} <span className="text-primary font-black">{(parseFloat(paymentAmounts[bill.id]) * exchangeRates.CNY_VND).toLocaleString()}</span> (汇率: {exchangeRates.CNY_VND})
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-md transition-opacity duration-300">
            <div className="w-full max-w-md bg-white dark:bg-[#0F141A] rounded-t-[40px] shadow-2xl animate-drawer-up max-h-[95vh] flex flex-col">
                <div className="flex justify-center p-3">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                </div>

                <div className="px-6 pb-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">批次财务对账</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-black text-primary uppercase tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded-md">BATCH_ID</span>
                            <span className="text-xs font-mono font-bold text-slate-500">#{batch.batchCode}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center active:scale-90 transition-all">
                        <span className="material-icons text-slate-500 text-xl font-bold">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Stage Stats Summary */}
                    <div className="grid grid-cols-1 gap-4 mb-2">
                        <SenderStageStats batch={batch} />
                        <TransitStageStats batch={batch} />
                        <ReceiverStageStats batch={batch} />
                    </div>

                    <div className="space-y-4">
                        {renderBill('A', batch.billA)}
                        {renderBill('B', batch.billB)}
                        {renderBill('C', batch.billC)}
                    </div>

                    <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white shadow-xl shadow-slate-900/20 relative overflow-hidden mt-2">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                        <h5 className="text-[10px] font-black uppercase text-primary mb-3 tracking-widest relative z-10">操作指南</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                            • 系统支持<span className="text-white font-bold mx-1">多次部分付款</span>，直到账单总额清空为止。<br />
                            • 修改单价会关联更新所有动态计费项，<span className="text-primary font-bold mx-1">谨慎操作</span>。<br />
                            • 长按付款记录可查看详细操作人。
                        </p>
                    </div>

                    <div className="h-12"></div>
                </div>
            </div>
        </div>
    );
};

export default AdminBillManagement;
