-- Migration: 20260213_init_new_schema.sql

-- Clean up old tables if they exist (Be careful, but necessary for a clean "design implementation")
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.batch_logs CASCADE;
DROP TABLE IF EXISTS public.waybills CASCADE;
DROP TABLE IF EXISTS public.batches CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'sender', 'transit', 'receiver');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE batch_status AS ENUM ('created', 'sealed', 'in_transit', 'inspected', 'received', 'completed', 'merged', 'split');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE currency_type AS ENUM ('VND', 'CNY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Companies
CREATE TABLE public.companies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    code text UNIQUE NOT NULL,
    role user_role NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id),
    role user_role NOT NULL,
    full_name text,
    created_at timestamptz DEFAULT now()
);

-- Batches
CREATE TABLE public.batches (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_no text UNIQUE NOT NULL,
    status batch_status NOT NULL DEFAULT 'created',
    sender_company_id uuid REFERENCES public.companies(id) NOT NULL,
    transit_company_id uuid REFERENCES public.companies(id),
    receiver_company_id uuid REFERENCES public.companies(id),
    parent_batch_id uuid REFERENCES public.batches(id),
    merged_into_batch_id uuid REFERENCES public.batches(id),
    currency currency_type DEFAULT 'VND',
    total_weight numeric(10, 2) DEFAULT 0,
    item_count integer DEFAULT 0,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Waybills
CREATE TABLE public.waybills (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id uuid REFERENCES public.batches(id) NOT NULL,
    tracking_no text NOT NULL,
    weight numeric(10, 2),
    volume numeric(10, 2),
    created_at timestamptz DEFAULT now()
);

-- Batch Logs
CREATE TABLE public.batch_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id uuid REFERENCES public.batches(id) NOT NULL,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    action text NOT NULL,
    previous_status batch_status,
    new_status batch_status,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- Bills
CREATE TABLE public.bills (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id uuid REFERENCES public.batches(id) NOT NULL,
    payer_company_id uuid REFERENCES public.companies(id),
    payee_company_id uuid REFERENCES public.companies(id),
    amount numeric(15, 2) NOT NULL,
    currency currency_type NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- Functions for RLS
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waybills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Policies

-- Profiles
DROP POLICY IF EXISTS "View own profile" ON public.profiles;
CREATE POLICY "View own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Companies
DROP POLICY IF EXISTS "View own company" ON public.companies;
CREATE POLICY "View own company" ON public.companies FOR SELECT USING (id = get_my_company_id());
DROP POLICY IF EXISTS "Admin view all companies" ON public.companies;
CREATE POLICY "Admin view all companies" ON public.companies FOR SELECT USING (is_admin());

-- Batches
DROP POLICY IF EXISTS "Batches Visibility Policy" ON public.batches;
CREATE POLICY "Batches Visibility Policy" ON public.batches FOR SELECT
USING (
    is_admin() 
    OR sender_company_id = get_my_company_id()
    OR transit_company_id = get_my_company_id()
    OR receiver_company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "Sender Create Batch" ON public.batches;
CREATE POLICY "Sender Create Batch" ON public.batches FOR INSERT
WITH CHECK (
    sender_company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "Company Update Own Batches" ON public.batches;
CREATE POLICY "Company Update Own Batches" ON public.batches FOR UPDATE
USING (
    sender_company_id = get_my_company_id()
    OR transit_company_id = get_my_company_id()
    OR receiver_company_id = get_my_company_id()
);

-- Waybills
DROP POLICY IF EXISTS "Waybills Visibility" ON public.waybills;
CREATE POLICY "Waybills Visibility" ON public.waybills FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.batches b
        WHERE b.id = waybills.batch_id
        AND (
            b.sender_company_id = get_my_company_id()
            OR b.transit_company_id = get_my_company_id()
            OR b.receiver_company_id = get_my_company_id()
            OR is_admin()
        )
    )
);

-- Logs
DROP POLICY IF EXISTS "Logs Visibility" ON public.batch_logs;
CREATE POLICY "Logs Visibility" ON public.batch_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.batches b
        WHERE b.id = batch_logs.batch_id
        AND (
            b.sender_company_id = get_my_company_id()
            OR b.transit_company_id = get_my_company_id()
            OR b.receiver_company_id = get_my_company_id()
            OR is_admin()
        )
    )
);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
