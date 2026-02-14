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
    isPDA?: boolean;
}

export default function Scanner({ onScan, activeBarcode, disabled, isPDA }: ScannerProps) {
    const { t } = useTranslation();
    const [value, setValue] = useState('');
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const inputRef = useRef<any>(null);

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
                    active.closest('.ant-modal') ||
                    active.closest('.ant-collapse')
                );

            if (!isInteracting && active !== inputRef.current) {
                inputRef.current.focus();
            }
        }, 1500);
        return () => clearInterval(timer);
    }, [disabled]);

    useEffect(() => {
        if (disabled) return;
        const unsubscribe = scannerAdapter.onScan((result) => {
            if (result.raw) {
                onScan(result.raw.trim());
                setLastScanned(result.raw.trim());
                setValue('');
                message.success(t('parcel.scanner_success', { barcode: result.raw }));
            }
        });
        return () => { unsubscribe(); };
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
            <div style={{ padding: isPDA ? '24px 16px' : '20px' }}>
                {!isPDA && (
                    <Typography.Text strong style={{
                        color: 'var(--primary)',
                        marginBottom: 8,
                        display: 'block',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        {t('parcel.scanner_label')}
                    </Typography.Text>
                )}

                <div style={{ position: 'relative' }}>
                    <Input
                        ref={inputRef}
                        placeholder={t('parcel.scanner_placeholder_full')}
                        prefix={<BarcodeOutlined style={{ color: 'var(--primary)' }} />}
                        size="large"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onPressEnter={handlePressEnter}
                        disabled={disabled}
                        inputMode={isPDA ? 'none' : 'text'} // PDA prevents software keyboard
                        style={{
                            height: isPDA ? '64px' : '54px',
                            fontSize: '16px',
                            background: 'white',
                            color: 'var(--text-main)',
                            border: '2px solid var(--border-light)',
                            borderRadius: '12px',
                            fontWeight: 700
                        }}
                    />

                    {!disabled && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: '12px',
                            border: '2px solid var(--primary)',
                            opacity: 0.3,
                            pointerEvents: 'none',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }} />
                    )}
                </div>

                {(activeBarcode || lastScanned) && !isPDA && (
                    <div style={{
                        marginTop: '12px',
                        padding: '10px 16px',
                        background: 'var(--bg-app)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--primary)',
                        fontSize: '13px',
                        fontWeight: 800
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
