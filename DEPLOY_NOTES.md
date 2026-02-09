# Hidden Backstage & Unified Auth: Deployment Notes

## System Ready: Unified Identity Model

We have successfully refactored the system to adhere to the "Unified Principle": **One App, One Login, Role-Based Access.**

### 1. Unified Auth (LINE Login)
*   **System Source**: All users identify via LINE Login.
*   **Admin Role**: "Admin" is no longer a separate system. It is simply a LINE user with `system_role='admin'` in the `users` table.

### 2. Access Control
*   **Front Entrance (`/`)**: Visible to everyone. Scanning & Operations.
*   **Back Entrance (`/admin/dashboard`)**: Hidden URL.
    *   **Security Check**: Automatically blocks users without `admin` or `auditor` role.
    *   **Capabilities**: Assign roles, revoke permissions, view audit logs.

### 3. Data Integrity & Ownership Lock
*   **Rule**: "He who scans it, owns it."
*   **Behavior**: If User A enters a weight, User B (even with the same role) **cannot modify it**. The input field is disabled and shows a warning.
*   **Exception**: User B can fill in *empty* fields (e.g. missing Transit weight), but cannot touch User A's Sender weight.

### 4. Admin Powers
*   **Revoke (`[x]`)**: Admins can instantly revoke a user's permission for a specific batch.

## Deployment Instructions
1.  **Rebuild**: Run `npm run build` to apply the latest security rules.
2.  **Environment**: Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.
3.  **Admin Setup**: You must manually set your first admin in the database:
    ```sql
    UPDATE users SET system_role = 'admin' WHERE id = 'YOUR_LINE_USER_ID';
    ```
