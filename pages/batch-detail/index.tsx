import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBatchDetail } from '../../hooks/useBatches';
import { useShipments } from '../../hooks/useShipments';
import { useInspections } from '../../hooks/useInspections';
import { useUserStore } from '../../store/user.store';
import { SenderStage } from './components/SenderStage';
import { TransitStage } from './components/TransitStage';
import { ReceiverStage } from './components/ReceiverStage';

type Stage = 'sender' | 'transit' | 'receiver';

const BatchDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const [activeTab, setActiveTab] = useState<Stage>('sender');

    // Auto-select tab based on role
    React.useEffect(() => {
        if (user?.role === 'transit') {
            setActiveTab('transit');
        } else if (user?.role === 'receiver') {
            setActiveTab('receiver');
        } else {
            setActiveTab('sender');
        }
    }, [user?.role]);

    const { data: batch, isLoading: isLoadingBatch } = useBatchDetail(id || '');
    const { data: shipments, isLoading: isLoadingShipments } = useShipments(id || '', { includeAll: true });
    const { data: inspections, isLoading: isLoadingInspections } = useInspections(id || '');

    const isLoading = isLoadingBatch || isLoadingShipments || isLoadingInspections;

    if (isLoading) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-sm font-medium">加载批次明细...</p>
                </div>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <span className="material-icons text-6xl text-slate-300 mb-4">inventory_2</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">未找到该批次</h2>
                <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20">
                    返回列表
                </button>
            </div>
        );
    }

    const stageTitle = {
        sender: '发出阶段详情',
        transit: '中转阶段对比详情',
        receiver: '接收阶段审计详情'
    }[activeTab];

    const currentShipments = shipments || [];
    const currentInspections = inspections || [];

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-display antialiased h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex-none bg-white dark:bg-[#1c2433] shadow-sm z-20 pb-2">
                <div className="h-10 w-full flex justify-between items-end px-6 pb-2 text-[10px] font-medium text-slate-400">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                        <span className="material-icons text-[12px]">signal_cellular_alt</span>
                        <span className="material-icons text-[12px]">wifi</span>
                        <span className="material-icons text-[12px]">battery_full</span>
                    </div>
                </div>

                <div className="flex items-center justify-between px-4 py-2">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                        <span className="material-icons">arrow_back</span>
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{stageTitle}</h1>
                        <span className="text-xs font-mono text-primary font-medium bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                            {batch.batch_no}
                        </span>
                    </div>
                    <button className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                        <span className="material-icons">more_horiz</span>
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="px-4 mt-2">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                        <button
                            onClick={() => setActiveTab('sender')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'sender' ? 'shadow-sm bg-primary text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            发出阶段
                        </button>
                        <button
                            onClick={() => setActiveTab('transit')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'transit' ? 'shadow-sm bg-primary text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            中转阶段
                        </button>
                        <button
                            onClick={() => setActiveTab('receiver')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'receiver' ? 'shadow-sm bg-primary text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            接收审计
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-safe">
                {activeTab === 'sender' && <SenderStage batch={batch} shipments={currentShipments} inspections={currentInspections} />}
                {activeTab === 'transit' && <TransitStage batch={batch} shipments={currentShipments} inspections={currentInspections} />}
                {activeTab === 'receiver' && <ReceiverStage batch={batch} shipments={currentShipments} inspections={currentInspections} />}
            </main>
        </div>
    );
};

export default BatchDetailPage;
