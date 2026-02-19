# Design Doc: Weight Difference Audit System & Warning (重量差异审计预警系统)

## 1. Objective
Enable senders to detect weight anomalies throughout the shipment lifecycle (Sender -> Transit -> Receiver). By defining absolute and percentage thresholds, the system automatically flags shipments with significant discrepancies and provides detailed audit reports.

## 2. Database Schema Changes
Add redundant fields to the `shipments` table for high-performance comparison and reporting.

### `shipments` table:
- `transit_weight` (numeric, nullable)
- `transit_length` (numeric, nullable)
- `transit_width` (numeric, nullable)
- `transit_height` (numeric, nullable)
- `receiver_weight` (numeric, nullable)
- `receiver_length` (numeric, nullable)
- `receiver_width` (numeric, nullable)
- `receiver_height` (numeric, nullable)

## 3. Configuration & Settings
Store audit rules in the global `settings` table or enterprise metadata.

### New Settings Keys:
- `weight_audit_abs` (number): Absolute weight difference threshold (e.g., 0.5 kg).
- `weight_audit_percent` (number): Percentage difference threshold (e.g., 5%).
- `weight_audit_export_mode` ('anomaly' | 'all'): User preference for Excel export scope.

## 4. Logical Flow
### Data Capture:
- **Transit Stage**: When an inspection is saved in `TransitCheck.tsx`, update the `shipments` table's `transit_*` fields in addition to creating the inspection record.
- **Receiver Stage**: When an inspection is saved in `ReceiverCheck.tsx`, update the `shipments` table's `receiver_*` fields.

### Audit Algorithm (OR Logic):
```typescript
const isAnomaly = (senderWeight, otherWeight, thresholdAbs, thresholdPercent) => {
    const diff = Math.abs(senderWeight - otherWeight);
    const percent = (diff / senderWeight) * 100;
    return diff > thresholdAbs || percent > thresholdPercent;
};
```

## 5. UI Implementation
- **Settings Page**: Add "Audit & Alerts" section with inputs for thresholds and a toggle for export mode.
- **Shipment Lists**: 
    - Apply `text-red-500` and a `⚠️` icon to the tracking number if an anomaly is detected compared to transit or receiver weights.
- **Batch Detail**: Add "Export Audit Report" button.

## 6. Export Functionality
- Generate Excel file using `xlsx` library.
- Columns: Tracking No, Category, Sender W/L/W/H, Transit W/L/W/H, Receiver W/L/W/H, Max Deviation, Reason.
- Scope controlled by `weight_audit_export_mode`.
