import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export interface FinanceStats {
    cny: {
        pending: number;
        paid: number;
        total: number;
    };
    vnd: {
        pending: number;
        paid: number;
        total: number;
    };
    collectionRate: number;
    monthlyTrend: {
        month: string;
        income: number;
        expense: number;
    }[];
}

export const useFinanceStats = () => {
    return useQuery({
        queryKey: ['finance-stats'],
        queryFn: async (): Promise<FinanceStats> => {
            // 获取账单统计
            const { data: billStats, error: billError } = await supabase
                .from('bills')
                .select('currency, status, total_amount');

            if (billError) throw billError;

            // 计算各币种的待结算和已结算金额
            const cnyPending = billStats
                ?.filter(b => b.currency === 'CNY' && b.status === 'pending')
                .reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0;

            const cnyPaid = billStats
                ?.filter(b => b.currency === 'CNY' && b.status === 'paid')
                .reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0;

            const vndPending = billStats
                ?.filter(b => b.currency === 'VND' && b.status === 'pending')
                .reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0;

            const vndPaid = billStats
                ?.filter(b => b.currency === 'VND' && b.status === 'paid')
                .reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0;

            // 计算回款率
            const totalBilled = cnyPending + cnyPaid + vndPending + vndPaid;
            const totalPaid = cnyPaid + vndPaid;
            const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

            // 获取最近6个月的趋势数据
            const { data: monthlyData, error: monthlyError } = await supabase
                .from('bills')
                .select('created_at, total_amount, bill_type, currency')
                .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: true });

            if (monthlyError) throw monthlyError;

            // 按月份聚合数据
            const monthlyTrend = [];
            const months = ['5月', '6月', '7月', '8月', '9月', '10月'];
            const now = new Date();

            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStr = `${monthDate.getMonth() + 1}月`;

                const monthBills = monthlyData?.filter(b => {
                    const billDate = new Date(b.created_at);
                    return billDate.getMonth() === monthDate.getMonth() &&
                        billDate.getFullYear() === monthDate.getFullYear();
                }) || [];

                // 收入：SENDER_TO_ADMIN 和 SENDER_TO_RECEIVER
                const income = monthBills
                    .filter(b => b.bill_type === 'SENDER_TO_ADMIN' || b.bill_type === 'SENDER_TO_RECEIVER')
                    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

                // 支出：ADMIN_TO_TRANSIT
                const expense = monthBills
                    .filter(b => b.bill_type === 'ADMIN_TO_TRANSIT')
                    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

                monthlyTrend.push({
                    month: monthStr,
                    income,
                    expense
                });
            }

            return {
                cny: {
                    pending: cnyPending,
                    paid: cnyPaid,
                    total: cnyPending + cnyPaid
                },
                vnd: {
                    pending: vndPending,
                    paid: vndPaid,
                    total: vndPending + vndPaid
                },
                collectionRate,
                monthlyTrend
            };
        },
        refetchInterval: 30000, // 每30秒刷新一次
    });
};
