-- Clean everything first
DELETE FROM auth.users WHERE email IN ('sender@test.com', 'transit@test.com', 'receiver@test.com');
-- Or clean all if possible? The USER asked to "clear database".
-- "那就清空数据库" -> Clear database.
-- I should be careful not to delete schema, just data.
-- TRUNCATE public.batches CASCADE;
-- TRUNCATE public.profiles CASCADE;
-- TRUNCATE auth.users CASCADE; -- Requires identifying specific users, usually can't truncate auth.users easily due to FKs.

-- Let's stick to deleting test users and clearing business data.
TRUNCATE public.batches CASCADE;
TRUNCATE public.bills CASCADE;
TRUNCATE public.operation_logs CASCADE;
-- Delete specific test users + old potential test users
DELETE FROM auth.users WHERE email LIKE '%@test.com';

-- Create extension pgcrypto if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to create user with Supabase compatible password hash
CREATE OR REPLACE FUNCTION create_test_user_v2(
    v_email text, 
    v_password text, -- Plain text password
    v_role text
) RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_encrypted_pw text;
    v_company_id uuid;
BEGIN
    -- Generate UUIDs
    v_user_id := uuid_generate_v4();
    
    -- Hash password using bcrypt (Supabase standard)
    v_encrypted_pw := crypt(v_password, gen_salt('bf'));

    -- Find Company (Should exist from previous seeds/cleaning, but let's be safe)
    -- Actually, user asked to CLEAR DB. So I must re-seed companies too.
    -- I'll define companies here or assume they exist? 
    -- Let's re-insert companies just in case.
    
    INSERT INTO public.companies (name, code, role) VALUES 
    ('Sender Logistics Co.', 'SENDER_001', 'sender'),
    ('Global Transit Ltd.', 'TRANSIT_001', 'transit'),
    ('Receiver Depot Inc.', 'RECEIVER_001', 'receiver')
    ON CONFLICT (code) DO NOTHING;
    
    SELECT id INTO v_company_id FROM public.companies WHERE role = v_role::user_role LIMIT 1;

    -- Insert into auth.users (Minimal required fields for GoTrue)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        confirmation_token, recovery_token, email_change_token_new, reauthentication_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        v_encrypted_pw,
        now(),
        '{"provider":"email","providers":["email"]}',
        json_build_object('role', v_role, 'full_name', 'Test ' || v_role || ' User')::jsonb,
        false,
        now(),
        now(),
        '', '', '', ''
    );

    -- Insert Identity (Crucial for login)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_user_id, -- Some systems use a separate UUID, but GoTrue often uses user_id as identity id or generates one. Let's start with user_id.
        -- Actually, looking at `auth.identities` schema, `id` is text execution usually UUID.
        v_user_id,
        json_build_object('sub', v_user_id, 'email', v_email, 'email_verified', true, 'phone_verified', false),
        'email',
        v_user_id::text, -- user_id as string for email provider
        now(),
        now(),
        now()
    );

    -- Insert Profile (Business Logic)
    INSERT INTO public.profiles (id, company_id, role, full_name, is_active)
    VALUES (v_user_id, v_company_id, v_role::user_role, 'Test ' || v_role || ' User', true)
    ON CONFLICT (id) DO UPDATE 
    SET company_id = EXCLUDED.company_id,
        role = EXCLUDED.role;
        
END;
$$ LANGUAGE plpgsql;

-- Executing the user creation with password 'password'
SELECT create_test_user_v2('sender@test.com', 'password', 'sender');
SELECT create_test_user_v2('transit@test.com', 'password', 'transit');
SELECT create_test_user_v2('receiver@test.com', 'password', 'receiver');
