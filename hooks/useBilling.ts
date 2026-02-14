import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BillingService } from '../services/billing.service';
import { Bill } from '../services/billing.service';
import { toast } from 'react-hot-toast';

/**
 * List all bills
 */
export const useBills = (status?: string) => {
    return useQuery({
        queryKey: ['bills', status],
        queryFn: async () => {
            const response = await BillingService.list(status);
            if (!response.success) {
                throw new Error(response.error);
            }
            return response.data;
        },
    });
};

/**
 * Fetch Bill Details by Batch ID
 * Useful for displaying the final bill summary
 */
export const useBillDetail = (batchId: string) => {
    return useQuery({
        queryKey: ['bill', batchId],
        queryFn: async () => {
            if (!batchId) return null;
            const response = await BillingService.getByBatch(batchId);
            if (!response.success && response.error !== 'PGRST116') { // Ignore "No Rows Found" (PGRST116) as it's normal for pending batches
                throw new Error(response.error);
            }
            return response.data;
        },
        enabled: !!batchId,
        retry: 1, // Don't retry too much if bill doesn't exist yet
    });
};
/**
 * Fetch Bill by its ID or Bill Number
 */
export const useBillById = (billIdOrNo: string) => {
    return useQuery({
        queryKey: ['bill', billIdOrNo],
        queryFn: async () => {
            if (!billIdOrNo || billIdOrNo === 'completed') return null;

            // Heuristic to check if it's a UUID
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(billIdOrNo);

            const response = isUuid
                ? await BillingService.getById(billIdOrNo)
                : await BillingService.getByBillNo(billIdOrNo);

            if (!response.success) {
                // If it fails, it might be the other type (rare but possible during dev)
                const fallback = isUuid
                    ? await BillingService.getByBillNo(billIdOrNo)
                    : await BillingService.getById(billIdOrNo);

                if (!fallback.success) {
                    if (fallback.error === 'PGRST116') return null;
                    throw new Error(fallback.error);
                }
                return fallback.data;
            }
            return response.data;
        },
        enabled: !!billIdOrNo && billIdOrNo !== 'completed',
    });
};

/**
 * Mark a bill as paid
 */
export const useMarkBillPaid = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (billId: string) => {
            const response = await BillingService.markAsPaid(billId);
            if (!response.success) {
                throw new Error(response.error || 'Failed to mark bill as paid');
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            queryClient.invalidateQueries({ queryKey: ['bill'] });
            toast.success('账单已标记为已支付');
        },
        onError: (error: Error) => {
            toast.error('支付失败: ' + error.message);
        },
    });
};

/**
 * Cancel a bill
 */
export const useCancelBill = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (billId: string) => {
            const response = await BillingService.cancel(billId);
            if (!response.success) {
                throw new Error(response.error || 'Failed to cancel bill');
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            queryClient.invalidateQueries({ queryKey: ['bill'] });
            toast.success('账单已取消');
        },
        onError: (error: Error) => {
            toast.error('取消失败: ' + error.message);
        },
    });
};
