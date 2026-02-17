
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminCompanies, useDeleteCompany, useCreateCompany, useUpdateCompany } from '../../hooks/useAdmin';
import { Company } from '../../services/admin.service';
import toast from 'react-hot-toast';

const CompanyManagement: React.FC = () => {
    const navigate = useNavigate();
    const { data: companies, isLoading } = useAdminCompanies();
    const deleteMutation = useDeleteCompany();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    const filteredCompanies = companies?.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'All' || c.role.toLowerCase() === roleFilter.toLowerCase();
        return matchesSearch && matchesRole;
    });

    const handleDelete = async (id: string) => {
        if (window.confirm('确定要删除这家公司吗？')) {
            try {
                await deleteMutation.mutateAsync(id);
                toast.success('公司已删除');
            } catch (error) {
                toast.error('删除失败');
            }
        }
    };

    const openDrawer = (company?: Company) => {
        setEditingCompany(company || null);
        setIsDrawerOpen(true);
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display pb-24">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 pt-12 pb-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <button onClick={() => navigate('/admin/dashboard')} className="p-2 -ml-2 text-slate-600 dark:text-slate-400">
                    <span className="material-icons">arrow_back</span>
                </button>
                <h1 className="text-base font-bold tracking-tight">公司管理</h1>
                <div className="flex items-center gap-1 -mr-2">
                    <button onClick={() => openDrawer()} className="p-2 text-primary">
                        <span className="material-icons">add_circle</span>
                    </button>
                </div>
            </header>

            {/* Stats Area */}
            <div className="mt-6">
                <div className="flex gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar">
                    <div className="flex min-w-[140px] flex-col gap-2 rounded-xl p-4 bg-[#0f3460] border border-primary/20 shadow-lg">
                        <div className="flex items-center justify-between">
                            <span className="material-icons text-primary text-xl">corporate_fare</span>
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wider">全部</span>
                        </div>
                        <div>
                            <p className="text-white/60 text-xs font-medium">总公司数</p>
                            <p className="text-white text-2xl font-bold leading-tight">{companies?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mt-6 flex gap-2 overflow-x-auto px-4 hide-scrollbar">
                {['All', 'Sender', 'Transit', 'Receiver'].map(role => (
                    <button
                        key={role}
                        onClick={() => setRoleFilter(role)}
                        className={`flex h-8 shrink-0 items-center justify-center rounded-full px-5 transition-all ${roleFilter === role
                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                : 'bg-slate-200 dark:bg-[#16213e] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800'
                            }`}
                    >
                        <p className="text-xs font-medium">{role === 'All' ? '全部' : role}</p>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="px-4 mt-6">
                <div className="relative">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                    <input
                        type="text"
                        placeholder="搜索公司名称或编号..."
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#16213e] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Company List */}
            <div className="px-4 mt-8 space-y-4">
                {isLoading ? (
                    <div className="text-center py-10 text-slate-500">加载中...</div>
                ) : filteredCompanies?.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">未找到相关公司</div>
                ) : (
                    filteredCompanies?.map(company => (
                        <div key={company.id} className="bg-white dark:bg-[#16213e] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <h4 className="text-sm font-bold truncate max-w-[180px]">{company.name}</h4>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${company.role === 'sender' ? 'bg-emerald-500/10 text-emerald-500' :
                                        company.role === 'transit' ? 'bg-orange-500/10 text-orange-500' :
                                            'bg-purple-500/10 text-purple-500'
                                    }`}>
                                    {company.role}
                                </div>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3">#{company.code}</div>

                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <div className="flex gap-2">
                                    <button onClick={() => openDrawer(company)} className="p-1 px-3 bg-primary/10 text-primary rounded-lg text-xs font-bold">编辑</button>
                                    <button onClick={() => handleDelete(company.id)} className="p-1 px-3 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold">删除</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Company Drawer */}
            <CompanyDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                company={editingCompany}
            />

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
                <button onClick={() => navigate('/admin/companies')} className="flex flex-col items-center gap-1 text-primary">
                    <span className="material-icons text-[24px]">corporate_fare</span>
                    <p className="text-[10px] font-bold">公司</p>
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

interface CompanyDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    company: Company | null;
}

const CompanyDrawer: React.FC<CompanyDrawerProps> = ({ isOpen, onClose, company }) => {
    const createMutation = useCreateCompany();
    const updateMutation = useUpdateCompany();
    const [formData, setFormData] = useState<Partial<Company>>({
        name: '',
        code: '',
        role: 'sender'
    });

    React.useEffect(() => {
        if (company) {
            setFormData(company);
        } else {
            setFormData({ name: '', code: '', role: 'sender' });
        }
    }, [company, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (company) {
                await updateMutation.mutateAsync({ id: company.id, ...formData });
                toast.success('公司已更新');
            } else {
                await createMutation.mutateAsync(formData);
                toast.success('公司已创建');
            }
            onClose();
        } catch (error) {
            toast.error('操作失败');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
            <div className="w-full max-w-md bg-background-light dark:bg-[#111821] rounded-t-3xl p-6 shadow-2xl animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{company ? '编辑公司' : '添加公司'}</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <span className="material-icons text-slate-500">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">公司名称</label>
                        <input
                            type="text"
                            required
                            className="w-full p-4 bg-white dark:bg-[#16213e] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="例如：全球快速物流"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">公司编码</label>
                            <input
                                type="text"
                                required
                                className="w-full p-4 bg-white dark:bg-[#16213e] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="COM-XXX"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">角色类型</label>
                            <select
                                className="w-full p-4 bg-white dark:bg-[#16213e] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                            >
                                <option value="sender">发货方 (Sender)</option>
                                <option value="transit">中转方 (Transit)</option>
                                <option value="receiver">接收方 (Receiver)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="w-full mt-4 bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {createMutation.isPending || updateMutation.isPending ? '提交中...' : company ? '保存更改' : '创建公司'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompanyManagement;
