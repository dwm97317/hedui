import React from 'react';
import { useNavigate } from 'react-router-dom';

const RiskMonitor: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 h-screen flex flex-col overflow-hidden antialiased">
      <header className="bg-white dark:bg-surface-dark px-4 py-3 shadow-sm flex items-center justify-between z-20 relative shrink-0">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <span className="material-icons">arrow_back</span>
            </button>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <span className="material-icons text-xl">admin_panel_settings</span>
            </div>
            <div>
                <h1 className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">主管面板</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">ID: SUP-8921</p>
            </div>
        </div>
        <button className="flex flex-col items-center justify-center h-10 w-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group relative">
            <span className="material-icons text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">history</span>
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-white dark:ring-surface-dark"></span>
            <span className="sr-only">操作日志</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        <div className="flex justify-between items-end">
            <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">运单编号</p>
                <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">HDF-9283-X92</div>
            </div>
            <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-800">
                中转中
            </span>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-700/50">
            <div className="grid grid-cols-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <div className="p-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">指标</div>
                <div className="p-3 text-xs font-bold text-slate-600 dark:text-slate-300 border-l border-slate-100 dark:border-slate-700 text-center">
                    <span className="block text-[10px] font-normal text-slate-400">Origin</span>
                    发出方
                </div>
                <div className="p-3 text-xs font-bold text-primary dark:text-blue-400 bg-primary/5 dark:bg-primary/10 border-l border-slate-100 dark:border-slate-700 text-center relative">
                    <span className="block text-[10px] font-normal text-slate-400/80 dark:text-blue-300/60">Hub</span>
                    中转站
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-primary"></div>
                </div>
                <div className="p-3 text-xs font-bold text-slate-600 dark:text-slate-300 border-l border-slate-100 dark:border-slate-700 text-center">
                    <span className="block text-[10px] font-normal text-slate-400">Final</span>
                    接收方
                </div>
            </div>
            <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-700/50 items-center">
                <div className="p-3 text-xs font-medium text-slate-500 dark:text-slate-400">重量</div>
                <div className="p-3 text-xs font-mono font-medium text-center text-slate-700 dark:text-slate-300 border-l border-slate-100 dark:border-slate-700/50">10.50<span className="text-[10px] text-slate-400 ml-0.5">kg</span></div>
                <div className="p-3 text-xs font-mono font-bold text-center text-warning bg-warning/5 dark:bg-warning/10 border-l border-warning/20 relative">
                    10.52<span className="text-[10px] text-warning/70 ml-0.5">kg</span>
                    <span className="material-icons text-[10px] absolute top-1 right-1">warning</span>
                </div>
                <div className="p-3 text-xs font-mono font-medium text-center text-slate-400 dark:text-slate-600 border-l border-slate-100 dark:border-slate-700/50 italic">--</div>
            </div>
            <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-700/50 items-center">
                <div className="p-3 text-xs font-medium text-slate-500 dark:text-slate-400">尺寸</div>
                <div className="p-3 text-[11px] font-mono font-medium text-center text-slate-700 dark:text-slate-300 border-l border-slate-100 dark:border-slate-700/50 leading-tight">40x30<br/>x20</div>
                <div className="p-3 text-[11px] font-mono font-medium text-center text-slate-900 dark:text-white bg-primary/5 dark:bg-primary/10 border-l border-slate-100 dark:border-slate-700/50 leading-tight">40x30<br/>x20</div>
                <div className="p-3 text-[11px] font-mono font-medium text-center text-slate-400 dark:text-slate-600 border-l border-slate-100 dark:border-slate-700/50 italic">--</div>
            </div>
            <div className="grid grid-cols-4 items-center">
                <div className="p-3 text-xs font-medium text-slate-500 dark:text-slate-400">时间</div>
                <div className="p-3 text-[10px] font-mono font-medium text-center text-slate-500 dark:text-slate-400 border-l border-slate-100 dark:border-slate-700/50 leading-tight">10:05<br/><span className="opacity-60">AM</span></div>
                <div className="p-3 text-[10px] font-mono font-medium text-center text-primary dark:text-blue-300 bg-primary/5 dark:bg-primary/10 border-l border-slate-100 dark:border-slate-700/50 leading-tight">14:20<br/><span className="opacity-60">PM</span></div>
                <div className="p-3 text-[10px] font-mono font-medium text-center text-slate-400 dark:text-slate-600 border-l border-slate-100 dark:border-slate-700/50 italic">--</div>
            </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/30 animate-pulse-slow">
            <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-white dark:bg-red-900/40 rounded-lg shadow-sm">
                    <span className="material-icons text-danger text-lg">gavel</span>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">差异核查</h3>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">检测到重量差异 (+0.02kg) 于中转站。</p>
                </div>
            </div>
            <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">调整原因 <span className="text-danger">*</span></label>
                <div className="relative">
                    <select className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-surface-dark border border-red-200 dark:border-red-900/50 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow appearance-none">
                        <option disabled defaultValue="">请选择原因...</option>
                        <option value="scale">Scale Calibration Variance</option>
                        <option value="packaging">Secondary Packaging Added</option>
                        <option value="damage">Minor Damage / Loss</option>
                        <option value="other">Other (Requires Comment)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <span className="material-icons text-lg">expand_more</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">审核追踪</h4>
            <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-2 space-y-6">
                <div className="relative">
                    <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-background-dark"></span>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">已创建</p>
                            <p className="text-xs text-slate-400">Hangzhou Logistics Center</p>
                        </div>
                        <span className="font-mono text-xs text-slate-400 font-medium">10:05</span>
                    </div>
                </div>
                <div className="relative">
                    <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary/60 ring-4 ring-white dark:ring-background-dark"></span>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">发出封箱</p>
                            <p className="text-xs text-slate-500">System Auto-Lock</p>
                        </div>
                        <span className="font-mono text-xs text-primary/80 font-medium">11:30</span>
                    </div>
                </div>
                <div className="relative">
                    <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20 dark:ring-primary/30 shadow-[0_0_0_4px_white] dark:shadow-[0_0_0_4px_#101922]"></span>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-primary dark:text-blue-400">中转查验</p>
                            <p className="text-xs text-slate-500">Sorting Hub #04</p>
                        </div>
                        <span className="font-mono text-xs text-primary font-bold">14:20</span>
                    </div>
                </div>
                <div className="relative">
                    <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700 ring-4 ring-white dark:ring-background-dark"></span>
                    <div className="flex justify-between items-start opacity-50">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Receiver Scan</p>
                        </div>
                        <span className="font-mono text-xs text-slate-400">--:--</span>
                    </div>
                </div>
            </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark p-4 shadow-upward border-t border-slate-100 dark:border-slate-800 z-30 pb-safe-area-bottom">
        <div className="flex gap-3 max-w-md mx-auto">
            <button className="flex-1 bg-white dark:bg-slate-800 text-success border border-success/30 hover:bg-success/5 active:bg-success/10 font-semibold py-3.5 px-4 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 group">
                <span className="material-icons text-xl group-active:scale-90 transition-transform">check_circle_outline</span>
                <span>核对阶段</span>
            </button>
            <button className="flex-1 bg-primary hover:bg-primary-dark active:bg-primary-dark text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2 group">
                <span className="material-icons text-xl group-active:scale-90 transition-transform">lock</span>
                <span>锁定数据</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default RiskMonitor;