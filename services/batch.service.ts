import { supabase, ServiceResponse, handleServiceCall } from './supabase';

export interface Batch {
    id: string;
    batch_no: string;
    status: 'draft' | 'sealed' | 'in_transit' | 'inspected' | 'received' | 'completed' | 'cancelled' | 'sender_processing' | 'sender_sealed' | 'transit_processing' | 'transit_sealed' | 'receiver_processing';
    sender_company_id: string;
    transit_company_id?: string;
    receiver_company_id: string;
    total_weight: number;
    item_count: number;
    currency: 'VND' | 'CNY';
    inspections?: any[]; // For multi-party weight reporting
    created_at: string;
    sealed_at?: string;
    transit_at?: string;
    received_at?: string;
}

export const BatchService = {
    /**
     * Create a new Batch (Sender only)
     */
    async create(data: Pick<Batch, 'batch_no' | 'sender_company_id' | 'receiver_company_id' | 'transit_company_id' | 'currency'>): Promise<ServiceResponse<Batch>> {
        return handleServiceCall(
            supabase.from('batches').insert({ ...data, status: 'sender_processing' }).select().single()
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
        const updateData: any = { status };

        // Auto-set timestamps based on status
        const now = new Date().toISOString();
        if (status === 'sender_sealed' || status === 'sealed') {
            updateData.sealed_at = now;
        } else if (['transit_processing', 'transit_sealed', 'inspected', 'in_transit'].includes(status)) {
            updateData.transit_at = now;
        } else if (status === 'completed') {
            updateData.received_at = now;
        }

        return handleServiceCall(
            supabase.from('batches').update(updateData).eq('id', id).select().single()
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
    },

    /**
     * Update Batch metadata
     */
    async update(id: string, data: Partial<Batch>): Promise<ServiceResponse<Batch>> {
        const updateData = { ...data };

        if (data.status) {
            const now = new Date().toISOString();
            if (data.status === 'sender_sealed' || data.status === 'sealed') {
                updateData.sealed_at = now;
            } else if (['transit_processing', 'transit_sealed', 'inspected', 'in_transit'].includes(data.status)) {
                updateData.transit_at = now;
            } else if (data.status === 'completed') {
                updateData.received_at = now;
            }
        }

        return handleServiceCall(
            supabase.from('batches').update(updateData).eq('id', id).select().single()
        );
    },

    /**
     * Delete Batch
     */
    async delete(id: string): Promise<ServiceResponse<void>> {
        return handleServiceCall(
            supabase.from('batches').delete().eq('id', id)
        );
    },

    getStatusLabel(status: Batch['status']): string {
        const labels: Record<string, string> = {
            'draft': '发出方：处理中',
            'sender_processing': '发出方：处理中',
            'sender_sealed': '发出方已封批次',
            'sealed': '发出方已封批次',
            'transit_processing': '中转方处理中',
            'transit_sealed': '中转方已封批次',
            'inspected': '中转方已封批次',
            'receiver_processing': '接收方处理中',
            'received': '接收方处理中',
            'completed': '已完成该批次',
            'in_transit': '待中转',
            'cancelled': '已取消'
        };
        return labels[status] || status;
    }
};
