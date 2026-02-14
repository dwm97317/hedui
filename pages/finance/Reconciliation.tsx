import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinanceBottomNav } from '../../components/FinanceLayout';

const Reconciliation: React.FC = () => {
  const navigate = useNavigate();
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Receipt Modal Component
  const ReceiptModal = () => (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-fade-in">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowReceiptModal(false)}></div>
        {/* Sheet Content */}
        <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl transform transition-transform duration-300 ease-out translate-y-0 relative z-10 animate-slide-up">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">登记收款</h3>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">BILL-20231024-01</span>
            </div>
            <form className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">本次实收金额 (CNY)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400 font-mono">¥</span>
                        <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 pl-8 pr-4 text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="0.00" type="number"/>
                    </div>
                    <p className="text-xs text-red-500 mt-1.5 flex items-center">
                        <span className="material-icons text-[14px] mr-1">info</span>
                        剩余未结金额: ¥ 6,000.00
                    </p>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">银行流水号 / 凭证号</label>
                    <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="输入流水号..." type="text"/>
                </div>
                <div className="pt-2 pb-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input className="form-checkbox h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary bg-slate-100 dark:bg-slate-800 border-none" type="checkbox"/>
                        <span className="text-sm text-slate-600 dark:text-slate-400">标记为最终结清</span>
                    </label>
                </div>
                <div className="flex gap-3 pt-4">
                    <button className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 transition-colors" onClick={() => setShowReceiptModal(false)} type="button">取消</button>
                    <button className="flex-1 py-3 px-4 bg-primary text-white font-medium rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors" onClick={() => setShowReceiptModal(false)} type="button">确认登记</button>
                </div>
            </form>
        </div>
    </div>
  );

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen flex flex-col font-display">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
            <span className="material-icons">arrow_back</span>
          </button>
          <h1 className="text-base font-semibold text-slate-900 dark:text-white">资金对账</h1>
          <div className="flex gap-2">
            <button className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-primary">
              <span className="material-icons">more_horiz</span>
            </button>
          </div>
        </div>
        {/* Search & Filter Section */}
        <div className="px-4 pb-4">
          {/* Search */}
          <div className="relative mb-3">
            <span className="absolute left-3 top-2.5 text-slate-400 material-icons text-xl">search</span>
            <input className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-white placeholder-slate-400 outline-none" placeholder="搜索账单号 / 客户名称..." type="text"/>
          </div>
          {/* Currency Tabs & Summary */}
          <div className="flex justify-between items-end">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button className="px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-full shadow-sm whitespace-nowrap">
                CNY
              </button>
              <button className="px-4 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-sm font-medium rounded-full whitespace-nowrap">
                USD
              </button>
              <button className="px-4 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-sm font-medium rounded-full whitespace-nowrap">
                EUR
              </button>
            </div>
            {/* Mini Summary for Active Currency */}
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">待收总额 (CNY)</div>
              <div className="text-sm font-bold text-red-500">¥ 1,245,000.00</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: List of Cards */}
      <main className="flex-1 px-4 py-4 space-y-4 overflow-y-auto pb-24 no-scrollbar">
        {/* Card 1: Partial Payment */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
          <div className="flex justify-between items-start mb-3 pl-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">BILL-20231024-01</span>
                <span className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-[10px] px-2 py-0.5 rounded font-medium border border-yellow-100 dark:border-yellow-800">
                  部分收款
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">上海宏宇贸易有限公司</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-400 block mb-0.5">剩余未结</span>
              <span className="text-sm font-bold text-red-500 font-mono">¥ 6,000.00</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pl-2 py-3 border-t border-dashed border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">应收金额</span>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 font-mono">¥ 10,000.00</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">已到账</span>
              <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 font-mono">¥ 4,000.00</div>
            </div>
          </div>
          <div className="pl-2 pt-2 flex justify-end">
            <button 
                onClick={() => setShowReceiptModal(true)}
                className="bg-primary/10 hover:bg-primary/20 active:bg-primary/30 text-primary text-xs font-medium px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <span className="material-icons text-sm mr-1.5">add_card</span>
              登记收款
            </button>
          </div>
        </div>

        {/* Card 2: Unpaid */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="flex justify-between items-start mb-3 pl-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">BILL-20231025-88</span>
                <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] px-2 py-0.5 rounded font-medium border border-red-100 dark:border-red-800">
                  未收
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">深圳深科技工贸</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-400 block mb-0.5">剩余未结</span>
              <span className="text-sm font-bold text-red-500 font-mono">$ 2,500.00</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pl-2 py-3 border-t border-dashed border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">应收金额</span>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 font-mono">$ 2,500.00</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">已到账</span>
              <div className="text-sm font-medium text-slate-400 font-mono">$ 0.00</div>
            </div>
          </div>
          <div className="pl-2 pt-2 flex justify-end">
            <button 
                onClick={() => setShowReceiptModal(true)}
                className="bg-primary/10 hover:bg-primary/20 active:bg-primary/30 text-primary text-xs font-medium px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <span className="material-icons text-sm mr-1.5">add_card</span>
              登记收款
            </button>
          </div>
        </div>

        {/* Card 3: Settled */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden opacity-75">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-start mb-3 pl-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">BILL-20230912-04</span>
                <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded font-medium border border-emerald-100 dark:border-emerald-800">
                  已结清
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">北京京北物流中心</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-400 block mb-0.5">剩余未结</span>
              <span className="text-sm font-bold text-slate-300 font-mono">¥ 0.00</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pl-2 py-3 border-t border-dashed border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">应收金额</span>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 font-mono">¥ 56,000.00</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">已到账</span>
              <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 font-mono">¥ 56,000.00</div>
            </div>
          </div>
          <div className="pl-2 pt-2 flex justify-end">
            <button className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium px-4 py-2 rounded-lg flex items-center cursor-not-allowed" disabled>
              <span className="material-icons text-sm mr-1.5">check_circle</span>
              已完成
            </button>
          </div>
        </div>

        {/* More Data Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="flex justify-between items-start mb-3 pl-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">BILL-20231026-11</span>
                <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] px-2 py-0.5 rounded font-medium border border-red-100 dark:border-red-800">
                  未收
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Global Trans Logistics</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-400 block mb-0.5">剩余未结</span>
              <span className="text-sm font-bold text-red-500 font-mono">€ 4,200.00</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pl-2 py-3 border-t border-dashed border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">应收金额</span>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 font-mono">€ 4,200.00</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">已到账</span>
              <div className="text-sm font-medium text-slate-400 font-mono">€ 0.00</div>
            </div>
          </div>
          <div className="pl-2 pt-2 flex justify-end">
            <button 
                onClick={() => setShowReceiptModal(true)}
                className="bg-primary/10 hover:bg-primary/20 active:bg-primary/30 text-primary text-xs font-medium px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <span className="material-icons text-sm mr-1.5">add_card</span>
              登记收款
            </button>
          </div>
        </div>
      </main>

      <FinanceBottomNav />
      
      {showReceiptModal && <ReceiptModal />}
    </div>
  );
};

export default Reconciliation;