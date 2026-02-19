/**
 * Label Print Service
 * ────────────────────
 * Renders a LabelTemplate with real data onto a <canvas>, converts
 * the bitmap to ESC/POS raster commands (TSPL / ESC/POS image), and
 * sends the result to a BLE thermal printer.
 */

import {
    LabelTemplate,
    LabelElement,
    LABEL_SIZES,
    DataFieldKey,
    LabelSize,
} from '../store/label-template.store';
import { bluetoothService } from './bluetooth.service';

// ─── Print data mapping ─────────────────────────────────────
export interface LabelPrintData {
    tracking_no?: string;
    receiver_name?: string;
    receiver_phone?: string;
    receiver_address?: string;
    sender_name?: string;
    sender_phone?: string;
    sender_address?: string;
    weight?: string;
    volume_weight?: string;
    pieces?: string;
    batch_no?: string;
    remark?: string;
    date?: string;
    custom?: string;
    [key: string]: string | undefined;
}

// ─── DPI / Scale constants ──────────────────────────────────
const PRINT_DPI = 203; // Standard 203 DPI thermal printer
const MM_TO_DOT = PRINT_DPI / 25.4; // 1mm ≈ 8 dots at 203DPI
const CANVAS_SCALE = 2; // Render at 2× for quality

// ─── Render template to Canvas ──────────────────────────────
export async function renderTemplateToCanvas(
    template: LabelTemplate,
    data: LabelPrintData,
): Promise<HTMLCanvasElement> {
    const { w, h } = LABEL_SIZES[template.size];
    const canvasW = Math.round(w * MM_TO_DOT);
    const canvasH = Math.round(h * MM_TO_DOT);

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;

    // White background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Render each element
    for (const el of template.elements) {
        await renderElement(ctx, el, data, canvasW, canvasH, w, h);
    }

    return canvas;
}

async function renderElement(
    ctx: CanvasRenderingContext2D,
    el: LabelElement,
    data: LabelPrintData,
    canvasW: number,
    canvasH: number,
    labelW: number,
    labelH: number,
): Promise<void> {
    const scaleX = canvasW / labelW;
    const scaleY = canvasH / labelH;
    const x = el.x * scaleX;
    const y = el.y * scaleY;
    const w = el.width * scaleX;
    const h = el.height * scaleY;

    // Resolve text from data binding
    const resolveText = (): string => {
        if (el.dataField && el.dataField !== 'custom') {
            return data[el.dataField] || '';
        }
        return el.text || '';
    };

    ctx.save();

    switch (el.type) {
        case 'text': {
            const text = resolveText();
            if (!text) break;
            const fontSize = (el.fontSize || 10) * scaleX * 0.9;
            ctx.font = `${el.fontWeight === 'bold' ? 'bold ' : ''}${fontSize}px sans-serif`;
            ctx.fillStyle = '#000';
            ctx.textBaseline = 'top';

            const align = el.textAlign || 'left';
            if (align === 'center') ctx.textAlign = 'center';
            else if (align === 'right') ctx.textAlign = 'right';
            else ctx.textAlign = 'left';

            const textX = align === 'center' ? x + w / 2 : align === 'right' ? x + w : x;

            // Simple word wrap
            const words = text.split('');
            let line = '';
            let lineY = y;
            const lineHeight = fontSize * 1.3;

            for (const char of words) {
                const testLine = line + char;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > w && line.length > 0) {
                    ctx.fillText(line, textX, lineY);
                    line = char;
                    lineY += lineHeight;
                    if (lineY > y + h) break;
                } else {
                    line = testLine;
                }
            }
            if (line && lineY <= y + h) {
                ctx.fillText(line, textX, lineY);
            }
            break;
        }

        case 'barcode': {
            const value = resolveText();
            if (!value) break;

            // Use JsBarcode if available
            try {
                const JsBarcode = (await import('jsbarcode')).default;
                const barcodeCanvas = document.createElement('canvas');
                JsBarcode(barcodeCanvas, value, {
                    format: el.barcodeFormat || 'CODE128',
                    width: 2,
                    height: h * 0.75,
                    displayValue: true,
                    fontSize: Math.max(10, fontSize_calc(el, scaleX)),
                    margin: 2,
                });
                ctx.drawImage(barcodeCanvas, x, y, w, h);
            } catch {
                // Fallback: draw placeholder barcode
                ctx.fillStyle = '#000';
                for (let i = 0; i < 60; i++) {
                    const bw = i % 3 === 0 ? 3 : i % 5 === 0 ? 2 : 1;
                    ctx.fillRect(x + (i * w / 60), y, bw, h * 0.7);
                }
                ctx.font = `${12 * scaleX * 0.5}px monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(value, x + w / 2, y + h * 0.85);
            }
            break;
        }

        case 'qrcode': {
            const value = resolveText();
            if (!value) break;

            try {
                const QRCode = (await import('qrcode')).default;
                const qrDataUrl = await QRCode.toDataURL(value, {
                    width: Math.round(w),
                    margin: 1,
                    errorCorrectionLevel: 'M',
                });
                const img = await loadImage(qrDataUrl);
                ctx.drawImage(img, x, y, w, h);
            } catch {
                // Fallback: black square
                ctx.fillStyle = '#000';
                ctx.fillRect(x, y, w, h);
            }
            break;
        }

        case 'line': {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = (el.lineWidth || 1) * scaleX;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y);
            ctx.stroke();
            break;
        }

        case 'rect': {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = (el.borderWidth || 1) * scaleX;
            if (el.filled) {
                ctx.fillStyle = '#ddd';
                ctx.fillRect(x, y, w, h);
            }
            ctx.strokeRect(x, y, w, h);
            break;
        }

        case 'image': {
            if (el.imageUrl) {
                try {
                    const img = await loadImage(el.imageUrl);
                    ctx.drawImage(img, x, y, w, h);
                } catch {
                    // ignore
                }
            }
            break;
        }
    }

    ctx.restore();
}

function fontSize_calc(el: LabelElement, scaleX: number): number {
    return (el.fontSize || 10) * scaleX * 0.6;
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// ─── Canvas → ESC/POS raster image ─────────────────────────
/**
 * Convert canvas to ESC/POS raster image commands.
 * Thermal printers expect 1-bit bitmaps sent line by line.
 *
 * Protocol: ESC/POS "GS v 0" raster bit image
 *   GS v 0 m xL xH yL yH [data]
 *   m = 0 (normal), xL/xH = bytes per line, yL/yH = total lines
 */
export function canvasToEscPosRaster(canvas: HTMLCanvasElement): Uint8Array {
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Calculate ESC/POS bitmap params
    const bytesPerLine = Math.ceil(width / 8);
    const bitmapData: number[] = [];

    // Convert to 1-bit monochrome (threshold)
    for (let row = 0; row < height; row++) {
        for (let byteIdx = 0; byteIdx < bytesPerLine; byteIdx++) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                const col = byteIdx * 8 + bit;
                if (col < width) {
                    const idx = (row * width + col) * 4;
                    const r = pixels[idx];
                    const g = pixels[idx + 1];
                    const b = pixels[idx + 2];
                    // Simple threshold: dark pixel = ink
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    if (gray < 128) {
                        byte |= (0x80 >> bit);
                    }
                }
            }
            bitmapData.push(byte);
        }
    }

    // Build ESC/POS command
    // ESC @ (init) + GS v 0 (raster image)
    const header = new Uint8Array([
        0x1B, 0x40,                          // ESC @ — Initialize
        0x1D, 0x76, 0x30, 0x00,              // GS v 0 m (m=0 normal mode)
        bytesPerLine & 0xFF,                 // xL
        (bytesPerLine >> 8) & 0xFF,          // xH
        height & 0xFF,                       // yL
        (height >> 8) & 0xFF,               // yH
    ]);

    const footer = new Uint8Array([
        0x0A, 0x0A, 0x0A,                    // Feed some lines
        0x1D, 0x56, 0x42, 0x00,              // GS V B 0 — Partial cut
    ]);

    const result = new Uint8Array(header.length + bitmapData.length + footer.length);
    result.set(header, 0);
    result.set(new Uint8Array(bitmapData), header.length);
    result.set(footer, header.length + bitmapData.length);

    return result;
}

// ─── TSPL Alternative (for TSPL-protocol printers) ──────────
/**
 * Generate TSPL commands for label printing.
 * Many Chinese BLE label printers use TSPL protocol.
 */
export function canvasToTspl(canvas: HTMLCanvasElement, labelW: number, labelH: number): Uint8Array {
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    const width = canvas.width;
    const height = canvas.height;

    const bytesPerLine = Math.ceil(width / 8);
    const bitmapData: number[] = [];

    for (let row = 0; row < height; row++) {
        for (let byteIdx = 0; byteIdx < bytesPerLine; byteIdx++) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                const col = byteIdx * 8 + bit;
                if (col < width) {
                    const idx = (row * width + col) * 4;
                    const gray = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
                    if (gray < 128) {
                        byte |= (0x80 >> bit);
                    }
                }
            }
            bitmapData.push(byte);
        }
    }

    const encoder = new TextEncoder();
    const commands = [
        `SIZE ${labelW} mm, ${labelH} mm\r\n`,
        `GAP 2 mm, 0 mm\r\n`,
        `CLS\r\n`,
        `BITMAP 0,0,${bytesPerLine},${height},0,`,
    ];

    const headerText = encoder.encode(commands.join(''));
    const footerText = encoder.encode(`\r\nPRINT 1,1\r\n`);

    const result = new Uint8Array(headerText.length + bitmapData.length + footerText.length);
    result.set(headerText, 0);
    result.set(new Uint8Array(bitmapData), headerText.length);
    result.set(footerText, headerText.length + bitmapData.length);

    return result;
}

// ─── High-level print function ──────────────────────────────
export type PrintProtocol = 'escpos' | 'tspl';

export interface PrintOptions {
    protocol?: PrintProtocol;
    copies?: number;
}

/**
 * Print a label template with data via Bluetooth.
 * This is the main entry point for label printing.
 */
export async function printLabel(
    template: LabelTemplate,
    data: LabelPrintData,
    options: PrintOptions = {},
): Promise<void> {
    const { protocol = 'tspl', copies = 1 } = options;

    if (!bluetoothService.isPrinterConnected()) {
        throw new Error('蓝牙打印机未连接，请先在设置中连接打印机');
    }

    // 1. Render template to canvas
    const canvas = await renderTemplateToCanvas(template, data);

    // 2. Convert to printer commands
    const { w, h } = LABEL_SIZES[template.size];
    let printData: Uint8Array;

    if (protocol === 'tspl') {
        printData = canvasToTspl(canvas, w, h);
    } else {
        printData = canvasToEscPosRaster(canvas);
    }

    // 3. Send to printer (with copies support)
    for (let i = 0; i < copies; i++) {
        await bluetoothService.printRaw(printData);
        if (i < copies - 1) {
            // Small delay between copies
            await new Promise(r => setTimeout(r, 500));
        }
    }
}

/**
 * Build LabelPrintData from shipment-like object.
 * Utility to normalize data from different page contexts.
 */
export function buildPrintData(params: {
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
}): LabelPrintData {
    const volWeight = ((params.length || 0) * (params.width || 0) * (params.height || 0)) / 6000;

    return {
        tracking_no: params.tracking_no || '',
        receiver_name: params.receiver_name || '',
        receiver_phone: params.receiver_phone || '',
        receiver_address: params.receiver_address || '',
        sender_name: params.sender_name || params.shipper_name || '',
        sender_phone: params.sender_phone || '',
        sender_address: params.sender_address || '',
        weight: params.weight ? `${params.weight.toFixed(2)} kg` : '',
        volume_weight: volWeight > 0 ? `${volWeight.toFixed(2)} kg` : '',
        pieces: params.pieces ? String(params.pieces) : '1',
        batch_no: params.batch_no || '',
        remark: params.remark || '',
        date: new Date().toLocaleDateString('zh-CN'),
    };
}
