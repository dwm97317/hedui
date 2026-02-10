-- Fix the Profile Trigger
BEGIN;

-- 1. Redefine the function to match the ACTUAL table schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        -- Default to 'sender' if not specified, or parse from metadata
        CASE 
            WHEN (new.raw_user_meta_data->>'role') = 'admin' THEN 'admin'::user_role
            WHEN (new.raw_user_meta_data->>'role') = 'transit' THEN 'transit'::user_role
            WHEN (new.raw_user_meta_data->>'role') = 'receiver' THEN 'receiver'::user_role
            ELSE 'sender'::user_role
        END
    );
    RETURN new;
END;
$$;

-- 2. Drop the trigger temporarily or ensure it uses the updated function.
-- (Postgres uses the latest definition of the function automatically if name matches)

COMMIT;
