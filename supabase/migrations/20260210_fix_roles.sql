-- 1. Add Unique Constraint for RPC Upsert
ALTER TABLE batch_user_roles
ADD CONSTRAINT batch_user_roles_unique_role UNIQUE (batch_id, user_id, role);

-- 2. Enable RLS (Good Practice, ensures we control visibility)
ALTER TABLE batch_user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Add Policy: Users can view their own roles
-- Note: We include permission for the specific Test Users since they might not match auth.uid() exactly 
-- (depending on how they are authenticated, but usually simpler to just allow them explicitly for debug).
DROP POLICY IF EXISTS "Users can read own roles" ON batch_user_roles;

CREATE POLICY "Users can read own roles"
ON batch_user_roles
FOR SELECT
USING (
    user_id = auth.uid()::text 
    OR user_id IN ('U_TEST_SENDER', 'U_TEST_TRANSIT', 'U_TEST_RECEIVER')
);

-- 4. Add Policy: Allow Debug RPC (Security Definer handles insert, but just in case)
-- Actually, the RPC is SECURITY DEFINER, so it bypasses RLS for the INSERT.
-- But the frontend needs to SELECT.
