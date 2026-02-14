import { supabase, ServiceResponse, handleServiceCall } from './supabase';

export interface Batch {
    id: string;
    batch_no: string;
    status: 'draft' | 'sealed' | 'in_transit' | 'inspected' | 'received' | 'completed' | 'cancelled';
    sender_company_id: string;
    transit_company_id?: string;
    receiver_company_id: string;
    total_weight: number;
    item_count: number;
    currency: 'VND' | 'CNY';
    inspections?: any[]; // For multi-party weight reporting
    created_at: string;
}

export const BatchService = {
    /**
     * Create a new Batch (Sender only)
     */
    async create(data: Pick<Batch, 'batch_no' | 'sender_company_id' | 'receiver_company_id' | 'transit_company_id' | 'currency'>): Promise<ServiceResponse<Batch>> {
        return handleServiceCall(
            supabase.from('batches').insert({ ...data, status: 'draft' }).select().single()
        );
    },

    /**
     * Get Batch by ID or Number
     */
    async getById(id: string): Promise<ServiceResponse<Batch>> {
        return handleServiceCall(
            supabase.from('batches').select('*').eq('id', id).single()
        );
    },

    async getByCode(code: string): Promise<ServiceResponse<Batch>> {
        return handleServiceCall(
            supabase.from('batches').select('*').eq('batch_no', code).single()
        );
    },

    /**
     * List Batches (Filtered by active user's company via RLS)
     */
    async list(status?: string): Promise<ServiceResponse<Batch[]>> {
        let query = supabase.from('batches').select('*').order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);
        return handleServiceCall(query);
    },

    /**
     * Update Status (State Machine enforced by DB)
     */
    async updateStatus(id: string, status: Batch['status']): Promise<ServiceResponse<Batch>> {
        return handleServiceCall(
            supabase.from('batches').update({ status }).eq('id', id).select().single()
        );
    },

    /**
     * Complete Batch (Triggers Billing)
     */
    async completeBatch(id: string): Promise<ServiceResponse<Batch>> {
        return this.updateStatus(id, 'completed');
    },

    /**
     * Cancel Batch (If allowed)
     */
    async cancelBatch(id: string): Promise<ServiceResponse<Batch>> {
        return this.updateStatus(id, 'cancelled');
    }
};
