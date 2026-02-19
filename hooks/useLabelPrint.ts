/**
 * useLabelPrint Hook
 * ──────────────────
 * Reusable hook for printing labels via Bluetooth thermal printer.
 * Used by all three roles: Sender, Transit, Receiver.
 *
 * Usage:
 *   const { printShipmentLabel, isPrinting, printerConnected } = useLabelPrint();
 *   await printShipmentLabel({ tracking_no: 'xxx', weight: 12.5 });
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useBluetoothStore } from '../store/bluetooth.store';
import { useLabelTemplateStore, LabelSize } from '../store/label-template.store';
import { printLabel, buildPrintData, LabelPrintData, PrintProtocol } from '../services/label-print.service';

interface PrintShipmentParams {
    tracking_no?: string;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    batch_no?: string;
    shipper_name?: string;
    receiver_name?: string;
    receiver_phone?: string;
    receiver_address?: string;
    sender_name?: string;
    sender_phone?: string;
    sender_address?: string;
    pieces?: number;
    remark?: string;
}

interface UseLabelPrintOptions {
    /** Override label size (default: use printer's configured size) */
    size?: LabelSize;
    /** Print protocol */
    protocol?: PrintProtocol;
    /** Number of copies */
    copies?: number;
    /** If true, silently skip if no printer connected (no error thrown) */
    silent?: boolean;
}

interface UseLabelPrintReturn {
    /** Print a label with shipment data */
    printShipmentLabel: (params: PrintShipmentParams) => Promise<boolean>;
    /** Is currently printing */
    isPrinting: boolean;
    /** Is printer connected via Bluetooth */
    printerConnected: boolean;
    /** Printer device name */
    printerName: string | null;
}

export function useLabelPrint(options: UseLabelPrintOptions = {}): UseLabelPrintReturn {
    const { protocol = 'tspl', copies = 1, silent = false } = options;
    const [isPrinting, setIsPrinting] = useState(false);

    const printerDevice = useBluetoothStore(s => s.printerDevice);
    const printSize = useBluetoothStore(s => s.printSize);
    const { getDefaultTemplate, templates, initDefaults } = useLabelTemplateStore();

    const printerConnected = !!printerDevice?.connected;
    const printerName = printerDevice?.name || null;

    const printShipmentLabel = useCallback(async (params: PrintShipmentParams): Promise<boolean> => {
        // Check printer
        if (!printerConnected) {
            if (silent) {
                console.log('[LabelPrint] No printer connected, skipping print');
                return false;
            }
            toast.error('蓝牙打印机未连接\n请先在设置→蓝牙中连接打印机', { duration: 3000, icon: '🔌' });
            return false;
        }

        setIsPrinting(true);

        try {
            // Determine size from option override or bluetooth config
            // Map bluetooth PrintSize → LabelSize
            const sizeMap: Record<string, LabelSize> = {
                '76x130': '76x130',
                '100x150': '100x130', // fallback
                '50x30': '76x130',    // fallback
                '100x100': '100x100',
                '100x130': '100x130',
            };
            const labelSize: LabelSize = options.size || sizeMap[printSize] || '76x130';

            // Ensure defaults exist
            initDefaults();

            // Find the default template for this size
            let template = getDefaultTemplate(labelSize);
            if (!template) {
                // Fallback: any template of this size
                template = templates.find(t => t.size === labelSize);
            }
            if (!template) {
                // Last resort: first available template
                template = templates[0];
            }
            if (!template) {
                toast.error('没有可用的标签模板，请先在模板管理中创建模板');
                return false;
            }

            // Build print data
            const data: LabelPrintData = buildPrintData(params);

            // Print!
            await printLabel(template, data, { protocol, copies });

            toast.success('标签打印成功', { icon: '🖨️', duration: 2000 });
            return true;
        } catch (err: any) {
            console.error('[LabelPrint] Print error:', err);
            toast.error(`打印失败: ${err.message || '未知错误'}`, { duration: 3000 });
            return false;
        } finally {
            setIsPrinting(false);
        }
    }, [printerConnected, printSize, options.size, protocol, copies, silent, getDefaultTemplate, templates, initDefaults]);

    return {
        printShipmentLabel,
        isPrinting,
        printerConnected,
        printerName,
    };
}
