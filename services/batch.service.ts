import { supabase, ServiceResponse, handleServiceCall } from './supabase';

export interface Batch {
    id: string;
    batch_no: string;
    status: 'draft' | 'sealed' | 'in_transit' | 'inspected' | 'received' | 'completed' | 'cancelled' | 'sender_processing' | 'sender_sealed' | 'transit_processing' | 'transit_sealed' | 'receiver_processing' | 'created';
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
    sender_weight?: number;
    transit_weight?: number;
    receiver_weight?: number;
    sender_volume?: number;
    transit_volume?: number;
    receiver_volume?: number;
    sender_actual_weight?: number;
    transit_actual_weight?: number;
    receiver_actual_weight?: number;
    sender_volumetric_weight?: number;
    transit_volumetric_weight?: number;
    receiver_volumetric_weight?: number;
    billing_weight_mode_a?: 'actual' | 'volumetric' | 'chargeable';
    billing_weight_mode_b?: 'actual' | 'volumetric' | 'chargeable';
    billing_weight_mode_c?: 'actual' | 'volumetric' | 'chargeable';
}

export const BatchService = {
    /**
     * Create a new Batch (Sender only)
     */
    async create(data: Pick<Batch, 'batch_no' | 'sender_company_id' | 'receiver_company_id' | 'transit_company_id' | 'currency'>): Promise<ServiceResponse<Batch>> {
        return handleServiceCall(
            supabase.from('batches')
                .insert({ ...data, status: 'sender_processing' })
                .select('id, batch_no, status, sender_company_id, transit_company_id, receiver_company_id, total_weight, item_count, currency, created_at, sealed_at, transit_at, received_at')
                .single()
        );
    },

    /**
     * Get Batch by ID or Number
     */
    async getById(id: string): Promise<ServiceResponse<Batch>> {
        console.log('[BatchService] getById called with ID:', id, 'Type:', typeof id);
        if (!id) {
            console.error('[BatchService] getById called with null/empty ID');
            return { data: null, error: 'ID is required', success: false };
        }
        return handleServiceCall(
            supabase.from('batches')
                .select('*')
                .eq('id', id)
                .single()
        );
    },

    async getByCode(code: string): Promise<ServiceResponse<Batch>> {
        return handleServiceCall(
            supabase.from('batches')
                .select('*')
                .eq('batch_no', code)
                .single()
        );
    },

    /**
     * List Batches (Filtered by active user's company via RLS)
     */
    async list(status?: string): Promise<ServiceResponse<Batch[]>> {
        let query = supabase.from('batches')
            .select('id, batch_no, status, sender_company_id, transit_company_id, receiver_company_id, total_weight, item_count, currency, created_at, sealed_at, transit_at, received_at')
            .order('created_at', { ascending: false });
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
            supabase.from('batches')
                .update(updateData)
                .eq('id', id)
                .select('id, batch_no, status, sender_company_id, transit_company_id, receiver_company_id, total_weight, item_count, currency, created_at, sealed_at, transit_at, received_at')
                .single()
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
            supabase.from('batches')
                .update(updateData)
                .eq('id', id)
                .select('id, batch_no, status, sender_company_id, transit_company_id, receiver_company_id, total_weight, item_count, currency, created_at, sealed_at, transit_at, received_at')
                .single()
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
            'draft': '发出方：待查验',
            'sender_processing': '发出方：查验中',
            'sender_sealed': '发出方：已封存',
            'sealed': '发出方：已封存',
            'transit_processing': '中转方：处理中',
            'transit_sealed': '中转方：已发出',
            'inspected': '中转方：已封存待领',
            'receiver_processing': '接收方：处理中',
            'received': '接收方：已收到',
            'completed': '已完成',
            'in_transit': '转运中',
            'cancelled': '已取消',
            'created': '待查验'
        };
        return labels[status] || status;
    }
};
