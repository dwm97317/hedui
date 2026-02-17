import { supabase, ServiceResponse, handleServiceCall } from './supabase';

export interface Bill {
    id: string;
    batch_id: string;
    bill_no: string;
    payer_company_id: string;
    payee_company_id: string;
    total_amount: number;
    currency: 'VND' | 'CNY';
    status: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
    paid_amount: number;
    created_at: string;
    updated_at: string;
    bill_items?: BillItem[];
    bill_payments?: BillPayment[];
    batch?: {
        batch_no: string;
        status: string;
        total_weight: number;
    };
    payer?: {
        name: string;
    };
    payee?: {
        name: string;
    };
}

export interface BillItem {
    id: string;
    bill_id: string;
    description: string;
    amount: number;
}

export interface BillPayment {
    id: string;
    bill_id: string;
    amount: number;
    payment_date: string;
    payment_method?: string;
    reference_no?: string;
    created_at: string;
}

export const BillingService = {
    /**
     * Get Bill by UUID
     */
    async getById(id: string): Promise<ServiceResponse<Bill>> {
        return handleServiceCall(
            supabase.from('bills').select('*, bill_items(*), bill_payments(*), batch:batches(batch_no, total_weight), payer:companies!payer_company_id(name), payee:companies!payee_company_id(name)').eq('id', id).maybeSingle()
        );
    },

    /**
     * Get Bill by Bill Number
     */
    async getByBillNo(billNo: string): Promise<ServiceResponse<Bill>> {
        return handleServiceCall(
            supabase.from('bills').select('*, bill_items(*), bill_payments(*), batch:batches(batch_no, total_weight), payer:companies!payer_company_id(name), payee:companies!payee_company_id(name)').eq('bill_no', billNo).maybeSingle()
        );
    },

    /**
     * Get Bill for a Batch (Auto-generated usually)
     */
    async getByBatch(batchId: string): Promise<ServiceResponse<Bill>> {
        // Single? Or multiple if cancellations allowed? Usually one bill per batch per our logic.
        return handleServiceCall(
            supabase.from('bills').select('*, bill_items(*), bill_payments(*), batch:batches(batch_no, total_weight), payer:companies!payer_company_id(name), payee:companies!payee_company_id(name)').eq('batch_id', batchId).maybeSingle()
        );
    },

    /**
     * List Bills for Company (Sender sees what they owe, Transit sees incoming)
     * This is RLS filtered.
     */
    async list(status?: string): Promise<ServiceResponse<Bill[]>> {
        let query = supabase.from('bills').select(`
            *,
            batch:batches(batch_no, status, total_weight),
            payer:companies!payer_company_id(name),
            payee:companies!payee_company_id(name)
        `).order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);
        return handleServiceCall(query);
    },

    /**
     * Pay Bill (Typically done by payment gateway callback or finance admin)
     */
    async markAsPaid(billId: string): Promise<ServiceResponse<Bill>> {
        return handleServiceCall(
            supabase.from('bills').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', billId).select().single()
        );
    },

    /**
     * Cancel Bill (Only Admin or specific roles should trigger this)
     */
    async cancel(billId: string): Promise<ServiceResponse<Bill>> {
        return handleServiceCall(
            supabase.from('bills').update({ status: 'cancelled' }).eq('id', billId).select().single()
        );
    },

    /**
     * Add a payment to a bill
     */
    async addPayment(billId: string, amount: number, method?: string, reference?: string): Promise<ServiceResponse<any>> {
        return handleServiceCall(
            supabase.from('bill_payments').insert({
                bill_id: billId,
                amount: amount,
                payment_method: method,
                reference_no: reference
            }).select().single()
        );
    }
};
