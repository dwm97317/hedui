import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReceiverArchive: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-white font-display antialiased h-screen flex flex-col overflow-hidden relative">
      {/* Top App Bar */}
      <header className="flex items-center bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-white/5 p-4 shrink-0 z-20">
        <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-white p-2 -ml-2 hover:bg-slate-50 dark:hover:bg-white/10 rounded-full transition-colors">
          <span className="material-icons-round block">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-8 text-slate-900 dark:text-white">查验完成 & 批次封存</h1>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {/* Hero Status Section */}
        <div className="flex flex-col items-center py-8 px-4 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-icons-round text-primary text-6xl">inventory_2</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary rounded-full border-4 border-white dark:border-background-dark flex items-center justify-center">
              <span className="material-icons-round text-white text-2xl">check</span>
            </div>
          </div>
          <h2 className="text-2xl font-mono font-bold tracking-tight text-slate-900 dark:text-white">RC-20240520-01</h2>
          <p className="text-primary font-semibold mt-1">本批次已全部查验完毕</p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-3 gap-3 px-4 mb-8">
          <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">总票数</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">124</span>
          </div>
          <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">总重量</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">850.5 <span className="text-xs font-normal">kg</span></span>
          </div>
          <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">异常件</span>
            <span className="text-xl font-bold text-slate-400">0</span>
          </div>
        </div>

        {/* Parcel Summary List */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-icons-round text-slate-400 text-lg">list_alt</span>
              包裹摘要列表
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">共 124 件</span>
          </div>
          <div className="space-y-2">
            {[
              { id: 'PK-9920384710', weight: '12.5 kg' },
              { id: 'PK-9920384711', weight: '8.2 kg' },
              { id: 'PK-9920384712', weight: '24.0 kg' },
              { id: 'PK-9920384713', weight: '5.5 kg' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 rounded-lg shadow-sm">
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-semibold text-slate-800 dark:text-white">{item.id}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">重量: {item.weight}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-xs font-bold text-primary">已核对</span>
                </div>
              </div>
            ))}
            {/* Fade out effect for scrolling list */}
            <div className="h-10 w-full bg-gradient-to-t from-background-light dark:from-background-dark to-transparent"></div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Action Area */}
      <footer className="absolute bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-white/5 p-4 space-y-3 z-30 pb-safe-area-bottom">
        <button onClick={() => navigate('/receiver')} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
          <span className="material-icons-round">lock_person</span>
          <span className="text-lg">确认封存并提交</span>
        </button>
        <button onClick={() => navigate(-1)} className="w-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold py-3 rounded-xl transition-all active:scale-[0.98]">
          返回修改
        </button>
      </footer>
    </div>
  );
};

export default ReceiverArchive;