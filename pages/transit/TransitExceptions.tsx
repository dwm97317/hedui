
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraScanButton } from '../../components/CameraScanner';

const TransitExceptions: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-gray-100 min-h-screen flex flex-col overflow-hidden relative selection:bg-primary selection:text-white">
            {/* Top Status Bar */}
            <div className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-between items-center shrink-0 z-20">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors mr-1">
                        <span className="material-icons text-lg">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-gray-300">
                        <span className="material-icons text-base text-primary">account_circle</span>
                        <span>李华 · 中转方</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="material-icons text-sm">wifi</span> 5G</span>
                    <span className="flex items-center gap-1"><span className="material-icons text-sm">battery_full</span> 98%</span>
                    <span>14:32</span>
                </div>
            </div>

            {/* Search & Filter Area */}
            <div className="bg-white dark:bg-background-dark px-4 pt-4 pb-2 shrink-0 z-10 space-y-3 border-b border-gray-200 dark:border-gray-800">
                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-icons text-gray-400 group-focus-within:text-primary transition-colors">qr_code_scanner</span>
                    </div>
                    <input
                        className="block w-full pl-10 pr-3 py-3 border-none rounded-lg leading-5 bg-gray-100 dark:bg-surface-dark text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:bg-surface-lighter transition-all text-lg font-medium shadow-inner"
                        placeholder="扫描或输入单号..."
                        type="text"
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                        <CameraScanButton onScan={(code) => { /* TODO: wire scan handler */ }} size="sm" />
                        <button className="p-1 text-primary hover:text-primary-dark transition-colors">
                            <span className="material-icons">search</span>
                        </button>
                    </div>
                </div>
                {/* Filter Tabs */}
                <div className="flex space-x-2">
                    <button className="flex-1 py-2 px-4 rounded bg-primary text-white font-medium text-sm shadow-lg shadow-primary/20 transition-transform active:scale-95 text-center">
                        全部 (12)
                    </button>
                    <button className="flex-1 py-2 px-4 rounded bg-white dark:bg-surface-dark text-slate-600 dark:text-gray-400 font-medium text-sm border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:text-slate-800 dark:hover:text-gray-200 transition-colors text-center">
                        待处理 (5)
                    </button>
                    <button className="flex-1 py-2 px-4 rounded bg-white dark:bg-surface-dark text-slate-600 dark:text-gray-400 font-medium text-sm border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:text-slate-800 dark:hover:text-gray-200 transition-colors text-center">
                        已解决 (7)
                    </button>
                </div>
            </div>

            {/* Exception List (Scrollable Area) */}
            <div className="flex-1 overflow-y-auto px-4 py-2 pb-24 space-y-3 bg-gray-50 dark:bg-background-dark/50 no-scrollbar">
                {/* Card 1: Weight Mismatch */}
                <div className="bg-white dark:bg-surface-dark rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    {/* Left accent strip */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                            <span className="text-[20px] font-bold text-slate-800 dark:text-white tracking-tight font-mono">SF1029384756</span>
                            <span className="text-xs text-gray-500 mt-1 font-mono">2023-10-27 14:30 | 批次: B-992</span>
                        </div>
                        <span className="px-2 py-1 rounded bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/30 text-xs font-bold flex items-center gap-1">
                            <span className="material-icons text-sm">warning</span>
                            重量不符
                        </span>
                    </div>
                    {/* Comparison Grid */}
                    <div className="bg-gray-50 dark:bg-background-dark rounded border border-gray-200 dark:border-gray-800 p-3 mb-3 grid grid-cols-2 gap-4">
                        <div className="flex flex-col border-r border-gray-300 dark:border-gray-700/50 pr-2">
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">发出方原始数据</span>
                            <span className="text-slate-700 dark:text-gray-300 font-medium">5.00 kg</span>
                        </div>
                        <div className="flex flex-col pl-2 relative">
                            <span className="text-[10px] uppercase tracking-wider text-primary mb-1">中转实测数据</span>
                            <span className="text-primary font-bold text-lg">7.20 kg</span>
                            {/* Indicator dot */}
                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button className="flex items-center gap-2 bg-primary hover:bg-blue-600 active:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors shadow-lg shadow-primary/20 w-full justify-center">
                            <span className="material-icons text-sm">build</span>
                            立即处理
                        </button>
                    </div>
                </div>

                {/* Card 2: Damaged Package */}
                <div className="bg-white dark:bg-surface-dark rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
                    {/* Left accent strip */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                            <span className="text-[20px] font-bold text-slate-800 dark:text-white tracking-tight font-mono">YT8837102934</span>
                            <span className="text-xs text-gray-500 mt-1 font-mono">2023-10-27 14:15 | 批次: A-104</span>
                        </div>
                        <span className="px-2 py-1 rounded bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/30 text-xs font-bold flex items-center gap-1">
                            <span className="material-icons text-sm">broken_image</span>
                            外包装破损
                        </span>
                    </div>
                    {/* Comparison Grid */}
                    <div className="bg-gray-50 dark:bg-background-dark rounded border border-gray-200 dark:border-gray-800 p-3 mb-3 grid grid-cols-2 gap-4">
                        <div className="flex flex-col border-r border-gray-300 dark:border-gray-700/50 pr-2">
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">包装状态 (原)</span>
                            <span className="text-slate-700 dark:text-gray-300 font-medium">完好</span>
                        </div>
                        <div className="flex flex-col pl-2">
                            <span className="text-[10px] uppercase tracking-wider text-orange-500 dark:text-orange-400 mb-1">包装状态 (现)</span>
                            <span className="text-orange-600 dark:text-orange-400 font-bold text-lg">侧面破损</span>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button className="flex items-center gap-2 bg-slate-100 dark:bg-surface-lighter hover:bg-slate-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-slate-700 dark:text-white px-4 py-2 rounded font-medium text-sm transition-colors w-full justify-center">
                            <span className="material-icons text-sm">visibility</span>
                            查看详情
                        </button>
                    </div>
                </div>

                {/* Card 3: Blurry Label */}
                <div className="bg-white dark:bg-surface-dark rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
                    {/* Left accent strip */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                            <span className="text-[20px] font-bold text-slate-800 dark:text-white tracking-tight font-mono">JD9928374610</span>
                            <span className="text-xs text-gray-500 mt-1 font-mono">2023-10-27 13:50 | 批次: C-221</span>
                        </div>
                        <span className="px-2 py-1 rounded bg-yellow-50 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500/30 text-xs font-bold flex items-center gap-1">
                            <span className="material-icons text-sm">blur_on</span>
                            标签模糊
                        </span>
                    </div>
                    {/* Comparison Grid */}
                    <div className="bg-gray-50 dark:bg-background-dark rounded border border-gray-200 dark:border-gray-800 p-3 mb-3 grid grid-cols-2 gap-4">
                        <div className="flex flex-col border-r border-gray-300 dark:border-gray-700/50 pr-2">
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">扫描状态</span>
                            <span className="text-slate-700 dark:text-gray-300 font-medium">自动分拣失败</span>
                        </div>
                        <div className="flex flex-col pl-2">
                            <span className="text-[10px] uppercase tracking-wider text-yellow-600 dark:text-yellow-400 mb-1">人工核验</span>
                            <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">待重新打单</span>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button className="flex items-center gap-2 bg-slate-100 dark:bg-surface-lighter hover:bg-slate-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-slate-700 dark:text-white px-4 py-2 rounded font-medium text-sm transition-colors w-full justify-center">
                            <span className="material-icons text-sm">print</span>
                            补打面单
                        </button>
                    </div>
                </div>

                {/* Card 4: Weight Mismatch (Resolved) */}
                <div className="bg-white dark:bg-surface-dark rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden opacity-60 grayscale-[0.5]">
                    {/* Left accent strip */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                            <span className="text-[20px] font-bold text-slate-600 dark:text-gray-300 tracking-tight font-mono line-through decoration-slate-400 dark:decoration-gray-500">SF8829102934</span>
                            <span className="text-xs text-gray-500 mt-1 font-mono">2023-10-27 10:12 | 批次: A-101</span>
                        </div>
                        <span className="px-2 py-1 rounded bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/30 text-xs font-bold flex items-center gap-1">
                            <span className="material-icons text-sm">check_circle</span>
                            已解决
                        </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-background-dark rounded border border-gray-200 dark:border-gray-800 p-3 mb-3 grid grid-cols-2 gap-4">
                        <div className="flex flex-col border-r border-gray-300 dark:border-gray-700/50 pr-2">
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">差异原因</span>
                            <span className="text-slate-600 dark:text-gray-400 font-medium text-sm">录入错误</span>
                        </div>
                        <div className="flex flex-col pl-2">
                            <span className="text-[10px] uppercase tracking-wider text-green-600 dark:text-green-500 mb-1">处理结果</span>
                            <span className="text-green-600 dark:text-green-500 font-bold text-sm">已更正收费</span>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button className="flex items-center gap-2 text-gray-400 px-4 py-2 rounded font-medium text-sm w-full justify-center border border-gray-200 dark:border-gray-700 cursor-not-allowed bg-gray-50 dark:bg-transparent">
                            已归档
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Action Area */}
            <div className="bg-white/95 dark:bg-background-dark/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 p-4 absolute bottom-0 left-0 right-0 z-30 pb-safe-area-bottom">
                <button className="w-full bg-primary hover:bg-blue-600 active:bg-blue-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                    <span className="material-icons">add_circle</span>
                    新增异常登记
                </button>
            </div>
        </div>
    );
};

export default TransitExceptions;
