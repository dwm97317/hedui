import React, { useState, useEffect } from 'react';
import { Shipment } from '../../../services/shipment.service';
import { Inspection } from '../../../services/inspection.service';

interface ShipmentEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    shipment: Shipment;
    inspection?: Inspection;
    role: 'sender' | 'transit' | 'receiver';
    onSave: (data: { weight: number; length: number; width: number; height: number }) => Promise<void>;
}

export const ShipmentEditModal: React.FC<ShipmentEditModalProps> = ({
    isOpen,
    onClose,
    shipment,
    inspection,
    role,
    onSave
}) => {
    const [weight, setWeight] = useState('');
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (role === 'sender') {
                setWeight(shipment.weight?.toString() || '');
                setLength(shipment.length?.toString() || '');
                setWidth(shipment.width?.toString() || '');
                setHeight(shipment.height?.toString() || '');
            } else if (role === 'transit') {
                setWeight(inspection?.transit_weight?.toString() || '');
                setLength(inspection?.transit_length?.toString() || '');
                setWidth(inspection?.transit_width?.toString() || '');
                setHeight(inspection?.transit_height?.toString() || '');
            } else if (role === 'receiver') {
                setWeight(inspection?.check_weight?.toString() || '');
                setLength(inspection?.check_length?.toString() || '');
                setWidth(inspection?.check_width?.toString() || '');
                setHeight(inspection?.check_height?.toString() || '');
            }
        }
    }, [isOpen, role, shipment, inspection]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                weight: parseFloat(weight) || 0,
                length: parseFloat(length) || 0,
                width: parseFloat(width) || 0,
                height: parseFloat(height) || 0
            });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const title = {
        sender: '修改发出重量/体积',
        transit: '修改中转称重/体积',
        receiver: '修改接收称重/体积'
    }[role];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-in slide-in-from-bottom-5 duration-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-primary">edit_note</span>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">包裹单号</p>
                        <p className="text-sm font-black font-mono text-slate-900 dark:text-white">{shipment.tracking_no}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">重量 (kg)</label>
                        <div className="relative group">
                            <input
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-xl font-black text-2xl transition-all outline-none"
                                type="number"
                                step="0.01"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                autoFocus
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">KG</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: '长', value: length, setter: setLength },
                            { label: '宽', value: width, setter: setWidth },
                            { label: '高', value: height, setter: setHeight }
                        ].map((dim, idx) => (
                            <div key={idx} className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">{dim.label} (cm)</label>
                                <input
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold outline-none focus:border-primary"
                                    type="number"
                                    value={dim.value}
                                    onChange={(e) => dim.setter(e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all text-lg disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="material-icons">save</span>
                                <span>保存修改</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    );
};
