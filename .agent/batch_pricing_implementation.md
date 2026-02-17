# Batch Unit Price Management Implementation

**Date:** 2026-02-18
**Status:** Completed

## Overview
Implemented a system to configure unit prices for each batch individually. This allows setting unique prices for the three bill types (A, B, C) per batch, rather than using a global default.

## Changes

### 1. Database Schema
- Altered `public.batches` table to include:
  - `unit_price_a` (DECIMAL): Sender -> Admin (VND)
  - `unit_price_b` (DECIMAL): Admin -> Transit (VND)
  - `unit_price_c` (DECIMAL): Sender -> Receiver (CNY)
- Updated `public.bills` table:
  - Removed `total_amount` (computed column issues).
  - Added `total_amount` as a regular column updated via triggers.
- **Triggers & Functions:**
  - `handle_batch_status_change`: Updated to use batch-specific unit prices when generating bills.
  - `recalculate_batch_bills`: New optimized RPC function to recalculate bill amounts for a specific batch when prices change.

### 2. Frontend Components
- **Finance Store (`finance.store.ts`):** 
  - Added `unitPriceA`, `unitPriceB`, `unitPriceC` to `FinanceBatch` interface.
  - Implemented `updateBatchUnitPrices` action which:
    1. Optimistically updates the UI.
    2. Updates `batches` table in Supabase.
    3. Calls `recalculate_batch_bills` RPC.
    4. Refetches batches to ensure consistency.

- **Admin Price Config Page (`/pages/finance/AdminPriceConfig.tsx`):**
  - New page accessible via `/finance/admin/pricing`.
  - Lists all batches with their current unit prices and status.
  - Shows estimated profit calculations (Batch A - Batch B).
  - Provides "Edit" button to open the configuration modal.

- **Batch Unit Price Modal (`/components/finance/BatchUnitPriceModal.tsx`):**
  - Modal dialog to edit the 3 unit prices.
  - Validates inputs (non-negative).
  - Shows real-time profit preview.

### 3. Usage
1. Navigate to **Finance > Config & Tools > Platform Price Strategy**.
2. Locate the target batch.
3. Click "Edit (调价)".
4. Enter new unit prices for bills A, B, and C.
5. Click "Save". The system will automatically recalculate all associated bills for that batch.

## Verification
- Checked database `batches` table for new columns.
- Verified default values are set for existing batches.
- Verified store logic and optimistic updates.
