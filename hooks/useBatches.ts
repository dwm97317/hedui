import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BatchService, Batch } from '../services/batch.service';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';

/**
 * Fetch and manage Batch List
 */
export const useBatches = (status?: string) => {
    return useQuery<Batch[], Error>({
        queryKey: ['batches', status],
        queryFn: async () => {
            const response = await BatchService.list(status);
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch batches');
            }
            const batches = response.data || [];

            if (batches.length === 0) return [];

            const batchIds = batches.map(b => b.id);
            const { data: inspections, error: inspError } = await supabase
                .from('inspections')
                .select('*')
                .in('batch_id', batchIds);

            if (inspError) {
                console.error('Failed to fetch inspections:', inspError);
            }

            const inspectionsMap = (inspections || []).reduce((acc: any, insp) => {
                if (!acc[insp.batch_id]) acc[insp.batch_id] = [];
                acc[insp.batch_id].push(insp);
                return acc;
            }, {});

            return batches.map(b => ({
                ...b,
                inspections: inspectionsMap[b.id] || []
            }));
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
            } else if (error.message.includes('final and cannot be modified')) {
                toast.error('This batch is locked/completed.');
            } else {
                toast.error(`Update Failed: ${error.message}`);
            }
        }
    });
};
