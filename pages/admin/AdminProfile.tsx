
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/user.store';
import { useFinanceStats } from '../../hooks/useFinanceStats';
import { useAdminUsers } from '../../hooks/useAdmin';
import { useFinanceStore } from '../../store/finance.store';

const AdminProfile: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useUserStore();
    const { data: stats } = useFinanceStats();
    const { data: users } = useAdminUsers();
    const { batches } = useFinanceStore();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="bg-background-light dark:bg-[#101622] text-slate-900 dark:text-slate-100 min-h-screen font-display pb-24">
            {/* Header Section */}
            <div className="bg-gradient-to-b from-[#0f3460] to-[#1a1a2e] pt-12 pb-8 px-6 flex flex-col items-center text-center">
                <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-primary to-blue-400 shadow-[0_0_20px_rgba(13,89,242,0.4)]">
                        <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center border-2 border-[#1a1a2e] overflow-hidden">
                            <span className="material-icons text-white text-4xl">admin_panel_settings</span>
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-[#1a1a2e] shadow-lg"></div>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-1">{user?.full_name || '系统管理员'}</h1>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 mr-1.5">Role:</span>
                    <span className="text-[11px] font-bold text-[#FFD700]">System Administrator</span>
                </div>

                {/* Stats Tiles */}
                <div className="flex gap-3 w-full overflow-x-auto pb-2 hide-scrollbar">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 flex-1 min-w-[100px] rounded-lg p-3 flex flex-col items-center gap-2">
                        <span className="material-icons text-primary text-xl">package_2</span>
                        <div className="text-center">
                            <p className="text-white text-sm font-bold leading-none mb-1">{batches.length}</p>
                            <p className="text-slate-400 text-[10px] leading-none">管理批次</p>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 flex-1 min-w-[100px] rounded-lg p-3 flex flex-col items-center gap-2">
                        <span className="material-icons text-green-400 text-xl">group</span>
                        <div className="text-center">
                            <p className="text-white text-sm font-bold leading-none mb-1">{users?.length || 0}</p>
                            <p className="text-slate-400 text-[10px] leading-none">活跃用户</p>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 flex-1 min-w-[100px] rounded-lg p-3 flex flex-col items-center gap-2">
                        <span className="material-icons text-orange-400 text-xl">payments</span>
                        <div className="text-center">
                            <p className="text-white text-sm font-bold leading-none mb-1">
                                ¥{stats ? (stats.cny.paid / 10000).toFixed(1) : '0'}W
                            </p>
                            <p className="text-slate-400 text-[10px] leading-none">平台收入</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-24">
                {/* Group 1: Admin Tasks */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">管理任务</h3>
                    <div className="bg-[#16213e] rounded-xl divide-y divide-slate-700/50 overflow-hidden">
                        <button onClick={() => navigate('/admin/settings')} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <span className="material-icons text-primary text-lg">security</span>
                                </div>
                                <span className="text-sm font-medium">账号安全</span>
                            </div>
                            <span className="material-icons text-slate-500 text-sm">chevron_right</span>
                        </button>
                        <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <span className="material-icons text-primary text-lg">description</span>
                                </div>
                                <span className="text-sm font-medium">系统日志</span>
                            </div>
                            <span className="material-icons text-slate-500 text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Group 2: Overview */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">全局预览</h3>
                    <div className="bg-[#16213e] rounded-xl divide-y divide-slate-700/50 overflow-hidden">
                        <button onClick={() => navigate('/admin/users')} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <span className="material-icons text-primary text-lg">corporate_fare</span>
                                </div>
                                <span className="text-sm font-medium">公司概览</span>
                            </div>
                            <span className="material-icons text-slate-500 text-sm">chevron_right</span>
                        </button>
                        <button onClick={() => navigate('/admin/companies')} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <span className="material-icons text-primary text-lg">corporate_fare</span>
                                </div>
                                <span className="text-sm font-medium">公司概览</span>
                            </div>
                            <span className="material-icons text-slate-500 text-sm">chevron_right</span>
                        </button>
                        <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <span className="material-icons text-primary text-lg">notifications</span>
                                </div>
                                <span className="text-sm font-medium">通知历史</span>
                            </div>
                            <span className="material-icons text-slate-500 text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full py-4 mt-4 flex items-center justify-center gap-2 rounded-xl border border-red-500/50 text-red-500 font-bold hover:bg-red-500/10 transition-all active:scale-[0.98]"
                >
                    <span className="material-icons">logout</span>
                    退出登录
                </button>
            </div>

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
                <button onClick={() => navigate('/admin/profile')} className="flex flex-col items-center gap-1 text-primary">
                    <span className="material-icons text-[24px]">person</span>
                    <p className="text-[10px] font-bold">我的</p>
                </button>
            </nav>
        </div>
    );
};

export default AdminProfile;
