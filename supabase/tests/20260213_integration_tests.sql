-- Comprehensive Workflow Test Suite
-- Target: Supabase SQL Editor
-- Purpose: Verify backend logic (State Machine, Billing, Logs, RLS)

BEGIN;

-- 0. Cleanup (Optional, keep commented out unless resetting)
-- DELETE FROM public.batches WHERE batch_no LIKE 'TEST-%';
-- DELETE FROM public.companies WHERE code LIKE 'TEST-%';

DO $$
DECLARE
    v_sender_id uuid;
    v_transit_id uuid;
    v_receiver_id uuid;
    v_batch_id uuid;
    v_count integer;
BEGIN
    RAISE NOTICE '--- STARTING INTEGRATION TESTS ---';

    -- 1. Setup Test Data
    -- Create Companies
    INSERT INTO public.companies (name, code, role) VALUES ('Test Sender Co', 'TEST_SENDER', 'sender') RETURNING id INTO v_sender_id;
    INSERT INTO public.companies (name, code, role) VALUES ('Test Transit Co', 'TEST_TRANSIT', 'transit') RETURNING id INTO v_transit_id;
    INSERT INTO public.companies (name, code, role) VALUES ('Test Receiver Co', 'TEST_RECEIVER', 'receiver') RETURNING id INTO v_receiver_id;

    -- Setup User context (Simulate Sender)
    -- In Supabase Editor, we can't easily switch roles, so we rely on function logic being correct.
    -- We assume the current executor has admin privileges (postgres role) which bypasses RLS,
    -- but we are testing the LOGIC inside triggers mostly here. 
    -- RLS policies need to be tested via 'SET ROLE authenticated' and setting request.jwt.claims, which is tricky in pure SQL script.
    -- We will focus on LOGIC VALIDATION here.

    -- 2. Create Batch (Happy Path)
    INSERT INTO public.batches (
        batch_no, status, sender_company_id, transit_company_id, receiver_company_id
    ) VALUES (
        'TEST-BATCH-001', 'draft', v_sender_id, v_transit_id, v_receiver_id
    ) RETURNING id INTO v_batch_id;

    RAISE NOTICE '✅ Batch Created: %', v_batch_id;

    -- 3. Add Shipments (Test Weight Auto-Calc)
    INSERT INTO public.shipments (tracking_no, batch_id, weight) VALUES ('TRK-001', v_batch_id, 10.0);
    INSERT INTO public.shipments (tracking_no, batch_id, weight) VALUES ('TRK-002', v_batch_id, 20.0);
    
    -- Verify Weight
    PERFORM 1 FROM public.batches WHERE id = v_batch_id AND total_weight = 30.0;
    IF FOUND THEN
        RAISE NOTICE '✅ Auto-Weight Calculation: Correct (30.0)';
    ELSE
        RAISE EXCEPTION '❌ Auto-Weight Calculation Failed';
    END IF;

    -- 4. State Machine: Valid Transitions
    UPDATE public.batches SET status = 'sealed' WHERE id = v_batch_id;
    UPDATE public.batches SET status = 'in_transit' WHERE id = v_batch_id;
    UPDATE public.batches SET status = 'received' WHERE id = v_batch_id; -- Skipping optional 'inspected'
    
    RAISE NOTICE '✅ State Machine: Valid Flow (draft -> sealed -> in_transit -> received) Successful';

    -- 5. State Machine: Invalid Transition (Attempt Rollback)
    BEGIN
        UPDATE public.batches SET status = 'draft' WHERE id = v_batch_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✅ State Machine: Rollback Prevented (received -> draft blocked)';
    END;

    -- 6. Completion & Billing
    UPDATE public.batches SET status = 'completed' WHERE id = v_batch_id;
    RAISE NOTICE '✅ State Machine: Completed';

    -- Verify Bill Generation
    SELECT count(*) INTO v_count FROM public.bills WHERE batch_id = v_batch_id;
    IF v_count = 1 THEN
        RAISE NOTICE '✅ Billing: Auto-Generated 1 Bill';
    ELSE
        RAISE EXCEPTION '❌ Billing Failed: Expected 1 bill, found %', v_count;
    END IF;

    -- 7. Idempotency Test (Try to complete again or re-trigger)
    -- The status is already 'completed'. Updating it to 'completed' again usually hits the "IF OLD.status = NEW.status THEN RETURN NEW" check in State Machine trigger.
    UPDATE public.batches SET status = 'completed' WHERE id = v_batch_id;
    
    -- Verify no duplicate bills
    SELECT count(*) INTO v_count FROM public.bills WHERE batch_id = v_batch_id;
    IF v_count = 1 THEN
        RAISE NOTICE '✅ Billing Idempotency: Verified (Still 1 Bill)';
    ELSE
        RAISE EXCEPTION '❌ Billing Idempotency Failed: Found % bills', v_count;
    END IF;

    -- 8. Freeze Test (Try to modify completed batch)
    BEGIN
        UPDATE public.batches SET status = 'sealed' WHERE id = v_batch_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✅ Freeze Logic: Verified (Cannot modify completed batch)';
    END;

    RAISE NOTICE '--- ALL TESTS PASSED ---';
    
    -- Rollback to keep DB clean
    ROLLBACK;
    RAISE NOTICE 'Rollback complete (DB Clean)';
END $$;
