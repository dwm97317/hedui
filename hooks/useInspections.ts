import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { InspectionService, Inspection } from '../services/inspection.service';

/**
 * Fetch Inspections for a Batch
 */
export const useInspections = (batchId: string) => {
    return useQuery<Inspection[], Error>({
        queryKey: ['inspections', batchId],
        queryFn: async () => {
            if (!batchId) return [];
            const response = await InspectionService.getByBatch(batchId);
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch inspections');
            }
            return response.data || [];
        },
        enabled: !!batchId,
    });
};

/**
 * Create Inspection Report
 */
export const useCreateInspection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Pick<Inspection, 'batch_id' | 'result' | 'photos' | 'notes' | 'transit_weight' | 'check_weight'>) => {
            const response = await InspectionService.create(data);
            console.log('Inspection Create Response:', response);
            if (!response.success) throw new Error(response.error || 'Failed to create inspection');
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: ['inspections', data.batch_id] });
                queryClient.invalidateQueries({ queryKey: ['batches'] });
                queryClient.invalidateQueries({ queryKey: ['batch', data.batch_id] });
                toast.success('检验记录已创建');
            }
        },
        onError: (error: any) => {
            toast.error('创建检验记录失败: ' + error.message);
        }
    });
};

/**
 * Update an existing inspection
 */
export const useUpdateInspection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Inspection> }) => {
            const response = await InspectionService.update(id, updates);
            if (!response.success) {
                throw new Error(response.error || 'Failed to update inspection');
            }
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: ['inspections', data.batch_id] });
                queryClient.invalidateQueries({ queryKey: ['batches'] });
                toast.success('检验记录已更新');
            }
        },
        onError: (error: Error) => {
            toast.error('更新检验记录失败: ' + error.message);
        },
    });
};
