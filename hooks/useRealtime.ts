import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

/**
 * Real-time subscription for shipment changes within a batch
 * Use this in components that display shipment lists
 */
export const useShipmentRealtime = (batchId?: string) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!batchId) return;

        const channel = supabase
            .channel(`shipments-${batchId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'shipments',
                    filter: `batch_id=eq.${batchId}`
                },
                (payload) => {
                    console.log('Shipment change detected:', payload);
                    // Invalidate shipment queries for this batch
                    queryClient.invalidateQueries({ queryKey: ['shipments', batchId] });
                    // Also invalidate batch data as shipment changes affect totals
                    queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
                    queryClient.invalidateQueries({ queryKey: ['batches'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [batchId, queryClient]);
};
