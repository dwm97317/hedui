
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SystemSettings: React.FC = () => {
    const navigate = useNavigate();
    const [autoComplete, setAutoComplete] = useState(true);
    const [autoGen, setAutoGen] = useState(false);
    const [vibration, setVibration] = useState(true);

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
                    <h1 className="text-lg font-bold tracking-tight text-white">系统设置</h1>
                </div>
                <div className="w-10"></div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-10">
                {/* FUNCTION SWITCHES */}
                <section className="mt-6">
                    <h3 className="px-5 mb-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">功能开关</h3>
                    <div className="mx-4 overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        {/* Item 1 */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-700/50">
                            <div className="flex-1 pr-4">
                                <p className="text-sm font-bold">批次自动完成</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">最后一次扫描后自动关闭批次</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={autoComplete}
                                    onChange={() => setAutoComplete(!autoComplete)}
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>
                        {/* Item 2 */}
                        <div className="flex items-center justify-between p-4">
                            <div className="flex-1 pr-4">
                                <p className="text-sm font-bold">账单自动生成</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">保存批次时自动生成结算单据</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={autoGen}
                                    onChange={() => setAutoGen(!autoGen)}
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* NOTIFICATION CONFIG */}
                <section className="mt-8">
                    <h3 className="px-5 mb-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">通知配置</h3>
                    <div className="mx-4 overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <button className="w-full flex items-center p-4 border-b border-slate-50 dark:border-slate-700/50 active:bg-slate-50 dark:active:bg-slate-700 transition-colors">
                            <span className="material-icons text-primary mr-3">mail</span>
                            <span className="text-sm font-semibold flex-1 text-left">邮件设置</span>
                            <span className="material-icons text-slate-300 text-sm">chevron_right</span>
                        </button>
                        <button className="w-full flex items-center p-4 border-b border-slate-50 dark:border-slate-700/50 active:bg-slate-50 dark:active:bg-slate-700 transition-colors">
                            <span className="material-icons text-primary mr-3">sms</span>
                            <span className="text-sm font-semibold flex-1 text-left">短信网关</span>
                            <span className="material-icons text-slate-300 text-sm">chevron_right</span>
                        </button>
                        <button className="w-full flex items-center p-4 active:bg-slate-50 dark:active:bg-slate-700 transition-colors">
                            <span className="material-icons text-primary mr-3">description</span>
                            <span className="text-sm font-semibold flex-1 text-left">消息模板</span>
                            <span className="material-icons text-slate-300 text-sm">chevron_right</span>
                        </button>
                    </div>
                </section>

                {/* PDA CONFIG */}
                <section className="mt-8">
                    <h3 className="px-5 mb-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">PDA 配置</h3>
                    <div className="mx-4 overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-700/50">
                            <span className="text-sm font-semibold">扫描模式</span>
                            <div className="flex items-center text-primary font-bold text-xs">
                                连续扫描
                                <span className="material-icons text-slate-300 text-xs ml-1">unfold_more</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <span className="text-sm font-semibold">震动反馈</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={vibration}
                                    onChange={() => setVibration(!vibration)}
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* SYSTEM MAINTENANCE */}
                <section className="mt-8">
                    <h3 className="px-5 mb-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">系统维护</h3>
                    <div className="px-4 space-y-3">
                        <button className="w-full flex flex-col items-start p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 active:scale-[0.98] transition-all">
                            <span className="text-sm font-bold">数据库优化</span>
                            <span className="text-[11px] text-slate-400 mt-0.5">上次优化: 2天前</span>
                        </button>
                        <button className="w-full flex flex-col items-start p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 active:scale-[0.98] transition-all">
                            <span className="text-sm font-bold text-red-500">清除缓存</span>
                            <span className="text-[11px] text-slate-400 mt-0.5">当前大小: 124.8 MB</span>
                        </button>
                    </div>
                </section>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700/50 px-6 py-2 pb-8 flex justify-between items-center z-50">
                <button onClick={() => navigate('/admin/dashboard')} className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="material-icons text-[24px]">dashboard</span>
                    <p className="text-[10px] font-medium">仪表盘</p>
                </button>
                <button onClick={() => navigate('/admin/users')} className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="material-icons text-[24px]">group</span>
                    <p className="text-[10px] font-medium">用户</p>
                </button>
                <button onClick={() => navigate('/admin/companies')} className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="material-icons text-[24px]">corporate_fare</span>
                    <p className="text-[10px] font-medium">公司</p>
                </button>
                <button onClick={() => navigate('/admin/batches')} className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="material-icons text-[24px]">inventory_2</span>
                    <p className="text-[10px] font-medium">批次</p>
                </button>
                <button onClick={() => navigate('/admin/profile')} className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="material-icons text-[24px]">person</span>
                    <p className="text-[10px] font-medium">我的</p>
                </button>
            </nav>
        </div>
    );
};

export default SystemSettings;
