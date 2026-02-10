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
        <div className="neon-card" style={{ padding: '2px', background: 'transparent', border: 'none' }}>
            <Typography.Text strong style={{ color: 'var(--primary)', marginBottom: 5, display: 'block', fontSize: '12px' }}>
                {t('scanner_label')}
            </Typography.Text>
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
                className="neon-border scanner-focus"
                style={{
                    height: '48px',
                    fontSize: '18px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)'
                }}
            />
            {(activeBarcode || lastScanned) && (
                <Alert
                    message={t('scanner_success', { barcode: activeBarcode || lastScanned })}
                    type="success"
                    showIcon
                    style={{ marginTop: '10px', background: 'rgba(82, 196, 26, 0.1)', border: 'none', color: '#52c41a' }}
                />
            )}
            <Typography.Text type="secondary" style={{ fontSize: '11px', marginTop: '8px', display: 'block', color: 'var(--text-sub)' }}>
                {t('scanner_tip')}
            </Typography.Text>
        </div>
    );
}
