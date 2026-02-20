import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface CameraScannerProps {
    /** Called when a barcode/QR code is successfully decoded */
    onResult: (code: string) => void;
    /** Whether the scanner modal is open */
    isOpen: boolean;
    /** Close the scanner modal */
    onClose: () => void;
    /** Optional title for the scanner modal */
    title?: string;
}

// Supported formats for both QR codes and barcodes — optimized subset for speed
const SUPPORTED_FORMATS = [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.DATA_MATRIX,
];

const SCANNER_REGION_ID = 'camera-scanner-region';

const CameraScanner: React.FC<CameraScannerProps> = ({
    onResult,
    isOpen,
    onClose,
    title = '扫描二维码/条形码',
}) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [torch, setTorch] = useState(false);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const hasResultRef = useRef(false);

    const stopScanner = useCallback(async () => {
        try {
            if (scannerRef.current) {
                const state = scannerRef.current.getState();
                // State 2 = SCANNING, 3 = PAUSED
                if (state === 2 || state === 3) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
                scannerRef.current = null;
            }
        } catch (e) {
            console.warn('[CameraScanner] Stop error:', e);
        }
    }, []);

    const startScanner = useCallback(async () => {
        setError(null);
        hasResultRef.current = false;

        // Small delay to let the DOM render
        await new Promise(r => setTimeout(r, 100));

        const el = document.getElementById(SCANNER_REGION_ID);
        if (!el) {
            setError('扫描区域未就绪');
            return;
        }

        try {
            const scanner = new Html5Qrcode(SCANNER_REGION_ID, {
                formatsToSupport: SUPPORTED_FORMATS,
                verbose: false,
            });
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode },
                {
                    fps: 20,          // Faster FPS
                    qrbox: (viewWidth, viewHeight) => {
                        const size = Math.min(viewWidth, viewHeight) * 0.75;
                        return { width: size, height: size };
                    },
                    aspectRatio: 1.0,
                    disableFlip: false,
                },
                (decodedText) => {
                    // Only fire once per scan session
                    if (!hasResultRef.current) {
                        hasResultRef.current = true;
                        // Vibrate feedback
                        if (navigator.vibrate) navigator.vibrate(100);
                        onResult(decodedText);
                        // Auto-close after successful scan
                        setTimeout(() => onClose(), 300);
                    }
                },
                () => {
                    // QR not found in this frame — ignore
                }
            );
        } catch (e: any) {
            console.error('[CameraScanner] Start error:', e);
            if (e?.toString?.().includes('NotAllowedError') || e?.toString?.().includes('Permission')) {
                setError('请允许使用摄像头权限');
            } else if (e?.toString?.().includes('NotFoundError')) {
                setError('未检测到摄像头设备');
            } else {
                setError(`启动相机失败: ${e?.message || e}`);
            }
        }
    }, [facingMode, onResult, onClose]);

    useEffect(() => {
        if (isOpen) {
            startScanner();
        } else {
            stopScanner();
        }
        return () => {
            stopScanner();
        };
    }, [isOpen, startScanner, stopScanner]);

    // Switch camera (front/back)
    const switchCamera = useCallback(async () => {
        await stopScanner();
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    }, [stopScanner]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
            {/* Scanner Container */}
            <div className="relative w-full h-full sm:w-[92vw] sm:h-auto sm:max-w-[500px] bg-[#111827] sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-primary text-xl">qr_code_scanner</span>
                        <h3 className="text-sm font-black text-white tracking-tight">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                    >
                        <span className="material-icons text-lg">close</span>
                    </button>
                </div>

                {/* Camera View */}
                <div className="relative bg-black flex-1 flex items-center justify-center overflow-hidden">
                    <div id={SCANNER_REGION_ID} className="w-full h-full object-cover" />

                    {/* Scanning guide overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[70vw] h-[70vw] max-w-[350px] max-h-[350px] relative">
                            {/* Corner decorators */}
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl"></div>

                            {/* Scanning line animation */}
                            <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line"></div>
                        </div>
                    </div>

                    {/* Error overlay */}
                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-center px-8">
                            <span className="material-icons text-red-400 text-4xl mb-3">error_outline</span>
                            <p className="text-sm font-bold text-red-400 mb-2">{error}</p>
                            <button
                                onClick={startScanner}
                                className="mt-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 transition-colors"
                            >
                                重试
                            </button>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6 px-5 py-4 border-t border-white/5">
                    <button
                        onClick={switchCamera}
                        className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                        <div className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                            <span className="material-icons text-xl">flip_camera_ios</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest">切换</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                        <div className="p-3.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
                            <span className="material-icons text-2xl">stop</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest">关闭</span>
                    </button>
                </div>

                {/* Hint */}
                <div className="text-center px-5 pb-4">
                    <p className="text-[10px] font-medium text-slate-600">
                        将二维码/条形码对准框内 · 自动识别
                    </p>
                </div>
            </div>
        </div>
    );
};

// ─── Convenience Button Component ───
interface CameraScanButtonProps {
    /** Called with the decoded text */
    onScan: (code: string) => void;
    /** Custom class for the button */
    className?: string;
    /** Button size variant */
    size?: 'sm' | 'md' | 'lg';
}

export const CameraScanButton: React.FC<CameraScanButtonProps> = ({
    onScan,
    className = '',
    size = 'md',
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const sizeClasses = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-2.5',
    };

    const iconSizes = {
        sm: 'text-[16px]',
        md: 'text-[20px]',
        lg: 'text-[24px]',
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`rounded-xl bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 border border-primary/20 transition-all ${sizeClasses[size]} ${className}`}
                title="手机摄像头扫码"
            >
                <span className={`material-icons ${iconSizes[size]}`}>qr_code_scanner</span>
            </button>

            <CameraScanner
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onResult={onScan}
            />
        </>
    );
};

export default CameraScanner;
