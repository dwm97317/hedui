import { create } from 'zustand';
import { supabase } from '../services/supabase';

export enum BillStatus {
    PENDING = 'pending',
    PAID = 'paid',
    PARTIALLY_PAID = 'partially_paid',
    OVERDUE = 'overdue',
}

export enum Currency {
    VND = 'VND',
    CNY = 'CNY',
}

export interface FinancePayment {
    id: string;
    amount: number;
    payment_date: string;
    payment_method?: string;
    reference_no?: string;
}

export interface FinanceBill {
    id: string;
    amount: number;
    paidAmount: number; // Added for multiple payments
    currency: Currency;
    status: BillStatus;
    type: 'SENDER_TO_ADMIN' | 'ADMIN_TO_TRANSIT' | 'SENDER_TO_RECEIVER';
    payer: string;
    payee: string;
    createdAt: string;
    unitPrice?: number;
    totalWeight?: number;
    payments: FinancePayment[];
}

export interface FinanceBatch {
    id: string;
    batchCode: string;
    totalWeight: number;
    totalVolume?: number;
    senderWeight?: number;
    transitWeight?: number;
    receiverWeight?: number;
    senderVolume?: number;
    transitVolume?: number;
    receiverVolume?: number;
    senderName: string;
    transitName: string;
    receiverName: string;
    status: string;
    createdAt: string;

    // The 3 Bills
    billA: FinanceBill; // Sender -> Admin (VND)
    billB: FinanceBill; // Admin -> Transit (VND)
    billC: FinanceBill; // Sender -> Receiver (CNY)

    // Batch Unit Prices
    unitPriceA: number;
    unitPriceB: number;
    unitPriceC: number;
}

interface FinanceState {
    batches: FinanceBatch[];
    loading: boolean;
    exchangeRates: { CNY_VND: number };

    // Actions
    fetchBatches: () => Promise<void>;
    fetchExchangeRates: () => Promise<void>;
    markBillAsPaid: (billId: string) => Promise<void>;
    updateBillUnitPrice: (billId: string, unitPrice: number) => Promise<void>;
    updateBillStatus: (billId: string, status: BillStatus) => Promise<void>;
    updateBatchUnitPrices: (batchId: string, priceA: number, priceB: number, priceC: number) => Promise<void>;
    updateExchangeRate: (base: Currency, target: Currency, rate: number) => Promise<void>;
    addBillPayment: (billId: string, amount: number, method?: string, reference?: string) => Promise<void>;
    deleteBillPayment: (paymentId: string) => Promise<void>;
    deleteBill: (billId: string) => Promise<void>;
    createBill: (bill: any) => Promise<void>;

    // Batch CRUD
    createBatch: (batch: any) => Promise<void>;
    updateBatch: (batchId: string, updates: any) => Promise<void>;
    deleteBatch: (batchId: string) => Promise<void>;

    getSenderBatches: () => FinanceBatch[];
    getTransitBatches: () => FinanceBatch[];
    getReceiverBatches: () => FinanceBatch[];
    getAdminBatches: () => FinanceBatch[];
    getStats: (startDate: string, endDate: string, companyId?: string, role?: string) => Promise<any>;
    getDailyTrends: (startDate: string, endDate: string, companyId?: string, role?: string) => Promise<any[]>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    batches: [],
    loading: false,
    exchangeRates: { CNY_VND: 3750 }, // Default fallback

    fetchBatches: async () => {
        // Also fetch exchange rates if needed or just do it once
        if (get().exchangeRates.CNY_VND === 3750) {
            await get().fetchExchangeRates();
        }

        set({ loading: true });
        try {
            console.log('Fetching finance batches...');
            const { data, error } = await supabase
                .from('batches')
                .select(`
                    id,
                    batch_no,
                    total_weight,
                    sender_weight,
                    transit_weight,
                    receiver_weight,
                    sender_volume,
                    transit_volume,
                    receiver_volume,
                    total_volume,
                    status,
                    created_at,
                    unit_price_a,
                    unit_price_b,
                    unit_price_c,
                    sender:sender_company_id(name),
                    transit:transit_company_id(name),
                    receiver:receiver_company_id(name),
                    bills (
                        id,
                        bill_type,
                        total_amount,
                        paid_amount,
                        currency,
                        status,
                        created_at,
                        unit_price,
                        total_weight,
                        payer:payer_company_id(name),
                        payee:payee_company_id(name),
                        payments:bill_payments(id, amount, payment_date, payment_method, reference_no)
                    )
                `)
                .is('deleted_at', null) // Only fetch non-deleted batches
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching finance batches:', error);
                set({ loading: false });
                return;
            }

            console.log('Got raw data:', data);

            const mappedBatches: FinanceBatch[] = data.map((batch: any) => {
                // Helper to find bill or return default empty bill to prevent crashes
                const findBill = (type: string): FinanceBill => {
                    const found = batch.bills?.find((b: any) => b.bill_type === type);
                    if (found) {
                        return {
                            id: found.id,
                            amount: Number(found.total_amount),
                            paidAmount: Number(found.paid_amount || 0),
                            currency: found.currency as Currency,
                            status: (found.status?.toLowerCase() || 'pending') as BillStatus,
                            type: found.bill_type,
                            payer: found.payer?.name || 'Unknown',
                            payee: found.payee?.name || 'Unknown',
                            createdAt: found.created_at,
                            unitPrice: Number(found.unit_price || 0),
                            totalWeight: Number(found.total_weight || 0),
                            payments: (found.payments || []).map((p: any) => ({
                                id: p.id,
                                amount: Number(p.amount),
                                payment_date: p.payment_date,
                                payment_method: p.payment_method,
                                reference_no: p.reference_no
                            }))
                        };
                    }
                    // Fallback if bill missing
                    return {
                        id: `missing-${type}-${batch.id}`,
                        amount: 0,
                        paidAmount: 0,
                        currency: type === 'SENDER_TO_RECEIVER' ? Currency.CNY : Currency.VND,
                        status: BillStatus.PENDING,
                        type: type as any,
                        payer: 'Unknown',
                        payee: 'Unknown',
                        createdAt: new Date().toISOString(),
                        unitPrice: 0,
                        totalWeight: 0,
                        payments: []
                    };
                };

                // 获取账单数据
                const billA = findBill('SENDER_TO_ADMIN');
                const billB = findBill('ADMIN_TO_TRANSIT');
                const billC = findBill('SENDER_TO_RECEIVER');

                return {
                    id: batch.id,
                    batchCode: batch.batch_no,
                    totalWeight: Number(batch.total_weight),
                    senderWeight: Number(batch.sender_weight || 0),
                    transitWeight: Number(batch.transit_weight || 0),
                    receiverWeight: Number(batch.receiver_weight || 0),
                    senderVolume: Number(batch.sender_volume || 0),
                    transitVolume: Number(batch.transit_volume || 0),
                    receiverVolume: Number(batch.receiver_volume || 0),
                    senderName: batch.sender?.name || 'Unknown Sender',
                    transitName: batch.transit?.name || 'Unknown Transit',
                    receiverName: batch.receiver?.name || 'Unknown Receiver',
                    status: batch.status,
                    createdAt: batch.created_at,
                    billA,
                    billB,
                    billC,
                    // 使用账单表中的实际单价，而不是批次表中的默认单价
                    unitPriceA: billA.unitPrice || Number(batch.unit_price_a || 0),
                    unitPriceB: billB.unitPrice || Number(batch.unit_price_b || 0),
                    unitPriceC: billC.unitPrice || Number(batch.unit_price_c || 0)
                };
            });

            set({ batches: mappedBatches, loading: false });
        } catch (err) {
            console.error('Unexpected error in fetchBatches:', err);
            set({ loading: false });
        }
    },

    markBillAsPaid: async (billId: string) => {
        // Optimistic Update
        set((state) => ({
            batches: state.batches.map(b => ({
                ...b,
                billA: b.billA.id === billId ? { ...b.billA, status: BillStatus.PAID } : b.billA,
                billB: b.billB.id === billId ? { ...b.billB, status: BillStatus.PAID } : b.billB,
                billC: b.billC.id === billId ? { ...b.billC, status: BillStatus.PAID } : b.billC,
            }))
        }));

        // Actual DB Update
        try {
            const { error } = await supabase
                .from('bills')
                .update({ status: 'paid' })
                .eq('id', billId);

            if (error) {
                console.error('Error updating bill status:', error);
                throw error;
            }
        } catch (error) {
            console.error('Failed to update bill status', error);
        }
    },

    updateBillUnitPrice: async (billId: string, unitPrice: number) => {
        // Find the bill to get weight
        const bill = get().batches.flatMap(b => [b.billA, b.billB, b.billC]).find(b => b.id === billId);
        if (!bill) return;

        const weight = bill.totalWeight || 0;
        const newAmount = weight * unitPrice;

        // Optimistic Update
        set((state) => ({
            batches: state.batches.map(b => ({
                ...b,
                billA: b.billA.id === billId ? { ...b.billA, unitPrice, amount: newAmount } : b.billA,
                billB: b.billB.id === billId ? { ...b.billB, unitPrice, amount: newAmount } : b.billB,
                billC: b.billC.id === billId ? { ...b.billC, unitPrice, amount: newAmount } : b.billC,
            }))
        }));

        // DB Update
        try {
            const { error } = await supabase
                .from('bills')
                .update({
                    unit_price: unitPrice,
                    total_amount: newAmount
                })
                .eq('id', billId);

            if (error) throw error;
        } catch (error) {
            console.error('Failed to update unit price:', error);
        }
    },

    updateBatchUnitPrices: async (batchId: string, priceA: number, priceB: number, priceC: number) => {
        // Optimistic Update
        set((state) => ({
            batches: state.batches.map(b => {
                if (b.id !== batchId) return b;

                const weight = b.totalWeight || 0;

                // Update bills based on new prices if they exist
                const updateBill = (bill: FinanceBill, newPrice: number) => ({
                    ...bill,
                    unitPrice: newPrice,
                    amount: weight * newPrice
                });

                return {
                    ...b,
                    unitPriceA: priceA,
                    unitPriceB: priceB,
                    unitPriceC: priceC,
                    billA: updateBill(b.billA, priceA),
                    billB: updateBill(b.billB, priceB),
                    billC: updateBill(b.billC, priceC),
                };
            })
        }));

        try {
            // Update batch unit prices
            const { error: batchError } = await supabase
                .from('batches')
                .update({
                    unit_price_a: priceA,
                    unit_price_b: priceB,
                    unit_price_c: priceC
                })
                .eq('id', batchId);

            if (batchError) throw batchError;

            // Trigger recalculate function
            const { error: recalcError } = await supabase.rpc('recalculate_batch_bills', { p_batch_id: batchId });
            if (recalcError) {
                console.warn('Failed to fully recalculate bills via RPC:', recalcError);
                // The optimistic update is likely correct anyway, but RPC ensures DB consistency
            }

            // Reload batches to ensure everything is synced
            await get().fetchBatches();

        } catch (error: any) {
            console.error('Failed to update batch unit prices:', error);

            // Revert optimistic update by reloading from database
            await get().fetchBatches();

            // Show user-friendly error message
            const errorMessage = error?.message || 'Unknown error';
            alert(`更新单价失败: ${errorMessage}`);

            throw error; // Re-throw so caller knows it failed
        }
    },

    updateExchangeRate: async (base: Currency, target: Currency, rate: number) => {
        try {
            // First deactivate old rates
            await supabase
                .from('exchange_rates')
                .update({ is_active: false })
                .eq('base_currency', base)
                .eq('target_currency', target);

            // Insert new active rate
            const { error } = await supabase
                .from('exchange_rates')
                .insert({
                    base_currency: base,
                    target_currency: target,
                    rate,
                    is_active: true
                });

            if (error) throw error;
            console.log(`Exchange rate updated: ${base} -> ${target} = ${rate}`);
            await get().fetchExchangeRates(); // Refresh local state
        } catch (error) {
            console.error('Failed to update exchange rate:', error);
        }
    },

    fetchExchangeRates: async () => {
        try {
            const { data, error } = await supabase
                .from('exchange_rates')
                .select('base_currency, target_currency, rate')
                .eq('is_active', true);

            if (error) throw error;

            const rates = { CNY_VND: 3750 };
            data.forEach((r: any) => {
                if (r.base_currency === 'CNY' && r.target_currency === 'VND') {
                    rates.CNY_VND = Number(r.rate);
                }
            });

            set({ exchangeRates: rates });
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
        }
    },

    updateBillStatus: async (billId: string, status: BillStatus) => {
        try {
            const { error } = await supabase
                .from('bills')
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', billId);

            if (error) throw error;

            // Reload batches to reflect the updated bill status
            await get().fetchBatches();

            console.log(`Bill ${billId} status updated to ${status}`);
        } catch (error: any) {
            console.error('Failed to update bill status:', error);
            const errorMessage = error?.message || 'Unknown error';
            alert(`更新账单状态失败: ${errorMessage}`);
            throw error;
        }
    },

    addBillPayment: async (billId: string, amount: number, method?: string, reference?: string) => {
        try {
            const { error } = await supabase
                .from('bill_payments')
                .insert({
                    bill_id: billId,
                    amount,
                    payment_method: method,
                    reference_no: reference
                });

            if (error) throw error;

            // Trigger fetch refresh which is handled by DB triggers updating bills
            await get().fetchBatches();
            console.log(`Payment of ${amount} added to bill ${billId}`);
        } catch (error: any) {
            console.error('Failed to add bill payment:', error);
            alert(`添加支付记录失败: ${error.message}`);
            throw error;
        }
    },
    deleteBillPayment: async (paymentId: string) => {
        try {
            const { error } = await supabase
                .from('bill_payments')
                .delete()
                .eq('id', paymentId);
            if (error) throw error;
            await get().fetchBatches();
        } catch (error: any) {
            console.error('Failed to delete bill payment:', error);
            throw error;
        }
    },
    deleteBill: async (billId: string) => {
        try {
            const { error } = await supabase
                .from('bills')
                .delete()
                .eq('id', billId);
            if (error) throw error;
            await get().fetchBatches();
        } catch (error: any) {
            console.error('Failed to delete bill:', error);
            throw error;
        }
    },
    createBill: async (bill: any) => {
        try {
            const { error } = await supabase
                .from('bills')
                .insert(bill);
            if (error) throw error;
            await get().fetchBatches();
        } catch (error: any) {
            console.error('Failed to create bill:', error);
            throw error;
        }
    },

    createBatch: async (batch: any) => {
        try {
            const { error } = await supabase
                .from('batches')
                .insert(batch);
            if (error) throw error;
            await get().fetchBatches();
        } catch (error: any) {
            console.error('Failed to create batch:', error);
            throw error;
        }
    },

    updateBatch: async (batchId: string, updates: any) => {
        try {
            const { error } = await supabase
                .from('batches')
                .update(updates)
                .eq('id', batchId);
            if (error) throw error;
            await get().fetchBatches();
        } catch (error: any) {
            console.error('Failed to update batch:', error);
            throw error;
        }
    },

    deleteBatch: async (batchId: string) => {
        try {
            // Logical deletion
            const { error } = await supabase
                .from('batches')
                .update({ deleted_at: new Date().toISOString(), status: 'cancelled' })
                .eq('id', batchId);
            if (error) throw error;
            await get().fetchBatches();
        } catch (error: any) {
            console.error('Failed to delete batch:', error);
            throw error;
        }
    },

    getStats: async (startDate: string, endDate: string, companyId?: string, role: string = 'admin') => {
        try {
            const { data, error } = await supabase.rpc('get_batch_stats', {
                p_start_date: startDate,
                p_end_date: endDate,
                p_company_id: companyId,
                p_role: role
            });
            if (error) throw error;
            return data[0];
        } catch (error: any) {
            console.error('Failed to fetch stats:', error);
            return null;
        }
    },

    getDailyTrends: async (startDate: string, endDate: string, companyId?: string, role: string = 'admin') => {
        try {
            const { data, error } = await supabase.rpc('get_daily_trends', {
                p_start_date: startDate,
                p_end_date: endDate,
                p_company_id: companyId,
                p_role: role
            });
            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('Failed to fetch daily trends:', error);
            return [];
        }
    },

    getSenderBatches: () => get().batches,
    getTransitBatches: () => get().batches,
    getReceiverBatches: () => get().batches,
    getAdminBatches: () => get().batches,
}));
