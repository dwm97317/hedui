import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/user.store';
import { useFinanceStore, FinanceBatch, FinanceBill, BillStatus, Currency } from '../../store/finance.store';
import { SenderStageStats, TransitStageStats, ReceiverStageStats } from '@/components/batch/BatchStageStats';

// Role → Bill type mapping (supports multiple bills per role)
type BillConfig = { key: 'billA' | 'billB' | 'billC'; label: string; shortLabel: string; type: string; color: string };

const ROLE_BILLS_MAP: Record<string, BillConfig[]> = {
    sender: [
        { key: 'billA', label: '发货账单 (Bill A)', shortLabel: 'A', type: 'SENDER_TO_ADMIN', color: 'text-blue-400 bg-blue-500/15 border-blue-500/20' },
        { key: 'billC', label: '收货账单 (Bill C)', shortLabel: 'C', type: 'SENDER_TO_RECEIVER', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20' },
    ],
    transit: [
        { key: 'billB', label: '中转账单 (Bill B)', shortLabel: 'B', type: 'ADMIN_TO_TRANSIT', color: 'text-purple-400 bg-purple-500/15 border-purple-500/20' },
    ],
    receiver: [
        { key: 'billC', label: '收货账单 (Bill C)', shortLabel: 'C', type: 'SENDER_TO_RECEIVER', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20' },
    ],
};

const ROLE_NAMES: Record<string, string> = {
    sender: '发货方',
    transit: '中转方',
    receiver: '接收方',
    admin: '管理员',
};

const BILL_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
    billA: { label: 'Bill A · 发→管', icon: 'north_east' },
    billB: { label: 'Bill B · 管→中', icon: 'swap_horiz' },
    billC: { label: 'Bill C · 发→收', icon: 'south_east' },
};

const WalletPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { batches, loading, fetchBatches, exchangeRates } = useFinanceStore();
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'partially_paid'>('all');
    const [billTypeFilter, setBillTypeFilter] = useState<'all' | 'billA' | 'billB' | 'billC'>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    const role = user?.role || 'sender';
    const billConfigs = ROLE_BILLS_MAP[role] || ROLE_BILLS_MAP.sender;

    useEffect(() => {
        if (batches.length === 0) {
            fetchBatches();
        }
    }, []);

    // Extract bills for this role — supports multiple bill types per role
    const myBills = useMemo(() => {
        const results: { batch: FinanceBatch; bill: FinanceBill; config: BillConfig }[] = [];
        batches.forEach(batch => {
            billConfigs.forEach(config => {
                const bill = batch[config.key];
                if (bill && !bill.id.startsWith('missing-')) {
                    results.push({ batch, bill, config });
                }
            });
        });
        // Sort by date descending
        results.sort((a, b) => new Date(b.bill.createdAt).getTime() - new Date(a.bill.createdAt).getTime());
        return results;
    }, [batches, billConfigs]);

    // Apply filters
    const filteredBills = useMemo(() => {
        let result = myBills;
        if (filter !== 'all') {
            result = result.filter(item => item.bill.status === filter);
        }
        if (billTypeFilter !== 'all') {
            result = result.filter(item => item.config.key === billTypeFilter);
        }
        return result;
    }, [myBills, filter, billTypeFilter]);

    // Compute summary stats
    const stats = useMemo(() => {
        let totalAmount = 0;
        let totalPaid = 0;
        let pendingCount = 0;
        let settledCount = 0;

        // Monthly stats (current month)
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        let monthTotal = 0;
        let monthPaid = 0;

        // Per-bill-type breakdown for sender (VND vs CNY)
        let vndTotal = 0;
        let cnyTotal = 0;
        let vndRemaining = 0;
        let cnyRemaining = 0;

        myBills.forEach(({ bill }) => {
            totalAmount += bill.amount;
            totalPaid += bill.paidAmount;
            if (bill.status === BillStatus.PAID) {
                settledCount++;
            } else {
                pendingCount++;
            }

            const billDate = new Date(bill.createdAt);
            if (billDate >= monthStart) {
                monthTotal += bill.amount;
                monthPaid += bill.paidAmount;
            }

            // Currency breakdown
            if (bill.currency === Currency.VND) {
                vndTotal += bill.amount;
                vndRemaining += (bill.amount - bill.paidAmount);
            } else {
                cnyTotal += bill.amount;
                cnyRemaining += (bill.amount - bill.paidAmount);
            }
        });

        return {
            totalAmount,
            totalPaid,
            remaining: totalAmount - totalPaid,
            pendingCount,
            settledCount,
            monthTotal,
            monthPaid,
            monthRemaining: monthTotal - monthPaid,
            vndTotal,
            cnyTotal,
            vndRemaining,
            cnyRemaining,
        };
    }, [myBills]);

    const rate = exchangeRates.CNY_VND || 3750;

    const formatAmount = (amount: number, currency?: Currency) => {
        const cur = currency || Currency.VND;
        if (cur === Currency.VND) {
            return `₫${amount.toLocaleString()}`;
        }
        return `¥${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    };

    const toCny = (vndAmount: number) => {
        return `≈ ¥${(vndAmount / rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    };

    const getStatusBadge = (status: BillStatus) => {
        switch (status) {
            case BillStatus.PAID:
                return { text: '已结清', bg: 'bg-green-500/15', text_color: 'text-green-400', border: 'border-green-500/20' };
            case BillStatus.PARTIALLY_PAID:
                return { text: '部分付', bg: 'bg-blue-500/15', text_color: 'text-blue-400', border: 'border-blue-500/20' };
            case BillStatus.OVERDUE:
                return { text: '逾期', bg: 'bg-red-500/15', text_color: 'text-red-400', border: 'border-red-500/20' };
            default:
                return { text: '待付', bg: 'bg-orange-500/15', text_color: 'text-orange-400', border: 'border-orange-500/20' };
        }
    };

    // Balance label depends on role
    const balanceLabel = role === 'transit' ? '待收余额' : '待付余额';
    const balanceIcon = role === 'transit' ? 'savings' : 'account_balance_wallet';
    const hasDualCurrency = role === 'sender'; // Sender has VND (Bill A) + CNY (Bill C)

    return (
        <div className="flex flex-col h-full bg-[#0f172a] text-white">
            {/* ─── Header ─── */}
            <header className="flex items-center justify-between px-4 py-3 bg-[#111827]/90 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
                <button onClick={() => navigate(-1)} className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                    <span className="material-icons">arrow_back_ios_new</span>
                </button>
                <h1 className="text-lg font-black tracking-tight text-white">我的钱包</h1>
                <div className="w-10 flex items-center justify-center">
                    <span className="material-icons text-primary text-lg">{balanceIcon}</span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
                {/* ─── Role Badge ─── */}
                <div className="px-5 pt-4 pb-2 flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <span className="material-icons text-primary text-sm">badge</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">
                            {ROLE_NAMES[role]}
                        </span>
                    </div>
                    {billConfigs.map(c => (
                        <span key={c.key} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black border ${c.color}`}>
                            {c.shortLabel} · {c.label.split('(')[0].trim()}
                        </span>
                    ))}
                </div>

                {/* ─── Balance Hero Card ─── */}
                <div className="px-5 pt-2 pb-4">
                    <div className="relative overflow-hidden rounded-[24px] p-6 bg-gradient-to-br from-[#1a2744] via-[#1e3a5f] to-[#2a1f5e] border border-white/10 shadow-2xl">
                        {/* Decorative orbs */}
                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                    <span className="material-icons text-white text-lg">{balanceIcon}</span>
                                </div>
                                <span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.2em]">{balanceLabel}</span>
                            </div>

                            {loading ? (
                                <div className="h-12 flex items-center gap-3">
                                    <span className="material-icons animate-spin text-primary/50">refresh</span>
                                    <span className="text-sm text-white/40">加载中...</span>
                                </div>
                            ) : (
                                <>
                                    {/* Dual currency balance for sender */}
                                    {hasDualCurrency ? (
                                        <div className="space-y-2 mb-4">
                                            {stats.vndRemaining > 0 && (
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-[9px] font-black text-blue-400 bg-blue-500/15 px-1.5 py-0.5 rounded border border-blue-500/20">A</span>
                                                    <span className="text-2xl font-black text-white tracking-tight">₫{stats.vndRemaining.toLocaleString()}</span>
                                                    <span className="text-xs text-white/30 font-medium">{toCny(stats.vndRemaining)}</span>
                                                </div>
                                            )}
                                            {stats.cnyRemaining > 0 && (
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">C</span>
                                                    <span className="text-2xl font-black text-white tracking-tight">¥{stats.cnyRemaining.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                                </div>
                                            )}
                                            {stats.vndRemaining === 0 && stats.cnyRemaining === 0 && (
                                                <div className="text-2xl font-black text-green-400 tracking-tight">全部已结清 ✓</div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-3xl font-black text-white tracking-tight leading-none mb-1">
                                                {formatAmount(stats.remaining, role === 'receiver' ? Currency.CNY : Currency.VND)}
                                            </div>
                                            {role !== 'receiver' && stats.remaining > 0 && (
                                                <div className="text-sm font-medium text-white/40 mb-4">
                                                    {toCny(stats.remaining)}
                                                </div>
                                            )}
                                            {(role === 'receiver' || stats.remaining <= 0) && <div className="mb-4"></div>}
                                        </>
                                    )}

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 text-[10px] font-black border border-orange-500/20">
                                            <span className="material-icons text-[12px]">schedule</span>
                                            待付 {stats.pendingCount} 笔
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 text-[10px] font-black border border-green-500/20">
                                            <span className="material-icons text-[12px]">check_circle</span>
                                            已结清 {stats.settledCount} 笔
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-white/50 text-[10px] font-black border border-white/10">
                                            共 {myBills.length} 笔
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Quick Stats Row ─── */}
                <div className="px-5 pb-5 grid grid-cols-3 gap-3">
                    <div className="bg-[#1e293b] rounded-2xl p-3.5 border border-white/5">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">本月应付</div>
                        <div className="text-sm font-black text-white">₫{stats.monthTotal.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#1e293b] rounded-2xl p-3.5 border border-white/5">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">本月已付</div>
                        <div className="text-sm font-black text-green-400">₫{stats.monthPaid.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#1e293b] rounded-2xl p-3.5 border border-white/5">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">待结清</div>
                        <div className="text-sm font-black text-orange-400">₫{stats.monthRemaining.toLocaleString()}</div>
                    </div>
                </div>

                {/* ─── Divider ─── */}
                <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4"></div>

                {/* ─── Transaction List Header ─── */}
                <div className="px-5 flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-primary text-lg">receipt_long</span>
                        <h2 className="text-sm font-black text-white tracking-tight">账单流水</h2>
                        <span className="text-[10px] font-bold text-slate-500">({filteredBills.length})</span>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1e293b] text-[10px] font-black text-slate-400 uppercase tracking-widest border border-white/5 hover:border-primary/30 transition-colors"
                        >
                            <span className="material-icons text-[14px]">filter_list</span>
                            {filter === 'all' ? '全部' : filter === 'paid' ? '已结清' : filter === 'pending' ? '待付' : '部分付'}
                        </button>

                        {showFilterMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-20 py-1 min-w-[120px] animate-scale">
                                {[
                                    { value: 'all' as const, label: '全部' },
                                    { value: 'pending' as const, label: '待付' },
                                    { value: 'partially_paid' as const, label: '部分付' },
                                    { value: 'paid' as const, label: '已结清' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setFilter(opt.value); setShowFilterMenu(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${filter === opt.value ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Bill Type Tabs (only show when role has multiple bill types) ─── */}
                {billConfigs.length > 1 && (
                    <div className="px-5 mb-4 flex items-center gap-2">
                        <button
                            onClick={() => setBillTypeFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${billTypeFilter === 'all' ? 'bg-primary/15 text-primary border-primary/30' : 'bg-[#1e293b] text-slate-500 border-white/5 hover:text-slate-300'}`}
                        >
                            全部
                        </button>
                        {billConfigs.map(c => (
                            <button
                                key={c.key}
                                onClick={() => setBillTypeFilter(c.key)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${billTypeFilter === c.key ? `${c.color}` : 'bg-[#1e293b] text-slate-500 border-white/5 hover:text-slate-300'}`}
                            >
                                {c.shortLabel} · {c.label.split('(')[0].trim()}
                            </button>
                        ))}
                    </div>
                )}

                {/* ─── Bill List ─── */}
                <div className="px-5 space-y-3 pb-8">
                    {loading ? (
                        <div className="py-16 flex flex-col items-center gap-4">
                            <span className="material-icons animate-spin text-4xl text-primary/30">refresh</span>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">同步账单中...</span>
                        </div>
                    ) : filteredBills.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 opacity-40">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                                <span className="material-icons text-4xl text-slate-600">receipt_long</span>
                            </div>
                            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">暂无账单记录</p>
                            <p className="text-[10px] text-slate-700">当批次产生账单后将显示在这里</p>
                        </div>
                    ) : (
                        filteredBills.map(({ batch, bill, config }) => {
                            const statusBadge = getStatusBadge(bill.status);
                            const remaining = bill.amount - bill.paidAmount;
                            const progress = bill.amount > 0 ? Math.min(100, (bill.paidAmount / bill.amount) * 100) : 0;
                            const billCurrency = bill.currency;
                            const isIncome = role === 'transit'; // Transit receives money
                            const typeInfo = BILL_TYPE_LABELS[config.key];

                            return (
                                <div
                                    key={`${bill.id}-${config.key}`}
                                    className="bg-[#1e293b] rounded-2xl p-4 border border-white/5 hover:border-primary/20 transition-all active:scale-[0.98] cursor-pointer group"
                                    onClick={() => navigate(`/finance/bill/${bill.id}`)}
                                >
                                    {/* Top row: batch info + amount */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                {/* Bill type badge */}
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${config.color}`}>
                                                    <span className="material-icons text-[10px] align-middle mr-0.5">{typeInfo.icon}</span>
                                                    {typeInfo.label}
                                                </span>
                                                <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                    #{batch.batchCode}
                                                </span>
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${statusBadge.bg} ${statusBadge.text_color} ${statusBadge.border} border`}>
                                                    {statusBadge.text}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-2">
                                                <span className="material-icons text-[12px]">event</span>
                                                {new Date(bill.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                            </div>
                                            {/* Stage Specific SRT & CBM */}
                                            <div className="mb-3 max-w-[240px]">
                                                {config.key === 'billA' && <SenderStageStats batch={batch} isCompact className="dark:bg-[#111827] border-white/5" />}
                                                {config.key === 'billB' && <TransitStageStats batch={batch} isCompact className="dark:bg-[#111827] border-white/5" />}
                                                {config.key === 'billC' && <ReceiverStageStats batch={batch} isCompact className="dark:bg-[#111827] border-white/5" />}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                            <div className={`text-base font-black ${isIncome ? 'text-green-400' : 'text-white'}`}>
                                                {isIncome ? '+' : ''}{formatAmount(bill.amount, billCurrency)}
                                            </div>
                                            {billCurrency === Currency.VND && (
                                                <div className="text-[10px] text-slate-500 font-medium">
                                                    {toCny(bill.amount)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payer/Payee info */}
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-3">
                                        <span className="material-icons text-[12px]">person</span>
                                        <span className="font-medium">{bill.payer}</span>
                                        <span className="material-icons text-[10px] text-slate-700">arrow_forward</span>
                                        <span className="font-medium">{bill.payee}</span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="space-y-1.5">
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-700 ease-out rounded-full ${progress === 100 ? 'bg-green-500' : progress > 0 ? 'bg-primary' : 'bg-slate-700'}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-[9px] font-bold">
                                            <span className="text-slate-500">
                                                已付 <span className="text-slate-400">{formatAmount(bill.paidAmount, billCurrency)}</span>
                                            </span>
                                            <span className={remaining > 0 ? 'text-orange-400' : 'text-green-400'}>
                                                {remaining > 0 ? `待付 ${formatAmount(remaining, billCurrency)}` : '已结清 ✓'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment history expansion hint */}
                                    {bill.payments.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                                    付款记录 ({bill.payments.length} 笔)
                                                </span>
                                                <span className="material-icons text-slate-600 text-[14px] group-hover:text-primary transition-colors">expand_more</span>
                                            </div>
                                            {/* Show latest 2 payments */}
                                            <div className="mt-2 space-y-1.5">
                                                {bill.payments.slice(0, 2).map(p => (
                                                    <div key={p.id} className="flex items-center justify-between text-[10px]">
                                                        <div className="flex items-center gap-1.5 text-slate-500">
                                                            <span className="w-1 h-1 rounded-full bg-green-500"></span>
                                                            {new Date(p.payment_date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                                                            {p.payment_method && (
                                                                <span className="text-slate-600 italic">{p.payment_method}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-green-400 font-bold">
                                                            -{formatAmount(p.amount, billCurrency)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {bill.payments.length > 2 && (
                                                    <div className="text-[9px] text-slate-600 italic text-center">
                                                        还有 {bill.payments.length - 2} 笔更早的记录
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Filter overlay backdrop */}
            {showFilterMenu && (
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)}></div>
            )}
        </div>
    );
};

export default WalletPage;
