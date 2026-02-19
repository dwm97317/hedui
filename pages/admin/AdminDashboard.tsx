
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/user.store';
import { useAdminUsers, useAdminCompanies } from '../../hooks/useAdmin';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = useUserStore(state => state.user);
    const { data: users } = useAdminUsers();
    const { data: companies } = useAdminCompanies();

    const currentDate = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display pb-24">
            {/* Header Section */}
            <header className="p-6 pb-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full border-2 border-primary/30 overflow-hidden bg-slate-800 flex items-center justify-center">
                                <span className="material-icons text-white">admin_panel_settings</span>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background-dark rounded-full"></div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">你好, {user?.full_name || '管理员'}</h1>
                            <p className="text-sm text-slate-400">{currentDate}</p>
                        </div>
                    </div>
                    <button className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <span className="material-icons text-slate-600 dark:text-slate-300">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-background-dark"></span>
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <section className="px-6 py-4 grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <span className="material-icons text-primary text-xl">package_2</span>
                        </div>
                        <span className="text-xs font-bold text-green-400">+12%</span>
                    </div>
                    <p className="text-sm text-slate-400">今日批次</p>
                    <p className="text-2xl font-bold mt-1">15</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <span className="material-icons text-green-500 text-xl">group</span>
                        </div>
                        <span className="text-xs font-bold text-blue-400">{users?.length || 0} 总数</span>
                    </div>
                    <p className="text-sm text-slate-400">活跃用户</p>
                    <p className="text-2xl font-bold mt-1">8</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <span className="material-icons text-purple-500 text-xl">corporate_fare</span>
                        </div>
                        <span className="text-xs font-bold text-purple-400">{companies?.length || 0}</span>
                    </div>
                    <p className="text-sm text-slate-400">关联公司</p>
                    <p className="text-2xl font-bold mt-1">{companies?.length || 0}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <span className="material-icons text-emerald-500 text-xl">check_circle</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full uppercase">正常</span>
                    </div>
                    <p className="text-sm text-slate-400">系统状态</p>
                    <p className="text-2xl font-bold mt-1">0 <span className="text-sm font-normal text-slate-500">错误</span></p>
                </div>
            </section>

            {/* Quick Actions */}
            <section className="px-6 py-4">
                <h3 className="text-lg font-bold mb-4">管理入口</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/30 hover:bg-primary/5 transition-colors group shadow-sm"
                    >
                        <span className="material-icons text-3xl mb-2 text-primary group-hover:scale-110 transition-transform">group</span>
                        <span className="text-sm font-medium">用户管理</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin/companies')}
                        className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/30 hover:bg-primary/5 transition-colors group shadow-sm"
                    >
                        <span className="material-icons text-3xl mb-2 text-purple-500 group-hover:scale-110 transition-transform">corporate_fare</span>
                        <span className="text-sm font-medium">公司管理</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin/batches')}
                        className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/30 hover:bg-primary/5 transition-colors group shadow-sm"
                    >
                        <span className="material-icons text-3xl mb-2 text-orange-500 group-hover:scale-110 transition-transform">inventory_2</span>
                        <span className="text-sm font-medium">批次管理</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin/bills')}
                        className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/30 hover:bg-primary/5 transition-colors group shadow-sm"
                    >
                        <span className="material-icons text-3xl mb-2 text-emerald-500 group-hover:scale-110 transition-transform">receipt_long</span>
                        <span className="text-sm font-medium">账单财务</span>
                    </button>
                    <button
                        onClick={() => navigate('/report-center')}
                        className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/30 hover:bg-primary/5 transition-colors group shadow-sm"
                    >
                        <span className="material-icons text-3xl mb-2 text-blue-500 group-hover:scale-110 transition-transform">bar_chart</span>
                        <span className="text-sm font-medium">报表中心</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin/import-shipments')}
                        className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/30 hover:bg-primary/5 transition-colors group shadow-sm"
                    >
                        <span className="material-icons text-3xl mb-2 text-green-500 group-hover:scale-110 transition-transform">upload_file</span>
                        <span className="text-sm font-medium">导入运单</span>
                    </button>
                </div>
            </section>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700/50 px-6 py-2 pb-8 flex justify-between items-center z-50">
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex flex-col items-center gap-1 text-primary"
                >
                    <span className="material-icons text-[24px]">dashboard</span>
                    <p className="text-[10px] font-bold">仪表盘</p>
                </button>
                <button
                    onClick={() => navigate('/admin/users')}
                    className="flex flex-col items-center gap-1 text-slate-400"
                >
                    <span className="material-icons text-[24px]">group</span>
                    <p className="text-[10px] font-medium">用户</p>
                </button>
                <button
                    onClick={() => navigate('/admin/companies')}
                    className="flex flex-col items-center gap-1 text-slate-400"
                >
                    <span className="material-icons text-[24px]">corporate_fare</span>
                    <p className="text-[10px] font-medium">公司</p>
                </button>
                <button
                    onClick={() => navigate('/admin/batches')}
                    className="flex flex-col items-center gap-1 text-slate-400"
                >
                    <span className="material-icons text-[24px]">inventory_2</span>
                    <p className="text-[10px] font-medium">批次</p>
                </button>
                <button
                    onClick={() => navigate('/admin/profile')}
                    className="flex flex-col items-center gap-1 text-slate-400"
                >
                    <span className="material-icons text-[24px]">person</span>
                    <p className="text-[10px] font-medium">我的</p>
                </button>
            </nav>
        </div>
    );
};

export default AdminDashboard;
