# Manual Test Plan & Debug Guide

> [!IMPORTANT]
> **Why Manual Testing?**
> Automated browser testing is currently unavailable due to environment restrictions (missing system libraries for Playwright and quota limits).
> However, we have implemented a **Debug Role Switcher** that makes manual verification extremely fast and reliable.

## 1. Prerequisites
- Ensure the dev server is running (`npm run dev`).
- Open the application in your browser (e.g., `http://localhost:5173`).

## 2. Test Role Switcher (The "Magic" Tool)
A floating widget is located in the **bottom-right corner** of the screen.
- **Function**: Instantly switches your identity and **automatically grants permission** for the active batch.
- **Roles**:
  - `测发` (Test Sender): Can create parcels, basic weighing.
  - `测中` (Test Transit): Can scan existing parcels, enter transit weight.
  - `测收` (Test Receiver): Can scan existing parcels, enter receiver weight (detects anomalies).

## 3. End-to-End Test Scenario

### Step 1: Sender Role (Creation)
1. Click **[测发]** in the debug widget.
2. If no batch is active, create one (e.g., `TEST-BATCH-001`).
3. Click **"New Parcel"** (Plus Icon) to generate a tracking number (e.g., `ST2024...`).
4. Enter a weight (e.g., `10.00`) and click **"Save"**.
   - *Result*: Parcel appears in the table with status `Pending`.

### Step 2: Transit Role (Middle Mile)
1. Click **[测中]** in the debug widget.
2. Scan (or type) the barcode from Step 1 into the search bar.
3. Enter a weight (e.g., `10.05`).
4. Click **"Save"**.
   - *Result*: Parcel updates. `Transit Weight` column shows `10.05`.

### Step 3: Receiver Role (Final Mile & Anomaly)
1. Click **[测收]** in the debug widget.
2. Scan the same barcode.
3. Enter a significantly different weight (e.g., `12.00`).
4. Click **"Save"**.
   - *Result*: 
     - Parcel updates. `Receiver Weight` column shows `12.00`.
     - **Verification**: The row text should turn **RED** or show an alert icon indicating a weight anomaly (>0.1kg difference).

### Step 4: Advanced Search
1. Click **[测发]** again.
2. Create a new parcel with Sender Name: `张三`.
3. In the search bar, type `zs` and press Enter.
   - *Result*: The parcel for `张三` should appear in the results (Pinyin Search).

## 4. Troubleshooting
- **Permission Denied**: If you see this, click the Role Button (e.g., `[测发]`) *again*. This re-triggers the permission grant RPC.
- **Batch Mismatch**: Ensure you are working in the same batch. The switcher grants permission *only* for the batch active at the time of clicking.
