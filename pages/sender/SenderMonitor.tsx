import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBatches, useBatchRealtime } from '../../hooks/useBatches';

const SenderMonitor: React.FC = () => {
  const navigate = useNavigate();

  // Real-time updates for batches
  useBatchRealtime();

  const { data: batches = [], isLoading } = useBatches();

  // Metrics calculation
  const today = new Date().toISOString().split('T')[0];
  const todayBatches = batches.filter(b => b.created_at?.startsWith(today));
  const todayWaybills = batches.reduce((acc, b) => acc + (b.item_count || 0), 0);
  const activeBatchesCount = batches.filter(b => b.status !== 'completed').length;

  // Calculate exceptions from inspections in batches
  const exceptionCount = batches.reduce((acc, b) => {
    return acc + (b.inspections?.filter(i => i.result === 'failed').length || 0);
  }, 0);

  const totalWeight = batches.reduce((acc, b) => acc + (b.total_weight || 0), 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400">正在加载监控数据...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-display antialiased overflow-hidden">
      {/* Mobile "Sidebar" / Navigation Rail */}
      <aside className="w-16 bg-sidebar-dark flex flex-col items-center py-6 flex-shrink-0 z-20 shadow-xl border-r border-slate-700/50">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-8 shadow-lg shadow-primary/30 cursor-pointer" onClick={() => navigate('/')}>
          <span className="material-icons text-white text-xl">local_shipping</span>
        </div>
        <nav className="flex-1 flex flex-col gap-6 w-full items-center">
          <button className="p-2 rounded-lg bg-primary/20 text-primary relative group">
            <span className="material-icons">dashboard</span>
            <div className="absolute right-2 top-2 w-1.5 h-1.5 bg-primary rounded-full"></div>
          </button>
          <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors" onClick={() => navigate('/history')}>
            <span className="material-icons">inventory_2</span>
          </button>
          <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <span className="material-icons">radar</span>
          </button>
          <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors relative">
            <span className="material-icons">warning</span>
            {exceptionCount > 0 && (
              <div className="absolute right-1 top-1 w-2 h-2 bg-danger rounded-full border border-sidebar-dark"></div>
            )}
          </button>
        </nav>
        <div className="mt-auto">
          <div className="w-10 h-10 rounded-full border-2 border-slate-600 bg-slate-700 overflow-hidden flex items-center justify-center text-white cursor-pointer" onClick={() => navigate('/profile')}>
            <span className="material-icons text-xl">person</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="bg-white dark:bg-background-dark/50 backdrop-blur-sm px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Hedui Logistics</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Operations View • Sender Monitor</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-primary dark:text-slate-400 dark:hover:text-primary relative">
              <span className="material-icons text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-white dark:ring-background-dark"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto dense-scroll p-3 space-y-4">
          {/* Metric Cards Grid */}
          <section className="grid grid-cols-2 gap-3">
            {/* Card 1: Today's Waybills */}
            <div className="bg-white dark:bg-surface-dark p-3 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-24">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">总运单数</span>
                <span className="material-icons text-primary/80 text-lg">receipt_long</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{todayWaybills.toLocaleString()}</div>
                <div className="text-xxs text-slate-400 font-medium mt-1">总计所有批次</div>
              </div>
            </div>
            {/* Card 2: Active Batches */}
            <div className="bg-white dark:bg-surface-dark p-3 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-24">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">活动中批次</span>
                <span className="material-icons text-primary/80 text-lg">local_shipping</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeBatchesCount}</div>
                <div className="text-xxs text-primary font-medium flex items-center mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1 animate-pulse"></span> 运行中
                </div>
              </div>
            </div>
            {/* Card 3: Unresolved Exceptions */}
            <div className="bg-white dark:bg-surface-dark p-3 rounded-lg shadow-sm border border-danger/20 dark:border-danger/20 flex flex-col justify-between h-24 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-16 h-16 bg-danger/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div className="flex justify-between items-start relative z-10">
                <span className="text-xs font-bold text-danger uppercase tracking-wider">查验异常</span>
                <span className="material-icons text-danger text-lg">error_outline</span>
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-bold text-danger">{exceptionCount}</div>
                <div className="text-xxs text-danger/80 font-medium mt-1">需关注批次</div>
              </div>
            </div>
            {/* Card 4: Total Weight */}
            <div className="bg-white dark:bg-surface-dark p-3 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-24">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">当前总重量</span>
                <span className="material-icons text-primary/80 text-lg">scale</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalWeight.toFixed(1)}<span className="text-sm font-normal text-slate-500 ml-1">kg</span></div>
                <div className="text-xxs text-slate-400 font-medium mt-1">
                  {batches.length > 0 ? (totalWeight / batches.length).toFixed(1) : 0}kg/批
                </div>
              </div>
            </div>
          </section>

          {/* Main Content: Recent Batch Progress */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">批次进度监控</h2>
              <button className="text-xs text-primary font-medium hover:underline" onClick={() => navigate('/history')}>查看全部</button>
            </div>

            {batches.slice(0, 5).map(batch => {
              const statusColors: Record<string, string> = {
                'pending': 'bg-slate-100 text-slate-600',
                'shipped': 'bg-blue-100 text-blue-600',
                'in_transit': 'bg-primary/10 text-primary',
                'arrived': 'bg-purple-100 text-purple-600',
                'inspected': 'bg-success/10 text-success',
                'completed': 'bg-slate-100 text-slate-400'
              };

              const progressMap: Record<string, number> = {
                'pending': 10,
                'shipped': 30,
                'in_transit': 60,
                'arrived': 80,
                'inspected': 90,
                'completed': 100
              };

              return (
                <div key={batch.id} className="bg-white dark:bg-surface-dark rounded-lg p-4 shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/batch/${batch.id}`)}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-white">#{batch.batch_no}</span>
                        <span className={`${statusColors[batch.status] || 'bg-slate-100'} text-xxs px-2 py-0.5 rounded-full font-medium border border-transparent`}>
                          {batch.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{batch.item_count} 件 • {batch.total_weight}kg</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{progressMap[batch.status] || 0}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${progressMap[batch.status] || 0}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {batches.length === 0 && (
              <div className="text-center py-10 text-slate-400">暂无活动批次</div>
            )}
          </section>

          {/* Real-time Feed */}
          <section className="mt-2 pb-6">
            <div className="flex items-center justify-between px-1 mb-3">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
                实时扫描动态
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
              </h2>
            </div>
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden text-xs text-slate-500 p-8 text-center">
              <span className="material-icons text-slate-300 text-4xl mb-2">sensors</span>
              <p>实时扫描数据流已连接</p>
            </div>
          </section>
        </div>
      </main>

      {/* Map Overlay / Background Graphic */}
      <div className="fixed top-0 right-0 w-full h-full pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0 overflow-hidden">
        <div className="absolute top-20 right-[-100px] w-[500px] h-[500px] rounded-full border-[40px] border-slate-900"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-[300px] h-[300px] rounded-full border-[20px] border-primary"></div>
      </div>
    </div>
  );
};

export default SenderMonitor;