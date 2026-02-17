
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/finance.store';
import { useUserStore } from '../store/user.store';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const ReportCenter: React.FC = () => {
    const navigate = useNavigate();
    const { getStats, getDailyTrends } = useFinanceStore();
    const { user } = useUserStore();

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const [stats, setStats] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const role = user?.role || 'admin';
        const companyId = user?.company_id;

        const [statsData, trendsData] = await Promise.all([
            getStats(dateRange.start, dateRange.end + 'T23:59:59', companyId, role),
            getDailyTrends(dateRange.start, dateRange.end + 'T23:59:59', companyId, role)
        ]);

        setStats(statsData);
        setTrends(trendsData);
        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [dateRange, user]);

    const formatCurrency = (amount: number, currency: string = 'VND') => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
    };

    const isAdmin = user?.role === 'admin';
    const isSender = user?.role === 'sender';
    const isReceiver = user?.role === 'receiver';

    return (
        <div className="bg-[#0f172a] text-slate-100 min-h-screen pb-24 font-display">
            {/* Header */}
            <nav className="sticky top-0 z-50 flex items-center justify-between bg-slate-900/80 backdrop-blur-md px-4 py-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <span className="material-icons text-white">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white">数据报表中心</h1>
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-none mt-1">Report Center</p>
                    </div>
                </div>
                <button onClick={fetchData} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white">
                    <span className={`material-icons ${loading ? 'animate-spin' : ''}`}>refresh</span>
                </button>
            </nav>

            <main className="p-4 space-y-6">
                {/* Date Filter */}
                <section className="bg-slate-800/50 rounded-3xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">开始日期</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="w-full bg-slate-900 border-none rounded-xl py-2 px-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">结束日期</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="w-full bg-slate-900 border-none rounded-xl py-2 px-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>
                </section>

                {/* Hero Stats */}
                <div className="grid grid-cols-1 gap-4">
                    {isAdmin && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-[40px] p-8 border border-emerald-500/20 relative overflow-hidden group shadow-2xl shadow-emerald-500/10"
                        >
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                            <p className="text-emerald-500 text-xs font-black uppercase tracking-[0.2em] mb-2">平台估算利润 (A - B)</p>
                            <h2 className="text-4xl font-black text-white tracking-tight">
                                {formatCurrency(stats?.bill_a_sum - stats?.bill_b_sum || 0)}
                            </h2>
                            <div className="mt-4 flex gap-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">总收入 (A)</p>
                                    <p className="text-sm font-bold">{formatCurrency(stats?.bill_a_sum || 0)}</p>
                                </div>
                                <div className="w-px h-8 bg-white/10"></div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">总成本 (B)</p>
                                    <p className="text-sm font-bold">{formatCurrency(stats?.bill_b_sum || 0)}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {isSender && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-[40px] p-8 border border-blue-500/20 relative overflow-hidden group shadow-2xl shadow-blue-500/10"
                        >
                            <p className="text-blue-500 text-xs font-black uppercase tracking-[0.2em] mb-2">发出方应付总额 (A + C)</p>
                            <h2 className="text-4xl font-black text-white tracking-tight">
                                {formatCurrency((stats?.bill_a_sum || 0) + (stats?.bill_c_sum || 0))}
                            </h2>
                            <div className="mt-4 flex gap-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">应付平台 (A)</p>
                                    <p className="text-sm font-bold">{formatCurrency(stats?.bill_a_sum || 0)}</p>
                                </div>
                                <div className="w-px h-8 bg-white/10"></div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">应付收货方 (C)</p>
                                    <p className="text-sm font-bold">{formatCurrency(stats?.bill_c_sum || 0)}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {isReceiver && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-[40px] p-8 border border-purple-500/20 relative overflow-hidden group shadow-2xl shadow-purple-500/10"
                        >
                            <p className="text-purple-500 text-xs font-black uppercase tracking-[0.2em] mb-2">接收方应收总额 (C)</p>
                            <h2 className="text-4xl font-black text-white tracking-tight">
                                {formatCurrency(stats?.bill_c_sum || 0)}
                            </h2>
                            <div className="mt-2">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">关联批次总数</p>
                                <p className="text-sm font-bold">{stats?.batch_count || 0} 个批次</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/40 rounded-3xl p-6 border border-white/5">
                        <span className="material-icons text-yellow-500 mb-2">fitness_center</span>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">累计重量 (kg)</p>
                        <p className="text-2xl font-black text-white mt-1">{(stats?.total_weight || 0).toLocaleString()} kg</p>
                    </div>
                    <div className="bg-slate-800/40 rounded-3xl p-6 border border-white/5">
                        <span className="material-icons text-cyan-500 mb-2">straighten</span>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">累计体积 (m³)</p>
                        <p className="text-2xl font-black text-white mt-1">{(stats?.total_volume || 0).toLocaleString()} m³</p>
                    </div>
                </div>

                {/* Charts Area */}
                <section className="space-y-4">
                    <div className="bg-slate-800/40 rounded-[40px] p-6 border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">每日重量趋势</h3>
                            <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-black rounded-full">30-Day Trend</span>
                        </div>

                        <div className="h-[250px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0d59f2" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0d59f2" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                    <XAxis
                                        dataKey="stats_date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                        tickFormatter={(str) => str.split('-').slice(1).join('/')}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                                        itemStyle={{ color: '#0d59f2' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total_weight"
                                        stroke="#0d59f2"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorWeight)"
                                        name="重量 (kg)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-slate-800/40 rounded-[40px] p-6 border border-white/5">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 font-display">每日体积概览</h4>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                    <XAxis
                                        dataKey="stats_date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                        tickFormatter={(str) => str.split('-').slice(1).join('/')}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                                    />
                                    <Bar dataKey="total_volume" fill="#06b6d4" radius={[4, 4, 0, 0]} name="体积 (m³)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ReportCenter;
