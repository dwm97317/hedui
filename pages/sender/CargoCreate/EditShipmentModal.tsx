import React from 'react';
import { Shipment } from '../../../services/shipment.service';

interface EditShipmentModalProps {
    editingShipment: Shipment | null;
    onClose: () => void;
    waybill: string;
    setWaybill: (val: string) => void;
    weight: string;
    setWeight: (val: string) => void;
    length: string;
    setLength: (val: string) => void;
    width: string;
    setWidth: (val: string) => void;
    height: string;
    setHeight: (val: string) => void;
    shipperName: string;
    setShipperName: (val: string) => void;
    handleUpdateShipment: () => void;
}

const EditShipmentModal: React.FC<EditShipmentModalProps> = ({
    editingShipment,
    onClose,
    waybill, setWaybill,
    weight, setWeight,
    length, setLength,
    width, setWidth,
    height, setHeight,
    shipperName, setShipperName,
    handleUpdateShipment
}) => {
    if (!editingShipment) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <header className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-icons-round text-primary">edit_note</span>
                        编辑单号信息
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">修改包裹明细后保存</p>
                </header>

                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">运单号</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-slate-400 text-lg">qr_code</span>
                            <input
                                value={waybill}
                                onChange={(e) => setWaybill(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">重量 (kg)</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-bold"
                            />
                            <button className="px-4 py-3 bg-primary/10 text-primary rounded-xl font-bold text-xs hover:bg-primary/20 transition-colors flex items-center gap-1.5">
                                <span className="material-icons-round text-sm">refresh</span>
                                重新取重
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">尺寸 (cm)</label>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="relative">
                                <span className="absolute top-1.5 left-3 text-[9px] font-black text-slate-400 uppercase">长</span>
                                <input
                                    type="number"
                                    value={length}
                                    onChange={(e) => setLength(e.target.value)}
                                    className="w-full pt-5 pb-2 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-center font-bold"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute top-1.5 left-3 text-[9px] font-black text-slate-400 uppercase">宽</span>
                                <input
                                    type="number"
                                    value={width}
                                    onChange={(e) => setWidth(e.target.value)}
                                    className="w-full pt-5 pb-2 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-center font-bold"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute top-1.5 left-3 text-[9px] font-black text-slate-400 uppercase">高</span>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className="w-full pt-5 pb-2 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-center font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">发货人姓名</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-slate-400 text-lg">person</span>
                            <input
                                value={shipperName}
                                onChange={(e) => setShipperName(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-bold"
                                placeholder="输入发货人姓名"
                            />
                        </div>
                    </div>
                </div>

                <footer className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 shrink-0">
                    <button
                        onClick={handleUpdateShipment}
                        className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                    >
                        保存修改
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold py-3 rounded-xl border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all"
                    >
                        取消
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default EditShipmentModal;
