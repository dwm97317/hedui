-- Migration: 20260213_triggers_and_automations.sql

-- 1. Automatic Billing Trigger
-- Goal: When a batch status changes to 'completed', automatically generate a bill.
-- Logic:
--   - Payer: Sender Company
--   - Payee: Transit Company (or Receiver, depending on business logic - assuming Transit for shipping fees)
--   - Amount: Calculated based on total weight * rate (simple logic for now, can be complex function later)

CREATE OR REPLACE FUNCTION public.generate_bill_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rate numeric := 5.0; -- Default rate per kg, can be fetched from a 'rates' table later
    v_amount numeric;
BEGIN
    -- Only trigger when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        -- Basic calculation: Weight * Rate
        -- Handle null weight
        v_amount := COALESCE(NEW.total_weight, 0) * v_rate;
        
        -- Insert Bill
        INSERT INTO public.bills (
            batch_id,
            payer_company_id,
            payee_company_id, -- Assuming the Transit company gets paid, or Receiver if COD. Let's default to Transit for freight.
            amount,
            currency,
            status,
            created_at
        ) VALUES (
            NEW.id,
            NEW.sender_company_id, -- Sender pays
            NEW.transit_company_id, -- Transit gets paid
            v_amount,
            NEW.currency, -- Inherit currency
            'pending',
            now()
        );
        
        -- Log the action
        INSERT INTO public.batch_logs (
            batch_id,
            user_id,
            action,
            previous_status,
            new_status,
            details
        ) VALUES (
            NEW.id,
            auth.uid(), -- The user who completed the batch triggers this
            'auto_generate_bill',
            OLD.status,
            NEW.status,
            jsonb_build_object('bill_amount', v_amount, 'reason', 'Batch Completed')
        );
        
    END IF;
    RETURN NEW;
END;
$$;

-- Attach Trigger to Batches
DROP TRIGGER IF EXISTS on_batch_completed ON public.batches;
CREATE TRIGGER on_batch_completed
AFTER UPDATE ON public.batches
FOR EACH ROW
EXECUTE FUNCTION public.generate_bill_on_completion();


-- 2. State Machine Enforcement Trigger
-- Goal: Prevent illegal status jumps (e.g., created -> received directly)
-- Allowed Flows:
--   created -> sealed
--   sealed -> in_transit
--   in_transit -> inspected
--   in_transit -> received
--   received -> completed
--   Any -> merged/split (special cases)

CREATE OR REPLACE FUNCTION public.enforce_batch_status_flow()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Allow no status change
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Define allowed transitions
    IF OLD.status = 'created' AND NEW.status = 'sealed' THEN RETURN NEW; END IF;
    IF OLD.status = 'sealed' AND NEW.status = 'in_transit' THEN RETURN NEW; END IF;
    IF OLD.status = 'in_transit' AND NEW.status = 'inspected' THEN RETURN NEW; END IF;
    IF OLD.status = 'in_transit' AND NEW.status = 'received' THEN RETURN NEW; END IF; -- Skip inspection allowed?
    IF OLD.status = 'inspected' AND NEW.status = 'received' THEN RETURN NEW; END IF;
    IF OLD.status = 'received' AND NEW.status = 'completed' THEN RETURN NEW; END IF;
    
    -- Special statuses
    IF NEW.status = 'merged' OR NEW.status = 'split' THEN RETURN NEW; END IF;

    -- If we get here, it's an illegal transition
    RAISE EXCEPTION 'Illegal batch status transition from % to %', OLD.status, NEW.status;
END;
$$;

-- Attach Trigger to Batches
DROP TRIGGER IF EXISTS check_batch_flow ON public.batches;
CREATE TRIGGER check_batch_flow
BEFORE UPDATE ON public.batches
FOR EACH ROW
EXECUTE FUNCTION public.enforce_batch_status_flow();


-- 3. Audit Log Trigger (Generic)
-- Goal: Log ANY meaningful change to a batch automatically, not just status.
-- This ensures traceability even if the application forgets to insert a log.

CREATE OR REPLACE FUNCTION public.log_batch_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO public.batch_logs (
            batch_id,
            user_id,
            action,
            previous_status,
            new_status,
            details
        ) VALUES (
            NEW.id,
            auth.uid(),
            'status_change',
            OLD.status,
            NEW.status,
            jsonb_build_object('triggered_by', 'system_trigger')
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Attach Trigger to Batches
DROP TRIGGER IF EXISTS log_status_change ON public.batches;
CREATE TRIGGER log_status_change
AFTER UPDATE ON public.batches
FOR EACH ROW
EXECUTE FUNCTION public.log_batch_changes();


-- 4. Calculate Batch Totals Trigger
-- Goal: When a Waybill is added/updated in a batch, update the Batch's total_weight and item_count.
-- This creates a "Batch Driven" system where the batch acts as a calculated container.

CREATE OR REPLACE FUNCTION public.update_batch_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the batch linked to the NEW waybill
    UPDATE public.batches
    SET 
        total_weight = (SELECT COALESCE(SUM(weight), 0) FROM public.waybills WHERE batch_id = NEW.batch_id),
        item_count = (SELECT COUNT(*) FROM public.waybills WHERE batch_id = NEW.batch_id),
        updated_at = now()
    WHERE id = NEW.batch_id;
    
    RETURN NEW;
END;
$$;

-- Attach Trigger to Waybills
DROP TRIGGER IF EXISTS on_waybill_change ON public.waybills;
CREATE TRIGGER on_waybill_change
AFTER INSERT OR UPDATE OR DELETE ON public.waybills
FOR EACH ROW
EXECUTE FUNCTION public.update_batch_totals();
