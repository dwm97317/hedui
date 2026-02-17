# Verification: Tiandy NT20 Scanner

> [!NOTE]
> This guide is specific to the **Tiandy NT20 (Alps)** PDA.

## 1. PDA Configuration

On the device, open **Scanner Settings** and ensure:

1.  **Output Mode**: `Broadcast` (Context)
2.  **Action**: `android.intent.action.RECEIVE_SCANDATA_BROADCAST`
3.  **Extra (Data)**: `android.intent.extra.SCAN_BROADCAST_DATA`

## 2. Test Verification

Since we cannot run the actual PDA hardware here, you can verify the bridge via the Browser Console:

1.  Open Chrome DevTools (F12) -> Console.
2.  Type:
    ```javascript
    window.scannerLabel.onScan("TEST-NT20-SCAN");
    ```
3.  **Expected Result**: The application should treat this exactly like a physical scan.
    - If "Sender" role: A new valid parcel should be retrieved or prompted.
    - If "Transit" role: The parcel should be added to the current batch.
