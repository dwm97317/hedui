# BarTender Label & Integration Specification

## 1. Label Configuration
| Parameter | Value | Note |
| :--- | :--- | :--- |
| **Dimensions** | **100 mm (W) x 130 mm (H)** | Portrait Orientation |
| **Margins** | 3mm (All sides) | Safe printing zone |
| **Resolution** | 203 / 300 DPI | Disable "Scale to Fit" |
| **Type** | Thermal Transfer / Direct Thermal | Industrial Grade |

## 2. Objects & Layout Strategy

### Zone A: Header (Identification)
| Object Name | Type | Font / Size | Data Source | Content Example |
| :--- | :--- | :--- | :--- | :--- |
| `PACKAGE_NO` | Text | Sans Bold / 18-22pt | `package_no_prefix` | **ST11-** |
| `PACKAGE_INDEX` | Text | Sans Black / 36-48pt | `package_index` | **3** |

### Zone B: Weight (Critical)
| Object Name | Type | Font / Size | Data Source | Content Example |
| :--- | :--- | :--- | :--- | :--- |
| `WEIGHT` | Text | Sans Bold / 24-28pt | `weight_value` | **39.5 KG** |
> **Rule**: Never use handwriting fonts. Must be machine-readable clarity.

### Zone C: Barcode (Tracking)
| Object Name | Type | Specs | Data Source | Content Example |
| :--- | :--- | :--- | :--- | :--- |
| `PACKAGE_BARCODE` | Barcode | Code 128 / W:60-70mm | `package_no` | **ST11-003** |
> **Rule**: Include Human Readable Text below barcode.

### Zone D: Routing
| Object Name | Type | Font / Size | Data Source | Content Example |
| :--- | :--- | :--- | :--- | :--- |
| `ROUTE` | Text | Sans / 14-16pt | `route_name` | **Chinh-QN** |

### Zone E: Footer
| Object Name | Type | Font / Size | Data Source | Content Example |
| :--- | :--- | :--- | :--- | :--- |
| `SHIP_DATE` | Text | Sans / 10-12pt | `batch_date` | **2026-01-04** |

### Zone F: Dimensions & Contact (Optional)
| Object Name | Type | Font / Size | Data Source | Content Example |
| :--- | :--- | :--- | :--- | :--- |
| `LENGTH` | Text | Sans / 10pt | `length_cm` | **50** |
| `WIDTH` | Text | Sans / 10pt | `width_cm` | **40** |
| `HEIGHT` | Text | Sans / 10pt | `height_cm` | **30** |
| `SENDER_NAME` | Text | Sans / 10-12pt | `sender_name` | **张三** |

---

## 3. Data Integration Model

### Architecture
**System (Postgres)** --> **Integration Table (`print_jobs`)** <-- **BarTender Automation**

We recommend using **Database Polling** or **Web Service Integration**.
The System will **NOT** send raw ZPL/Command codes. It will insert a record into a `print_jobs` table or send a JSON payload with the exact field values.

### Field Mapping (JSON / DB Schema)
```json
{
  "job_id": "uuid",
  "printer": "PRINTER_NAME_01",
  "copies": 1,
  "data": {
    "PACKAGE_NO": "ST20240210-001",
    "PACKAGE_INDEX": "1",
    "WEIGHT": "45.2 KG",
    "ROUTE": "Hanoi-Express",
    "SHIP_DATE": "2024-02-10",
    "PACKAGE_BARCODE": "ST20240210-001",
    "LENGTH": "50",
    "WIDTH": "40",
    "HEIGHT": "30",
    "SENDER_NAME": "张三"
  }
}
```

## 4. Operational Rules
1.  **Immutability**: Once printed, the parcel weight is **LOCKED** in the system.
2.  **Reprinting**: Requires "Admin/Manager" permission. Reprints must be logged.
3.  **No Calculation**: BarTender does *zero* logic. It only renders what is sent.

## 5. Future Expansion: Transfer Label
| Field | Purpose |
| :--- | :--- |
| `TRANSFER_ID` | Master grouping ID |
| `TOTAL_WEIGHT` | Sum of all child parcels |
| `PARCEL_COUNT` | e.g., "1/50" |
