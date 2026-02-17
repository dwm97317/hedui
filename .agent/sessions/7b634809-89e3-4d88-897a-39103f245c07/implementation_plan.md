# Route A: Database & RLS Design

This plan focuses on building the foundational data layer for the weight verification system using Supabase (PostgreSQL).

## Proposed Changes

### Database Schema

#### [NEW] `schema.sql` (Conceptual)

We will define the following tables:

1.  **`profiles`**: To store user roles.
    - `id` (uuid, references auth.users)
    - `role` (enum: 'sender', 'transit', 'receiver', 'admin')
2.  **`packages`**: The core package data.
    - `id` (uuid, primary key)
    - `package_code` (text, unique)
    - `ship_date` (date)
    - `sender_weight` (numeric)
    - `transit_weight` (numeric)
    - `receiver_weight` (numeric)
    - `merge_batch_id` (uuid, null, references merge_batches)
    - `status` (text)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
3.  **`merge_batches`**: For merged batches.
    - `id` (uuid, primary key)
    - `batch_id` (text, unique)
    - `total_weight` (numeric)
    - `created_by` (uuid, references auth.users)
    - `created_at` (timestamptz)
4.  **`audit_logs`**: To track all changes.
    - `id` (uuid)
    - `table_name` (text)
    - `record_id` (uuid)
    - `changed_by` (uuid)
    - `old_data` (jsonb)
    - `new_data` (jsonb)
    - `created_at` (timestamptz)

### RLS Policies

#### `packages` table policies:
- **SELECT**: All authenticated users can see all packages.
- **INSERT**: 
    - Only `sender` can insert new packages.
- **UPDATE**:
    - `sender`: Can only update `sender_weight` and only if `transit_weight` is null.
    - `transit`: Can only update `transit_weight` and `merge_batch_id`.
    - `receiver`: Can only update `receiver_weight`.
    - `admin`: Full update access (optional, usually for audit/correction).

> [!IMPORTANT]
> Since PostgreSQL RLS is row-level, column-level restrictions for `UPDATE` will be implemented using a **Trigger Function** that checks which columns are being modified based on the user's role.

### Threshold Configuration
- A `settings` table to store the global threshold (default 2kg).


---

## Route B: Frontend Structure & Flow (Mobile-First)

The frontend will be a lightweight mobile application (Mini-program style).

### User Journey & UI Layout

#### 1. Sender (发出方)
- **Dashboard**: "Send Package" button, Daily summary (total weight, count).
- **Operation**:
    1. Click "Scan".
    2. Scan barcode -> Auto-fill `package_code`.
    3. Focus on `weight` field -> Enter numeric weight.
    4. Auto-save & Ready for next scan (Loop mode).

#### 2. Transit (中转方)
- **Dashboard**: "Record Transit" button, "Merger Batch" button.
- **Operation (Record)**:
    1. Scan barcode -> Pull package data.
    2. Input transit weight.
- **Operation (Merge)**:
    1. Select multiple scanned packages.
    2. Click "Create Batch" -> Generate `batch_id`.
    3. Input total batch weight.

#### 3. Receiver (接收方)
- **Dashboard**: "Receive Package/Batch" button.
- **Operation**:
    1. Scan barcode (Package or Batch ID).
    2. Display comparison: `Sender Weight` | `Transit Weight`.
    3. Input `Receiver Weight`.
    4. **Warning**: If diff > Threshold, highlight row in RED with ⚠️ icon.

#### 4. Admin (管理员)
- **Dashboard**: Total overview, Anomaly list.
- **Settings**: Change "Warning Threshold" (Default 2kg).

### Operational Constraints
- **Step Count**: Max 3 clicks/scans per weighing.
- **Visuals**: Large fonts for weight input, high-contrast buttons for warehouse environments.

---

---

## Route C: Development Schedule (V1)

Estimated total duration: **10 - 14 Days** (Single Developer).

### Phase 1: Infrastructure & Auth (2 Days)
- **Supabase Setup**: Apply `schema.sql`, configure Auth providers.
- **Role Setup**: Script to initialize test users with `profiles` roles.
- **RLS Verification**: Run SQL test scripts to confirm security logic.

### Phase 2: Core Page Implementation (5 - 7 Days)
- **Shared Components**: Scan-to-input utility, common layout.
- **Sender View**: Package entry list, daily stats.
- **Transit View**: Transit weight update, multi-select merge logic.
- **Receiver View**: Verification screen with real-time calculated diffs and warnings.
- **Admin View**: Threshold setting page, audit log viewer.

### Phase 3: Verification & Polish (3 - 5 Days)
- **E2E Testing**: Full lifecycle (Sender -> Transit -> Receiver).
- **Edge Cases**: Handling partial scans, invalid weights, duplicate scans.
- **UI/UX Polish**: Loading states, error messages, offline feedback (basic).
- **Internal Beta**: User smoke testing.

### Key Milestones
1. **M1 (Day 3)**: Data flows through the system (no UI).
2. **M2 (Day 8)**: All 3 roles can perform basic operations.
3. **M3 (Day 12)**: System is ready for warehouse testing.

## Verification Plan

### Automated Tests
- Script to simulate different users (Sender, Transit, Receiver) attempting to update unauthorized columns.
- SQL tests for RLS policy enforcement.

### Manual Verification
- Verify that a `transit` user cannot modify `sender_weight`.
- Verify that weight difference warnings can be calculated via a SQL view.
