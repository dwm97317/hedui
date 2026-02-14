export interface WeightResult {
    value: number;
    unit: 'kg' | 'lb';
    raw?: string;
    source: 'BLE' | 'HID' | 'MANUAL';
}

export interface WeightProvider {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getWeight(): Promise<WeightResult | null>;
    isStable(): boolean;
    onWeightChange?: (weight: WeightResult) => void;
}

export class ManualWeightProvider implements WeightProvider {
    async connect() { console.log('Manual Provider Connected'); }
    async disconnect() { console.log('Manual Provider Disconnected'); }
    async getWeight() { return null; } // Manual provider doesn't pull, it pushes via UI
    isStable() { return true; } // Manual input is always considered "stable" by definition
}

export class BleWeightProvider implements WeightProvider {
    private device: BluetoothDevice | null = null;
    private server: BluetoothRemoteGATTServer | null = null;
    private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
    public onWeightChange?: (weight: WeightResult) => void;

    async connect() {
        if (!navigator.bluetooth) throw new Error('Web Bluetooth not supported');

        try {
            // Standard BLE Scale Service UUIDs (often 181d for Weight Scale)
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['weight_scale'] }],
                optionalServices: ['battery_service'] // Example optional
            });

            if (!this.device) throw new Error('No device selected');

            this.server = await this.device.gatt?.connect() || null;
            if (!this.server) throw new Error('Could not connect to GATT Server');

            const service = await this.server.getPrimaryService('weight_scale');
            this.characteristic = await service.getCharacteristic('weight_measurement');

            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged', this.handleNotifications);

            console.log('BLE Connected:', this.device.name);
        } catch (err) {
            console.error('BLE Connection Error:', err);
            throw err;
        }
    }

    handleNotifications = (event: any) => {
        const value = event.target.value;
        // Parsing logic depends on specific scale protocol. 
        // Standard Weight Scale Measurement (0x2A9D):
        // Flags (8bit), Weight (16bit/32bit depending on flags)...
        // For prototype, we assume a simple text or standard format mock:
        // Let's assume standard 0x2A9D format for now or just mock it.

        // Mocking a value for now since we can't test real BLE hardware here
        // In real impl, parse DataView `value`

        /* 
        const flags = value.getUint8(0);
        const unit = (flags & 0x01) ? 'lb' : 'kg';
        const weight = value.getUint16(1, true) * (unit === 'kg' ? 0.005 : 0.01); // Resolution ex.
        */

        console.log('BLE Data Received (Raw):', value);
    }

    async disconnect() {
        if (this.device?.gatt?.connected) {
            this.device.gatt.disconnect();
        }
    }

    async getWeight() {
        // BLE pushes data, so this might return last cached value
        return null;
    }

    isStable() {
        // In real world, check 'Measurement Status' flag or recent variance
        return true;
    }
}

export class HidWeightProvider implements WeightProvider {
    // HID Scanner/Scale usually acts like a keyboard
    // We listen to window keypress events or specific input focus

    async connect() { console.log('HID Provider Ready (Listening to Keyboard)'); }
    async disconnect() { console.log('HID Provider Stopped'); }
    async getWeight() { return null; }
    isStable() { return true; }
}
