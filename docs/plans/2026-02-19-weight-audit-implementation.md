# Weight Difference Audit System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a weight difference audit system that flags discrepancies between sender, transit, and receiver stages and provides configurable alerts and reports.

**Architecture:** Use Supabase for centralized threshold configuration and redundant shipment fields for performance. Apply audit logic in the frontend to visually flag anomalies and generate Excel reports.

**Tech Stack:** React, Supabase, Zustand, Lucide Icons, xlsx library.

---

### Task 1: Database Schema Expansion
**Files:**
- Modify: `supabase migrations` (via `apply_migration` tool)

**Step 1: Write migration to add shipment fields**
```sql
ALTER TABLE public.shipments 
ADD COLUMN transit_weight numeric,
ADD COLUMN transit_length numeric,
ADD COLUMN transit_width numeric,
ADD COLUMN transit_height numeric,
ADD COLUMN receiver_weight numeric,
ADD COLUMN receiver_length numeric,
ADD COLUMN receiver_width numeric,
ADD COLUMN receiver_height numeric;

-- Add settings if they don't exist
INSERT INTO public.settings (key, value, description) VALUES 
('weight_audit_abs', '0.5', '重量差异绝对值阈值 (kg)'),
('weight_audit_percent', '5', '重量差异百分比阈值 (%)'),
('weight_audit_export_mode', 'all', 'Excel导出模式: anomaly (仅异常) 或 all (全量)');
```

**Step 2: Apply migration**
Run: `mcp_supabase-mcp-server_apply_migration` with the SQL above.
Expected: SUCCESS

**Step 3: Commit**
```bash
git commit -m "db: add redundant shipment audit fields and global settings"
```

### Task 2: Service Layer Update
**Files:**
- Modify: `/www/wwwroot/hedui/services/shipment.service.ts`
- Modify: `/www/wwwroot/hedui/services/inspection.service.ts`

**Step 1: Update Shipment interface**
Add the new 8 fields to the `Shipment` interface in `shipment.service.ts`.

**Step 2: Update Transit/Receiver logic**
Modify `InspectionService.create` or add a new method to ensure that when an inspection is saved, the corresponding `shipment` record is updated with the measured values.

**Step 3: Commit**
```bash
git commit -m "svc: update shipment and inspection services to support audit fields"
```

### Task 3: Global Settings Store
**Files:**
- Modify: `/www/wwwroot/hedui/store/scanner.store.ts`

**Step 1: Add audit settings to ScannerState**
Add `weightAuditAbs`, `weightAuditPercent`, `exportMode` to the store.

**Step 2: Implement hydration from DB**
Add an action `fetchAuditSettings` that calls a service to get these from the `settings` table.

**Step 3: Commit**
```bash
git commit -m "store: add weight audit settings to scanner store"
```

### Task 4: UI - Audit Configuration
**Files:**
- Modify: `/www/wwwroot/hedui/pages/settings/Settings.tsx`

**Step 1: Add Audit & Alerts section**
Implement the UI for setting `weight_audit_abs`, `weight_audit_percent`, and `weight_audit_export_mode`.

**Step 2: Commit**
```bash
git commit -m "ui: add weight audit configuration to settings page"
```

### Task 5: UI - Anomaly Highlighting
**Files:**
- Modify: `/www/wwwroot/hedui/pages/sender/CargoCreate/RecentRecords.tsx`
- Modify: `/www/wwwroot/hedui/pages/sender/CargoCreate/index.tsx`

**Step 1: Implement audit calculation helper**
Create a utility function to check for anomalies based on thresholds.

**Step 2: Apply visual styles**
Update `RecentRecords` to turn tracking numbers red and show `⚠️` if `isAnomaly` is true.

**Step 3: Commit**
```bash
git commit -m "ui: highlight weight anomalies in sender records"
```

### Task 6: Excel Export Functionality
**Files:**
- Modify: `/www/wwwroot/hedui/pages/batch-detail/index.tsx` (or appropriate batch view)

**Step 1: Install xlsx if needed or use existing**
**Step 2: Implement export logic**
Create an "Export Audit Report" button that filters data based on the `exportMode` setting.

**Step 3: Commit**
```bash
git commit -m "feat: implement batch audit report export to Excel"
```
