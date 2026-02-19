import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BatchService, Batch } from '../services/batch.service';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';

/**
 * Fetch and manage Batch List
 */
export const useBatches = (status?: string, options: { includeInspections?: boolean } = {}) => {
    const { includeInspections = false } = options;
    return useQuery<Batch[], Error>({
        queryKey: ['batches', status, { includeInspections }],
        queryFn: async () => {
            let query = supabase
                .from('batches')
                .select(includeInspections ? 'id, batch_no, status, sender_company_id, transit_company_id, receiver_company_id, total_weight, item_count, currency, created_at, sealed_at, transit_at, received_at, sender_weight, transit_weight, receiver_weight, sender_volume, transit_volume, receiver_volume, inspections(*)' : 'id, batch_no, status, sender_company_id, transit_company_id, receiver_company_id, total_weight, item_count, currency, created_at, sealed_at, transit_at, received_at, sender_weight, transit_weight, receiver_weight, sender_volume, transit_volume, receiver_volume')
                .order('created_at', { ascending: false });

            if (status) query = query.eq('status', status);

            const { data, error } = await query;

            if (error) {
                console.error('Failed to fetch batches:', error);
                throw new Error(error.message || 'Failed to fetch batches');
            }

            return (data || []) as unknown as Batch[];
        },
    });
};

/**
 * Real-time subscription for batch changes
 * Use this in components that need live updates when batches change
 */
export const useBatchRealtime = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel('batch-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'batches' },
                (payload) => {
                    console.log('Batch change detected:', payload);
                    // Invalidate all batch queries to trigger refetch
                    queryClient.invalidateQueries({ queryKey: ['batches'] });
                    queryClient.invalidateQueries({ queryKey: ['batch'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};

/**
 * Fetch single Batch Detail
 */
export const useBatchDetail = (batchId: string) => {
    return useQuery<Batch, Error>({
        queryKey: ['batch', batchId],
        queryFn: async () => {
            const response = await BatchService.getById(batchId);
            if (!response.success) throw new Error(response.error || 'Failed to load batch');
            return response.data!;
        },
        enabled: !!batchId,
    });
};

/**
 * Mutation for Creating Batch
 */
export const useCreateBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const response = await BatchService.create(data);
            if (!response.success) throw new Error(response.error || 'Creation Failed');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['batches'] }); // Refresh list
            toast.success('Batch Created Successfully!');
        },
        onError: (error: any) => {
            // Handle known Supabase constraints (e.g. Unique batch_no)
            if (error.message.includes('unique constraint')) {
                toast.error('Batch Number already exists!');
            } else {
                toast.error(error.message);
            }
        }
    });
};

/**
 * Mutation for Updating Status (State Machine)
 */
export const useUpdateBatchStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string, status: Batch['status'] }) => {
            const response = await BatchService.updateStatus(id, status);
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['batch', data.id] }); // Refresh detail
            queryClient.invalidateQueries({ queryKey: ['batches'] }); // Refresh lists

            if (data.status === 'completed') {
                toast.success('Batch Completed! Bill generated.');
            } else {
                toast.success(`Active State: ${data.status}`);
            }
        },
        onError: (error: any) => {
            // Handle "Invalid Transition" or "Frozen" errors from Trigger
            if (error.message.includes('Invalid status transition')) {
                toast.error('Cannot move to this status directly!');
            } else {
                toast.error(`Update Failed: ${error.message}`);
            }
        }
    });
};

/**
 * Mutation for Deleting Batch
 */
export const useDeleteBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await BatchService.delete(id);
            if (!response.success) throw new Error(response.error || 'Delete Failed');
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['batches'] });
            toast.success('批次已删除');
        },
        onError: (error: any) => {
            toast.error(`删除失败: ${error.message}`);
        }
    });
};

/**
 * Mutation for Updating Batch
 */
export const useUpdateBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<Batch> }) => {
            const response = await BatchService.update(id, data);
            if (!response.success) throw new Error(response.error || 'Update Failed');
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['batch', data.id] });
            queryClient.invalidateQueries({ queryKey: ['batches'] });
            toast.success('批次已更新');
        },
        onError: (error: any) => {
            toast.error(`更新失败: ${error.message}`);
        }
    });
};
