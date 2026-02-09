import { useState, useRef, useEffect } from 'react';
import { Input, Typography, Alert } from 'antd';
import { BarcodeOutlined } from '@ant-design/icons';

interface ScannerProps {
    onScan: (barcode: string) => void;
    disabled?: boolean;
}

export default function Scanner({ onScan, disabled }: ScannerProps) {
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

    const handlePressEnter = () => {
        if (value.trim()) {
            onScan(value.trim());
            setLastScanned(value.trim());
            setValue('');
        }
    };

    return (
        <div>
            <Input
                ref={inputRef}
                placeholder="请扫码或手动输入..."
                prefix={<BarcodeOutlined style={{ color: 'var(--primary)' }} />}
                size="large"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onPressEnter={handlePressEnter}
                disabled={disabled}
                className="neon-border scanner-focus"
                style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
            {lastScanned && (
                <Alert
                    message={`完成定位: ${lastScanned}`}
                    type="success"
                    showIcon
                    style={{ marginTop: '10px', background: 'rgba(82, 196, 26, 0.1)', border: 'none', color: '#52c41a' }}
                />
            )}
            <Typography.Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                提示: 扫码器通常模拟回车。光标将自动锁定。
            </Typography.Text>
        </div>
    );
}
