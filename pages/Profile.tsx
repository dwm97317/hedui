import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FinanceBottomNav } from '../components/FinanceLayout';

const Profile: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 antialiased selection:bg-primary selection:text-white h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-primary text-white shadow-md px-6 pt-12 pb-20 flex justify-between items-start rounded-b-[2rem]">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight">个人中心</h1>
          <p className="text-xs text-blue-100 opacity-80">Hedui Logistics Platform</p>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/settings')} className="text-white hover:text-blue-100 transition-colors">
            <span className="material-icons">settings</span>
          </button>
          <div className="relative">
            <button className="text-white hover:text-blue-100 transition-colors">
              <span className="material-icons">notifications_none</span>
            </button>
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-primary"></span>
          </div>
        </div>
      </header>

      <main className="relative z-10 -mt-14 px-4 space-y-5 flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-lg border border-slate-100 dark:border-slate-700 flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm">
              <span className="material-icons text-4xl text-slate-400 dark:text-slate-500">person</span>
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">张三</h2>
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-300 text-[10px] font-semibold rounded border border-blue-100 dark:border-blue-800/50">已认证</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">高级操作员 (中转方)</p>
          </div>
          <span className="material-icons text-slate-300 dark:text-slate-600">chevron_right</span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-4 divide-x divide-slate-100 dark:divide-slate-700">
          <div className="text-center px-2">
            <p className="text-xs text-slate-400 mb-1">所属公司</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">越通物流</p>
          </div>
          <div className="text-center px-2">
            <p className="text-xs text-slate-400 mb-1">工号</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white font-mono">HT-9527</p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">偏好设置</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="group flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <span className="material-symbols-outlined text-lg">currency_exchange</span>
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-white">结算币种设置</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">VND ₫ / CNY ¥</span>
                <span className="material-icons text-slate-300 dark:text-slate-600 text-lg">chevron_right</span>
              </div>
            </div>
            <div className="group flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined text-lg">scale</span>
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-white">计费方式偏好</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">按重量计费</span>
                <span className="material-icons text-slate-300 dark:text-slate-600 text-lg">chevron_right</span>
              </div>
            </div>
            <div className="group flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <span className="material-symbols-outlined text-lg">print</span>
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-white">打印模板预览</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="material-icons text-slate-300 dark:text-slate-600 text-lg">chevron_right</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">安全与活动</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="group flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <span className="material-symbols-outlined text-lg">history</span>
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-white">操作日志</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="material-icons text-slate-300 dark:text-slate-600 text-lg">chevron_right</span>
              </div>
            </div>
            <div className="group flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <span className="material-symbols-outlined text-lg">security</span>
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-white">账号安全</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded dark:bg-green-900/30 dark:text-green-400">LINE 已绑定</span>
                <span className="material-icons text-slate-300 dark:text-slate-600 text-lg">chevron_right</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 pb-8 flex flex-col items-center space-y-4">
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 font-medium py-3.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 active:scale-[0.99] transition-transform"
          >
            退出登录
          </button>
          <p className="text-xs text-slate-400">当前版本 v2.4.0</p>
        </div>
      </main>

      <FinanceBottomNav />
    </div>
  );
};

export default Profile;