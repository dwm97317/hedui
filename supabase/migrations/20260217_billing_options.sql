-- 20260217_billing_options.sql
-- Enhances the billing system with configurable templates and price rules

-- 1. Create Bill Templates Table
CREATE TABLE public.bill_templates (
    id TEXT PRIMARY KEY, -- e.g., 'modern_minimal'
    name TEXT NOT NULL,
    description TEXT,
    preview_image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Default Templates
INSERT INTO public.bill_templates (id, name, description, preview_image_url) VALUES
('modern_minimal', '简洁现代', '突出总额，适合移动端快速查看', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvatpw3sW5hhAh3-T0fyI1ZEbZDRX3Nmk1J__DbxIKpM5odLPIWzse2KsXdHNi6oOVXfQtpk3pkJ2BmWRFcP65b8-VuT1I1J-g6LlEPZXi9AK29XMNnSkHkZGzGZ3OIqw-U139HMQmY70EAhzdWFFURyiHRjBFleY0jevguRfUpy-Iw43qCORdVb8LIgwm-I20_bmc4lU0dH-TvBWjpfds_Khb_etj7XlEgY9azJO4nuq1oJHXk0Rmva7zp4Njv7fuYJTmXjGCbRc'),
('classic_pro', '经典专业', '明细清晰，符合国际财务标准', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6rUE1BC7IFr5pvU-2V4At1wUUDVNvyaqGlri4-jKFCvZh0xXqBqyR3EQsOY6fvmqqdk7F8YTm_0dQdvk6AFPLST6YtJ_EkS-S0ieX18WAR2JTqtWpGhMRw5iVaXrVXn-3UupQ_zgejLk_85rMosKvhZ-PntM9zt2AvocmJ31zEy2vNGRUPOHzHP1KjcbHbL07QAxdTAO9CBEx27PhiRK0tnw3lhHxAojEbjuWTfelZgmXLn75yQnrlhXp-y5szUBuOaeNyYanKUo'),
('data_dense', '数据密集', '适合多品类、高频次物流对账', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFrwkcC3mDpP4x0yN4oaKi42ktElsXUYoxJin7Ja7puHBoe5ABVTDqiz6OB9tqsC2PzXxH47obCygiwstr-t8aKoamNEbx_9soCfG54GxFoCz1qzXNC-TA5Dzc_BRmmsqapdNcR4XV1jfUvFXmkEmejOg_ihmJLAAhdYOsBLYpsboh3VorBkxWaFZFF6tKlDsS-JGjJLEz-PGbaSP8iWPSqkVsoE-TXMQeBx2SpZOgXolIcVDGVliSzDFSoV5At6YeedJcUyilx-I'),
('business_minimal', '商务极简', '极致灰调，稳重且专业的视觉体验', null);

-- 2. Create Batch Bill Configurations Table
CREATE TABLE public.batch_bill_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    bill_type public.bill_type NOT NULL, -- 'SENDER_TO_ADMIN', etc.
    template_id TEXT REFERENCES public.bill_templates(id),
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(batch_id, bill_type)
);

-- 3. Create Price Rules Table (Per Batch)
CREATE TABLE public.batch_price_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    bill_type public.bill_type NOT NULL,
    category TEXT NOT NULL, -- 'Electronics', 'General', etc.
    unit_price DECIMAL(15, 2) NOT NULL,
    currency public.currency_code NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(batch_id, bill_type, category)
);

-- 4. Enable RLS
ALTER TABLE public.bill_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_bill_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_price_rules ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Templates are readable by everyone
CREATE POLICY "Templates are public" ON public.bill_templates FOR SELECT USING (true);

-- Configs and Rules: Readable by batch participants (simplified to public for now or same logic as batches)
CREATE POLICY "Batch participants can view configs" ON public.batch_bill_configs FOR SELECT USING (true); -- Simplify for dev
CREATE POLICY "Admins can edit configs" ON public.batch_bill_configs FOR ALL USING (true); -- Simplify for dev

CREATE POLICY "Batch participants can view rules" ON public.batch_price_rules FOR SELECT USING (true);
CREATE POLICY "Admins can edit rules" ON public.batch_price_rules FOR ALL USING (true);


-- 6. Updated Trigger Function to use Price Rules
CREATE OR REPLACE FUNCTION public.handle_batch_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_unit_price DECIMAL(15, 2);
    v_currency public.currency_code;
    v_sender_company_id UUID;
    v_receiver_company_id UUID;
    v_admin_company_id UUID;
BEGIN
    -- Fetch Admin Company (Mock or Real)
    SELECT id INTO v_admin_company_id FROM public.companies WHERE role = 'admin' LIMIT 1;
    
    -- Configurable Logic: Try to find a specific rule for 'General' category first, else default
    -- In a real app, we might sum up parcels by category. Here we assume 'General' for the batch level bill.
    
    -- Sender to Admin (Bill A)
    IF NEW.status = 'sealed' AND OLD.status != 'sealed' THEN
        -- Try to get configured price
        SELECT unit_price, currency INTO v_unit_price, v_currency 
        FROM public.batch_price_rules 
        WHERE batch_id = NEW.id AND bill_type = 'SENDER_TO_ADMIN' AND category = 'General' LIMIT 1;

        -- Defaults if no rule
        IF v_unit_price IS NULL THEN v_unit_price := 50000; END IF;
        IF v_currency IS NULL THEN v_currency := 'VND'; END IF;

        INSERT INTO public.bills (batch_id, bill_type, currency, total_weight, unit_price, payer_company_id, payee_company_id)
        VALUES (NEW.id, 'SENDER_TO_ADMIN', v_currency, NEW.total_weight, v_unit_price, NEW.sender_company_id, v_admin_company_id);
    END IF;

    -- Admin to Transit (Bill B)
    IF NEW.status = 'in_transit' AND OLD.status != 'in_transit' THEN
        SELECT unit_price, currency INTO v_unit_price, v_currency 
        FROM public.batch_price_rules 
        WHERE batch_id = NEW.id AND bill_type = 'ADMIN_TO_TRANSIT' AND category = 'General' LIMIT 1;
        
        IF v_unit_price IS NULL THEN v_unit_price := 40000; END IF;
        IF v_currency IS NULL THEN v_currency := 'VND'; END IF;

        INSERT INTO public.bills (batch_id, bill_type, currency, total_weight, unit_price, payer_company_id, payee_company_id)
        VALUES (NEW.id, 'ADMIN_TO_TRANSIT', v_currency, NEW.total_weight, v_unit_price, v_admin_company_id, NEW.transit_company_id);
    END IF;

    -- Sender to Receiver (Bill C)
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        SELECT unit_price, currency INTO v_unit_price, v_currency 
        FROM public.batch_price_rules 
        WHERE batch_id = NEW.id AND bill_type = 'SENDER_TO_RECEIVER' AND category = 'General' LIMIT 1;
        
        IF v_unit_price IS NULL THEN v_unit_price := 15; END IF;
        IF v_currency IS NULL THEN v_currency := 'CNY'; END IF;

        INSERT INTO public.bills (batch_id, bill_type, currency, total_weight, unit_price, payer_company_id, payee_company_id)
        VALUES (NEW.id, 'SENDER_TO_RECEIVER', v_currency, NEW.total_weight, v_unit_price, NEW.sender_company_id, NEW.receiver_company_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
