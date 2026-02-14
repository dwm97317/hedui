import React from 'react';
import { useNavigate } from 'react-router-dom';

const ExchangeRates: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-800 dark:text-slate-100 flex flex-col font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-full transition-colors">
          <span className="material-icons">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">汇率管理</h1>
        <button className="p-2 -mr-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
          <span className="material-icons">history</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {/* Warning Banner */}
        <div className="p-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-lg p-3 flex gap-3 items-start shadow-sm">
            <span className="material-icons text-orange-500 text-xl mt-0.5 shrink-0">lock_clock</span>
            <div>
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">汇率锁定机制说明</h3>
              <p className="text-xs text-orange-700/80 dark:text-orange-300/80 leading-relaxed">
                账单一旦生成，将永久锁定当时汇率，后续汇率变动不影响历史账单。
              </p>
            </div>
          </div>
        </div>

        {/* Current Rates Section */}
        <div className="px-4 mb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">生效中的汇率</h2>
            <span className="text-xs text-slate-400">上次更新: 10分钟前</span>
          </div>
          
          {/* Rate Card 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                生效中
              </span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-2">
                <div aria-label="Vietnam Flag" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-gray-800 text-lg shadow-sm">
                  🇻🇳
                </div>
                <div aria-label="China Flag" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-gray-800 text-lg shadow-sm">
                  🇨🇳
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  VND <span className="material-icons text-xs align-middle px-1">arrow_forward</span> CNY
                </div>
                <div className="text-xs text-slate-400">越南盾 转 人民币</div>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">0.000285</span>
              <span className="text-xs text-emerald-500 font-medium flex items-center">
                <span className="material-icons text-sm">trending_up</span> +0.02%
              </span>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>生效日期: 2023-10-24 09:00</span>
              <button className="text-primary font-medium hover:text-primary/80">编辑</button>
            </div>
          </div>

          {/* Rate Card 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                生效中
              </span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-2">
                <div aria-label="China Flag" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-gray-800 text-lg shadow-sm">
                  🇨🇳
                </div>
                <div aria-label="Vietnam Flag" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-gray-800 text-lg shadow-sm">
                  🇻🇳
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  CNY <span className="material-icons text-xs align-middle px-1">arrow_forward</span> VND
                </div>
                <div className="text-xs text-slate-400">人民币 转 越南盾</div>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">3,508.77</span>
              <span className="text-xs text-slate-400 font-medium flex items-center">
                <span className="material-icons text-sm">remove</span> 0.00%
              </span>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>生效日期: 2023-10-24 09:00</span>
              <button className="text-primary font-medium hover:text-primary/80">编辑</button>
            </div>
          </div>
        </div>

        {/* Historical Section Link */}
        <div className="px-4 mt-6">
          <button className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between group active:scale-[0.99] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-icons">manage_search</span>
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">历史批次汇率查询</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">查看过往账单锁定的汇率记录</div>
              </div>
            </div>
            <span className="material-icons text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform">chevron_right</span>
          </button>
        </div>

        {/* Recent Expired */}
        <div className="px-4 mt-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">最近失效</h2>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800 flex justify-between items-center opacity-70">
            <div className="flex items-center gap-3">
              <span className="text-lg grayscale">🇻🇳</span>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">VND → CNY</span>
                <span className="text-xs text-slate-400">2023-10-23</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-500 line-through">0.000284</div>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">已过期</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 pb-8 safe-area-pb z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg border border-primary/30 bg-primary/5 text-primary font-semibold hover:bg-primary/10 transition-colors active:scale-[0.98]">
            <span className="material-icons text-xl">add_circle_outline</span>
            新增汇率
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg bg-primary text-white font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-[0.98]">
            <span className="material-icons text-xl">cloud_sync</span>
            立即同步云端
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExchangeRates;