import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBatches } from '../../hooks/useBatches';
import { useUserStore } from '../../store/user.store';
import { useBatchStore } from '../../store/batch.store';
import { BatchSwitchModal } from '../../components/BatchSwitchModal';

const SentHome: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { data: batches, isLoading } = useBatches();
    const { activeBatchId, setActiveBatchId } = useBatchStore();
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

    // Auto-select first active batch if none selected
    useEffect(() => {
        if (!activeBatchId && batches && batches.length > 0) {
            const firstActive = batches.find(b => b.status === 'draft' || b.status === 'sealed');
            if (firstActive) setActiveBatchId(firstActive.id);
        }
    }, [batches, activeBatchId, setActiveBatchId]);

    // Find the selected batch or fallback to first relevant one
    const activeBatch = batches?.find(b => b.id === activeBatchId) ||
        batches?.find(b => b.status === 'draft' || b.status === 'sealed');

    // Stats for the dashboard
    const totalItems = batches?.reduce((sum, b) => sum + (b.item_count || 0), 0) || 0;
    const totalWeight = batches?.reduce((sum, b) => sum + (Number(b.total_weight) || 0), 0) || 0;
    const draftCount = batches?.filter(b => b.status === 'draft').length || 0;
    const sealedCount = batches?.filter(b => b.status === 'sealed').length || 0;

    if (isLoading) return <div className="p-8 text-center text-gray-400 bg-background-light h-screen flex items-center justify-center italic">加载中...</div>;

    return (
        <div className="bg-background-light text-text-main font-display min-h-screen flex flex-col overflow-y-auto antialiased">
            {/* Header */}
            <header className="px-4 py-3 pt-6 flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 relative overflow-hidden">
                        <span className="material-icons text-primary">person</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-text-main leading-tight">{user?.full_name || '发送员'}</h1>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-white uppercase tracking-wider">发送方</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">工号: {user?.id?.slice(0, 8).toUpperCase() || 'N/A'}</div>
                    </div>
                </div>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors relative">
                    <span className="material-icons">notifications</span>
                    <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 border border-white"></span>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 no-scrollbar pb-32">
                {/* Current Batch Section */}
                <section className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white/20 to-transparent pointer-events-none"></div>
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl font-bold">inventory</span>
                            <span className="text-sm font-bold text-slate-700">当前活跃批次</span>
                        </div>
                        <button
                            onClick={() => setIsSwitchModalOpen(true)}
                            className="flex items-center gap-1 bg-white/80 hover:bg-white border border-blue-300 rounded-full px-4 py-1.5 text-xs text-primary font-bold shadow-sm transition-all active:scale-95"
                        >
                            <span className="material-icons text-[14px]">swap_horiz</span>
                            切换批次
                        </button>
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-4 font-mono">
                            {activeBatch?.batch_no || '暂无活跃批次'}
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/80 rounded-xl p-3 border border-white/50 backdrop-blur-sm">
                                <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">已录入单量</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-primary">{activeBatch?.item_count || 0}</span>
                                    <span className="text-[10px] text-slate-400 font-bold">件</span>
                                </div>
                            </div>
                            <div className="bg-white/80 rounded-xl p-3 border border-white/50 backdrop-blur-sm">
                                <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">当前总重量</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-primary">{activeBatch?.total_weight || 0}</span>
                                    <span className="text-[10px] text-slate-400 font-bold">KG</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Global Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                        <div className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                            草稿批次
                        </div>
                        <div className="text-2xl font-black text-slate-800 tracking-tight">{draftCount}</div>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                        <div className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            已封包批次
                        </div>
                        <div className="text-2xl font-black text-slate-800 tracking-tight">{sealedCount}</div>
                    </div>
                </div>

                {/* Action Grid */}
                <section className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => navigate('/sender/create')}
                        className="relative overflow-hidden bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all duration-200 rounded-2xl p-6 shadow-xl shadow-primary/20 flex items-center justify-between group"
                    >
                        <div className="z-10 text-left">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                                <span className="material-icons text-white text-3xl">add_box</span>
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">货物建档与称重</h3>
                            <p className="text-white/70 text-xs font-bold mt-1 uppercase tracking-widest">Cargo Filing & Weighing</p>
                        </div>
                        <span className="material-icons text-white/20 text-8xl absolute -right-4 -bottom-4 rotate-12 group-hover:scale-110 transition-transform">scale</span>
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/create-batch')}
                            className="bg-white border border-slate-100 hover:border-primary/50 active:bg-slate-50 transition-all rounded-2xl p-5 flex flex-col items-start justify-between min-h-[130px] shadow-sm shadow-slate-200/50"
                        >
                            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                <span className="material-icons">create_new_folder</span>
                            </div>
                            <div className="text-left w-full mt-auto">
                                <h3 className="font-black text-slate-800 text-lg">开启新批次</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Start New Batch</p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/sender/monitor')}
                            className="bg-white border border-slate-100 hover:border-cyan-500/50 active:bg-slate-50 transition-all rounded-2xl p-5 flex flex-col items-start justify-between min-h-[130px] shadow-sm shadow-slate-200/50"
                        >
                            <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                                <span className="material-icons">dashboard</span>
                            </div>
                            <div className="text-left w-full mt-auto">
                                <h3 className="font-black text-slate-800 text-lg">实时监控</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Live Monitor</p>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Settings/Profile Section */}
                <section className="mt-2">
                    <button
                        onClick={() => navigate('/reports')}
                        className="w-full flex items-center justify-between bg-slate-800 rounded-2xl p-5 active:scale-[0.99] transition-all group shadow-lg"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-white/10 text-white flex items-center justify-center">
                                <span className="material-icons">bar_chart</span>
                            </div>
                            <div className="text-left">
                                <h3 className="font-black text-white text-lg group-hover:text-primary transition-colors">统计报表</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Analytics & Reports</p>
                            </div>
                        </div>
                        <span className="material-icons text-slate-500 group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </button>
                </section>
            </main>

            {/* Navigation - Same as others for consistency */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 pb-safe z-50">
                <div className="flex justify-around items-center h-16 px-2">
                    <button className="flex flex-col items-center justify-center w-full h-full gap-1 text-primary">
                        <span className="material-icons text-2xl">home</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter">首页 (Home)</span>
                    </button>
                    <button
                        onClick={() => navigate('/sender/create')}
                        className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 relative group"
                    >
                        <div className="absolute -top-7 bg-primary border-4 border-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl shadow-primary/30 transform transition-transform group-active:scale-95">
                            <span className="material-icons text-white text-2xl">add</span>
                        </div>
                        <span className="text-[10px] font-bold mt-8">建档</span>
                    </button>
                    <button onClick={() => navigate('/reports')} className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 hover:text-primary">
                        <span className="material-icons text-2xl">bar_chart</span>
                        <span className="text-[10px] font-bold">报表</span>
                    </button>
                    <button onClick={() => navigate('/settings')} className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 hover:text-primary">
                        <span className="material-icons text-2xl">settings</span>
                        <span className="text-[10px] font-bold">设置</span>
                    </button>
                </div>
            </nav>
            <div className="h-20 w-full"></div>

            <BatchSwitchModal
                isOpen={isSwitchModalOpen}
                onClose={() => setIsSwitchModalOpen(false)}
                batches={batches || []}
            />
        </div>
    );
};

export default SentHome;
