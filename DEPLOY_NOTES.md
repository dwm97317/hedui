# Weight Verification System: Final Deployment Notes

## System Overview
This is the **Final Production Version** of the Weight Verification System. It features:
- **Multi-Language Support**: CN, VN, TH, MM (Auto-detected).
- **Responsive Design**: Side-by-side for PC/PAD, prioritized vertical stack for Mobile.
- **PDA Optimization**: Supports both Keyboard Emulation and `window.onScan` Broadcast mode.
- **Strict Security**: Field-level database triggers enforce that only the responsible role can edit their specific weight.

## Key Configurations

### 1. Database Migrations (Required)
You must apply the "Triplet Audit" migration to your Supabase instance if you haven't already. This adds the `*_updated_at` columns and the `handle_parcel_field_security` trigger.
*(Note: I have already applied this to the current linked Supabase instance.)*

### 2. PDA / Scanner Setup
- **Keyboard Mode**: Works out of the box. Ensure the cursor is in the input field (the app auto-focuses).
- **Broadcast Mode (Recommended)**:
    - Configure your PDA to send a standard Android Broadcast.
    - Or simply allow the PDA to inject `window.onScan(code)` via WebView.
    - The app listens globally for this event.

### 3. Environment Variables
Ensure `.env` contains:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Deployment Steps
1.  **Build**: Run `npm run build`. This generates the `dist/` folder.
2.  **Deploy**: Upload the `dist/` folder to your static hosting (Vercel, Netlify, or Nginx).
3.  **SPA Routing**: If using Nginx, ensure all requests fallback to `index.html`:
    ```nginx
    location / {
      try_files $uri $uri/ /index.html;
    }
    ```

## Admin & Security
- **Role Assignment**: Use the database `batch_user_roles` table to assign `sender`, `transit`, or `receiver` roles to specific LINE Operator IDs for specific batches.
- **Audit**: All weight changes are finalized with a timestamp and user ID. Viewable by hovering over the weight in the table.
