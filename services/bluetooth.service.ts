/**
 * Bluetooth Service
 * Handles Web Bluetooth API connections for BLE scales and BLE label printers.
 *
 * Common BLE Scale services:
 * - Weight Measurement: 0x181D (Body Composition) or custom
 * - Generic Access: 0x1800
 * - Battery: 0x180F
 *
 * Common BLE Printer services (ESC/POS over BLE):
 * - SPP-like UUID for serial data
 */

// ─── Types ───────────────────────────────────────────────────────
export type DeviceType = 'scale' | 'printer';

export interface BtDeviceInfo {
    id: string;
    name: string;
    type: DeviceType;
    connected: boolean;
    rssi?: number;
    mac?: string;
    batteryLevel?: number;
}

export interface ScaleReading {
    weight: number;      // in kg
    unit: 'kg' | 'lb';
    stable: boolean;     // whether reading is settled
    timestamp: number;
}

// ─── Well-known BLE UUIDs ────────────────────────────────────────
// Many cheap BLE scales use a custom service. We accept all devices and
// try common patterns. Users can also pair by name prefix.
const SCALE_NAME_PREFIXES = ['S-Pro', 'HS-', 'XK', 'CAS', 'ACS', 'SF-', 'JCS', 'BSM', 'WH-', 'DY-'];
const PRINTER_NAME_PREFIXES = ['Zebra', 'XP-', 'xprinter', 'TSC', 'HPRT', 'GODEX', 'JP-', 'HM-', 'QR-', 'PT-', 'GP-', 'NB-', 'PeriPage', 'MUNBYN', 'Bluetooth Printer'];

// Common BLE service UUIDs for serial-over-BLE
const SERIAL_SERVICE_UUIDS = [
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip / common BLE serial
    '0000ff00-0000-1000-8000-00805f9b34fb', // Common Chinese BLE serial
    '0000ffe0-0000-1000-8000-00805f9b34fb', // Common Chinese BLE scale/serial
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // RN4870/RN4871
];

const SERIAL_CHAR_UUIDS = [
    '49535343-8841-43f4-a8d4-ecbe34729bb3', // Microchip TX
    '49535343-1e4d-4bd9-ba61-23c647249616', // Microchip RX
    '0000ff02-0000-1000-8000-00805f9b34fb', // Common write
    '0000ff01-0000-1000-8000-00805f9b34fb', // Common notify/read
    '0000ffe1-0000-1000-8000-00805f9b34fb', // Common scale notify
    'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f', // RN4870 TX
];

// ─── Bluetooth Service ───────────────────────────────────────────
class BluetoothService {
    private scaleDevice: BluetoothDevice | null = null;
    private printerDevice: BluetoothDevice | null = null;
    private scaleCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
    private printerWriteCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
    private onWeightChange: ((reading: ScaleReading) => void) | null = null;
    private onDisconnect: ((type: DeviceType) => void) | null = null;

    /** Check if Web Bluetooth is available */
    isSupported(): boolean {
        return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
    }

    /** Scan and connect to a BLE scale */
    async connectScale(): Promise<BtDeviceInfo> {
        if (!this.isSupported()) throw new Error('您的浏览器不支持蓝牙功能');

        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: SCALE_NAME_PREFIXES.map(prefix => ({ namePrefix: prefix })),
                optionalServices: SERIAL_SERVICE_UUIDS,
            });

            return await this.connectToScale(device);
        } catch (err: any) {
            if (err.name === 'NotFoundError') {
                // User cancelled the picker — try acceptAllDevices
                throw new Error('未选择设备');
            }
            throw err;
        }
    }

    /** Scan and connect with accept-all (fallback) */
    async connectScaleAll(): Promise<BtDeviceInfo> {
        if (!this.isSupported()) throw new Error('您的浏览器不支持蓝牙功能');

        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: SERIAL_SERVICE_UUIDS,
        });

        return await this.connectToScale(device);
    }

    private async connectToScale(device: BluetoothDevice): Promise<BtDeviceInfo> {
        if (!device.gatt) throw new Error('设备不支持 GATT');

        // Disconnect previous
        if (this.scaleDevice?.gatt?.connected) {
            this.scaleDevice.gatt.disconnect();
        }

        const server = await device.gatt.connect();
        this.scaleDevice = device;

        // Listen for disconnection
        device.addEventListener('gattserverdisconnected', () => {
            this.scaleCharacteristic = null;
            this.onDisconnect?.('scale');
        });

        // Try to find a notification characteristic for weight data
        await this.subscribeToScaleNotifications(server);

        return {
            id: device.id,
            name: device.name || '未知秤',
            type: 'scale',
            connected: true,
        };
    }

    private async subscribeToScaleNotifications(server: BluetoothRemoteGATTServer) {
        for (const svcUuid of SERIAL_SERVICE_UUIDS) {
            try {
                const service = await server.getPrimaryService(svcUuid);
                const chars = await service.getCharacteristics();

                for (const char of chars) {
                    if (char.properties.notify || char.properties.indicate) {
                        this.scaleCharacteristic = char;
                        await char.startNotifications();
                        char.addEventListener('characteristicvaluechanged', (event: any) => {
                            const value = event.target.value as DataView;
                            const reading = this.parseScaleData(value);
                            if (reading && this.onWeightChange) {
                                this.onWeightChange(reading);
                            }
                        });
                        console.log('[BT Scale] Subscribed to notifications on:', svcUuid, char.uuid);
                        return;
                    }
                }
            } catch {
                // Service not found, try next
            }
        }
        console.warn('[BT Scale] No notification characteristic found — weight data may not stream');
    }

    /** Parse weight data from common BLE scale protocols */
    private parseScaleData(data: DataView): ScaleReading | null {
        try {
            // Many cheap scales send ASCII strings like "ST,+12.50,kg"
            const decoder = new TextDecoder();
            const str = decoder.decode(data.buffer);

            // Pattern 1: "ST,+12.50,kg" or "US,+12.50,kg"
            const match = str.match(/(ST|US|GS),\s*([+-]?\d+\.?\d*)\s*(kg|lb|g)/i);
            if (match) {
                let weight = parseFloat(match[2]);
                const unit = match[3].toLowerCase();
                if (unit === 'g') weight = weight / 1000;
                return {
                    weight: Math.abs(weight),
                    unit: unit === 'lb' ? 'lb' : 'kg',
                    stable: match[1] === 'ST',
                    timestamp: Date.now(),
                };
            }

            // Pattern 2: Raw hex weight (2 bytes, little-endian, divide by 100)
            if (data.byteLength >= 2 && data.byteLength <= 8) {
                const raw = data.getUint16(data.byteLength - 2, true);
                if (raw > 0 && raw < 100000) {
                    return {
                        weight: raw / 100,
                        unit: 'kg',
                        stable: true,
                        timestamp: Date.now(),
                    };
                }
            }
        } catch {
            // Ignore parse errors
        }
        return null;
    }

    /** Scan and connect to a BLE printer */
    async connectPrinter(): Promise<BtDeviceInfo> {
        if (!this.isSupported()) throw new Error('您的浏览器不支持蓝牙功能');

        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: PRINTER_NAME_PREFIXES.map(prefix => ({ namePrefix: prefix })),
                optionalServices: SERIAL_SERVICE_UUIDS,
            });

            return await this.connectToPrinter(device);
        } catch (err: any) {
            if (err.name === 'NotFoundError') throw new Error('未选择设备');
            throw err;
        }
    }

    /** Scan printer with accept-all */
    async connectPrinterAll(): Promise<BtDeviceInfo> {
        if (!this.isSupported()) throw new Error('您的浏览器不支持蓝牙功能');

        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: SERIAL_SERVICE_UUIDS,
        });

        return await this.connectToPrinter(device);
    }

    private async connectToPrinter(device: BluetoothDevice): Promise<BtDeviceInfo> {
        if (!device.gatt) throw new Error('设备不支持 GATT');

        if (this.printerDevice?.gatt?.connected) {
            this.printerDevice.gatt.disconnect();
        }

        const server = await device.gatt.connect();
        this.printerDevice = device;

        device.addEventListener('gattserverdisconnected', () => {
            this.printerWriteCharacteristic = null;
            this.onDisconnect?.('printer');
        });

        // Find writable characteristic for sending print data
        await this.findPrinterWriteChar(server);

        return {
            id: device.id,
            name: device.name || '未知打印机',
            type: 'printer',
            connected: true,
        };
    }

    private async findPrinterWriteChar(server: BluetoothRemoteGATTServer) {
        for (const svcUuid of SERIAL_SERVICE_UUIDS) {
            try {
                const service = await server.getPrimaryService(svcUuid);
                const chars = await service.getCharacteristics();

                for (const char of chars) {
                    if (char.properties.write || char.properties.writeWithoutResponse) {
                        this.printerWriteCharacteristic = char;
                        console.log('[BT Printer] Write characteristic found:', svcUuid, char.uuid);
                        return;
                    }
                }
            } catch {
                // try next
            }
        }
        console.warn('[BT Printer] No write characteristic found');
    }

    /** Send raw bytes to printer (ESC/POS or ZPL) */
    async printRaw(data: Uint8Array): Promise<void> {
        if (!this.printerWriteCharacteristic) {
            throw new Error('打印机未连接或未找到写入通道');
        }

        // BLE has a max packet size (~20 bytes default, up to 512 with MTU negotiation)
        // We chunk the data
        const CHUNK_SIZE = 20;
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
            const chunk = data.slice(i, i + CHUNK_SIZE);
            if (this.printerWriteCharacteristic.properties.writeWithoutResponse) {
                await this.printerWriteCharacteristic.writeValueWithoutResponse(chunk);
            } else {
                await this.printerWriteCharacteristic.writeValueWithResponse(chunk);
            }
            // Small delay between chunks
            await new Promise(r => setTimeout(r, 20));
        }
    }

    /** Send text string to printer as ESC/POS */
    async printText(text: string): Promise<void> {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        // ESC/POS: Init printer + text + cut
        const init = new Uint8Array([0x1B, 0x40]); // ESC @
        const cut = new Uint8Array([0x1D, 0x56, 0x00]); // GS V 0 (full cut)
        const combined = new Uint8Array([...init, ...data, 0x0A, ...cut]);
        await this.printRaw(combined);
    }

    /** Disconnect scale */
    disconnectScale() {
        if (this.scaleDevice?.gatt?.connected) {
            this.scaleDevice.gatt.disconnect();
        }
        this.scaleDevice = null;
        this.scaleCharacteristic = null;
    }

    /** Disconnect printer */
    disconnectPrinter() {
        if (this.printerDevice?.gatt?.connected) {
            this.printerDevice.gatt.disconnect();
        }
        this.printerDevice = null;
        this.printerWriteCharacteristic = null;
    }

    /** Check if scale is connected */
    isScaleConnected(): boolean {
        return this.scaleDevice?.gatt?.connected ?? false;
    }

    /** Check if printer is connected */
    isPrinterConnected(): boolean {
        return this.printerDevice?.gatt?.connected ?? false;
    }

    /** Register weight change callback */
    setOnWeightChange(cb: (reading: ScaleReading) => void) {
        this.onWeightChange = cb;
    }

    /** Register disconnect callback */
    setOnDisconnect(cb: (type: DeviceType) => void) {
        this.onDisconnect = cb;
    }

    /** Get connected scale device info */
    getScaleDevice(): BtDeviceInfo | null {
        if (!this.scaleDevice) return null;
        return {
            id: this.scaleDevice.id,
            name: this.scaleDevice.name || '未知秤',
            type: 'scale',
            connected: this.scaleDevice.gatt?.connected ?? false,
        };
    }

    /** Get connected printer device info */
    getPrinterDevice(): BtDeviceInfo | null {
        if (!this.printerDevice) return null;
        return {
            id: this.printerDevice.id,
            name: this.printerDevice.name || '未知打印机',
            type: 'printer',
            connected: this.printerDevice.gatt?.connected ?? false,
        };
    }
}

// Singleton
export const bluetoothService = new BluetoothService();
