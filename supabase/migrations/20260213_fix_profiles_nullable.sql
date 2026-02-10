-- Make company_id nullable to allow initial user creation, then fill it later.
BEGIN;

ALTER TABLE public.profiles
ALTER COLUMN company_id DROP NOT NULL;

COMMIT;
