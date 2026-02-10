import React, { useState, useEffect, useRef } from 'react';
import { Typography, Button, Space, Card, Divider, Tag, Collapse, Input, message } from 'antd';
import {
    BarcodeOutlined,
    DashboardOutlined,
    ArrowRightOutlined,
    CheckCircleFilled,
    ExpandAltOutlined,
    PrinterOutlined,
    CloseOutlined,
    EditOutlined
} from '@ant-design/icons';
import { Role, Batch, Parcel } from '../../types';
import { useTranslation } from 'react-i18next';
import WeightEditor from '../WeightEditor';
import Scanner from '../Scanner';

const { Panel } = Collapse;

interface PDAWorkflowViewProps {
    role: Role;
    activeBatch: Batch;
    onScan: (barcode: string) => void;
    currentUserId: string;
    canEdit: boolean;
    activeBarcode: string | null;
    onReset: () => void;
}

type Step = 'scan' | 'operate' | 'success';

export default function PDAWorkflowView({
    role,
    activeBatch,
    onScan,
    currentUserId,
    canEdit,
    activeBarcode,
    onReset
}: PDAWorkflowViewProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>('scan');
    const scanInputRef = useRef<any>(null);

    // Auto-focus logic: PDA should always have focus on a hidden scanner input if in scan step
    useEffect(() => {
        if (step === 'scan' && scanInputRef.current) {
            scanInputRef.current.focus();
        }
    }, [step]);

    // When a barcode is detected, move to operator step
    useEffect(() => {
        if (activeBarcode) {
            setStep('operate');
        } else {
            setStep('scan');
        }
    }, [activeBarcode]);

    const handleSaveComplete = () => {
        message.success(t('parcel.save_success'));
        setStep('success');
        // Auto-reset to scan after 2 seconds or manual click
        setTimeout(() => {
            onReset();
            setStep('scan');
        }, 2000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
            {/* Sticky Context Bar */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'var(--shadow-pro)'
            }}>
                <div>
                    <Typography.Text type="secondary" style={{ fontSize: '10px', fontWeight: 800 }}>{t('batch.number')}</Typography.Text>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>{activeBatch.batch_number}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Typography.Text type="secondary" style={{ fontSize: '10px', fontWeight: 800 }}>{t('common.current_role')}</Typography.Text>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>{t(`roles.${role}`)}</div>
                </div>
            </div>

            {/* Workflow Steps */}
            <div style={{ flex: 1 }}>
                {step === 'scan' && (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'var(--bg-app)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            border: '2px solid var(--primary)'
                        }}>
                            <BarcodeOutlined style={{ fontSize: '40px', color: 'var(--primary)' }} />
                        </div>
                        <Typography.Title level={3} style={{ marginBottom: '8px' }}>
                            {t('parcel.waiting_scan') || '请扫描包裹单号'}
                        </Typography.Title>
                        <Typography.Text type="secondary" style={{ fontWeight: 600 }}>
                            {t('pda.scan_hint') || '使用物理扫描键或扫描窗口对准条码'}
                        </Typography.Text>

                        {/* Hidden input for physical scanner focus */}
                        <Input
                            ref={scanInputRef}
                            style={{ position: 'absolute', opacity: 0, height: 0 }}
                            onBlur={() => { if (step === 'scan') setTimeout(() => scanInputRef.current?.focus(), 100); }}
                        />

                        <div style={{ marginTop: '40px' }}>
                            <Scanner onScan={onScan} disabled={!canEdit} activeBarcode={activeBarcode} isPDA={true} />
                        </div>
                    </div>
                )}

                {step === 'operate' && activeBarcode && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Active Item Title */}
                        <div style={{ padding: '0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space size="small">
                                <div style={{ background: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 800 }}>OPEN</div>
                                <Typography.Text style={{ fontSize: '20px', fontWeight: 800 }}>{activeBarcode}</Typography.Text>
                            </Space>
                            <Button icon={<CloseOutlined />} type="text" onClick={onReset} danger />
                        </div>

                        {/* Central Weight Editor (Specialized PDA Rendering handles in CSS variables) */}
                        <div className="glass-card" style={{ padding: '24px 16px' }}>
                            <WeightEditor
                                role={role}
                                barcode={activeBarcode}
                                activeBatchId={activeBatch.id}
                                onSave={handleSaveComplete}
                                readOnly={!canEdit}
                                currentUserId={currentUserId}
                                isPDA={true}
                            />
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px', border: '2px solid #10b981' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: '#ecfdf5',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <CheckCircleFilled style={{ fontSize: '48px', color: '#10b981' }} />
                        </div>
                        <Typography.Title level={2} style={{ color: '#10b981', marginBottom: '8px' }}>
                            {t('common.done') || '提交成功'}
                        </Typography.Title>
                        <Typography.Text type="secondary" style={{ fontSize: '16px', fontWeight: 600 }}>
                            {t('pda.auto_reset_hint') || '正在准备下一单...'}
                        </Typography.Text>

                        <div style={{ marginTop: '40px' }}>
                            <Button size="large" type="primary" block style={{ height: '56px', borderRadius: '12px' }} onClick={() => { onReset(); setStep('scan'); }}>
                                {t('common.next_item') || '立即扫描下一单'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Floating Area (Thumb Zone) */}
            {step === 'operate' && (
                <div style={{ marginTop: 'auto', paddingBottom: '16px' }}>
                    {/* No extra global buttons needed as WeightEditor has the primary action button */}
                    <Typography.Text type="secondary" style={{ textAlign: 'center', display: 'block', fontSize: '11px', fontWeight: 600 }}>
                        {t('pda.footer_hint') || '请在上方输入重量并确认'}
                    </Typography.Text>
                </div>
            )}
        </div>
    );
}
