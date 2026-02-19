import React from 'react';
import { CameraScanButton } from '../../../components/CameraScanner';

interface CargoCreateFormProps {
    waybillNo: string;
    setWaybillNo: (val: string) => void;
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
    volumetricWeight: number;
    chargeableWeight: number;
    transportMode: number;
    setTransportMode: (val: number) => void;
    itemCategory: string;
    setItemCategory: (val: string) => void;
    isReprintMode?: boolean;
    archiveShipment?: any;
}

const CargoCreateForm: React.FC<CargoCreateFormProps> = ({
    waybillNo, setWaybillNo,
    weight, setWeight,
    length, setLength,
    width, setWidth,
    height, setHeight,
    shipperName, setShipperName,
    volumetricWeight,
    chargeableWeight,
    transportMode, setTransportMode,
    itemCategory, setItemCategory,
    isReprintMode = false,
    archiveShipment
}) => {
    return (
        <div className="flex flex-col gap-5">
            {/* Waybill Input */}
            <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[10px]">运单号</label>
                    {isReprintMode && (
                        <span className="flex items-center gap-1 text-[10px] text-purple-500 font-black uppercase tracking-widest animate-pulse">
                            <span className="material-icons text-[12px]">print</span>
                            运单已存在 - 重印模式
                        </span>
                    )}
                </div>
                <div className="relative group">
                    <input
                        value={waybillNo}
                        onChange={(e) => setWaybillNo(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-4 pr-12 text-lg font-mono font-bold tracking-wide shadow-sm transition-all outline-none ${isReprintMode
                            ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-500 ring-2 ring-purple-500/20 text-purple-700 dark:text-purple-300'
                            : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent'
                            }`}
                        placeholder="扫描或输入单号"
                        type="text"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {waybillNo && (
                            <button
                                onClick={() => setWaybillNo('')}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <span className="material-icons text-[20px]">close</span>
                            </button>
                        )}
                        <CameraScanButton onScan={(code) => setWaybillNo(code)} />
                    </div>
                </div>
            </div>

            {/* Weight Section */}
            <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400">重量 (kg)</label>
                    <div className="flex items-center gap-1.5 text-[10px] text-primary bg-primary/10 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider">
                        <span className="material-icons text-[12px]">bluetooth</span>
                        <span>自动获取</span>
                    </div>
                </div>
                <div className="relative flex items-center justify-center bg-slate-50 dark:bg-background-dark rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 py-10 group hover:border-primary/50 transition-all duration-300">
                    <input
                        className="w-full bg-transparent text-center text-7xl font-black text-slate-900 dark:text-white focus:outline-none font-mono tracking-tighter"
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                    />
                    <span className="absolute right-5 bottom-3 text-slate-400 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest">kg</span>
                </div>
                <div className="mt-3 flex flex-col items-center gap-2">
                    {isReprintMode && archiveShipment && (
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="text-gray-500 uppercase">存档重量:</span>
                            <span className="text-slate-800 dark:text-slate-200">{archiveShipment.weight} kg</span>
                            {archiveShipment.transit_weight && (
                                <>
                                    <span className="text-gray-400 mx-1">|</span>
                                    <span className="text-orange-500 uppercase">中转重:</span>
                                    <span className="text-orange-600 font-black">{archiveShipment.transit_weight} kg</span>
                                </>
                            )}
                        </div>
                    )}
                    <button
                        className="text-xs text-gray-500 underline decoration-gray-600 hover:text-primary hover:decoration-primary transition-colors font-medium"
                    >
                        手动修正
                    </button>
                </div>
            </div>

            {/* Dimensions Grid */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 pl-1">尺寸信息 (cm)</label>
                <div className="grid grid-cols-3 gap-3">
                    <div className="relative">
                        <input
                            value={length}
                            onChange={(e) => setLength(e.target.value)}
                            className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg font-medium transition-all"
                            placeholder="0"
                            type="number"
                        />
                        <span className="text-[10px] text-gray-500 absolute top-1 left-2 font-medium">长</span>
                    </div>
                    <div className="relative">
                        <input
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg font-medium transition-all"
                            placeholder="0"
                            type="number"
                        />
                        <span className="text-[10px] text-gray-500 absolute top-1 left-2 font-medium">宽</span>
                    </div>
                    <div className="relative">
                        <input
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg font-medium transition-all"
                            placeholder="0"
                            type="number"
                        />
                        <span className="text-[10px] text-gray-500 absolute top-1 left-2 font-medium">高</span>
                    </div>
                </div>
            </div>

            {/* Shipper Input */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 pl-1 uppercase tracking-widest text-[10px]">发货人姓名</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <span className="material-icons text-[20px]">person</span>
                    </span>
                    <input
                        value={shipperName}
                        onChange={(e) => setShipperName(e.target.value)}
                        className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-10 py-4 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base font-bold shadow-sm transition-all"
                        placeholder="输入发货人"
                        type="text"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary transition-all active:scale-90">
                        <span className="material-icons text-[20px]">history</span>
                    </button>
                </div>
            </div>

            {/* Additional Info: Transport Mode & Category */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400 pl-1 uppercase tracking-widest text-[10px]">物品类别 (可选)</label>
                    <input
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value)}
                        className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base font-bold shadow-sm transition-all"
                        placeholder="例如: 电子产品"
                        type="text"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400 pl-1 uppercase tracking-widest text-[10px]">运输方式</label>
                    <div className="flex bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-white/10 p-1">
                        {[
                            { value: 1, label: '陆运' },
                            { value: 2, label: '海运' },
                            { value: 3, label: '空运' }
                        ].map((mode) => (
                            <button
                                key={mode.value}
                                onClick={() => setTransportMode(mode.value)}
                                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${transportMode === mode.value
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Info */}
            <div className="flex gap-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 py-2">
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-surface-dark px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></span>
                    <span>体积: <span className="text-slate-700 dark:text-slate-300">{volumetricWeight.toFixed(2)}</span> kg</span>
                </div>
                <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(19,91,236,0.5)]"></span>
                    <span>计费: <span className="text-primary">{chargeableWeight.toFixed(2)}</span> kg</span>
                </div>
            </div>
        </div>
    );
};

export default CargoCreateForm;
