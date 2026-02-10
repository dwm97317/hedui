-- Create test users directly in auth.users and public.profiles
BEGIN;

-- 1. Function to create user if not exists
CREATE OR REPLACE FUNCTION create_test_user(
    v_email text, 
    v_password text, 
    v_role text,
    v_company_name text,
    v_company_code text
) RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_company_id uuid;
BEGIN
    -- Only proceed if user doesn't exist
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        
        -- Insert into auth.users (Simulation: In real Supabase, use API. But for local dev/test script, we can insert if we have permission. 
        -- However, generating encrypted password hash manually is hard in SQL. 
        -- BETTER STRATEGY: We CANNOT easily insert into auth.users with a valid password hash via pure SQL without pgcrypto/extensions often restricted.
        -- ALTERNATIVE: We will trigger a sign-up via client-side or use a Supabase Admin API call.
        
        -- SINCE I AM AN AI AGENT with MCP access, I should use the SITE to sign up or use a special script.
        -- WAIT! I can use `supabase-js` in a node script to sign them up! That's cleaner.
        RAISE EXCEPTION 'Cannot create auth user via SQL easily without hash knowledge. Use User Registration Script.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Actually, let's just create the companies first so they are ready for the users when they sign up.
INSERT INTO public.companies (name, code, role) VALUES 
('Sender Logistics Co.', 'SENDER_001', 'sender'),
('Global Transit Ltd.', 'TRANSIT_001', 'transit'),
('Receiver Depot Inc.', 'RECEIVER_001', 'receiver')
ON CONFLICT (code) DO NOTHING;

COMMIT;
