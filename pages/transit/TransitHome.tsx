import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBatches } from '../../hooks/useBatches';
import { useUserStore } from '../../store/user.store';
import { useBatchStore } from '../../store/batch.store';
import { BatchSwitchModal } from '../../components/BatchSwitchModal';

const TransitHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { data: batches, isLoading } = useBatches();
  const { activeBatchId, setActiveBatchId } = useBatchStore();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  // Auto-select first active batch if none selected
  useEffect(() => {
    if (!activeBatchId && batches && batches.length > 0) {
      const firstActive = batches.find(b => b.status === 'sender_sealed' || b.status === 'transit_processing' || b.status === 'sealed');
      if (firstActive) setActiveBatchId(firstActive.id);
    }
  }, [batches, activeBatchId, setActiveBatchId]);

  // Find the selected batch or fallback to first relevant one
  const activeBatch = batches?.find(b => b.id === activeBatchId) ||
    batches?.find(b => b.status === 'sender_sealed' || b.status === 'transit_processing' || b.status === 'sealed');

  // Stats for the "Progress" card
  const totalProcessedItems = batches?.reduce((sum, b) => sum + (b.item_count || 0), 0) || 0;
  const totalProcessedWeight = batches?.reduce((sum, b) => sum + (Number(b.total_weight) || 0), 0) || 0;
  const checkedCount = batches?.filter(b => b.status === 'transit_sealed' || b.status === 'inspected').reduce((sum, b) => sum + (b.item_count || 0), 0) || 0;
  const uncheckedCount = batches?.filter(b => b.status === 'sender_sealed' || b.status === 'sealed').reduce((sum, b) => sum + (b.item_count || 0), 0) || 0;

  if (isLoading) return <div className="p-8 text-center text-gray-400 bg-background-light h-screen flex items-center justify-center italic">加载中...</div>;

  return (
    <div className="bg-background-light text-text-main font-display min-h-screen flex flex-col overflow-y-auto antialiased">
      {/* Status Bar Placeholder */}
      <div className="w-full px-4 pt-2 pb-1 flex justify-between items-center text-xs text-gray-400 font-medium z-20">
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <div className="flex gap-1">
          <span className="material-icons text-[14px]">signal_cellular_alt</span>
          <span className="material-icons text-[14px]">wifi</span>
          <span className="material-icons text-[14px]">battery_full</span>
        </div>
      </div>

      <header className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 relative overflow-hidden">
            <span className="material-icons text-primary">person</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-text-main leading-tight">{user?.full_name || '中转员'}</h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-white uppercase tracking-wider">中转方</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">工号: {user?.id?.slice(0, 8).toUpperCase() || 'N/A'}</div>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors relative">
          <span className="material-icons">notifications</span>
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 border border-white"></span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-4 no-scrollbar">
        {/* Current Batch Section */}
        <section className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white/20 to-transparent pointer-events-none"></div>
          <div className="flex justify-between items-center mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="material-icons text-orange-600 text-lg">local_shipping</span>
              <span className="text-sm font-bold text-gray-700">当前批次</span>
            </div>
            <button
              onClick={() => setIsSwitchModalOpen(true)}
              className="flex items-center gap-1 bg-white/60 hover:bg-white border border-orange-300 rounded-full px-3 py-1 text-xs text-orange-600 font-medium transition-colors"
            >
              <span className="material-icons text-[14px]">swap_horiz</span>
              切换
            </button>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-3 font-mono">
              {activeBatch?.batch_no || '暂无活跃批次'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 rounded-lg p-2.5 border border-white/50">
                <div className="text-[10px] text-gray-500 font-medium mb-0.5">申报总件数</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-orange-600">{activeBatch?.item_count || 0}</span>
                  <span className="text-xs text-gray-500">件</span>
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-2.5 border border-white/50">
                <div className="text-[10px] text-gray-500 font-medium mb-0.5">申报总重量</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-orange-600">{activeBatch?.total_weight || 0}</span>
                  <span className="text-xs text-gray-500">KG</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Progress Section */}
        <section className="bg-[#f0f7ff] rounded-xl p-4 border-l-4 border-primary shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <div className="flex-1">
              <h2 className="text-sm font-bold text-text-main mb-3 flex items-center gap-1">
                我的当前批次处理进度
              </h2>
              <div className="mb-4">
                <div className="text-[10px] text-gray-500 font-medium mb-0.5">累计处理总件数</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-bold text-primary tracking-tight">{totalProcessedItems}</span>
                  <span className="text-sm text-gray-400">件</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-medium mb-0.5">累计处理总重量</div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-bold text-primary tracking-tight">{totalProcessedWeight}</span>
                  <span className="text-sm text-gray-400">KG</span>
                </div>
              </div>
            </div>
            <div className="bg-primary/5 rounded-lg p-2 flex flex-col items-center justify-center w-16 h-16 self-center">
              <div className="flex items-end gap-1 h-8 w-full justify-center">
                <div className="w-1.5 bg-primary/20 h-3 rounded-t-sm"></div>
                <div className="w-1.5 bg-primary/40 h-5 rounded-t-sm"></div>
                <div className="w-1.5 bg-primary/30 h-4 rounded-t-sm"></div>
                <div className="w-1.5 bg-primary h-7 rounded-t-sm"></div>
              </div>
              <span className="text-[10px] text-primary mt-1 font-bold">+12%</span>
            </div>
          </div>
          <div className="mt-2 pt-3 border-t border-gray-200 flex gap-4 text-xs">
            <div className="flex items-center gap-1 font-medium text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>已查验: {checkedCount} 件</span>
            </div>
            <div className="flex items-center gap-1 font-medium text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>未查验: {uncheckedCount} 件</span>
            </div>
          </div>
        </section>

        {/* Action Grid */}
        <section className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate(activeBatchId ? `/transit/check?batchId=${activeBatchId}` : '/transit/check')}
            className="col-span-2 relative group overflow-hidden bg-primary hover:bg-primary-dark active:scale-[0.99] transition-all duration-150 rounded-xl min-h-[140px] flex flex-row items-center justify-between px-6 shadow-md shadow-primary/10"
          >
            <div className="z-10 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-icons text-white text-3xl">fact_check</span>
              </div>
              <h3 className="text-2xl font-bold text-white">中转查验</h3>
              <p className="text-white/80 text-sm font-medium mt-1">扫描入库 / 状态核实</p>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 translate-x-4"></div>
            <div className="z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <span className="material-icons text-white">arrow_forward</span>
            </div>
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#FFF 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
          </button>

          <button
            onClick={() => navigate('/transit/merge')}
            className="bg-white border border-gray-200 hover:border-primary/50 active:bg-primary/5 transition-all rounded-xl p-4 flex flex-col items-start justify-between min-h-[110px] shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
              <span className="material-icons">call_merge</span>
            </div>
            <div className="text-left w-full">
              <h3 className="font-bold text-text-main text-lg">货物合并</h3>
              <p className="text-xs text-gray-500 mt-0.5">多单合一转运</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/transit/split')}
            className="bg-white border border-gray-200 hover:border-cyan-500/50 active:bg-cyan-50 transition-all rounded-xl p-4 flex flex-col items-start justify-between min-h-[110px] shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center mb-2">
              <span className="material-icons text-cyan-500">call_split</span>
            </div>
            <div className="text-left w-full">
              <h3 className="font-bold text-text-main text-lg">货物拆分</h3>
              <p className="text-xs text-gray-500 mt-0.5">单票拆分流转</p>
            </div>
          </button>
        </section>

        {/* Exception Section */}
        <section className="mt-auto">
          <button
            onClick={() => navigate('/transit/exceptions')}
            className="w-full flex items-center justify-between bg-white border border-red-100 rounded-lg p-4 active:bg-red-50 transition-colors group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-red-50 text-red-500 flex items-center justify-center">
                <span className="material-icons">report_problem</span>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-text-main group-hover:text-red-500 transition-colors">异常件处理</h3>
                <p className="text-xs text-gray-500">破损 / 滞留 / 无主件登记</p>
              </div>
            </div>
            <span className="material-icons text-gray-300 group-hover:text-red-500 transition-colors">chevron_right</span>
          </button>
        </section>
      </main>


      <BatchSwitchModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        batches={batches || []}
      />
    </div>
  );
};

export default TransitHome;
