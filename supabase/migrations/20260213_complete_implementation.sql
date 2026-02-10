-- Migration: 20260213_complete_implementation.sql
-- Description: Complete production-ready schema implementation for Workflow System
-- Includes: Tables, RLS, Triggers, Indexes

BEGIN;

-- 1. Clean up (Safe drops for development iteration)
DROP TRIGGER IF EXISTS tr_audit_log ON public.batches;
DROP TRIGGER IF EXISTS tr_audit_log ON public.shipments;
DROP TRIGGER IF EXISTS tr_batch_state_machine ON public.batches;
DROP TRIGGER IF EXISTS tr_auto_generate_bill ON public.batches;

DROP TABLE IF EXISTS public.bill_items CASCADE;
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.inspections CASCADE;
DROP TABLE IF EXISTS public.shipment_relations CASCADE;
DROP TABLE IF EXISTS public.shipments CASCADE; -- Renamed from waybills
DROP TABLE IF EXISTS public.operation_logs CASCADE; -- Renamed from batch_logs
DROP TABLE IF EXISTS public.batches CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- 2. Extensions & Enums
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'sender', 'transit', 'receiver');
    CREATE TYPE batch_status AS ENUM ('draft', 'sealed', 'in_transit', 'inspected', 'received', 'completed', 'cancelled');
    CREATE TYPE currency_type AS ENUM ('VND', 'CNY');
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Tables Structure

-- 3.1 Companies (Tenants)
CREATE TABLE public.companies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    code text UNIQUE NOT NULL,
    role user_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.2 Users (Profiles linked to Auth)
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) NOT NULL,
    role user_role NOT NULL,
    full_name text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.3 Batches (Core Workflow)
CREATE TABLE public.batches (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_no text UNIQUE NOT NULL,
    status batch_status NOT NULL DEFAULT 'draft',
    
    -- Partners involved
    sender_company_id uuid REFERENCES public.companies(id) NOT NULL,
    transit_company_id uuid REFERENCES public.companies(id),
    receiver_company_id uuid REFERENCES public.companies(id),
    
    -- Metrics
    total_weight numeric(10, 2) DEFAULT 0,
    item_count integer DEFAULT 0,
    currency currency_type DEFAULT 'VND',
    
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.4 Shipments (Parcels/Waybills)
CREATE TABLE public.shipments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_no text NOT NULL,
    batch_id uuid REFERENCES public.batches(id) ON DELETE CASCADE,
    
    weight numeric(10, 2),
    volume numeric(10, 2),
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT uq_tracking_batch UNIQUE (tracking_no, batch_id)
);

-- 3.5 Shipment Relations (Merge/Split History)
CREATE TABLE public.shipment_relations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_shipment_id uuid REFERENCES public.shipments(id),
    child_shipment_id uuid REFERENCES public.shipments(id),
    type text CHECK (type IN ('merge', 'split')),
    created_at timestamptz DEFAULT now()
);

-- 3.6 Inspections (Quality check records)
CREATE TABLE public.inspections (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id uuid REFERENCES public.batches(id) NOT NULL,
    inspector_id uuid REFERENCES auth.users(id) NOT NULL,
    result text NOT NULL CHECK (result IN ('passed', 'failed', 'flagged')),
    photos text[], -- Array of URLs
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 3.7 Bills (Financials)
CREATE TABLE public.bills (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id uuid REFERENCES public.batches(id) NOT NULL,
    bill_no text UNIQUE NOT NULL, -- Auto-generated
    
    payer_company_id uuid REFERENCES public.companies(id) NOT NULL,
    payee_company_id uuid REFERENCES public.companies(id) NOT NULL,
    
    total_amount numeric(15, 2) NOT NULL DEFAULT 0,
    currency currency_type NOT NULL,
    status payment_status DEFAULT 'pending',
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.8 Bill Items (Line items for details)
CREATE TABLE public.bill_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id uuid REFERENCES public.bills(id) ON DELETE CASCADE,
    description text NOT NULL,
    amount numeric(15, 2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 3.9 Operation Logs (Audit Trail)
CREATE TABLE public.operation_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    action text NOT NULL, -- INSERT, UPDATE, DELETE
    changed_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
    old_data jsonb,
    new_data jsonb,
    created_at timestamptz DEFAULT now()
);

-- 4. Indexes (Performance)
CREATE INDEX idx_batches_sender ON public.batches(sender_company_id);
CREATE INDEX idx_batches_transit ON public.batches(transit_company_id);
CREATE INDEX idx_batches_receiver ON public.batches(receiver_company_id);
CREATE INDEX idx_batches_status ON public.batches(status);
CREATE INDEX idx_shipments_batch ON public.shipments(batch_id);
CREATE INDEX idx_shipments_tracking ON public.shipments(tracking_no);
CREATE INDEX idx_profiles_company ON public.profiles(company_id);
CREATE INDEX idx_logs_record ON public.operation_logs(record_id);

-- 5. RLS Policies (Security)

-- Helper Functions
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 Company Visibility
CREATE POLICY "See own company" ON public.companies FOR SELECT USING (id = get_my_company_id() OR is_admin());

-- 5.2 Batch Access Strategy
-- Logic: You can see a batch if your company is the Sender, Transit, or Receiver.
CREATE POLICY "Access relevant batches" ON public.batches
FOR ALL USING (
    sender_company_id = get_my_company_id() OR
    transit_company_id = get_my_company_id() OR
    receiver_company_id = get_my_company_id() OR
    is_admin()
);

-- 5.3 Shipment Access (Inherited from Batch)
CREATE POLICY "Access relevant shipments" ON public.shipments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.batches b 
        WHERE b.id = shipments.batch_id 
        AND (
            b.sender_company_id = get_my_company_id() OR
            b.transit_company_id = get_my_company_id() OR
            b.receiver_company_id = get_my_company_id() OR
            is_admin()
        )
    )
);

-- 6. Triggers & Business Logic

-- 6.1 State Machine Trigger
CREATE OR REPLACE FUNCTION check_batch_state_transition()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;
    
    -- Define Allowed Transitions
    -- draft -> sealed
    IF OLD.status = 'draft' AND NEW.status = 'sealed' THEN RETURN NEW; END IF;
    -- sealed -> in_transit
    IF OLD.status = 'sealed' AND NEW.status = 'in_transit' THEN RETURN NEW; END IF;
    -- in_transit -> inspected OR received
    IF OLD.status = 'in_transit' AND (NEW.status = 'inspected' OR NEW.status = 'received') THEN RETURN NEW; END IF;
    -- inspected -> received
    IF OLD.status = 'inspected' AND NEW.status = 'received' THEN RETURN NEW; END IF;
    -- received -> completed
    IF OLD.status = 'received' AND NEW.status = 'completed' THEN RETURN NEW; END IF;
    -- Only Admin can cancel
    IF NEW.status = 'cancelled' AND is_admin() THEN RETURN NEW; END IF;

    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
END;
$$;

CREATE TRIGGER tr_batch_state_machine
BEFORE UPDATE ON public.batches
FOR EACH ROW EXECUTE FUNCTION check_batch_state_transition();

-- 6.2 Auto-Audit Log Trigger
CREATE OR REPLACE FUNCTION record_operation_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.operation_logs (
        table_name, record_id, action, old_data, new_data, changed_by
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );
    RETURN NULL;
END;
$$;

CREATE TRIGGER tr_audit_log_batches
AFTER UPDATE ON public.batches
FOR EACH ROW EXECUTE FUNCTION record_operation_log();

CREATE TRIGGER tr_audit_log_shipments
AFTER INSERT OR UPDATE OR DELETE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION record_operation_log();

-- 6.3 Auto-Billing Trigger
CREATE OR REPLACE FUNCTION auto_generate_bill()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_bill_id uuid;
    v_rate numeric := 10.0; -- Mock rate, should technically query a rate table
    v_total numeric;
BEGIN
    -- Only runs on completion
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        v_total := COALESCE(NEW.total_weight, 0) * v_rate;
        
        -- Create Bill Header
        INSERT INTO public.bills (
            batch_id, bill_no, payer_company_id, payee_company_id, total_amount, currency, status
        ) VALUES (
            NEW.id,
            'BILL-' || floor(extract(epoch from now())), -- Simple ID gen
            NEW.sender_company_id, -- Sender pays
            NEW.transit_company_id, -- Transit receives
            v_total,
            NEW.currency,
            'pending'
        ) RETURNING id INTO v_bill_id;
        
        -- Create Bill Detail Item
        INSERT INTO public.bill_items (bill_id, description, amount)
        VALUES (v_bill_id, 'Freight Charge for Batch ' || NEW.batch_no, v_total);
        
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tr_auto_generate_bill
AFTER UPDATE ON public.batches
FOR EACH ROW EXECUTE FUNCTION auto_generate_bill();

COMMIT;
