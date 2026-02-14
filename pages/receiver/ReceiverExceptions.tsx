import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReceiverExceptions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-white font-display min-h-screen flex flex-col overflow-hidden antialiased">
      {/* Top Bar */}
      <div className="w-full px-4 pt-2 pb-1 flex justify-between items-center text-xs text-gray-400 font-medium z-30 bg-white dark:bg-surface-dark">
        <span>09:41</span>
        <div className="flex gap-1">
          <span className="material-icons text-[14px]">signal_cellular_alt</span>
          <span className="material-icons text-[14px]">wifi</span>
          <span className="material-icons text-[14px]">battery_full</span>
        </div>
      </div>

      <header className="bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-white/5 z-20 sticky top-0">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center -ml-2 text-gray-600 dark:text-gray-300 hover:text-primary">
            <span className="material-icons">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-bold text-slate-800 dark:text-white flex-1 text-center pr-6">接收方异常件处理</h1>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-icons text-xl">search</span>
            <input className="w-full bg-gray-50 dark:bg-black/20 border-0 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-black/40 transition-all placeholder-gray-400 text-slate-800 dark:text-white" placeholder="扫描或输入运单号" type="text"/>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400">
              <span className="material-icons text-xl">qr_code_scanner</span>
            </button>
          </div>
        </div>
        <div className="flex px-4 gap-6 overflow-x-auto hide-scrollbar border-b border-gray-100 dark:border-white/5 text-sm">
          <button className="pb-3 border-b-2 border-primary text-primary font-semibold whitespace-nowrap">全部</button>
          <button className="pb-3 border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white whitespace-nowrap">待处理 <span className="ml-1 text-[10px] bg-red-100 dark:bg-red-900/30 text-red-500 px-1.5 py-0.5 rounded-full">3</span></button>
          <button className="pb-3 border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white whitespace-nowrap">已上报</button>
          <button className="pb-3 border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white whitespace-nowrap">已处理</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col gap-3 no-scrollbar">
        {/* Exception Card 1 */}
        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">SF1029384756</span>
                <span className="material-icons text-gray-300 text-sm cursor-pointer">content_copy</span>
              </div>
              <span className="text-xs text-gray-400 mt-1">原批次: BATCH-20231024-01</span>
            </div>
            <span className="px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-500 text-xs font-bold border border-red-100 dark:border-red-900/30">外包装破损</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500 dark:text-gray-400 mt-3 mb-4">
            <div className="flex items-center gap-1">
              <span className="material-icons text-[14px] text-gray-400">schedule</span>
              <span>发现: 10:23</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons text-[14px] text-gray-400">person</span>
              <span>上报人: 王建国</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-50 dark:border-white/5">
            <button className="px-4 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">详情</button>
            <button className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium shadow-sm shadow-primary/30 active:scale-95 transition-transform">处理</button>
          </div>
        </div>

        {/* Exception Card 2 */}
        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">YT8837123901</span>
                <span className="material-icons text-gray-300 text-sm cursor-pointer">content_copy</span>
              </div>
              <span className="text-xs text-gray-400 mt-1">原批次: BATCH-20231024-05</span>
            </div>
            <span className="px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-500 text-xs font-bold border border-orange-100 dark:border-orange-900/30">重量不符</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500 dark:text-gray-400 mt-3 mb-4">
            <div className="flex items-center gap-1">
              <span className="material-icons text-[14px] text-gray-400">schedule</span>
              <span>发现: 09:45</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons text-[14px] text-gray-400">scale</span>
              <span>差异: -0.5kg</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-50 dark:border-white/5">
            <button className="px-4 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">详情</button>
            <button className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium shadow-sm shadow-primary/30 active:scale-95 transition-transform">处理</button>
          </div>
        </div>

        {/* Exception Card 3 */}
        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden opacity-90">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-600 dark:text-gray-300 tracking-tight">JD992837112</span>
              </div>
              <span className="text-xs text-gray-400 mt-1">原批次: BATCH-20231023-12</span>
            </div>
            <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-500 text-xs font-bold border border-blue-100 dark:border-blue-900/30">滞留件</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500 dark:text-gray-400 mt-3 mb-4">
            <div className="flex items-center gap-1">
              <span className="material-icons text-[14px] text-gray-400">schedule</span>
              <span>发现: 昨天 18:30</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons text-[14px] text-gray-400">update</span>
              <span>状态: 等待审核</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-50 dark:border-white/5">
            <button className="px-4 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">查看进度</button>
          </div>
        </div>

        {/* Exception Card 4 */}
        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden grayscale opacity-70">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-500 dark:text-gray-400 tracking-tight">ZTO11223344</span>
              </div>
              <span className="text-xs text-gray-400 mt-1">原批次: BATCH-20231023-09</span>
            </div>
            <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-bold border border-gray-200 dark:border-gray-700">标签脱落</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500 dark:text-gray-400 mt-3 mb-4">
            <div className="flex items-center gap-1">
              <span className="material-icons text-[14px] text-gray-400">schedule</span>
              <span>发现: 昨天 14:15</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons text-[14px] text-gray-400">check_circle</span>
              <span>已补打标签</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-50 dark:border-white/5">
            <button className="px-4 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-400" disabled>已归档</button>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-white/5 pb-safe-area-bottom z-40">
        <button className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all text-white font-bold text-lg rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
          <span className="material-icons">add_circle_outline</span>
          新增异常登记
        </button>
      </div>
    </div>
  );
};

export default ReceiverExceptions;