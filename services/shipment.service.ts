import { supabase, ServiceResponse, handleServiceCall } from './supabase';

export interface Shipment {
    id: string;
    tracking_no: string;
    batch_id: string;
    weight: number;
    volume?: number;
    status: 'pending' | 'shipped' | 'received';
    created_at: string;
    length?: number;
    width?: number;
    height?: number;
}

export const ShipmentService = {
    /**
     * Create (Add) a Shipment to a Batch
     * Trigger: update_batch_totals will auto-recalculate batch weight
     */
    async create(data: Pick<Shipment, 'tracking_no' | 'batch_id' | 'weight' | 'volume' | 'length' | 'width' | 'height'>): Promise<ServiceResponse<Shipment>> {
        return handleServiceCall(
            supabase.from('shipments').insert({ ...data, status: 'pending' }).select().single()
        );
    },

    /**
     * Bulk Create (More efficient for batch scanning)
     */
    async createMany(data: Partial<Shipment>[]): Promise<ServiceResponse<Shipment[]>> {
        return handleServiceCall(
            supabase.from('shipments').insert(data).select()
        );
    },

    /**
     * Get Shipments for a Batch
     */
    async listByBatch(batchId: string): Promise<ServiceResponse<Shipment[]>> {
        return handleServiceCall(
            supabase.from('shipments').select('*').eq('batch_id', batchId).order('created_at', { ascending: false })
        );
    },

    /**
     * List all shipments for reporting
     */
    async listAll(): Promise<ServiceResponse<Shipment[]>> {
        return handleServiceCall(
            supabase.from('shipments').select('*').order('created_at', { ascending: false })
        );
    },

    /**
     * Find a Shipment by Tracking Number
     */
    async findByTracking(trackingNo: string): Promise<ServiceResponse<Shipment>> {
        return handleServiceCall(
            supabase.from('shipments').select('*').eq('tracking_no', trackingNo).single()
        );
    },

    /**
     * Move Shipment to another Batch (Split/Merge Prep)
     */
    async moveToBatch(shipmentId: string, newBatchId: string): Promise<ServiceResponse<Shipment>> {
        return handleServiceCall(
            supabase.from('shipments').update({ batch_id: newBatchId }).eq('id', shipmentId).select().single()
        );
    },

    /**
     * Update Weight or Status
     */
    async update(id: string, updates: Partial<Shipment>): Promise<ServiceResponse<Shipment>> {
        return handleServiceCall(
            supabase.from('shipments').update(updates).eq('id', id).select().single()
        );
    },

    /**
     * Merge Multiple Shipments into One
     */
    async mergeShipments(data: {
        parent_tracking_no: string;
        child_ids: string[];
        batch_id: string;
        total_weight: number;
        volume?: number;
    }): Promise<ServiceResponse<Shipment>> {
        // 1. Create parent shipment
        const parentResp = await handleServiceCall<Shipment>(
            supabase.from('shipments').insert({
                tracking_no: data.parent_tracking_no,
                batch_id: data.batch_id,
                weight: data.total_weight,
                volume: data.volume,
                status: 'pending'
            }).select().single()
        );

        if (!parentResp.success) return parentResp;
        const parent = parentResp.data!;

        // 2. Create relations
        const relations = data.child_ids.map(childId => ({
            parent_shipment_id: parent.id,
            child_shipment_id: childId,
            type: 'merge'
        }));

        const relResp = await handleServiceCall<any>(
            supabase.from('shipment_relations').insert(relations)
        );

        if (!relResp.success) return { data: null, error: relResp.error, success: false };

        // 3. Update child shipments status to 'shipped'
        await supabase.from('shipments').update({ status: 'shipped' }).in('id', data.child_ids);

        return { data: parent, error: null, success: true };
    },

    /**
     * Split One Shipment into Multiple
     */
    async splitShipment(data: {
        parent_id: string;
        children: Array<{ tracking_no: string; weight: number; volume?: number }>;
        batch_id: string;
    }): Promise<ServiceResponse<Shipment[]>> {
        // 1. Create child shipments
        const childrenToInsert = data.children.map(child => ({
            tracking_no: child.tracking_no,
            batch_id: data.batch_id,
            weight: child.weight,
            volume: child.volume,
            status: 'pending'
        }));

        const childResp = await handleServiceCall<Shipment[]>(
            supabase.from('shipments').insert(childrenToInsert).select()
        );

        if (!childResp.success) return childResp;
        const children = childResp.data!;

        // 2. Create relations
        const relations = children.map(child => ({
            parent_shipment_id: data.parent_id,
            child_shipment_id: child.id,
            type: 'split'
        }));

        const relResp = await handleServiceCall<any>(
            supabase.from('shipment_relations').insert(relations)
        );

        if (!relResp.success) return { data: null, error: relResp.error, success: false };

        // 3. Update parent shipment status to 'split' (or 'shipped')
        await supabase.from('shipments').update({ status: 'shipped' }).eq('id', data.parent_id);

        return { data: children, error: null, success: true };
    },

    /**
     * Delete (Remove from Batch)
     */
    async remove(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase.from('shipments').delete().eq('id', id);
        if (error) return { data: null, error: error.message, success: false };
        return { data: null, error: null, success: true };
    }
};
