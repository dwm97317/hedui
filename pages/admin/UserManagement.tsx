
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminUsers, useDeleteUser, useUpdateUserRole, useAdminCompanies } from '../../hooks/useAdmin';
import { UserProfile, Company } from '../../services/admin.service';
import toast from 'react-hot-toast';

const UserManagement: React.FC = () => {
    const navigate = useNavigate();
    const { data: users, isLoading } = useAdminUsers();
    const deleteMutation = useDeleteUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    const filteredUsers = users?.filter(u => {
        const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'All' || u.role.toLowerCase() === roleFilter.toLowerCase();
        return matchesSearch && matchesRole;
    });

    const handleDelete = async (id: string) => {
        if (window.confirm('确定要移除该用户吗？')) {
            try {
                await deleteMutation.mutateAsync(id);
                toast.success('用户已移除');
            } catch (error) {
                toast.error('移除失败');
            }
        }
    };

    const openDrawer = (user?: UserProfile) => {
        setEditingUser(user || null);
        setIsDrawerOpen(true);
    };

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
                    <h1 className="text-lg font-bold tracking-tight text-white">用户管理</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => openDrawer()} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 transition-transform active:scale-95">
                        <span className="material-icons">person_add</span>
                    </button>
                </div>
            </nav>

            {/* Search & Filter Section */}
            <div className="bg-slate-900/50 backdrop-blur-md px-4 pt-4 pb-2 border-b border-white/5">
                <div className="relative mb-4">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                    <input
                        className="w-full rounded-full border-none bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                        placeholder="搜索用户名或 ID..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                    {['All', 'Sender', 'Transit', 'Receiver', 'Admin'].map(role => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`flex h-9 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors ${roleFilter === role ? 'bg-primary text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                }`}
                        >
                            {role === 'All' ? '全部' :
                                role === 'Sender' ? '发货商' :
                                    role === 'Transit' ? '转运商' :
                                        role === 'Receiver' ? '收货商' : '管理员'}
                        </button>
                    ))}
                </div>
            </div>

            {/* User List Area */}
            <main className="flex-1 space-y-3 p-4">
                {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : filteredUsers?.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        未找到相关用户
                    </div>
                ) : (
                    filteredUsers?.map(user => (
                        <div key={user.id} className="group relative flex flex-col gap-3 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/5 hover:ring-primary/30 transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500">
                                            {user.full_name?.[0] || '?'}
                                        </div>
                                        <div className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-800 bg-green-500"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-base font-bold leading-tight text-slate-900 dark:text-white">
                                            {user.full_name || '未命名用户'}
                                        </h3>
                                        <p className="text-[12px] text-slate-400 truncate max-w-[150px]">{user.id}</p>
                                    </div>
                                </div>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' :
                                    user.role === 'sender' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                                        user.role === 'transit' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                                            'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                                    }`}>
                                    {user.role}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-2">
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                    <span className="material-icons text-sm">business</span>
                                    <span className="text-[12px] font-medium">{user.company?.name || '个人用户'}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openDrawer(user)} className="p-1 px-3 bg-primary/10 text-primary rounded-lg text-xs font-bold">编辑</button>
                                    <button onClick={() => handleDelete(user.id)} className="p-1 px-3 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold">移除</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* User Drawer */}
            <UserDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                user={editingUser}
            />

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700/50 px-6 py-2 pb-8 flex justify-between items-center z-50">
                <button onClick={() => navigate('/admin/dashboard')} className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="material-icons text-[24px]">dashboard</span>
                    <p className="text-[10px] font-medium">仪表盘</p>
                </button>
                <button onClick={() => navigate('/admin/users')} className="flex flex-col items-center gap-1 text-primary">
                    <span className="material-icons text-[24px]">group</span>
                    <p className="text-[10px] font-bold">用户</p>
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

interface UserDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile | null;
}

const UserDrawer: React.FC<UserDrawerProps> = ({ isOpen, onClose, user }) => {
    const updateRoleMutation = useUpdateUserRole();
    const { data: companies } = useAdminCompanies();
    const [formData, setFormData] = useState<Partial<UserProfile>>({
        full_name: '',
        role: 'sender',
        company_id: ''
    });

    React.useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                role: user.role,
                company_id: user.company_id || ''
            });
        } else {
            setFormData({ full_name: '', role: 'sender', company_id: '' });
        }
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (user) {
                // For now we only support updating role and company_id if we add it to AdminService
                await updateRoleMutation.mutateAsync({ userId: user.id, role: formData.role! });
                toast.success('用户权限已更新');
            } else {
                toast.error('目前仅支持编辑现有用户权限');
            }
            onClose();
        } catch (error) {
            toast.error('操作失败');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
            <div className="w-full max-w-md bg-white dark:bg-[#111821] rounded-t-3xl p-6 shadow-2xl animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{user ? '编辑用户' : '添加用户'}</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <span className="material-icons text-slate-500">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-slate-900 dark:text-slate-100">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">真实姓名</label>
                        <input
                            type="text"
                            required
                            disabled={!!user}
                            className="w-full p-4 bg-slate-50 dark:bg-[#16213e] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="例如：张三"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">角色类型</label>
                        <select
                            className="w-full p-4 bg-slate-50 dark:bg-[#16213e] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                        >
                            <option value="sender">发货商 (Sender)</option>
                            <option value="transit">转运商 (Transit)</option>
                            <option value="receiver">收货商 (Receiver)</option>
                            <option value="admin">管理员 (Admin)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">所属公司</label>
                        <select
                            className="w-full p-4 bg-slate-50 dark:bg-[#16213e] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
                            value={formData.company_id}
                            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                        >
                            <option value="">个人用户 (及无公司)</option>
                            {companies?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={updateRoleMutation.isPending}
                        className="w-full mt-4 bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {updateRoleMutation.isPending ? '提交中...' : user ? '保存更改' : '创建用户'}
                    </button>
                    {!user && <p className="text-[10px] text-center text-slate-400">请使用注册链接邀请新用户</p>}
                </form>
            </div>
        </div>
    );
};

export default UserManagement;
