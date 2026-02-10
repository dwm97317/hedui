import { useState, useEffect, useRef } from 'react';
import { Input, Button, Typography, message, Tag, Radio, Space, Card, Divider, Tooltip } from 'antd';
import { SaveOutlined, ForwardOutlined, PrinterOutlined, ToolOutlined, UsbOutlined, WifiOutlined, LogoutOutlined } from '@ant-design/icons';
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

    const [weightSource, setWeightSource] = useState<'MANUAL' | 'BLE' | 'HID'>('MANUAL');
    const [provider, setProvider] = useState<WeightProvider | null>(null);
    const [isStable, setIsStable] = useState(true);

    useEffect(() => {
        let newProvider: WeightProvider;
        if (weightSource === 'BLE') newProvider = new BleWeightProvider();
        else if (weightSource === 'HID') newProvider = new HidWeightProvider();
        else newProvider = new ManualWeightProvider();

        newProvider.connect().catch(err => message.error('Device Connect Error: ' + err.message));
        setProvider(newProvider);

        return () => { newProvider.disconnect(); };
    }, [weightSource]);

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
                setWeight(''); setLength(''); setWidth(''); setHeight(''); setSenderName('');
                setIsLockedByOther(false); setIsPrinted(false); setAuditInfo(null);
                return;
            }
            setFetching(true);
            const { data } = await supabase.from('parcels').select('*').eq('barcode', barcode).eq('batch_id', activeBatchId).single();
            let shouldLock = false;
            if (data) {
                setIsPrinted(!!data.printed);
                if (data.printed) shouldLock = true;

                let existingWeight = null;
                let existingUserId = null;
                let existingTime = null;

                if (role === 'sender') { existingWeight = data.sender_weight; existingUserId = data.sender_user_id; existingTime = data.sender_updated_at; }
                else if (role === 'transit') { existingWeight = data.transit_weight; existingUserId = data.transit_user_id; existingTime = data.transit_updated_at; }
                else if (role === 'receiver') { existingWeight = data.receiver_weight; existingUserId = data.receiver_user_id; existingTime = data.receiver_updated_at; }

                if (existingUserId) setAuditInfo({ user: existingUserId, time: existingTime });
                else setAuditInfo(null);

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
                setWeight(''); setIsLockedByOther(false); setAuditInfo(null); setIsPrinted(false);
            }
            setFetching(false);
            if (inputRef.current && !shouldLock) setTimeout(() => { inputRef.current?.focus(); }, 100);
        };
        fetchExisting();
    }, [barcode, activeBatchId, role, readOnly, currentUserId, t]);

    const handleSave = async () => {
        if (readOnly || isLockedByOther || isPrinted || !barcode || !weight || !isStable) return;
        setFetching(true);
        try {
            const weightVal = parseFloat(weight);
            if (weightVal <= 0) throw new Error(t('parcel.weight_must_positive'));
            let updateData: any = { updated_at: new Date().toISOString(), weight_source: weightSource, length_cm: length ? parseFloat(length) : null, width_cm: width ? parseFloat(width) : null, height_cm: height ? parseFloat(height) : null, sender_name: senderName || null };
            if (role === 'sender') { updateData.sender_weight = weightVal; updateData.status = 'sent'; updateData.sender_user_id = currentUserId; }
            else if (role === 'transit') { updateData.transit_weight = weightVal; updateData.status = 'in_transit'; updateData.transit_user_id = currentUserId; }
            else if (role === 'receiver') { updateData.receiver_weight = weightVal; updateData.status = 'received'; updateData.receiver_user_id = currentUserId; }

            const { error } = await supabase.from('parcels').upsert({ barcode, batch_id: activeBatchId, ...updateData }, { onConflict: 'barcode' });
            if (error) throw error;
            message.success(t('parcel.save_success'));
            if (role !== 'sender') { setWeight(''); onSave(); }
        } catch (err: any) { message.error(t('parcel.save_failed') + ': ' + err.message); } finally { setFetching(false); }
    };

    const handlePrintAndLock = async () => {
        if (!barcode) return;
        setFetching(true);
        try {
            const weightVal = parseFloat(weight);
            if (isNaN(weightVal) || weightVal <= 0) throw new Error(t('parcel.weight_must_positive'));
            const py = senderName ? pinyin(senderName, { toneType: 'none' }).replace(/\s/g, '') : null;
            const initial = senderName ? pinyin(senderName, { pattern: 'initial', toneType: 'none' }).replace(/\s/g, '') : null;
            const updateData: any = {
                updated_at: new Date().toISOString(), weight_source: weightSource, length_cm: length ? parseFloat(length) : null, width_cm: width ? parseFloat(width) : null, height_cm: height ? parseFloat(height) : null, sender_name: senderName || null, sender_name_pinyin: py, sender_name_initial: initial,
                ...(role === 'sender' ? { sender_weight: weightVal, sender_user_id: currentUserId, status: 'sent' } : {}),
                ...(role === 'transit' ? { transit_weight: weightVal, transit_user_id: currentUserId, status: 'in_transit' } : {}),
                ...(role === 'receiver' ? { receiver_weight: weightVal, receiver_user_id: currentUserId, status: 'received' } : {})
            };
            const { data: parcelData, error: upsertError } = await supabase.from('parcels').upsert({ barcode, batch_id: activeBatchId, ...updateData }, { onConflict: 'barcode' }).select().single();
            if (upsertError) throw upsertError;
            await supabase.from('print_jobs').insert({ parcel_id: parcelData.id, payload: { PACKAGE_NO: barcode, ...updateData }, status: 'pending' });
            await supabase.from('parcels').update({ printed: true, printed_at: new Date().toISOString(), printed_by: currentUserId }).eq('id', parcelData.id);
            message.success(t('parcel.print_success'));
            setIsPrinted(true); onSave();
        } catch (err: any) { message.error(t('common.error') + ': ' + err.message); } finally { setFetching(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Weight Action Area */}
            <div style={{ background: 'var(--bg-app)', border: '2px solid var(--border-light)', borderRadius: '16px', padding: '32px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <Typography.Text style={{ fontWeight: 800, fontSize: '12px', color: 'var(--text-sub)', textTransform: 'uppercase' }}>{t(`parcel.${role}_weight`)}</Typography.Text>
                        <div style={{ fontSize: '72px', fontWeight: 900, color: isStable ? 'var(--primary)' : 'var(--accent)', fontFamily: 'var(--font-digital)', lineHeight: 1, margin: '8px 0' }}>
                            {weight || '0.00'}
                            <span style={{ fontSize: '24px', marginLeft: '12px', color: 'var(--text-sub)' }}>KG</span>
                        </div>
                        <Space>
                            <Typography.Text style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>{barcode || t('parcel.waiting_scan')}</Typography.Text>
                            {isStable && <Tag color="blue" bordered={false} style={{ fontWeight: 700 }}>STABLE</Tag>}
                        </Space>
                    </div>
                    {!readOnly && (
                        <Radio.Group value={weightSource} onChange={e => setWeightSource(e.target.value as any)} buttonStyle="solid">
                            <Tooltip title="Manual"><Radio.Button value="MANUAL"><ToolOutlined /></Radio.Button></Tooltip>
                            <Tooltip title="Bluetooth"><Radio.Button value="BLE"><WifiOutlined /></Radio.Button></Tooltip>
                            <Tooltip title="USB"><Radio.Button value="HID"><UsbOutlined /></Radio.Button></Tooltip>
                        </Radio.Group>
                    )}
                </div>
            </div>

            <Input ref={inputRef} type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} onPressEnter={handleSave} style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }} disabled={!barcode || readOnly || isLockedByOther || isPrinted || weightSource !== 'MANUAL'} />

            {/* Dimensional & Info Area */}
            {(role === 'sender' || length || width || height || senderName) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <InfoBox label={t('parcel.length')} value={length} onChange={setLength} disabled={readOnly || isLockedByOther || isPrinted || role !== 'sender'} />
                        <InfoBox label={t('parcel.width')} value={width} onChange={setWidth} disabled={readOnly || isLockedByOther || isPrinted || role !== 'sender'} />
                        <InfoBox label={t('parcel.height')} value={height} onChange={setHeight} disabled={readOnly || isLockedByOther || isPrinted || role !== 'sender'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Typography.Text style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-sub)' }}>{t('parcel.sender_name_label')}</Typography.Text>
                        <Input
                            size="large"
                            placeholder={t('parcel.sender_name_placeholder')}
                            value={senderName}
                            onChange={e => setSenderName(e.target.value)}
                            disabled={readOnly || isLockedByOther || isPrinted || role !== 'sender'}
                            style={{ borderRadius: '8px', fontWeight: 600, border: '1px solid var(--border-light)' }}
                        />
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {!isPrinted && !isLockedByOther ? (
                    <>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            size="large"
                            block
                            onClick={handleSave}
                            loading={fetching}
                            disabled={!barcode || readOnly}
                            style={{ height: '64px', borderRadius: '12px', fontSize: '18px', fontWeight: 800 }}
                        >
                            {t('parcel.save_continue')}
                        </Button>
                        {role === 'sender' && (
                            <Button
                                type="primary"
                                ghost
                                icon={<PrinterOutlined />}
                                size="large"
                                block
                                onClick={handlePrintAndLock}
                                loading={fetching}
                                disabled={!barcode || !weight}
                                style={{ height: '64px', borderRadius: '12px', fontSize: '18px', fontWeight: 800, border: '2px solid var(--primary)' }}
                            >
                                {t('parcel.print_and_lock')}
                            </Button>
                        )}
                    </>
                ) : (
                    <div style={{ gridColumn: 'span 2', padding: '24px', background: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5', color: '#9a3412', fontWeight: 600, textAlign: 'center' }}>
                        {isPrinted ? <span><PrinterOutlined /> {t('parcel.already_printed')}</span> : <span><LogoutOutlined /> {t('parcel.ownership_lock')}</span>}
                    </div>
                )}
            </div>

            {auditInfo && (
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-sub)', fontWeight: 500 }}>
                    {t('parcel.audit_who')}: <span style={{ color: 'var(--text-main)' }}>{auditInfo.user}</span> | {auditInfo.time ? new Date(auditInfo.time).toLocaleString() : '-'}
                </div>
            )}
        </div>
    );
}

function InfoBox({ label, value, onChange, disabled }: any) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Typography.Text style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-sub)' }}>{label}</Typography.Text>
            <Input
                size="large"
                type="number"
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                style={{ borderRadius: '8px', fontWeight: 600, border: '1px solid var(--border-light)' }}
            />
        </div>
    );
}
