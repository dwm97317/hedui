import { create } from 'zustand';
import { supabase } from '../services/supabase';

export enum BillStatus {
    PENDING = 'pending',
    PAID = 'paid',
    OVERDUE = 'overdue',
}

export enum Currency {
    VND = 'VND',
    CNY = 'CNY',
}

export interface FinanceBill {
    id: string;
    amount: number;
    currency: Currency;
    status: BillStatus;
    type: 'SENDER_TO_ADMIN' | 'ADMIN_TO_TRANSIT' | 'SENDER_TO_RECEIVER';
    payer: string;
    payee: string;
    createdAt: string;
    unitPrice?: number;
    totalWeight?: number;
}

export interface FinanceBatch {
    id: string;
    batchCode: string;
    totalWeight: number;
    senderName: string;
    transitName: string;
    receiverName: string;
    status: string;
    createdAt: string;

    // The 3 Bills
    billA: FinanceBill; // Sender -> Admin (VND)
    billB: FinanceBill; // Admin -> Transit (VND)
    billC: FinanceBill; // Sender -> Receiver (CNY)
}

interface FinanceState {
    batches: FinanceBatch[];
    loading: boolean;

    // Actions
    fetchBatches: () => Promise<void>;
    markBillAsPaid: (billId: string) => Promise<void>;
    updateBillUnitPrice: (billId: string, unitPrice: number) => Promise<void>;
    updateExchangeRate: (base: Currency, target: Currency, rate: number) => Promise<void>;
    getSenderBatches: () => FinanceBatch[];
    getTransitBatches: () => FinanceBatch[];
    getReceiverBatches: () => FinanceBatch[];
    getAdminBatches: () => FinanceBatch[];
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    batches: [],
    loading: false,

    fetchBatches: async () => {
        set({ loading: true });
        try {
            console.log('Fetching finance batches...');
            const { data, error } = await supabase
                .from('batches')
                .select(`
                    id,
                    batch_no,
                    total_weight,
                    status,
                    created_at,
                    sender:sender_company_id(name),
                    transit:transit_company_id(name),
                    receiver:receiver_company_id(name),
                    bills (
                        id,
                        bill_type,
                        total_amount,
                        currency,
                        status,
                        created_at,
                        unit_price,
                        total_weight,
                        payer:payer_company_id(name),
                        payee:payee_company_id(name)
                    )
                `)
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
                            currency: found.currency as Currency,
                            status: (found.status?.toLowerCase() || 'pending') as BillStatus,
                            type: found.bill_type,
                            payer: found.payer?.name || 'Unknown',
                            payee: found.payee?.name || 'Unknown',
                            createdAt: found.created_at,
                            unitPrice: Number(found.unit_price || 0),
                            totalWeight: Number(found.total_weight || 0)
                        };
                    }
                    // Fallback if bill missing
                    return {
                        id: `missing-${type}-${batch.id}`,
                        amount: 0,
                        currency: type === 'SENDER_TO_RECEIVER' ? Currency.CNY : Currency.VND,
                        status: BillStatus.PENDING,
                        type: type as any,
                        payer: 'Unknown',
                        payee: 'Unknown',
                        createdAt: new Date().toISOString(),
                        unitPrice: 0,
                        totalWeight: 0
                    };
                };

                return {
                    id: batch.id,
                    batchCode: batch.batch_no,
                    totalWeight: Number(batch.total_weight),
                    senderName: batch.sender?.name || 'Unknown Sender',
                    transitName: batch.transit?.name || 'Unknown Transit',
                    receiverName: batch.receiver?.name || 'Unknown Receiver',
                    status: batch.status,
                    createdAt: batch.created_at,
                    billA: findBill('SENDER_TO_ADMIN'),
                    billB: findBill('ADMIN_TO_TRANSIT'),
                    billC: findBill('SENDER_TO_RECEIVER')
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
        } catch (error) {
            console.error('Failed to update exchange rate:', error);
        }
    },

    getSenderBatches: () => get().batches,
    getTransitBatches: () => get().batches,
    getReceiverBatches: () => get().batches,
    getAdminBatches: () => get().batches,
}));
