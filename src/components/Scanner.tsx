import { useState, useRef, useEffect } from 'react';
import { Input, Typography, Alert, message } from 'antd';
import { BarcodeOutlined } from '@ant-design/icons';

import { Role } from '../types';
import { useTranslation } from 'react-i18next';
import { scannerAdapter } from '../services/scanner';

interface ScannerProps {
    onScan: (barcode: string) => void;
    activeBarcode?: string | null;
    disabled?: boolean;
}

export default function Scanner({ onScan, activeBarcode, disabled }: ScannerProps) {
    const { t } = useTranslation();
    const [value, setValue] = useState('');
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const inputRef = useRef<any>(null);

    // Focus Keeper: We still want the input focused for manual "Zero-Click" typing if possible,
    // though the Adapter handles background HID scans now.
    useEffect(() => {
        if (disabled) return;
        const timer = setInterval(() => {
            if (!inputRef.current) return;
            const active = document.activeElement;
            const isInteracting =
                active && (
                    active.tagName === 'INPUT' ||
                    active.tagName === 'TEXTAREA' ||
                    active.tagName === 'BUTTON' ||
                    active.getAttribute('contenteditable') === 'true' ||
                    active.closest('.ant-input-number') ||
                    active.closest('.ant-select') ||
                    active.closest('.ant-modal')
                );

            if (!isInteracting && active !== inputRef.current) {
                inputRef.current.focus();
            }
        }, 1500);
        return () => clearInterval(timer);
    }, []);

    // Unified Scanner Adapter Subscription
    useEffect(() => {
        if (disabled) return;

        const unsubscribe = scannerAdapter.onScan((result) => {
            console.log('Scanner Component Received:', result);
            if (result.raw) {
                // Play a sound or feedback?
                // Audio feedback could be here.

                onScan(result.raw.trim());
                setLastScanned(result.raw.trim());
                setValue(''); // Clear manual input just in case
                message.success(t('scanner_success', { barcode: result.raw }));
            }
        });

        return () => {
            unsubscribe();
        };
    }, [onScan, disabled, t]);

    const handlePressEnter = () => {
        if (value.trim()) {
            onScan(value.trim());
            setLastScanned(value.trim());
            setValue('');
        }
    };

    return (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '20px' }}>
                <Typography.Text strong style={{
                    color: 'var(--primary)',
                    marginBottom: 8,
                    display: 'block',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    {t('scanner_label')}
                </Typography.Text>

                <div style={{ position: 'relative' }}>
                    <Input
                        ref={inputRef}
                        placeholder={t('scanner_placeholder_full')}
                        prefix={<BarcodeOutlined style={{ color: 'var(--primary)' }} />}
                        size="large"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onPressEnter={handlePressEnter}
                        disabled={disabled}
                        inputMode="none"
                        style={{
                            height: '54px',
                            fontSize: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px'
                        }}
                    />

                    {/* Scanning Pulse Animation */}
                    {!disabled && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: '12px',
                            border: '1px solid var(--primary)',
                            opacity: 0.3,
                            pointerEvents: 'none',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }} />
                    )}
                </div>

                {(activeBarcode || lastScanned) && (
                    <div style={{
                        marginTop: '12px',
                        padding: '10px 16px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#10B981',
                        fontSize: '13px',
                        fontWeight: 600
                    }}>
                        <BarcodeOutlined />
                        <span>{activeBarcode || lastScanned}</span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.1; }
                    50% { opacity: 0.4; box-shadow: 0 0 15px var(--primary); }
                }
            `}</style>
        </div>
    );
}
