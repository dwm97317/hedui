import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/user.store';
import { useBatches } from '../../hooks/useBatches';
import { useBatchStore } from '../../store/batch.store';
import { useShipments } from '../../hooks/useShipments';
import { BatchSwitchModal } from '../../components/BatchSwitchModal';
import { SenderStageStats, TransitStageStats, ReceiverStageStats } from '@/components/batch/BatchStageStats';

const SentHome: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { data: batches, isLoading, error } = useBatches();
    const { activeBatchId, setActiveBatchId } = useBatchStore();
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

    // Auto-select first active batch if none selected
    useEffect(() => {
        if (!activeBatchId && batches && batches.length > 0) {
            const firstActive = batches.find(b => b.status === 'sender_processing' || b.status === 'draft' || b.status === 'sender_sealed' || b.status === 'sealed');
            if (firstActive) setActiveBatchId(firstActive.id);
        }
    }, [batches, activeBatchId, setActiveBatchId]);

    // Find the selected batch or fallback to first relevant one
    const activeBatch = batches?.find(b => b.id === activeBatchId) ||
        batches?.find(b => b.status === 'sender_processing' || b.status === 'draft' || b.status === 'sender_sealed' || b.status === 'sealed');

    // Fetch live shipments for the active batch to calculate stats (Must include ALL for Sender stats: merged_child/split_parent)
    const { data: shipments } = useShipments(activeBatch?.id || '', { includeAll: true });

    const todayCount = batches?.filter(b => {
        const today = new Date().toISOString().split('T')[0];
        return b.created_at.startsWith(today);
    }).reduce((acc, b) => acc + (b.item_count || 0), 0) || 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background-dark text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-400 bg-background-dark h-screen flex flex-col items-center justify-center gap-4">
                <span className="material-icons text-6xl">error_outline</span>
                <p>数据加载失败</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary rounded-lg text-white">重试</button>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-gray-100 min-h-screen flex flex-col overflow-hidden">
            {/* Header Section */}
            <header className="bg-surface-dark/95 backdrop-blur shadow-md z-50">
                <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-400 border-b border-white/5">
                    <span className="font-mono tracking-wider">角色: {user?.role?.toLowerCase() === 'sender' ? '发货员' : (user?.role === 'admin' ? '管理员' : (user?.role || '发货员'))}</span>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <span className="material-icons text-[14px] text-primary">circle</span>
                            <span className="text-primary font-medium">设备在线</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="material-icons text-[14px]">wifi</span>
                            <span>5G</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="material-icons text-[14px]">battery_std</span>
                            <span>85%</span>
                        </span>
                    </div>
                </div>
                <div className="px-5 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 relative">
                            <span className="material-icons text-primary text-2xl">local_shipping</span>
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-surface-dark"></div>
                        </div>
                        <div>
                            <h1 className="text-sm font-medium text-gray-400">发出方</h1>
                            <p className="text-xl font-bold leading-tight text-white">{user?.full_name || '王小明'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400 mb-0.5">今日创建</div>
                        <div className="text-2xl font-bold text-primary leading-none">{todayCount}</div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 no-scrollbar pb-20">
                {/* Current Batch Info Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-surface-dark to-surface-hover border border-white/5 flex flex-col gap-4 shadow-lg overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 cursor-pointer" onClick={() => activeBatch && navigate(`/batch/${activeBatch.id}`)}>
                            <div className="flex items-center gap-1.5 mb-1 text-gray-400">
                                <span className="material-icons text-[14px]">inventory_2</span>
                                <span className="text-[10px] uppercase tracking-wider font-bold">当前进行中批次</span>
                            </div>
                            <div className="text-lg font-mono text-white font-bold tracking-wider">
                                {activeBatch ? activeBatch.batch_no : '无活跃批次'}
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/batch-list')}
                            className="bg-white/5 text-gray-400 hover:text-white px-2 py-1 rounded text-[10px] font-medium border border-white/5 transition-colors flex items-center gap-1"
                        >
                            <span className="material-icons text-[12px]">list_alt</span>
                            批次列表
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {activeBatch && (
                            <>
                                <SenderStageStats batch={activeBatch as any} shipments={shipments} isCompact className="bg-white/5 border-white/5" />
                                <TransitStageStats batch={activeBatch as any} isCompact className="bg-white/5 border-white/5" />
                                <ReceiverStageStats batch={activeBatch as any} isCompact className="bg-white/5 border-white/5" />
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-1">
                        <button
                            onClick={() => setIsSwitchModalOpen(true)}
                            className="flex flex-col items-center justify-center gap-1 text-primary bg-primary/10 p-2 rounded-xl text-[10px] font-bold hover:bg-primary/20 transition-all border border-primary/20 active:scale-95"
                        >
                            <span className="material-icons text-[18px]">swap_horiz</span>
                            <span>切换</span>
                        </button>
                        <button
                            onClick={() => navigate('/create-batch')}
                            className="flex flex-col items-center justify-center gap-1 text-white bg-primary p-2 rounded-xl text-[10px] font-bold hover:bg-blue-600 transition-all shadow-md shadow-blue-900/10 active:scale-95"
                        >
                            <span className="material-icons text-[18px]">add</span>
                            <span>新建</span>
                        </button>
                        <button
                            onClick={() => navigate('/admin/import-shipments')}
                            className="flex flex-col items-center justify-center gap-1 bg-green-600/10 text-green-500 p-2 rounded-xl text-[10px] font-bold hover:bg-green-600/20 transition-all border border-green-600/20 active:scale-95"
                        >
                            <span className="material-icons text-[18px]">upload_file</span>
                            <span>Excel 导入</span>
                        </button>
                    </div>
                </div>

                {/* Big Action Button: Create Cargo */}
                <button
                    onClick={() => navigate('/sender/create')}
                    className="group relative flex flex-row items-center justify-between p-6 rounded-xl bg-primary hover:bg-blue-600 shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] w-full min-h-[160px]"
                >
                    <div className="flex flex-col items-start gap-3 z-10 text-left">
                        <div className="p-3 rounded-full bg-white/20 text-white mb-1">
                            <span className="material-icons-outlined text-4xl">add_box</span>
                        </div>
                        <span className="text-3xl font-bold text-white tracking-tight">创建货物</span>
                        <span className="text-base text-blue-100 font-medium opacity-80 decoration-none">新建货物条码与信息</span>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                        <span className="material-icons text-[180px] text-white">inventory_2</span>
                    </div>
                    <span className="material-icons text-white/50 text-4xl group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                </button>

                {/* Secondary Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/sender/create')}
                        className="group flex flex-col items-center justify-center p-6 rounded-xl bg-surface-dark hover:bg-surface-hover border border-white/5 shadow-lg transition-all active:scale-[0.98] aspect-[4/3] w-full relative overflow-hidden"
                    >
                        <div className="absolute top-3 right-3 flex items-center gap-1">
                            <span className="material-icons text-[10px] text-green-400 animate-pulse">circle</span>
                        </div>
                        <div className="mb-3 p-4 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white text-primary transition-colors duration-300">
                            <span className="material-icons-outlined text-4xl">print</span>
                        </div>
                        <span className="text-xl font-bold text-gray-200 group-hover:text-white">称重 + 打印</span>
                        <div className="mt-2 text-[10px] text-gray-500 font-mono text-center">自动连接蓝牙秤</div>
                    </button>

                    <button
                        onClick={() => activeBatch && navigate(`/batch/${activeBatch.id}`)}
                        className="group flex flex-col items-center justify-center p-6 rounded-xl bg-surface-dark hover:bg-surface-hover border border-white/5 shadow-lg transition-all active:scale-[0.98] aspect-[4/3] w-full"
                    >
                        <div className="mb-3 p-4 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white text-primary transition-colors duration-300">
                            <span className="material-icons-outlined text-4xl">send_and_archive</span>
                        </div>
                        <span className="text-xl font-bold text-gray-200 group-hover:text-white">发出确认</span>
                    </button>
                </div>

                {/* Record List Button */}
                <button
                    onClick={() => navigate('/sender/monitor')}
                    className="mt-auto w-full p-5 rounded-xl bg-surface-dark hover:bg-surface-hover border border-white/5 flex items-center justify-between group active:bg-surface-dark/80 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gray-700/30 flex items-center justify-center text-gray-300">
                            <span className="material-icons-outlined text-2xl">history</span>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-lg font-bold text-gray-200 group-hover:text-white">今日发出记录</span>
                            <span className="text-sm text-gray-400">查看最近操作历史</span>
                        </div>
                    </div>
                    <span className="material-icons text-gray-500 group-hover:text-white text-base">chevron_right</span>
                </button>
            </main>

            {/* Navigation spacer for BottomNav if needed, 
          but our App.tsx has its own BottomNav handling. 
          The design shows its own specific nav which might override? 
          For now I'll skip the inline nav as it might conflict with global BottomNav.
      */}
            {/* Batch Switch Modal */}
            <BatchSwitchModal
                isOpen={isSwitchModalOpen}
                onClose={() => setIsSwitchModalOpen(false)}
                batches={batches || []}
            />
        </div>
    );
};

export default SentHome;
