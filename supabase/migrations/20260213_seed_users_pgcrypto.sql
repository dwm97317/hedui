-- CLEANUP
DELETE FROM auth.users WHERE email IN ('sender@test.com', 'transit@test.com', 'receiver@test.com');
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- Create Function using pgcrypto for real password hashes
BEGIN;

DROP FUNCTION IF EXISTS create_user_with_hash(text, text, text, text);

CREATE OR REPLACE FUNCTION create_test_user_safe(
    v_email text, 
    v_password text, -- Plain text password
    v_role text,
    v_company_code text
) RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_identity_id uuid;
    v_company_id uuid;
    v_encrypted_pw text;
BEGIN
    SELECT id INTO v_company_id FROM public.companies WHERE code = v_company_code;
    IF v_company_id IS NULL THEN
        RAISE NOTICE 'Company % not found', v_company_code;
        RETURN;
    END IF;

    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        v_user_id := uuid_generate_v4();
        v_identity_id := uuid_generate_v4();
        
        -- Use pgcrypto to hash the password securely
        v_encrypted_pw := crypt(v_password, gen_salt('bf'));
        
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
            '', '', '', '' -- Empty tokens just in case unique constraints exist
        );
        
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
            v_identity_id,
            v_user_id,
            json_build_object('sub', v_user_id, 'email', v_email, 'email_verified', true),
            'email',
            v_user_id::text, -- For email provider, provider_id IS usually the user ID string
            now(),
            now(),
            now()       
        );
        
        RAISE NOTICE 'User % created with ID % (PW Hash Generated)', v_email, v_user_id;

        INSERT INTO public.profiles (id, company_id, role, full_name, is_active)
        VALUES (v_user_id, v_company_id, v_role::user_role, 'Test ' || v_role || ' User', true)
        ON CONFLICT (id) DO UPDATE 
        SET company_id = EXCLUDED.company_id, 
            role = EXCLUDED.role,
            full_name = EXCLUDED.full_name;

    ELSE
        -- Update password too just in case
        UPDATE auth.users 
        SET encrypted_password = crypt(v_password, gen_salt('bf'))
        WHERE id = v_user_id;

        UPDATE public.profiles
        SET company_id = v_company_id
        WHERE id = v_user_id;
    END IF;

END;
$$ LANGUAGE plpgsql;

-- Create users with password 'password'
SELECT create_test_user_safe('sender@test.com', 'password', 'sender', 'SENDER_001');
SELECT create_test_user_safe('transit@test.com', 'password', 'transit', 'TRANSIT_001');
SELECT create_test_user_safe('receiver@test.com', 'password', 'receiver', 'RECEIVER_001');

COMMIT;
