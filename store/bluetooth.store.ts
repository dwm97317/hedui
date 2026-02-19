import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { bluetoothService, BtDeviceInfo, ScaleReading, DeviceType } from '../services/bluetooth.service';

export type PrintSize = '76x130' | '100x150' | '50x30';

interface BluetoothState {
    // Scale
    scaleDevice: BtDeviceInfo | null;
    scaleConnecting: boolean;
    lastWeight: ScaleReading | null;

    // Printer
    printerDevice: BtDeviceInfo | null;
    printerConnecting: boolean;
    printSize: PrintSize;

    // Scanning UI
    isScanning: boolean;
    scanTarget: DeviceType | null;

    // Actions
    connectScale: () => Promise<void>;
    connectScaleAll: () => Promise<void>;
    disconnectScale: () => void;
    connectPrinter: () => Promise<void>;
    connectPrinterAll: () => Promise<void>;
    disconnectPrinter: () => void;
    setPrintSize: (size: PrintSize) => void;
    setScanning: (scanning: boolean, target?: DeviceType | null) => void;
    updateWeight: (reading: ScaleReading) => void;
    handleDisconnect: (type: DeviceType) => void;
}

export const useBluetoothStore = create<BluetoothState>()(
    persist(
        (set, get) => {
            // Register callbacks
            bluetoothService.setOnWeightChange((reading) => {
                set({ lastWeight: reading });
            });
            bluetoothService.setOnDisconnect((type) => {
                get().handleDisconnect(type);
            });

            return {
                scaleDevice: null,
                scaleConnecting: false,
                lastWeight: null,
                printerDevice: null,
                printerConnecting: false,
                printSize: '76x130',
                isScanning: false,
                scanTarget: null,

                connectScale: async () => {
                    set({ scaleConnecting: true, isScanning: true, scanTarget: 'scale' });
                    try {
                        const device = await bluetoothService.connectScale();
                        set({ scaleDevice: device, scaleConnecting: false, isScanning: false, scanTarget: null });
                    } catch (err: any) {
                        set({ scaleConnecting: false, isScanning: false, scanTarget: null });
                        throw err;
                    }
                },

                connectScaleAll: async () => {
                    set({ scaleConnecting: true, isScanning: true, scanTarget: 'scale' });
                    try {
                        const device = await bluetoothService.connectScaleAll();
                        set({ scaleDevice: device, scaleConnecting: false, isScanning: false, scanTarget: null });
                    } catch (err: any) {
                        set({ scaleConnecting: false, isScanning: false, scanTarget: null });
                        throw err;
                    }
                },

                disconnectScale: () => {
                    bluetoothService.disconnectScale();
                    set({ scaleDevice: null, lastWeight: null });
                },

                connectPrinter: async () => {
                    set({ printerConnecting: true, isScanning: true, scanTarget: 'printer' });
                    try {
                        const device = await bluetoothService.connectPrinter();
                        set({ printerDevice: device, printerConnecting: false, isScanning: false, scanTarget: null });
                    } catch (err: any) {
                        set({ printerConnecting: false, isScanning: false, scanTarget: null });
                        throw err;
                    }
                },

                connectPrinterAll: async () => {
                    set({ printerConnecting: true, isScanning: true, scanTarget: 'printer' });
                    try {
                        const device = await bluetoothService.connectPrinterAll();
                        set({ printerDevice: device, printerConnecting: false, isScanning: false, scanTarget: null });
                    } catch (err: any) {
                        set({ printerConnecting: false, isScanning: false, scanTarget: null });
                        throw err;
                    }
                },

                disconnectPrinter: () => {
                    bluetoothService.disconnectPrinter();
                    set({ printerDevice: null });
                },

                setPrintSize: (size) => set({ printSize: size }),

                setScanning: (scanning, target = null) => set({ isScanning: scanning, scanTarget: target }),

                updateWeight: (reading) => set({ lastWeight: reading }),

                handleDisconnect: (type) => {
                    if (type === 'scale') {
                        set({ scaleDevice: null, lastWeight: null });
                    } else {
                        set({ printerDevice: null });
                    }
                },
            };
        },
        {
            name: 'hedui-bluetooth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                printSize: state.printSize,
                // We only persist settings, not connection state
                // (BLE connections don't survive page reload)
            }),
        }
    )
);
