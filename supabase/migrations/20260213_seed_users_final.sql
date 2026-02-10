-- CLEANUP FIRST
DELETE FROM auth.users WHERE email IN ('sender@test.com', 'transit@test.com', 'receiver@test.com');
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- Create stored procedure with CORRECT columns for auth.identities
BEGIN;

DROP FUNCTION IF EXISTS create_user_with_hash(text, text, text, text);

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
            json_build_object('role', v_role, 'full_name', 'Test ' || v_role || ' User')::jsonb,
            false,
            now(),
            now()
        );
        
        -- Insert Identity with provider_id
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id, -- REQUIRED and likely NOT NULL
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_user_id,
            json_build_object('sub', v_user_id, 'email', v_email),
            'email',
            v_user_id::text, 
            now(),
            now(),
            now()       
        );
        
        RAISE NOTICE 'User % created with ID %', v_email, v_user_id;

        -- 3. Update the Profile linkage (Manual handle since trigger is dropped)
        INSERT INTO public.profiles (id, company_id, role, full_name, is_active)
        VALUES (v_user_id, v_company_id, v_role::user_role, 'Test ' || v_role || ' User', true)
        ON CONFLICT (id) DO UPDATE 
        SET company_id = EXCLUDED.company_id, 
            role = EXCLUDED.role,
            full_name = EXCLUDED.full_name;

    ELSE
        RAISE NOTICE 'User % already exists, updating profile linkage.', v_email;
        UPDATE public.profiles
        SET company_id = v_company_id
        WHERE id = v_user_id;
    END IF;

END;
$$ LANGUAGE plpgsql;

-- Apply with CORRECT Hash
SELECT create_user_with_hash('sender@test.com', '$2a$06$/3meMB.3NJ5HwqKMhl1eIOhWAShhViEVBmUp.rUxebs1PuQKb7zF6', 'sender', 'SENDER_001');
SELECT create_user_with_hash('transit@test.com', '$2a$06$/3meMB.3NJ5HwqKMhl1eIOhWAShhViEVBmUp.rUxebs1PuQKb7zF6', 'transit', 'TRANSIT_001');
SELECT create_user_with_hash('receiver@test.com', '$2a$06$/3meMB.3NJ5HwqKMhl1eIOhWAShhViEVBmUp.rUxebs1PuQKb7zF6', 'receiver', 'RECEIVER_001');

COMMIT;
