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
    shipper_name?: string;
    parent_id?: string;
    package_tag?: 'standard' | 'merge_parent' | 'merged_child' | 'split_parent' | 'split_child';
    sender_at?: string;
    transit_at?: string;
    receiver_at?: string;
    transport_mode?: number; // 1: Land, 2: Sea, 3: Air
    item_category?: string;
    transit_weight?: number;
    transit_length?: number;
    transit_width?: number;
    transit_height?: number;
    receiver_weight?: number;
    receiver_length?: number;
    receiver_width?: number;
    receiver_height?: number;
}

export const ShipmentService = {
    /**
     * Create (Add) a Shipment to a Batch
     * Trigger: update_batch_totals will auto-recalculate batch weight
     */
    async create(data: Pick<Shipment, 'tracking_no' | 'batch_id' | 'weight' | 'volume' | 'length' | 'width' | 'height' | 'shipper_name' | 'transport_mode' | 'item_category'>): Promise<ServiceResponse<Shipment>> {
        return handleServiceCall(
            supabase.from('shipments')
                .insert({ ...data, status: 'pending' })
                .select('*')
                .single()
        );
    },

    /**
     * Bulk Create (More efficient for batch scanning)
     */
    async createMany(data: Partial<Shipment>[]): Promise<ServiceResponse<Shipment[]>> {
        return handleServiceCall(
            supabase.from('shipments')
                .insert(data)
                .select('*')
        );
    },

    /**
     * Get VALID Shipments for a Batch (Excludes Merged Children & Split Parents)
     */
    async listByBatch(batchId: string, includeAll: boolean = false): Promise<ServiceResponse<Shipment[]>> {
        let query = supabase.from('shipments')
            .select('*')
            .eq('batch_id', batchId)
            .order('created_at', { ascending: false });

        if (!includeAll) {
            // Filter out invalid packages (merged children and split parents)
            query = query.not('package_tag', 'in', '("merged_child","split_parent")');
        }

        return handleServiceCall(query);
    },

    async listRelations(batchId: string): Promise<ServiceResponse<any[]>> {
        // Fetch relations where the parent or child belongs to this batch
        const query = supabase.from('shipment_relations')
            .select('*, parent:shipments!parent_shipment_id(tracking_no), child:shipments!child_shipment_id(tracking_no)')
            .or(`parent_shipment_id.in.(select id from shipments where batch_id.eq.${batchId}),child_shipment_id.in.(select id from shipments where batch_id.eq.${batchId})`);

        // Simplified query: just get relations and we'll filter in memory or use a direct join
        const simpleQuery = supabase.from('shipment_relations')
            .select(`
                *,
                parent:shipments!parent_shipment_id(tracking_no, batch_id),
                child:shipments!child_shipment_id(tracking_no, batch_id)
            `)
            .eq('parent.batch_id', batchId); // Supabase allows filtering on joined tables in some configs

        // Safer way: Get all relations where parent belongs to the batch
        const finalQuery = supabase.from('shipment_relations')
            .select('*, parent:shipments!parent_shipment_id!inner(batch_id)')
            .eq('parent.batch_id', batchId);

        return handleServiceCall(finalQuery);
    },

    /**
     * List all shipments for reporting
     */
    async listAll(): Promise<ServiceResponse<Shipment[]>> {
        return handleServiceCall(
            supabase.from('shipments')
                .select('*')
                .order('created_at', { ascending: false })
        );
    },

    /**
     * Find a Shipment by Tracking Number
     * Note: This returns ANY shipment, even invalid ones, so we can detect them.
     */
    async findByTracking(trackingNo: string): Promise<ServiceResponse<Shipment>> {
        return handleServiceCall(
            supabase.from('shipments')
                .select('*')
                .eq('tracking_no', trackingNo)
                .single()
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
        role?: 'transit' | 'receiver';
    }): Promise<ServiceResponse<Shipment>> {
        const { data: { user } } = await supabase.auth.getUser();
        const stage = data.role || 'transit';

        // 1. Create parent shipment
        const parentResp = await handleServiceCall<Shipment>(
            supabase.from('shipments').insert({
                tracking_no: data.parent_tracking_no,
                batch_id: data.batch_id,
                weight: data.total_weight,
                volume: data.volume,
                status: stage === 'receiver' ? 'received' : 'pending',
                package_tag: 'merge_parent'
            }).select().single()
        );

        if (!parentResp.success) return parentResp;
        const parent = parentResp.data!;

        // 1.5 Auto-Inspect for stage
        // This marks the parent as already checked.
        await supabase.from('inspections').insert({
            batch_id: data.batch_id,
            inspector_id: user?.id,
            result: 'passed',
            notes: stage === 'receiver'
                ? `ReceiverItemCheck ShipmentID:${parent.id} (Auto-Merge Parent)`
                : `WeighCheck ShipmentID:${parent.id} (Auto-Merge Parent)`,
            transit_weight: stage === 'transit' ? data.total_weight : null,
            check_weight: stage === 'receiver' ? data.total_weight : null,
            photos: []
        });

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

        // 3. Update child shipments status to 'shipped' and set tag
        await supabase.from('shipments').update({ status: 'shipped', package_tag: 'merged_child' }).in('id', data.child_ids);

        return { data: parent, error: null, success: true };
    },

    /**
     * Split One Shipment into Multiple
     */
    async splitShipment(data: {
        parent_id: string;
        children: Array<{ tracking_no: string; weight: number; volume?: number }>;
        batch_id: string;
        role?: 'transit' | 'receiver';
    }): Promise<ServiceResponse<Shipment[]>> {
        const { data: { user } } = await supabase.auth.getUser();
        const stage = data.role || 'transit';

        // 1. Create child shipments
        const childrenToInsert = data.children.map(child => ({
            tracking_no: child.tracking_no,
            batch_id: data.batch_id,
            weight: child.weight,
            volume: child.volume,
            status: stage === 'receiver' ? 'received' : 'pending',
            package_tag: 'split_child'
        }));

        const childResp = await handleServiceCall<Shipment[]>(
            supabase.from('shipments').insert(childrenToInsert).select()
        );

        if (!childResp.success) return childResp;
        const children = childResp.data!;

        // 1.5 Auto-Inspect children
        // This makes them "Verified" immediately without re-scanning.
        const autoInspections = children.map(child => ({
            batch_id: data.batch_id,
            inspector_id: user?.id,
            result: 'passed',
            notes: stage === 'receiver'
                ? `ReceiverItemCheck ShipmentID:${child.id} (Auto-Split Sub)`
                : `WeighCheck ShipmentID:${child.id} (Auto-Split Sub)`,
            transit_weight: stage === 'transit' ? child.weight : null,
            check_weight: stage === 'receiver' ? child.weight : null,
            photos: []
        }));

        await supabase.from('inspections').insert(autoInspections);

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

        // 3. Update parent shipment status to 'shipped' and tag
        await supabase.from('shipments').update({ status: 'shipped', package_tag: 'split_parent' }).eq('id', data.parent_id);

        return { data: children, error: null, success: true };
    },

    async remove(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase.from('shipments').delete().eq('id', id);
        if (error) return { data: null, error: error.message, success: false };
        return { data: null, error: null, success: true };
    },

    /**
     * Remove Multiple Shipments by Batch and Tracking Numbers
     */
    async removeInBatch(batchId: string, trackingNos: string[]): Promise<ServiceResponse<null>> {
        const { error } = await supabase.from('shipments')
            .delete()
            .eq('batch_id', batchId)
            .in('tracking_no', trackingNos);
        if (error) return { data: null, error: error.message, success: false };
        return { data: null, error: null, success: true };
    }
};
