import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FinanceBottomNav } from '../../components/FinanceLayout';
import { useBills } from '../../hooks/useBilling';
import { useFinanceStore, BillStatus } from '../../store/finance.store';
import { useUserStore } from '../../store/user.store';

const BillList: React.FC = () => {
  const navigate = useNavigate();
  const { data: bills, isLoading, error } = useBills();
  const isAdmin = useUserStore(state => state.checkRole(['admin']));

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'partially_paid':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'cancelled':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
      default:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return '已收全款';
      case 'partially_paid': return '部分支付';
      case 'cancelled': return '已取消';
      default: return '待确认';
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === 'CNY' ? '¥' : '₫';
    return `${symbol} ${amount.toLocaleString()}`;
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#15202b]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 safe-area-top">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-icons text-sm">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">多币种账单</h1>
          <button className="p-2 -mr-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
            <span className="material-icons">filter_list</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 px-4 space-y-5 pb-24 no-scrollbar">
        {/* Summary Dashboard (Header) */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0f2438] to-[#137fec] text-white shadow-lg shadow-primary/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/30 rounded-full -ml-8 -mb-8 blur-xl"></div>
          <div className="relative p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-100 opacity-80">待结算金额总览</span>
              <span className="material-icons text-blue-200 text-sm">insights</span>
            </div>
            <div className="flex space-x-6 overflow-x-auto no-scrollbar pb-1">
              <div className="flex flex-col min-w-max">
                <span className="text-xs text-blue-200 mb-1">CNY (人民币)</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-light opacity-70">¥</span>
                  <span className="text-3xl font-bold tracking-tight">
                    {bills?.filter(b => b.currency === 'CNY' && b.status === 'pending').reduce((sum, b) => sum + Number(b.total_amount), 0).toLocaleString() || '0.00'}
                  </span>
                </div>
              </div>
              <div className="w-px bg-white/20 h-10 self-center"></div>
              <div className="flex flex-col min-w-max">
                <span className="text-xs text-blue-200 mb-1">VND (越南盾)</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-light opacity-70">₫</span>
                  <span className="text-3xl font-bold tracking-tight">
                    {bills?.filter(b => b.currency === 'VND' && b.status === 'pending').reduce((sum, b) => sum + Number(b.total_amount), 0).toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="material-icons text-slate-400">search</span>
          </span>
          <input className="w-full py-3 pl-10 pr-4 text-sm bg-white dark:bg-[#1a2632] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-200 placeholder-slate-400" placeholder="搜索账单号、批次号..." type="text" />
        </div>

        {/* Bill List */}
        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">账单明细</h2>
            <span className="text-xs text-slate-500">共 {bills?.length || 0} 条记录</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10 text-slate-400 italic">加载中...</div>
          ) : error ? (
            <div className="flex justify-center py-10 text-red-500 italic">加载失败，请重试</div>
          ) : bills?.length === 0 ? (
            <div className="flex justify-center py-10 text-slate-400 italic font-light">暂无账单数据</div>
          ) : (
            bills?.map((bill) => (
              <article key={bill.id} className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded flex items-center justify-center font-bold text-xs ${bill.currency === 'CNY' ? 'bg-red-50 text-red-600' : 'bg-blue-100 text-primary'}`}>
                      {bill.currency === 'CNY' ? 'CN' : 'VN'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">账单号 / 批次号</span>
                      <span className="text-sm font-semibold font-mono text-slate-800 dark:text-slate-200">
                        {bill.bill_no} <span className="text-slate-400 text-xs font-normal">/ {bill.batch?.batch_no || '未知'}</span>
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(bill.status)}`}>
                    {getStatusText(bill.status)}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">付款方</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate block">{bill.payer?.name || '平台收缴'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">收款方</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate block">{bill.payee?.name || '仓库网点'}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-700 text-right">
                    <span className="text-xs text-slate-500 mr-2">合计金额 ({bill.currency})</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatAmount(Number(bill.total_amount), bill.currency)}
                    </span>
                  </div>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/finance/bill/${bill.id}`)}
                    className="flex-1 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 text-primary dark:text-blue-400 text-sm font-medium transition-colors border border-slate-200 dark:border-slate-600"
                  >
                    查看详情
                  </button>
                  {isAdmin && (bill.status === 'pending' || bill.status === 'partially_paid') && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('确认该账单已收全款？')) {
                          await useFinanceStore.getState().updateBillStatus(bill.id, BillStatus.PAID);
                        }
                      }}
                      className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors shadow-sm"
                    >
                      直接确认全收
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      <FinanceBottomNav />
    </div>
  );
};

export default BillList;