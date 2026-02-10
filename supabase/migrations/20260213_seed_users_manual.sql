-- Create a stored procedure to safely insert a test user using the provided password hash.
BEGIN;

-- 0. Ensure pgcrypto extension is not strictly required if we pass the hash directly.
-- The user provided hash: $2a$06$/3meMB.3NJ5HwqKMhl1eIOhWAShhViEVBmUp.rUxebs1PuQKb7zF6

CREATE OR REPLACE FUNCTION create_user_with_hash(
    v_email text, 
    v_password_hash text, 
    v_role text,
    v_company_code text
) RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_company_id uuid;
BEGIN
    -- 1. Get Company ID
    SELECT id INTO v_company_id FROM public.companies WHERE code = v_company_code;
    IF v_company_id IS NULL THEN
        RAISE NOTICE 'Company % not found, skipping user creation.', v_company_code;
        RETURN;
    END IF;

    -- 2. Check if user exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        -- Insert User
        v_user_id := uuid_generate_v4();
        
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
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            v_email,
            v_password_hash,
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            false,
            now(),
            now()
        );
        
        -- Insert Identity (Crucial for Supabase Auth to work)
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_user_id,
            json_build_object('sub', v_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()       
        );
        
        RAISE NOTICE 'User % created with ID %', v_email, v_user_id;
    ELSE
        RAISE NOTICE 'User % already exists, updating profile linkage.', v_email;
    END IF;

    -- 3. Link Profile (Upsert)
    INSERT INTO public.profiles (id, company_id, role, full_name, is_active)
    VALUES (v_user_id, v_company_id, v_role, 'Test ' || v_role || ' User', true)
    ON CONFLICT (id) DO UPDATE 
    SET company_id = EXCLUDED.company_id, 
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name;

END;
$$ LANGUAGE plpgsql;

-- Apply for all 3 roles using the provided hash
-- Apply for all 3 roles using the provided hash
SELECT create_user_with_hash('sender@test.com', '$2a$06$/3meMB.3NJ5HwqKMhl1eIOhWAShhViEVBmUp.rUxebs1PuQKb7zF6', 'sender', 'SENDER_001');
SELECT create_user_with_hash('transit@test.com', '$2a$06$/3meMB.3NJ5HwqKMhl1eIOhWAShhViEVBmUp.rUxebs1PuQKb7zF6', 'transit', 'TRANSIT_001');
SELECT create_user_with_hash('receiver@test.com', '$2a$06$/3meMB.3NJ5HwqKMhl1eIOhWAShhViEVBmUp.rUxebs1PuQKb7zF6', 'receiver', 'RECEIVER_001');

COMMIT;
