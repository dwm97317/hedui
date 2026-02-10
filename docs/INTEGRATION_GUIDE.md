# Supabase Workflow Integration Guide

## 1. Safety & Concurrency Architecture (Backend Enforced)

We have implemented strict database-level protections. The frontend does **not** need to worry about race conditions for critical financial logic.

*   **Idempotency**: The billing trigger `auto_generate_bill` now checks if a bill exists before creating one. Even if the frontend sends 10 requests to "complete" a batch simultaneously, only **one** bill will be created.
*   **Status Freezing**: Once a batch is `completed`, it is **frozen**. Any attempt to modify it (e.g., change weight, add shipments, revert status) will be rejected by the database.
*   **State Machine**: Standard transitions are enforced. Illegal jumps (e.g., `draft` -> `completed`) raise an exception.

## 2. Frontend Integration Flow

### Step 1: Create Batch (Sender)
No special logic needed. Just insert.
```typescript
const { data, error } = await supabase
  .from('batches')
  .insert({
    batch_no: 'BATCH-20231027-01',
    sender_company_id: '...', // Must match user's company
    receiver_company_id: '...',
    status: 'draft'
  })
```

### Step 2: Move Workflow (Sender/Transit/Receiver)
Just update the status. The backend handles the rest.
```typescript
// Example: Sender seales the batch
const { error } = await supabase
  .from('batches')
  .update({ status: 'sealed' })
  .eq('id', batchId)

if (error) {
  alert(error.message) // "Invalid status transition..." if they try something illegal
}
```

### Step 3: Complete & Bill (Receiver)
When the receiver marks it as completed:
```typescript
const { error } = await supabase
  .from('batches')
  .update({ status: 'completed' })
  .eq('id', batchId)
```
*   **Backend Action**: 
    1.  Status becomes `completed`.
    2.  `auto_generate_bill` trigger fires.
    3.  Bill is created in `bills` table.
    4.  Batch is now frozen.

### Step 4: View Bills (Finance)
```typescript
const { data: bills } = await supabase
  .from('bills')
  .select('*, bill_items(*), batches(batch_no)')
  .eq('payer_company_id', myCompanyId) // or payee
```

## 3. Go-Live Checklist (Do NOT Skip)

- [ ] **Run Verification Script**: Execute `supabase/tests/20260213_integration_tests.sql` in SQL Editor and confirm "ALL TESTS PASSED".
- [ ] **RLS Verification**: 
    - [ ] Login as `sender@test.com`, try to view `transit` batches (Should fail/empty).
    - [ ] Login as `transit@test.com`, try to `insert` a batch (Should fail, only Senders can create).
- [ ] **Role Assignment**: Ensure all real users have entries in the `profiles` table with correct `company_id`.
- [ ] **Rate Configuration**: Currently `auto_generate_bill` uses a hardcoded rate (`10.0`). 
    - *Action*: Update the function `auto_generate_bill` to query a real `rates` table if needed before launch.
- [ ] **Frontend Error Handling**: Ensure your UI gracefully handles "Batch is final" or "Invalid transition" errors from Supabase.
