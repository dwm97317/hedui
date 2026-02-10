-- CLEANUP: Delete the manually inserted users so we can try clean registration via API
-- This ensures no conflicting IDs or broken trigger logic remains
BEGIN;

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT id FROM auth.users WHERE email IN ('sender@test.com', 'transit@test.com', 'receiver@test.com') LOOP
        DELETE FROM public.profiles WHERE id = r.id; 
        DELETE FROM auth.identities WHERE user_id = r.id;
        DELETE FROM auth.users WHERE id = r.id;
    END LOOP;
END $$;

COMMIT;
