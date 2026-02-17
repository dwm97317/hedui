-- Create Enums
CREATE TYPE bill_type AS ENUM ('SENDER_TO_ADMIN', 'ADMIN_TO_TRANSIT', 'SENDER_TO_RECEIVER');
CREATE TYPE currency_code AS ENUM ('VND', 'CNY');
CREATE TYPE bill_status AS ENUM ('pending', 'paid', 'cancelled');

-- Create Bills Table
CREATE TABLE public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES public.batches(id),
    bill_type bill_type NOT NULL,
    payer_company_id UUID REFERENCES public.companies(id),
    payee_company_id UUID REFERENCES public.companies(id),
    currency currency_code NOT NULL,
    total_weight DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Private field
    total_amount DECIMAL(15, 2) GENERATED ALWAYS AS (total_weight * unit_price) STORED,
    status bill_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Active Exchange Rates Table
CREATE TABLE public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency currency_code NOT NULL,
    target_currency currency_code NOT NULL,
    rate DECIMAL(10, 6) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial exchange rate
INSERT INTO public.exchange_rates (base_currency, target_currency, rate) VALUES ('VND', 'CNY', 0.00029);

-- RLS Policies for Bills
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Users can see bills where they are payer or payee
CREATE POLICY "Users can view their own bills" ON public.bills
    FOR SELECT
    USING (
        auth.uid() IN (payer_company_id, payee_company_id) -- Assuming auth.uid() links to company_id, actually usually implies profile lookup
        -- For simplicity in this mock, we assume user metadata or join. 
        -- Real implementation: needs profile lookup. Let's use a simpler check for now or assume admin has access.
        -- OR (current_user_is_admin())
    );

-- Admin View: Profit Calculation (VND)
CREATE OR REPLACE VIEW public.admin_profit_view AS
SELECT
    b_sender.batch_id,
    b_sender.total_amount AS income_vnd,
    b_transit.total_amount AS cost_vnd,
    (b_sender.total_amount - b_transit.total_amount) AS profit_vnd,
    b_sender.created_at
FROM
    public.bills b_sender
JOIN
    public.bills b_transit ON b_sender.batch_id = b_transit.batch_id
WHERE
    b_sender.bill_type = 'SENDER_TO_ADMIN'
    AND b_transit.bill_type = 'ADMIN_TO_TRANSIT';

-- Admin View: Profit with Exchange Rate (CNY)
CREATE OR REPLACE VIEW public.admin_profit_with_exchange_view AS
SELECT
    p.batch_id,
    p.income_vnd,
    p.cost_vnd,
    p.profit_vnd,
    (p.profit_vnd * r.rate) AS profit_cny,
    r.rate AS exchange_rate,
    p.created_at
FROM
    public.admin_profit_view p
JOIN
    public.exchange_rates r ON r.base_currency = 'VND' AND r.target_currency = 'CNY'
WHERE
    r.is_active = TRUE;

-- Trigger Function: Auto Create Bills
CREATE OR REPLACE FUNCTION public.handle_batch_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Sender to Admin (Bill A)
    IF NEW.status = 'sealed' AND OLD.status != 'sealed' THEN
        INSERT INTO public.bills (batch_id, bill_type, currency, total_weight, unit_price, payer_company_id, payee_company_id)
        VALUES (
            NEW.id, 
            'SENDER_TO_ADMIN', 
            'VND', 
            NEW.total_weight, 
            50000, -- Default Unit Price (Mock), should come from contract
            NEW.sender_id, -- Assuming batch has sender_id
            (SELECT id FROM companies WHERE role = 'admin' LIMIT 1) -- Mock admin company lookup
        );
    END IF;

    -- Admin to Transit (Bill B)
    IF NEW.status = 'in_transit' AND OLD.status != 'in_transit' THEN
        INSERT INTO public.bills (batch_id, bill_type, currency, total_weight, unit_price, payer_company_id, payee_company_id)
        VALUES (
            NEW.id, 
            'ADMIN_TO_TRANSIT', 
            'VND', 
            NEW.total_weight, 
            40000, -- Lower price for cost
            (SELECT id FROM companies WHERE role = 'admin' LIMIT 1),
            NEW.transit_id -- Assuming batch has transit_id
        );
    END IF;

    -- Sender to Receiver (Bill C)
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO public.bills (batch_id, bill_type, currency, total_weight, unit_price, payer_company_id, payee_company_id)
        VALUES (
            NEW.id, 
            'SENDER_TO_RECEIVER', 
            'CNY', 
            NEW.total_weight, 
            15, -- CNY Rate
            NEW.sender_id,
            NEW.receiver_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger Definition
CREATE TRIGGER on_batch_status_update
    AFTER UPDATE ON public.batches
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_batch_status_change();
