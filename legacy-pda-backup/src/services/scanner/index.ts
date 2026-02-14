export interface ScanResult {
    raw: string;
    symbology?: string;
    source: 'PDA' | 'CAMERA' | 'HID';
    device?: string;
}

export type ScanCallback = (result: ScanResult) => void;

interface IntentMapping {
    action: string;
    key: string;
}

const SCAN_MAPPINGS: IntentMapping[] = [
    { action: 'nlscan.action.SCANNER_RESULT', key: 'SCAN_BARCODE1' },
    { action: 'android.intent.action.SCANRESULT', key: 'value' },
    { action: 'com.sunmi.scanner.ACTION_DATA_CODE_RECEIVED', key: 'data' },
    { action: 'com.zebra.action.SCAN_RESULT', key: 'com.symbol.datawedge.data_string' }
];

export class ScannerAdapter {
    private subscribers: ScanCallback[] = [];
    private buffer: string = '';
    private lastKeyTime: number = 0;
    private TIMEOUT = 50; // ms between keystrokes to be considered a scan

    constructor() {
        if (typeof window !== 'undefined') {
            this.initHidListener();
            this.initBridgeListener();
        }
    }

    private initHidListener() {
        window.addEventListener('keydown', (e) => {
            // Ignore if focus is on an input field (let the UI handle manual typing/focus-scanning)
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                return;
            }

            // Heuristic: Scanners are FAST (inter-key gap < 50ms) and end with Enter.

            const now = Date.now();
            if (now - this.lastKeyTime > this.TIMEOUT) {
                // If gap is too large, it's likely manual typing or start of new scan
                // But if it's manual typing in a focused field, we might not want to intercept?
                // The requirement says "HID... 扫码 ≈ 输入完成事件".
                // Let's rely on the buffer reset for slow typing.
                this.buffer = '';
            }
            this.lastKeyTime = now;

            if (e.key === 'Enter') {
                if (this.buffer.length > 2) {
                    // It's a scan!
                    // Prevent default to avoid double-submission if it was caught by an input
                    // e.preventDefault(); // Optional: depend on if we want to block Enter

                    this.emit({ raw: this.buffer, source: 'HID' });
                }
                this.buffer = '';
            } else if (e.key.length === 1) {
                this.buffer += e.key;
            }
        });
    }

    private initBridgeListener() {
        // 1. Configurable Bridge through 'dispatchScanEvent'
        (window as any).dispatchScanEvent = (event: any) => {
            console.log('Bridge Event:', event);
            let raw = '';
            let symbology = '';

            // Map based on action/intent
            if (event && event.action) {
                const mapping = SCAN_MAPPINGS.find(m => m.action === event.action);
                if (mapping && event[mapping.key]) {
                    raw = event[mapping.key];
                }
                // Fallback: check common keys
                else if (event.data || event.value || event.barcode) {
                    raw = event.data || event.value || event.barcode;
                }
            }
            // Fallback for simple objects
            else if (event && (event.data || event.value || event.barcode)) {
                raw = event.data || event.value || event.barcode;
            }
            // Fallback for direct string (legacy)
            else if (typeof event === 'string') {
                raw = event;
            }

            if (raw) {
                this.emit({
                    raw,
                    source: 'PDA',
                    symbology: symbology || event.symbology || event.scanType
                });
            }
        };

        // 2. Legacy 'onScan' hook
        (window as any).onScan = (val: string) => {
            this.emit({ raw: val, source: 'PDA' });
        };

        // 3. Tiandy NT20 / Universal Bridge (scannerLabel)
        // This is the recommended interface for new native integrations.
        (window as any).scannerLabel = {
            onScan: (code: string) => {
                console.log('ScannerLabel Bridge:', code);
                if (code) {
                    this.emit({ raw: code, source: 'PDA' });
                }
            }
        };
    }

    public onScan(callback: ScanCallback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    private emit(result: ScanResult) {
        console.log('Scan Adapter Emit:', result);
        this.subscribers.forEach(cb => cb(result));
    }
}

export const scannerAdapter = new ScannerAdapter();
