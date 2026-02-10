-- Fix NULL values in auth.users that cause GoTrue 500 errors
BEGIN;

-- Fix existing users
UPDATE auth.users 
SET email_change = '' 
WHERE email_change IS NULL;

-- Also fix other likely culprits just in case
UPDATE auth.users SET phone_change = '' WHERE phone_change IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;
UPDATE auth.users SET reauthentication_token = '' WHERE reauthentication_token IS NULL;

COMMIT;
