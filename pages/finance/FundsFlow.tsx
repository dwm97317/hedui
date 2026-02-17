import React, { useEffect } from 'react';
import { useFinanceStore, BillStatus } from '../../store/finance.store';
import { RefreshCw, TrendingUp } from 'lucide-react';

const FundsFlow = () => {
    const fetchBatches = useFinanceStore(state => state.fetchBatches);
    const getAdminBatches = useFinanceStore(state => state.getAdminBatches);
    const loading = useFinanceStore(state => state.loading);

    const batches = getAdminBatches();

    useEffect(() => {
        fetchBatches();
    }, []);

    // Calculate Aggregates
    const totalRevenueVND = batches.reduce((sum, b) => sum + b.billA.amount, 0);
    const totalCostVND = batches.reduce((sum, b) => sum + b.billB.amount, 0);
    const totalProfitVND = totalRevenueVND - totalCostVND;

    const totalGoodsCNY = batches.reduce((sum, b) => sum + b.billC.amount, 0);

    const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formatCNY = (amount: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);

    if (loading) return <div className="p-8 text-white">正在加载财务数据...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans overflow-hidden">
            <header className="mb-12 flex justify-between items-center relative z-10">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        资金流向拓扑图
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">三方账单循环实时监控</p>
                </div>
                <button onClick={() => fetchBatches()} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition">
                    <RefreshCw size={20} className="text-white" />
                </button>
            </header>

            {/* Main Diagram Area */}
            <div className="relative w-full max-w-5xl mx-auto h-[600px] bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm shadow-2xl p-8 flex items-center justify-center">

                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

                {/* Nodes */}
                <div className="relative w-full h-full">

                    {/* SENDER Node (Left) */}
                    <div className="absolute top-1/2 left-10 -translate-y-1/2 w-48 h-48 bg-slate-800 rounded-2xl border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] flex flex-col items-center justify-center z-20 hover:scale-105 transition-transform duration-300">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
                            <span className="text-3xl">📦</span>
                        </div>
                        <h3 className="text-xl font-bold text-blue-400">发货方</h3>
                        <p className="text-xs text-slate-400 mt-1">批次起点</p>
                    </div>

                    {/* ADMIN Node (Center Top) */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-40 bg-slate-800 rounded-2xl border-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)] flex flex-col items-center justify-center z-20 hover:scale-105 transition-transform duration-300">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-2">
                            <span className="text-2xl">🛡️</span>
                        </div>
                        <h3 className="text-lg font-bold text-purple-400">平台 (您)</h3>
                        <div className="mt-2 text-center">
                            <div className="text-xs text-slate-400 uppercase tracking-widest">净利润</div>
                            <div className="text-xl font-bold text-green-400 font-mono">{formatVND(totalProfitVND)}</div>
                        </div>
                    </div>

                    {/* TRANSIT Node (Right Top) */}
                    <div className="absolute top-1/2 right-10 -translate-y-1/2 w-48 h-48 bg-slate-800 rounded-2xl border-2 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.2)] flex flex-col items-center justify-center z-20 hover:scale-105 transition-transform duration-300">
                        <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-3">
                            <span className="text-3xl">🚚</span>
                        </div>
                        <h3 className="text-xl font-bold text-orange-400">中转方</h3>
                        <p className="text-xs text-slate-400 mt-1">物流供应商</p>
                    </div>

                    {/* RECEIVER Node (Bottom Center) */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-56 h-40 bg-slate-800 rounded-2xl border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)] flex flex-col items-center justify-center z-20 hover:scale-105 transition-transform duration-300">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                            <span className="text-2xl">👤</span>
                        </div>
                        <h3 className="text-lg font-bold text-green-400">接收方</h3>
                        <p className="text-xs text-slate-400 mt-1">最终客户</p>
                    </div>

                    {/* SVG Flows */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                        <defs>
                            <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#60a5fa" />
                            </marker>
                            <marker id="arrowhead-orange" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#fb923c" />
                            </marker>
                            <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#4ade80" />
                            </marker>
                        </defs>

                        {/* Path 1: Sender -> Admin (Bill A - VND) */}
                        <path d="M 230 300 C 350 300, 350 150, 480 150" fill="none" stroke="#60a5fa" strokeWidth="3" markerEnd="url(#arrowhead-blue)" className="animate-pulse" />
                        <foreignObject x="280" y="200" width="120" height="50">
                            <div className="bg-slate-900/80 p-1 rounded text-center border border-blue-500/30 text-blue-300 text-xs">
                                <div className="font-bold">账单 A (VND)</div>
                                <div>{formatVND(totalRevenueVND)}</div>
                            </div>
                        </foreignObject>

                        {/* Path 2: Admin -> Transit (Bill B - VND) */}
                        <path d="M 740 150 C 850 150, 850 300, 950 300" fill="none" stroke="#fb923c" strokeWidth="3" markerEnd="url(#arrowhead-orange)" className="animate-pulse" />
                        <foreignObject x="800" y="200" width="120" height="50">
                            <div className="bg-slate-900/80 p-1 rounded text-center border border-orange-500/30 text-orange-300 text-xs">
                                <div className="font-bold">账单 B (VND)</div>
                                <div>{formatVND(totalCostVND)}</div>
                            </div>
                        </foreignObject>

                        {/* Path 3: Sender -> Receiver (Bill C - CNY) */}
                        <path d="M 230 300 C 350 300, 350 480, 500 480" fill="none" stroke="#4ade80" strokeWidth="3" markerEnd="url(#arrowhead-green)" strokeDasharray="5,5" />
                        <foreignObject x="320" y="420" width="120" height="50">
                            <div className="bg-slate-900/80 p-1 rounded text-center border border-green-500/30 text-green-300 text-xs">
                                <div className="font-bold">账单 C (CNY)</div>
                                <div>{formatCNY(totalGoodsCNY)}</div>
                                <div className="text-[10px] text-slate-500">直接结算</div>
                            </div>
                        </foreignObject>

                    </svg>

                </div>
            </div>

            {/* Legend */}
            <div className="max-w-5xl mx-auto mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <div className="text-blue-400 font-bold mb-1">账单 A 流向</div>
                    <div className="text-xs text-slate-500">发货方向平台支付物流费用</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <div className="text-orange-400 font-bold mb-1">账单 B 流向</div>
                    <div className="text-xs text-slate-500">平台向中转方支付运输费用</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <div className="text-green-400 font-bold mb-1">账单 C 流向</div>
                    <div className="text-xs text-slate-500">发货方接收来自接收方的货款 (直接支付/平台促成)</div>
                </div>
            </div>

        </div>
    );
};

export default FundsFlow;
