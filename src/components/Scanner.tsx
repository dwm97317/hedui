import { useState, useRef, useEffect } from 'react';
import { Input, Typography, Alert } from 'antd';
import { BarcodeOutlined } from '@ant-design/icons';

import { Role } from '../types';
import { useTranslation } from 'react-i18next';

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

    useEffect(() => {
        if (disabled) return;
        const timer = setInterval(() => {
            if (!inputRef.current) return;

            // IF the current active element is already an input or button, DON'T steal focus
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

    // PDA Broadcast Mode Bridge: Listen for window.onScan (industry standard for professional scanners)
    useEffect(() => {
        (window as any).onScan = (barcode: string) => {
            if (disabled) return;
            if (barcode) {
                onScan(barcode.trim());
                setLastScanned(barcode.trim());
                setValue(''); // Clear manual input if any
            }
        };
        return () => { delete (window as any).onScan; };
    }, [onScan, disabled]);

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
                className="neon-border scanner-focus"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
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
