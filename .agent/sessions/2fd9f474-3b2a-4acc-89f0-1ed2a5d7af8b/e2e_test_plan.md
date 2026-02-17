# E2E Testing Plan: PDA Logistics

This plan outlines the End-to-End (E2E) testing strategy to verify the backend integration and core business workflows of the Hedui Logistics application.

## Testing Strategy
We will use the **Browser Subagent** to perform guided manual verification of the main user roles and their interactions. This ensures that UI, State Management (React Query), and Backend (Supabase) are working in harmony.

## Test Scenarios

### 1. Sender Workflow (Creation & Dispatch)
- **Login**: Authenticate as `sender@demo.com`.
- **Batch Creation**: Create a new batch with a unique number (e.g., `BT-2026-TEST`).
- **Parcel Scanning**: Add at least 2 parcels with weights.
- **Seal & Ship**: Transition batch status from `draft` to `shipped`.

### 2. Transit Workflow (Audit)
- **Inspection**: Enter actual weight at the transit hub.
- **Tolerance Check**: Verify UI responds to weight discrepancies.
- **Dispatch**: Move batch to `in_transit` status.

### 3. Receiver Workflow (Arrival & Verification)
- **Arrival Check**: Scan parcels upon arrival.
- **Resolution**: Complete the batch.
- **Success Criteria**: Batch status must transition to `completed`.

### 4. Finance Workflow (Billing)
- **Verification**: Check if a Bill was automatically created for the completed batch.
- **Payment**: Simulate payment verification.
- **Success Criteria**: Bill status transitions to `paid`.

## Verification Metrics
- [ ] Real-time UI updates (Toast notifications, progress bars).
- [ ] Database state consistency (Check `batches`, `shipments`, `bills` tables).
- [ ] Role-based access control (Redirects on unauthorized pages).
