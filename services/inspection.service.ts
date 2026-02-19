import { supabase, ServiceResponse, handleServiceCall } from './supabase';

export interface Inspection {
    id: string;
    batch_id: string;
    inspector_id: string;
    result: 'passed' | 'failed' | 'flagged';
    photos: string[];
    notes?: string;
    transit_weight?: number;
    transit_length?: number;
    transit_width?: number;
    transit_height?: number;
    check_weight?: number;
    check_length?: number;
    check_width?: number;
    check_height?: number;
    created_at: string;
}

export const InspectionService = {
    /**
     * Create Inspection Report
     */
    async create(data: Partial<Inspection> & { batch_id: string; result: Inspection['result'] }): Promise<ServiceResponse<Inspection>> {
        // Requires authenticated user (inspector_id auto-fills via RLS/Trigger usually, or set via auth.uid() if column policy allows)
        // Here we might need to rely on the backend setting inspector_id or pass it if RLS allows.
        // For simplicity, let's assume auth.uid() is used by the backend default or RLS context.

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null, error: 'Not authenticated', success: false };

        return handleServiceCall(
            supabase.from('inspections').insert({
                ...data,
                inspector_id: user.id
            }).select().single()
        );
    },

    /**
     * Get Inspections for a Batch
     */
    async getByBatch(batchId: string): Promise<ServiceResponse<Inspection[]>> {
        return handleServiceCall(
            supabase.from('inspections')
                .select('id, batch_id, inspector_id, result, photos, notes, transit_weight, transit_length, transit_width, transit_height, check_weight, check_length, check_width, check_height, created_at')
                .eq('batch_id', batchId)
                .order('created_at', { ascending: false })
        );
    },

    /**
     * Update Inspection (Only if not finalized logic applies, or if admin)
     */
    async update(id: string, updates: Partial<Inspection>): Promise<ServiceResponse<Inspection>> {
        return handleServiceCall(
            supabase.from('inspections').update(updates).eq('id', id).select().single()
        );
    }
};
