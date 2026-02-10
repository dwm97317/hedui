-- Migration: 20260213_fix_weight_trigger.sql
-- Description: Re-implements the batch total calculation trigger for the 'shipments' table (renamed from waybills).

BEGIN;

-- 1. Create/Update Function
CREATE OR REPLACE FUNCTION public.update_batch_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS to ensure totals are always accurate regardless of who inserts
AS $$
DECLARE
    target_batch_id uuid;
BEGIN
    -- Determine target batch
    IF TG_OP = 'DELETE' THEN
        target_batch_id := OLD.batch_id;
    ELSE
        target_batch_id := NEW.batch_id;
    END IF;

    -- Update Batch Totals
    -- Querying 'shipments', NOT 'waybills'
    UPDATE public.batches
    SET 
        total_weight = (SELECT COALESCE(SUM(weight), 0) FROM public.shipments WHERE batch_id = target_batch_id),
        item_count = (SELECT COUNT(*) FROM public.shipments WHERE batch_id = target_batch_id),
        updated_at = now()
    WHERE id = target_batch_id;
    
    RETURN NULL; -- Ignored for AFTER triggers
END;
$$;

-- 2. Attach Trigger to Shipments
DROP TRIGGER IF EXISTS tr_update_batch_totals ON public.shipments;
CREATE TRIGGER tr_update_batch_totals
AFTER INSERT OR UPDATE OR DELETE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.update_batch_totals();

COMMIT;
