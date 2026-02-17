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
- **Data**: Weight from batch, Unit Price from user/contract settings (default or lookup).

### 3.2 Bill B Trigger (Admin -> Transit)
- **Event**: Transit status changes to 'in_transit' (or arriving at transit).
- **Action**: Generate `ADMIN_TO_TRANSIT` bill.

### 3.3 Bill C Trigger (Sender -> Receiver)
- **Event**: Receiver status changes to 'completed'.
- **Action**: Generate `SENDER_TO_RECEIVER` bill.

## 4. Admin Profit Views

### 4.1 `admin_profit_view`
- Joins Bill A and Bill B by `batch_id`.
- Calculates `profit_vnd = bill_a.amount - bill_b.amount`.

### 4.2 `admin_profit_with_exchange_view`
- Joins `admin_profit_view` with `exchange_rates`.
- Calculates `profit_cny = profit_vnd * rate`.

## 5. UI Implementation (Stitch/React)

- **Finance Home**: Update dashboard to show relevant bills based on role.
- **Bill List**: Filter by 'Type' and 'Direction' (Incoming/Outgoing).
- **Exchange Rate Settings**: Admin-only page to update rates.

## Execution Steps

1.  **Database Migration**: Create tables and enums.
2.  **RLS Policies**: Apply security rules.
3.  **Functions & Triggers**: Write PL/pgSQL for auto-billing.
4.  **Views**: Create profit analysis views.
5.  **Frontend Integration**: Update Finance module.
