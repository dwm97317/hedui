import { useState, useEffect, useRef } from 'react';
import { Input, Button, Form, Typography, message, Tag, Space, Alert, Radio } from 'antd';
import { SaveOutlined, ForwardOutlined, PrinterOutlined, ToolOutlined, UsbOutlined, WifiOutlined } from '@ant-design/icons';
import { pinyin } from 'pinyin-pro';
import { supabase } from '../lib/supabase';
import { Role } from '../types';
import { useTranslation } from 'react-i18next';
import { WeightProvider, ManualWeightProvider, BleWeightProvider, HidWeightProvider, WeightResult } from '../services/weight';

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
        // For other sources, if we had a stream, we'd check variance here.
        // Since we don't have real hardware, we assume stable for now to unblock UI.
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
                // Check if printed (Global Lock)
                if (data.printed) {
                    setIsPrinted(true);
                    shouldLock = true;
                    // message.info(t('parcel.printed_locked')); // Optional: too noisy if auto-scanned
                } else {
                    setIsPrinted(false);
                }

                // Check if current user owns the data for this role
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

                // If data exists AND belongs to someone else, enforce Read-Only logic
                if (existingWeight !== null && existingUserId && existingUserId !== currentUserId) {
                    message.warning(t('parcel.ownership_lock_with_time', { userId: existingUserId, time: existingTime ? new Date(existingTime).toLocaleString() : '-' }));
                    setWeight(existingWeight.toString());
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

            // Focus the weight input after fetching, if not locked
            if (inputRef.current && !shouldLock) {
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 100);
            }
        };
        fetchExisting();
    }, [barcode, activeBatchId, role, readOnly, currentUserId]);

    const handleSave = async () => {
        if (readOnly || isLockedByOther || isPrinted) return; // Block save if locked
        if (!barcode) return message.warning(t('parcel.scanner_placeholder'));
        if (!weight) return message.warning(t('parcel.weight_label'));
        if (!isStable) return message.warning(t('parcel.unstable_weight') || 'Scale Unstable');

        // ... (rest of logic same as before, no changes needed inside try block for save)
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
            // ... (rest of updateData logic is fine)

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
            // Don't clear weight immediately if we are in Sender role (might want to print)
            // But usually we move to next. For now, keep as is.
            // onSave(); // Let the user click Print manually if Sender?
            // Actually, per SOP: Weigh -> Print -> Lock. So we should probably SAVE first, then enable Print button.
            // Current flow: Scan -> Input Weight -> Enter(Save) -> Next.
            // New flow: Scan -> Input Weight -> Save -> Print -> Lock -> Next.

            // For now, let's keep auto-next for non-sender. Sender might need to stay to print.
            if (role !== 'sender') {
                setWeight('');
                onSave();
            } else {
                // Refresh to show Print button? Or just set local state?
                // We need to re-fetch to ensure we have the latest state if needed, or just trust UI.
                // Let's just notify success. The user is still on this barcode.
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
            // 1. Prepare Data
            const weightVal = parseFloat(weight);
            if (isNaN(weightVal) || weightVal <= 0) throw new Error(t('parcel.weight_must_positive') || 'Weight > 0');

            // Compute Pinyin for Search (Industrial optimization)
            const py = senderName ? pinyin(senderName, { toneType: 'none' }).replace(/\s/g, '') : null;
            const initial = senderName ? pinyin(senderName, { pattern: 'initial', toneType: 'none' }).replace(/\s/g, '') : null;
            // Construct payload based on bartender_spec.md
            const payload = {
                PACKAGE_NO: barcode,
                PACKAGE_INDEX: barcode.split('-')[1] || '0',
                WEIGHT: `${weightVal.toFixed(2)} KG`,
                ROUTE: 'Chinh-QN', // Mock routing
                SHIP_DATE: new Date().toISOString().slice(0, 10),
                PACKAGE_BARCODE: barcode,
                LENGTH: length || '-',
                WIDTH: width || '-',
                HEIGHT: height || '-',
                SENDER_NAME: senderName || '-'
            };

            // 2. Upsert Parcel
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

            // 3. Insert Print Job
            const { error: printError } = await supabase.from('print_jobs').insert({
                parcel_id: parcelData.id,
                payload: payload,
                status: 'pending'
            });

            if (printError) throw printError;

            // 4. Lock Parcel
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
        <Form layout="vertical" className="neon-card" style={{ padding: '15px' }}>
            <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{t('common.duty')}: {t(`parcel.${role}_weight`)}</Typography.Text>
                    {/* Source Switcher */}
                    {!readOnly && (
                        <Radio.Group
                            value={weightSource}
                            onChange={e => setWeightSource(e.target.value as any)}
                            size="small"
                            buttonStyle="solid"
                        >
                            <Radio.Button value="MANUAL"><ToolOutlined /></Radio.Button>
                            <Radio.Button value="BLE"><WifiOutlined /></Radio.Button>
                            <Radio.Button value="HID"><UsbOutlined /></Radio.Button>
                        </Radio.Group>
                    )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '18px' }}>
                        {barcode || t('parcel.waiting_scan')}
                        {isPrinted && <Tag color="red" style={{ marginLeft: 10 }}>{t('parcel.locked') || 'LOCKED'}</Tag>}
                    </div>
                    {auditInfo && (
                        <div style={{ fontSize: '10px', color: 'var(--text-sub)', textAlign: 'right' }}>
                            <div>{t('parcel.audit_who')}: {auditInfo.user}</div>
                            <div>{auditInfo.time ? new Date(auditInfo.time).toLocaleTimeString() : ''}</div>
                        </div>
                    )}
                </div>
            </div>

            <Form.Item label={<span style={{ color: isStable ? '#52c41a' : '#faad14' }}>{t('parcel.weight_label')} {isStable ? '(Stable)' : '(Unstable)'}</span>}>
                <Input
                    ref={inputRef}
                    size="large"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    onPressEnter={handleSave}
                    disabled={!barcode || readOnly || isLockedByOther || isPrinted || weightSource !== 'MANUAL'}
                    prefix={weightSource === 'MANUAL' ? null : <WifiOutlined spin={!isStable} />}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: isStable ? 'white' : '#faad14',
                        border: `1px solid ${isStable ? 'rgba(255,255,255,0.2)' : '#faad14'}`,
                        transition: 'all 0.3s'
                    }}
                />
            </Form.Item>

            {/* Optional Dimensional & Sender Info (Only for Sender/Manual) */}
            {(role === 'sender' || length || width || height || senderName) && (
                <div style={{ marginBottom: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        <Form.Item label={t('parcel.length') || '长 (cm)'} style={{ marginBottom: 0 }}>
                            <Input
                                type="number"
                                placeholder="L"
                                value={length}
                                onChange={e => setLength(e.target.value)}
                                disabled={readOnly || isLockedByOther || isPrinted || role !== 'sender'}
                                className="glass-card"
                            />
                        </Form.Item>
                        <Form.Item label={t('parcel.width') || '宽 (cm)'} style={{ marginBottom: 0 }}>
                            <Input
                                type="number"
                                placeholder="W"
                                value={width}
                                onChange={e => setWidth(e.target.value)}
                                disabled={readOnly || isLockedByOther || isPrinted || role !== 'sender'}
                                className="glass-card"
                            />
                        </Form.Item>
                        <Form.Item label={t('parcel.height') || '高 (cm)'} style={{ marginBottom: 0 }}>
                            <Input
                                type="number"
                                placeholder="H"
                                value={height}
                                onChange={e => setHeight(e.target.value)}
                                disabled={readOnly || isLockedByOther || isPrinted || role !== 'sender'}
                                className="glass-card"
                            />
                        </Form.Item>
                    </div>
                    <Form.Item label={t('parcel.sender_name_label') || '发件人姓名'} style={{ marginBottom: 0 }}>
                        <Input
                            placeholder={t('parcel.sender_name_placeholder') || '输入联系人姓名'}
                            value={senderName}
                            onChange={e => setSenderName(e.target.value)}
                            disabled={readOnly || isLockedByOther || isPrinted || role !== 'sender'}
                            className="glass-card"
                        />
                    </Form.Item>
                </div>
            )}

            {!isPrinted ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        size="large"
                        block
                        onClick={handleSave}
                        loading={fetching}
                        disabled={!barcode || readOnly || isLockedByOther}
                    >
                        {t('parcel.save_continue')}
                    </Button>

                    {/* Only Sender can Print & Lock */}
                    {role === 'sender' && weight && !isLockedByOther && (
                        <Button
                            type="primary"
                            danger
                            icon={<PrinterOutlined />}
                            size="large"
                            block
                            onClick={handlePrintAndLock}
                            loading={fetching}
                            disabled={!isStable}
                        >
                            {t('parcel.print_and_lock') || '打印并锁定'}
                        </Button>
                    )}
                </Space>
            ) : (
                <Alert message={t('parcel.already_printed') || '已打印锁定'} type="warning" showIcon />
            )}

            {!readOnly && (
                <Button
                    icon={<ForwardOutlined />}
                    style={{ marginTop: '10px', background: 'transparent', color: 'var(--text-sub)' }}
                    block
                    onClick={() => { setWeight(''); setIsPrinted(false); onSave(); }}
                >
                    {t('common.skip')}
                </Button>
            )}
        </Form>
    );
}
