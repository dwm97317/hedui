import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinanceBottomNav } from '../../components/FinanceLayout';
import { useBills } from '../../hooks/useBilling';
import { useFinanceStore } from '../../store/finance.store';
import BillCPriceModal from '../../components/finance/BillCPriceModal';
import BillTemplateModal from '../../components/finance/BillTemplateModal';

const FinanceHome: React.FC = () => {
  const navigate = useNavigate();
  const { data: bills } = useBills();
  const batches = useFinanceStore(state => state.batches);
  const fetchBatches = useFinanceStore(state => state.fetchBatches);
  const updateBillUnitPrice = useFinanceStore(state => state.updateBillUnitPrice);

  const [isBillCModalOpen, setIsBillCModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  React.useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const latestBatch = batches[0];

  const pendingBills = bills?.filter(b => b.status === 'pending') || [];
  const cnyTotal = pendingBills.filter(b => b.currency === 'CNY').reduce((sum, b) => sum + Number(b.total_amount), 0);
  const vndTotal = pendingBills.filter(b => b.currency === 'VND').reduce((sum, b) => sum + Number(b.total_amount), 0);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 antialiased selection:bg-primary selection:text-white h-full flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">财务概览</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Hedui Logistics Platform</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/finance/rates')}
            className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-icons">currency_exchange</span>
          </button>
          <div className="relative">
            <button className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
              <span className="material-icons">notifications_none</span>
            </button>
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-background-dark"></span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pt-20 px-4 space-y-6 pb-24">
        {/* Quick Access Roles (Dev/Demo) */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => navigate('/finance/sender')} className="flex flex-col items-center p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
            <span className="material-icons text-blue-500">local_shipping</span>
            <span className="text-[10px] mt-1 text-slate-600 dark:text-slate-300">发货方</span>
          </button>
          <button onClick={() => navigate('/finance/transit')} className="flex flex-col items-center p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
            <span className="material-icons text-orange-500">sync_alt</span>
            <span className="text-[10px] mt-1 text-slate-600 dark:text-slate-300">中转方</span>
          </button>
          <button onClick={() => navigate('/finance/receiver')} className="flex flex-col items-center p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
            <span className="material-icons text-green-500">inventory</span>
            <span className="text-[10px] mt-1 text-slate-600 dark:text-slate-300">接收方</span>
          </button>
          <button onClick={() => navigate('/finance/flow')} className="flex flex-col items-center p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
            <span className="material-icons text-purple-500">hub</span>
            <span className="text-[10px] mt-1 text-slate-600 dark:text-slate-300">资金流</span>
          </button>
        </div>

        {/* Currency Cards Swiper */}
        <div className="flex overflow-x-auto no-scrollbar space-x-4 pb-2 snap-x snap-mandatory">
          {/* CNY Card */}
          <div className="min-w-[90%] snap-center bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <span className="text-6xl font-bold text-primary">¥</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">¥</div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">人民币 (CNY)</span>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">+12% 同比</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">待结算总额</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{cnyTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">本月已收</p>
                <p className="text-2xl font-bold text-primary">0</p>
              </div>
            </div>
            <div className="mt-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: '68%' }}></div>
            </div>
          </div>
          {/* VND Card */}
          <div className="min-w-[90%] snap-center bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <span className="text-6xl font-bold text-indigo-500">₫</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">₫</div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">越南盾 (VND)</span>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">-2% 同比</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">待结算总额</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{vndTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">本月已收</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">0</p>
              </div>
            </div>
            <div className="mt-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>
        </div>

        {/* Status & Alerts */}
        <div className="grid grid-cols-2 gap-4">
          {/* Collection Rate */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center relative">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 w-full text-left">总回款率</h3>
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle className="text-slate-100 dark:text-slate-700" cx="48" cy="48" fill="transparent" r="36" stroke="currentColor" strokeWidth="8"></circle>
                <circle className="text-primary" cx="48" cy="48" fill="transparent" r="36" stroke="currentColor" strokeDasharray="226.2" strokeDashoffset="72" strokeWidth="8"></circle>
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-bold text-slate-800 dark:text-white">68%</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">较上月 +5%</p>
          </div>
          {/* Action Required */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">待办提醒</h3>
              <div className="flex items-center space-x-2 mb-1">
                <span className="material-icons text-orange-500 text-xl">warning_amber</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{pendingBills.length}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">待确认账单</p>
            </div>
            <button onClick={() => navigate('/finance/bills')} className="w-full mt-3 py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-lg transition-colors">
              立即处理
            </button>
          </div>
        </div>

        {/* Specialized Tools / Config */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <span className="material-icons text-lg text-primary">admin_panel_settings</span>
            配置与工具
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => navigate('/finance/admin/pricing')}
              className="group flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3 text-white">
                <span className="material-icons text-2xl">architecture</span>
                <div className="text-left">
                  <div className="text-sm font-bold">平台价格策略</div>
                  <div className="text-[10px] text-blue-100 opacity-80 uppercase tracking-widest font-mono">Batch-Centric Pricing</div>
                </div>
              </div>
              <span className="material-icons text-white/50 group-hover:translate-x-1 transition-transform">chevron_right</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsBillCModalOpen(true)}
                className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
              >
                <span className="material-icons text-blue-500 mb-2">payments</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">账单C单价</span>
              </button>
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
              >
                <span className="material-icons text-purple-500 mb-2">style</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">账单模板</span>
              </button>
            </div>
          </div>
        </div>

        {/* Trends Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-white">近6个月收支趋势</h3>
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-primary mr-1"></span>
                <span className="text-slate-500">收入</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 mr-1"></span>
                <span className="text-slate-500">支出</span>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between h-40 space-x-2">
            {/* Month 1 */}
            <div className="flex flex-col items-center space-y-1 w-full group">
              <div className="relative w-full flex items-end justify-center h-full space-x-1">
                <div className="w-1.5 bg-slate-300 dark:bg-slate-600 rounded-t-sm h-[40%] group-hover:bg-slate-400 transition-all"></div>
                <div className="w-1.5 bg-primary rounded-t-sm h-[55%] group-hover:bg-blue-600 transition-all"></div>
              </div>
              <span className="text-[10px] text-slate-400">5月</span>
            </div>
            {/* Month 2 */}
            <div className="flex flex-col items-center space-y-1 w-full group">
              <div className="relative w-full flex items-end justify-center h-full space-x-1">
                <div className="w-1.5 bg-slate-300 dark:bg-slate-600 rounded-t-sm h-[35%] group-hover:bg-slate-400 transition-all"></div>
                <div className="w-1.5 bg-primary rounded-t-sm h-[45%] group-hover:bg-blue-600 transition-all"></div>
              </div>
              <span className="text-[10px] text-slate-400">6月</span>
            </div>
            {/* Month 3 */}
            <div className="flex flex-col items-center space-y-1 w-full group">
              <div className="relative w-full flex items-end justify-center h-full space-x-1">
                <div className="w-1.5 bg-slate-300 dark:bg-slate-600 rounded-t-sm h-[50%] group-hover:bg-slate-400 transition-all"></div>
                <div className="w-1.5 bg-primary rounded-t-sm h-[60%] group-hover:bg-blue-600 transition-all"></div>
              </div>
              <span className="text-[10px] text-slate-400">7月</span>
            </div>
            {/* Month 4 */}
            <div className="flex flex-col items-center space-y-1 w-full group">
              <div className="relative w-full flex items-end justify-center h-full space-x-1">
                <div className="w-1.5 bg-slate-300 dark:bg-slate-600 rounded-t-sm h-[65%] group-hover:bg-slate-400 transition-all"></div>
                <div className="w-1.5 bg-primary rounded-t-sm h-[80%] group-hover:bg-blue-600 transition-all"></div>
              </div>
              <span className="text-[10px] text-slate-400">8月</span>
            </div>
            {/* Month 5 */}
            <div className="flex flex-col items-center space-y-1 w-full group">
              <div className="relative w-full flex items-end justify-center h-full space-x-1">
                <div className="w-1.5 bg-slate-300 dark:bg-slate-600 rounded-t-sm h-[45%] group-hover:bg-slate-400 transition-all"></div>
                <div className="w-1.5 bg-primary rounded-t-sm h-[75%] group-hover:bg-blue-600 transition-all"></div>
              </div>
              <span className="text-[10px] text-slate-400">9月</span>
            </div>
            {/* Month 6 (Current) */}
            <div className="flex flex-col items-center space-y-1 w-full group">
              <div className="relative w-full flex items-end justify-center h-full space-x-1">
                <div className="w-1.5 bg-slate-300 dark:bg-slate-600 rounded-t-sm h-[55%] group-hover:bg-slate-400 transition-all"></div>
                <div className="w-1.5 bg-primary rounded-t-sm h-[90%] group-hover:bg-blue-600 transition-all"></div>
              </div>
              <span className="text-[10px] font-bold text-primary">10月</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">最近交易记录</h3>
            <button className="text-xs text-primary font-medium hover:underline">查看全部</button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {/* Item 1 */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                  <span className="material-icons text-xl">arrow_downward</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">顺丰物流服务费</p>
                  <p className="text-xs text-slate-400">今天 10:23</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600 dark:text-green-400">+ ¥12,500.00</p>
                <p className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded inline-block">已到账</p>
              </div>
            </div>
            {/* Item 2 */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                  <span className="material-icons text-xl">arrow_upward</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">办公室租赁费用</p>
                  <p className="text-xs text-slate-400">昨天 16:45</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 dark:text-white">- ¥8,000.00</p>
                <p className="text-[10px] text-slate-400">支出</p>
              </div>
            </div>
            {/* Item 3 */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <span className="material-icons text-xl">sync_alt</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">越南分公司汇款</p>
                  <p className="text-xs text-slate-400">10月24日</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">+ ₫50,000,000</p>
                <p className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded inline-block">VND 入账</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FinanceBottomNav />

      {/* Modals */}
      <BillCPriceModal
        isOpen={isBillCModalOpen}
        onClose={() => setIsBillCModalOpen(false)}
        onConfirm={async (prices) => {
          if (latestBatch) {
            // For demo purposes, we update the main bill unit price using the average of categories
            const avg = Object.values(prices).reduce((a, b) => a + b, 0) / Object.values(prices).length;
            await updateBillUnitPrice(latestBatch.billC.id, avg);
            console.log('Updated Bill C Prices for batch:', latestBatch.batchCode);
          }
          setIsBillCModalOpen(false);
        }}
      />
      <BillTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelect={(templateId) => {
          console.log('Selected Template:', templateId);
          setIsTemplateModalOpen(false);
        }}
      />
    </div>
  );
};

export default FinanceHome;