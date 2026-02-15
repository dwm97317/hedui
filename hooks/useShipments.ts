import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast'; // For toast
import { ShipmentService, Shipment } from '../services/shipment.service';

/**
 * Fetch Shipments for a Batch
 */
export const useShipments = (batchId: string, options?: { includeAll?: boolean }) => {
    return useQuery<Shipment[], Error>({
        queryKey: ['shipments', batchId, options?.includeAll],
        queryFn: async () => {
            if (!batchId) return [];
            const response = await ShipmentService.listByBatch(batchId, options?.includeAll);
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch shipments');
            }
            return response.data || [];
        },
        enabled: !!batchId,
        staleTime: 5000,
    });
};

/**
 * Fetch All Shipments (for Reporting)
 */
export const useAllShipments = () => {
    return useQuery<Shipment[], Error>({
        queryKey: ['shipments', 'all'],
        queryFn: async () => {
            const response = await ShipmentService.listAll();
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch all shipments');
            }
            return response.data || [];
        },
        staleTime: 60000, // Longer cache for reports
    });
};

/**
 * Fetch Shipment Relations (Merges/Splits) for a Batch
 */
export const useShipmentRelations = (batchId: string) => {
    return useQuery<any[], Error>({
        queryKey: ['shipment_relations', batchId],
        queryFn: async () => {
            if (!batchId) return [];
            const response = await ShipmentService.listRelations(batchId);
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch relations');
            }
            return response.data || [];
        },
        enabled: !!batchId,
        staleTime: 10000,
    });
};

/**
 * Add Single Shipment to Batch
 */
export const useAddShipment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const response = await ShipmentService.create(data);
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['shipments', data.batch_id] }); // Refresh list
            // Also refresh Batch detail because Weight Trigger updated it!
            queryClient.invalidateQueries({ queryKey: ['batch', data.batch_id] });
            toast.success('Parcel Added');
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });
};
/**
 * Update Shipment (Status/Weight/etc)
 */
export const useUpdateShipment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<Shipment> }) => {
            const response = await ShipmentService.update(id, updates);
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['shipments', data.batch_id] });
            queryClient.invalidateQueries({ queryKey: ['batch', data.batch_id] });
        }
    });
};

/**
 * Find Shipment by Tracking Number
 */
export const useShipmentByNo = (trackingNo: string) => {
    return useQuery<Shipment | null, Error>({
        queryKey: ['shipment', trackingNo],
        queryFn: async () => {
            if (!trackingNo) return null;
            const response = await ShipmentService.findByTracking(trackingNo);
            if (!response.success) {
                if (response.error === 'PGRST116') return null; // Not found
                throw new Error(response.error);
            }
            return response.data;
        },
        enabled: !!trackingNo,
    });
};

/**
 * Merge Shipments Mutation
 */
export const useMergeShipments = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            parent_tracking_no: string;
            child_ids: string[];
            batch_id: string;
            total_weight: number;
            volume?: number;
            role?: 'transit' | 'receiver';
        }) => {
            const response = await ShipmentService.mergeShipments(data);
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['shipments', data.batch_id] });
            queryClient.invalidateQueries({ queryKey: ['batch', data.batch_id] });
            queryClient.invalidateQueries({ queryKey: ['inspections', data.batch_id] });
            toast.success('Merge Successful');
        },
        onError: (error: any) => {
            toast.error('Merge Failed: ' + error.message);
        }
    });
};

/**
 * Split Shipment Mutation
 */
export const useSplitShipment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            parent_id: string;
            children: Array<{ tracking_no: string; weight: number; volume?: number }>;
            batch_id: string;
            role?: 'transit' | 'receiver';
        }) => {
            const response = await ShipmentService.splitShipment(data);
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (data: any) => {
            // Invalidate the branch of shipments for this batch
            if (data && data.length > 0) {
                const batchId = data[0].batch_id;
                queryClient.invalidateQueries({ queryKey: ['shipments', batchId] });
                queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
                queryClient.invalidateQueries({ queryKey: ['inspections', batchId] });
            }
            toast.success('Split Successful');
        },
        onError: (error: any) => {
            toast.error('Split Failed: ' + error.message);
        }
    });
};

/**
 * Remove Shipment from Batch
 */
export const useRemoveShipment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            const response = await ShipmentService.remove(id);
            if (!response.success) throw new Error(response.error || 'Delete failed');
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shipments'] });
            queryClient.invalidateQueries({ queryKey: ['batch'] });
            toast.success('Parcel Removed');
        }
    });
};
