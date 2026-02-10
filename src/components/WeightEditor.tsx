import { useState, useEffect, useRef } from 'react';
import { Input, Button, Typography, message, Tag, Radio } from 'antd';
import { SaveOutlined, ForwardOutlined, PrinterOutlined, ToolOutlined, UsbOutlined, WifiOutlined } from '@ant-design/icons';
import { pinyin } from 'pinyin-pro';
import { supabase } from '../lib/supabase';
import { Role } from '../types';
import { useTranslation } from 'react-i18next';
import { WeightProvider, ManualWeightProvider, BleWeightProvider, HidWeightProvider } from '../services/weight';

interface WeightEditorProps {
    role: Role;
    barcode: string | null;
    activeBatchId?: string | null;
    onSave: () => void;
    readOnly?: boolean;
    currentUserId?: string;
}

export default function WeightEditor({ role, barcode, activeBatchId, onSave, readOnly, currentUserId }: WeightEditorProps) {
    const { t } = useTranslation();
    const [weight, setWeight] = useState('');
    const [fetching, setFetching] = useState(false);
    const [isPrinted, setIsPrinted] = useState(false);
    const [isLockedByOther, setIsLockedByOther] = useState(false);
    const [auditInfo, setAuditInfo] = useState<{ user?: string; time?: string } | null>(null);
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [senderName, setSenderName] = useState('');
    const inputRef = useRef<any>(null);

    // Hardware Integration State
    const [weightSource, setWeightSource] = useState<'MANUAL' | 'BLE' | 'HID'>('MANUAL');
    const [provider, setProvider] = useState<WeightProvider | null>(null);
    const [isStable, setIsStable] = useState(true); // Default to true for manual

    // Initialize Provider
    useEffect(() => {
        let newProvider: WeightProvider;
        if (weightSource === 'BLE') newProvider = new BleWeightProvider();
        else if (weightSource === 'HID') newProvider = new HidWeightProvider();
        else newProvider = new ManualWeightProvider();

        newProvider.connect().catch(err => message.error('Device Connect Error: ' + err.message));
        setProvider(newProvider);

        return () => { newProvider.disconnect(); };
    }, [weightSource]);

    // Stability Logic (Mock for Manual/HID, Real for BLE would be in callback)
    useEffect(() => {
        if (weightSource === 'MANUAL') {
            setIsStable(true);
            return;
        }
        setIsStable(true);
    }, [weight, weightSource]);

    useEffect(() => {
        if (readOnly) return;

        const fetchExisting = async () => {
            if (!barcode || !activeBatchId) {
                setWeight('');
                setLength('');
                setWidth('');
                setHeight('');
                setSenderName('');
                setIsLockedByOther(false);
                setIsPrinted(false);
                return;
            }
            setFetching(true);

            // Fetch existing parcel data to check ownership
            const { data, error } = await supabase
                .from('parcels')
                .select('*')
                .eq('barcode', barcode)
                .eq('batch_id', activeBatchId)
                .single();

            let shouldLock = false;

            if (data) {
                if (data.printed) {
                    setIsPrinted(true);
                    shouldLock = true;
                } else {
                    setIsPrinted(false);
                }

                let existingWeight = null;
                let existingUserId = null;
                let existingTime = null;

                if (role === 'sender') {
                    existingWeight = data.sender_weight;
                    existingUserId = data.sender_user_id;
                    existingTime = data.sender_updated_at;
                } else if (role === 'transit') {
                    existingWeight = data.transit_weight;
                    existingUserId = data.transit_user_id;
                    existingTime = data.transit_updated_at;
                } else if (role === 'receiver') {
                    existingWeight = data.receiver_weight;
                    existingUserId = data.receiver_user_id;
                    existingTime = data.receiver_updated_at;
                }

                if (existingUserId) {
                    setAuditInfo({ user: existingUserId, time: existingTime });
                } else {
                    setAuditInfo(null);
                }

                // Dimensional and Sender Info
                setLength(data.length_cm ? data.length_cm.toString() : '');
                setWidth(data.width_cm ? data.width_cm.toString() : '');
                setHeight(data.height_cm ? data.height_cm.toString() : '');
                setSenderName(data.sender_name || '');

                if (existingUserId && existingUserId !== currentUserId) {
                    message.warning(t('parcel.ownership_lock_with_time', { userId: existingUserId, time: existingTime ? new Date(existingTime).toLocaleString() : '-' }));
                    setWeight(existingWeight ? existingWeight.toString() : '');
                    setIsLockedByOther(true);
                    shouldLock = true;
                } else if (existingWeight !== null) {
                    setWeight(existingWeight.toString());
                    setIsLockedByOther(false);
                } else {
                    setWeight('');
                    setIsLockedByOther(false);
                }
            } else {
                setWeight('');
                setIsLockedByOther(false);
                setAuditInfo(null);
                setIsPrinted(false);
            }
            setFetching(false);

            if (inputRef.current && !shouldLock) {
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 100);
            }
        };
        fetchExisting();
    }, [barcode, activeBatchId, role, readOnly, currentUserId, t]);

    const handleSave = async () => {
        if (readOnly || isLockedByOther || isPrinted) return;
        if (!barcode) return message.warning(t('parcel.scanner_placeholder'));
        if (!weight) return message.warning(t('parcel.weight_label'));
        if (!isStable) return message.warning(t('parcel.unstable_weight') || 'Scale Unstable');

        setFetching(true);
        try {
            const weightVal = parseFloat(weight);
            if (weightVal <= 0) throw new Error(t('parcel.weight_must_positive') || 'Weight > 0');

            let updateData: any = {
                updated_at: new Date().toISOString(),
                weight_source: weightSource,
                length_cm: length ? parseFloat(length) : null,
                width_cm: width ? parseFloat(width) : null,
                height_cm: height ? parseFloat(height) : null,
                sender_name: senderName || null
            };

            if (role === 'sender') {
                updateData.sender_weight = weightVal;
                updateData.status = 'sent';
                updateData.sender_user_id = currentUserId;
            } else if (role === 'transit') {
                updateData.transit_weight = weightVal;
                updateData.status = 'in_transit';
                updateData.transit_user_id = currentUserId;
            } else if (role === 'receiver') {
                updateData.receiver_weight = weightVal;
                updateData.status = 'received';
                updateData.receiver_user_id = currentUserId;
            }

            const { error } = await supabase
                .from('parcels')
                .upsert({
                    barcode,
                    batch_id: activeBatchId,
                    ...updateData
                }, { onConflict: 'barcode' });

            if (error) throw error;

            message.success(t('parcel.save_success'));
            if (role !== 'sender') {
                setWeight('');
                onSave();
            }
        } catch (err: any) {
            message.error(t('parcel.save_failed') + ': ' + err.message);
        } finally {
            setFetching(false);
        }
    };

    const handlePrintAndLock = async () => {
        if (!barcode) return;
        setFetching(true);
        try {
            const weightVal = parseFloat(weight);
            if (isNaN(weightVal) || weightVal <= 0) throw new Error(t('parcel.weight_must_positive') || 'Weight > 0');

            const py = senderName ? pinyin(senderName, { toneType: 'none' }).replace(/\s/g, '') : null;
            const initial = senderName ? pinyin(senderName, { pattern: 'initial', toneType: 'none' }).replace(/\s/g, '') : null;

            const payload = {
                PACKAGE_NO: barcode,
                PACKAGE_INDEX: barcode.split('-')[1] || '0',
                WEIGHT: `${weightVal.toFixed(2)} KG`,
                ROUTE: 'Chinh-QN',
                SHIP_DATE: new Date().toISOString().slice(0, 10),
                PACKAGE_BARCODE: barcode,
                LENGTH: length || '-',
                WIDTH: width || '-',
                HEIGHT: height || '-',
                SENDER_NAME: senderName || '-'
            };

            const updateData: any = {
                updated_at: new Date().toISOString(),
                weight_source: weightSource,
                length_cm: length ? parseFloat(length) : null,
                width_cm: width ? parseFloat(width) : null,
                height_cm: height ? parseFloat(height) : null,
                sender_name: senderName || null,
                sender_name_pinyin: py,
                sender_name_initial: initial,
                ...(role === 'sender' ? { sender_weight: weightVal, sender_user_id: currentUserId, status: 'sent' } : {}),
                ...(role === 'transit' ? { transit_weight: weightVal, transit_user_id: currentUserId, status: 'in_transit' } : {}),
                ...(role === 'receiver' ? { receiver_weight: weightVal, receiver_user_id: currentUserId, status: 'received' } : {})
            };

            const { data: parcelData, error: upsertError } = await supabase
                .from('parcels')
                .upsert({
                    barcode,
                    batch_id: activeBatchId,
                    ...updateData
                }, { onConflict: 'barcode' })
                .select()
                .single();

            if (upsertError) throw upsertError;

            const { error: printError } = await supabase.from('print_jobs').insert({
                parcel_id: parcelData.id,
                payload: payload,
                status: 'pending'
            });

            if (printError) throw printError;

            const { error: lockError } = await supabase.from('parcels').update({
                printed: true,
                printed_at: new Date().toISOString(),
                printed_by: currentUserId
            }).eq('id', parcelData.id);

            if (lockError) throw lockError;

            message.success(t('parcel.print_success'));
            setIsPrinted(true);
            onSave();
        } catch (err: any) {
            message.error(t('common.error') + ': ' + err.message);
        } finally {
            setFetching(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div className={`glass-card ${isStable ? 'neon-border' : 'neon-border-purple'}`}
                style={{
                    padding: '20px',
                    textAlign: 'center',
                    background: isStable ? 'rgba(15, 23, 42, 0.4)' : 'rgba(88, 28, 135, 0.1)'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <Typography.Text type="secondary" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {t(`parcel.${role}_weight`)}
                    </Typography.Text>
                    {!readOnly && (
                        <Radio.Group
                            value={weightSource}
                            onChange={e => setWeightSource(e.target.value as any)}
                            size="small"
                        >
                            <Radio.Button value="MANUAL" style={{ background: 'transparent', color: 'var(--text-sub)' }}><ToolOutlined /></Radio.Button>
                            <Radio.Button value="BLE" style={{ background: 'transparent', color: 'var(--text-sub)' }}><WifiOutlined /></Radio.Button>
                            <Radio.Button value="HID" style={{ background: 'transparent', color: 'var(--text-sub)' }}><UsbOutlined /></Radio.Button>
                        </Radio.Group>
                    )}
                </div>

                <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <div style={{
                        fontSize: '64px',
                        color: isStable ? '#10B981' : '#F59E0B',
                        textShadow: isStable ? '0 0 20px rgba(16, 185, 129, 0.4)' : '0 0 20px rgba(245, 158, 11, 0.4)',
                        marginBottom: '0px',
                        transition: 'all 0.5s',
                        height: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }} className="font-digital">
                        {weight || '0.00'}
                        <span style={{ fontSize: '18px', marginLeft: '8px', opacity: 0.6 }}>KG</span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 700 }}>
                        {barcode || t('parcel.waiting_scan')}
                    </div>
                    {isStable && <Tag color="success" bordered={false} style={{ borderRadius: '4px', fontSize: '10px' }}>STABLE</Tag>}
                </div>
            </div>

            <Input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onPressEnter={handleSave}
                style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }}
                disabled={!barcode || readOnly || isLockedByOther || isPrinted || weightSource !== 'MANUAL'}
            />

            {(role === 'sender' || length || width || height || senderName) && (
                <div className="glass-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '12px' }}>
                            <Typography.Text type="secondary" style={{ fontSize: '10px' }}>{t('parcel.length')}</Typography.Text>
                            <Input
                                variant="borderless"
                                type="number"
                                inputMode="decimal"
                                placeholder="L"
                                value={length}
                                onChange={e => setLength(e.target.value)}
                                disabled={readOnly || isLockedByOther || isPrinted || role !== 'sender'}
                                style={{ color: 'white', fontWeight: 600, padding: 0 }}
                            />
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '12px' }}>
                            <Typography.Text type="secondary" style={{ fontSize: '10px' }}>{t('parcel.width')}</Typography.Text>
                            <Input
                                variant="borderless"
                                type="number"
                                inputMode="decimal"
                                placeholder="W"
                                value={width}
                                onChange={e => setWidth(e.target.value)}
                                disabled={readOnly || isLockedByOther || isPrinted || role !== 'sender'}
                                style={{ color: 'white', fontWeight: 600, padding: 0 }}
                            />
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '12px' }}>
                            <Typography.Text type="secondary" style={{ fontSize: '10px' }}>{t('parcel.height')}</Typography.Text>
                            <Input
                                variant="borderless"
                                type="number"
                                inputMode="decimal"
                                placeholder="H"
                                value={height}
                                onChange={e => setHeight(e.target.value)}
                                disabled={readOnly || isLockedByOther || isPrinted || role !== 'sender'}
                                style={{ color: 'white', fontWeight: 600, padding: 0 }}
                            />
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                        <Typography.Text type="secondary" style={{ fontSize: '10px' }}>{t('parcel.sender_name_label')}</Typography.Text>
                        <Input
                            variant="borderless"
                            placeholder={t('parcel.sender_name_placeholder')}
                            value={senderName}
                            onChange={e => setSenderName(e.target.value)}
                            disabled={readOnly || isLockedByOther || isPrinted || role !== 'sender'}
                            style={{ color: 'white', fontWeight: 600, padding: 0, marginTop: '4px' }}
                        />
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {!isPrinted ? (
                    <>
                        {role === 'sender' && weight && !isLockedByOther ? (
                            <Button
                                type="primary"
                                danger
                                icon={<PrinterOutlined />}
                                size="large"
                                style={{ height: '60px', borderRadius: '16px', fontSize: '18px', fontWeight: 700 }}
                                block
                                onClick={handlePrintAndLock}
                                loading={fetching}
                                disabled={!isStable}
                            >
                                {t('parcel.print_and_lock')}
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                size="large"
                                style={{ height: '60px', borderRadius: '16px', fontSize: '18px', fontWeight: 700 }}
                                block
                                onClick={handleSave}
                                loading={fetching}
                                disabled={!barcode || readOnly || isLockedByOther}
                            >
                                {t('parcel.save_continue')}
                            </Button>
                        )}
                    </>
                ) : (
                    <div style={{
                        padding: '16px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: '16px',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#F59E0B'
                    }}>
                        <PrinterOutlined style={{ fontSize: '20px' }} />
                        <span style={{ fontWeight: 600 }}>{t('parcel.already_printed')}</span>
                    </div>
                )}

                {!readOnly && (
                    <Button
                        type="text"
                        icon={<ForwardOutlined />}
                        style={{ color: 'var(--text-sub)' }}
                        block
                        onClick={() => { setWeight(''); setIsPrinted(false); onSave(); }}
                    >
                        {t('common.skip')}
                    </Button>
                )}
            </div>

            {auditInfo && (
                <div style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>
                    {t('parcel.audit_who')}: {auditInfo.user} @ {auditInfo.time ? new Date(auditInfo.time).toLocaleTimeString() : '-'}
                </div>
            )}
        </div>
    );
}
