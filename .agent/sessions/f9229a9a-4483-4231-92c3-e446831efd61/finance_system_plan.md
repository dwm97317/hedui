# Implementation Plan: Three-Way Billing System

This plan outlines the steps to implement a multi-role billing system where each batch generates three distinct bills (A, B, C) with strict visibility controls and admin profit tracking.

## 1. Database Schema Design

### 1.1 `bills` Table
The core table to store billing information.

- `id`: UUID, Primary Key
- `batch_id`: UUID, Foreign Key to `batches`
- `bill_type`: Enum ('SENDER_TO_ADMIN', 'ADMIN_TO_TRANSIT', 'SENDER_TO_RECEIVER')
- `payer_company_id`: UUID, Foreign Key to `companies` (Sender/Admin)
- `payee_company_id`: UUID, Foreign Key to `companies` (Admin/Transit/Receiver)
- `currency`: Enum ('VND', 'CNY')
- `total_weight`: Decimal
- `unit_price`: Decimal (Private, used for calculation)
- `total_amount`: Decimal
- `status`: Enum ('pending', 'paid', 'cancelled')
- `created_at`: Timestamp
- `updated_at`: Timestamp

### 1.2 `exchange_rates` Table
To manage currency exchange rates for profit calculation.

- `id`: UUID, Primary Key
- `base_currency`: String ('VND')
- `target_currency`: String ('CNY')
- `rate`: Decimal
- `is_active`: Boolean
- `created_at`: Timestamp

### 1.3 `batch_bill_configs` Table (New)
Stores configuration for the 3 bills per batch.

- `id`: UUID, Primary Key
- `batch_id`: UUID, Foreign Key to `batches`
- `bill_type`: Enum ('A', 'B', 'C') -- Corresponding to the 3 flows
- `template_id`: String (e.g., 'modern_minimal', 'classic_pro')
- `is_enabled`: Boolean (default true)
- `created_at`: Timestamp

### 1.4 `batch_price_rules` Table (New)
Stores unit price settings per category for a specific batch/bill configuration.

- `id`: UUID, Primary Key
- `batch_id`: UUID, Foreign Key to `batches`
- `bill_type`: Enum ('A', 'B', 'C')
- `category`: String (e.g., 'Electronics', 'Cosmetics', 'General')
- `unit_price`: Decimal
- `currency`: Enum ('VND', 'CNY')
- `created_at`: Timestamp

## 2. Row Level Security (RLS)

### 2.1 Bill Visibility
Strict rules to ensure users consistently only see their own bills.

- Users can see bills where `payer_company_id` OR `payee_company_id` matches their company ID.
- Admins typically have full access, but for this specific flow, they are participants in bills A and B.

### 2.2 Field-Level Security (Optional but Recommended)
- Consider hiding `unit_price` from non-admin users via RLS or View, or handle strictly in frontend (User requested RLS/View approach). We will create a `bills_public` view if necessary, or just rely on RLS policies if Supabase column-level security is not fully utilized. *Correction*: User suggested a view for masking. We can create a secure view `bills_view` that excludes `unit_price` for non-admins.

## 3. Automation Triggers

### 3.1 Bill A Trigger (Sender -> Admin)
- **Event**: Batch status changes to 'sealed' (or equivalent sender-complete status).
- **Action**: Generate `SENDER_TO_ADMIN` bill.
- **Data**: Weight from batch, Unit Price from `batch_price_rules` (Bill A) or default.

### 3.2 Bill B Trigger (Admin -> Transit)
- **Event**: Transit status changes to 'in_transit' (or arriving at transit).
- **Action**: Generate `ADMIN_TO_TRANSIT` bill.
- **Data**: Weight from batch, Unit Price from `batch_price_rules` (Bill B).

### 3.3 Bill C Trigger (Sender -> Receiver)
- **Event**: Receiver status changes to 'completed'.
- **Action**: Generate `SENDER_TO_RECEIVER` bill.
- **Data**: Weight from batch, Unit Price from `batch_price_rules` (Bill C).

## 4. Admin Profit Views

### 4.1 `admin_profit_view`
- Joins Bill A and Bill B by `batch_id`.
- Calculates `profit_vnd = bill_a.amount - bill_b.amount`.

### 4.2 `admin_profit_with_exchange_view`
- Joins `admin_profit_view` with `exchange_rates`.
- Calculates `profit_cny = profit_vnd * rate`.

## 5. UI Implementation (Stitch/React)

### 5.1 Batch Billing Dashboard
A new page `pages/finance/BatchBillingSettings.tsx`.
- Lists the 3 bills (A, B, C) for the current batch.
- Shows status of each (Configured/Pending/Generated).

### 5.2 Template Gallery (`BillTemplateGallery.tsx`)
*Reference: Stitch Screen 995994911*
- **Grid Layout**: Display available templates as cards with preview images.
- **Interactive**: Click to select, active state with "Check" badge.
- **Preview**: Modal to show full-screen preview of the bill with dummy data.
- **Persistence**: Save selected `template_id` to `batch_bill_configs`.

### 5.3 Unit Price Settings (`BillPriceSettingsModal.tsx`)
*Reference: Stitch Screen 6c43c771*
- **Context**: "Bill C Settings" (or A/B).
- **Form**:
  - List categories (Electronics, Cosmetics, etc.).
  - Input field for Unit Price per category.
  - Currency indicator (locked to CNY for Bill C, maybe configurable for others).
- **Persistence**: Save rows to `batch_price_rules`.

## Execution Steps (Completed)

- [x] **Database Migration**: Create `bills`, `exchange_rates`, `batch_bill_configs`, `batch_price_rules`.
- [x] **RLS Policies**: Apply security rules for new tables.
- [x] **UI Components**: Implement `BillTemplateGallery` and `BillPriceSettingsModal` using Tailwind/Glassmorphism.
- [x] **Page Integration**: Wire up `BatchBillingSettings` to the main Finance route.
- [x] **Logic Integration**: Update bill generation triggers to read from new config tables.
