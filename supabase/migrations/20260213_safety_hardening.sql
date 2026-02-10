-- Migration: 20260213_safety_hardening.sql
-- Description: Enhances system safety for concurrency, idempotency, and status freezing.

BEGIN;

-- 1. Idempotency for Billing
-- Ensure a batch can only ever have ONE bill.
ALTER TABLE public.bills 
ADD CONSTRAINT uq_bills_batch_id UNIQUE (batch_id);

-- Update the Trigger Function to be Idempotent
CREATE OR REPLACE FUNCTION auto_generate_bill()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_bill_id uuid;
    v_rate numeric := 10.0; -- Mock rate
    v_total numeric;
BEGIN
    -- Only runs on completion
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        -- Double check: If bill already exists, do nothing (Idempotent)
        IF EXISTS (SELECT 1 FROM public.bills WHERE batch_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        v_total := COALESCE(NEW.total_weight, 0) * v_rate;
        
        -- Insert Bill safely
        INSERT INTO public.bills (
            batch_id, bill_no, payer_company_id, payee_company_id, total_amount, currency, status
        ) VALUES (
            NEW.id,
            'BILL-' || substring(cast(uuid_generate_v4() as text), 1, 8),
            NEW.sender_company_id,
            NEW.transit_company_id,
            v_total,
            NEW.currency,
            'pending'
        ) 
        ON CONFLICT (batch_id) DO NOTHING -- Fail-safe
        RETURNING id INTO v_bill_id;
        
        -- Insert Items only if bill was created
        IF v_bill_id IS NOT NULL THEN
            INSERT INTO public.bill_items (bill_id, description, amount)
            VALUES (v_bill_id, 'Freight Charge for Batch ' || NEW.batch_no, v_total);
        END IF;
        
    END IF;
    RETURN NEW;
END;
$$;

-- 2. Freeze Completed Batches
-- Once a batch is 'completed' or 'cancelled', it should be immutable (except maybe by Admin).
CREATE OR REPLACE FUNCTION freeze_completed_batches()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- If the batch was already completed/cancelled, prevent further changes
    -- Unless the user is admin (assuming we have a way to check, usually via RLS or claim, 
    -- but triggers run as the user. Let's strictly block for now to be safe, or allow status change ONLY if it is an admin correction).
    
    IF OLD.status IN ('completed', 'cancelled') THEN
        -- Allow NO changes except maybe specific fields if needed, effectively freezing the row.
        RAISE EXCEPTION 'Batch % is final and cannot be modified.', OLD.batch_no;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Attach Freeze Trigger (Run BEFORE other update triggers)
DROP TRIGGER IF EXISTS tr_freeze_batch ON public.batches;
CREATE TRIGGER tr_freeze_batch
BEFORE UPDATE ON public.batches
FOR EACH ROW
EXECUTE FUNCTION freeze_completed_batches();


-- 3. Enhance RLS for "Strict Isolation"
-- Ensure Transporters cannot "Create" batches, only Senders can.
DROP POLICY IF EXISTS "Sender Create Batch" ON public.batches;
CREATE POLICY "Sender Create Batch" ON public.batches FOR INSERT
WITH CHECK (
    sender_company_id = get_my_company_id()
);

-- Ensure Transporters can only Update specific fields? 
-- (Postgres RLS doesn't support column-level UPDATE granularity easily in policies without check options, 
-- but the State Machine trigger handles the logical flow).

COMMIT;
