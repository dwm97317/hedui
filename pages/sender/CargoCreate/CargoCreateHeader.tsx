import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CargoCreateHeaderProps {
    batchNo?: string;
}

const CargoCreateHeader: React.FC<CargoCreateHeaderProps> = ({ batchNo }) => {
    const navigate = useNavigate();

    return (
        <header className="bg-white dark:bg-surface-dark/95 backdrop-blur shadow-md z-50 sticky top-0 shrink-0">
            <div className="px-4 py-2 flex justify-between items-center text-[10px] text-gray-400 border-b border-white/5 flex-wrap gap-y-1">
                <div className="flex items-center gap-4">
                    <span className="font-mono tracking-wider">设备号: NT20-001</span>
                    {batchNo && (
                        <span className="flex items-center gap-1 border-l border-white/10 pl-4">
                            <span className="text-gray-500">当前活动批次:</span>
                            <span className="font-mono font-black text-white tracking-widest">{batchNo}</span>
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-primary">
                        <span className="material-icons text-[12px] font-bold">bluetooth_connected</span>
                        <span className="font-bold">蓝牙秤: 已连接</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="material-icons text-[12px]">wifi</span>
                        <span className="font-bold">5G</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="material-icons text-[12px]">battery_std</span>
                        <span className="font-bold">85%</span>
                    </span>
                </div>
            </div>
            <div className="px-5 py-4 flex justify-between items-center relative">
                <button
                    onClick={() => navigate('/sender')}
                    className="absolute left-4 p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
                >
                    <span className="material-icons">arrow_back</span>
                </button>
                <div className="w-full text-center px-12">
                    <h1 className="text-lg font-bold text-white tracking-wide">创建货物 (仅建档)</h1>
                </div>
                <div className="absolute right-4 flex items-center gap-2 z-10">
                    <button
                        onClick={() => navigate('/sender/monitor')}
                        className="text-primary hover:text-blue-300 text-[10px] font-bold uppercase transition-all border border-primary/30 rounded px-1.5 py-1 bg-primary/10 active:scale-95 shadow-sm"
                    >
                        已建档单号概览
                    </button>
                    <div className="w-px h-4 bg-white/10"></div>
                    <button
                        onClick={() => {
                            // Logic for generating waybill can be added in parent, 
                            // but for UI consistency we add the button here.
                            const event = new CustomEvent('generate-waybill');
                            window.dispatchEvent(event);
                        }}
                        className="text-primary hover:text-blue-300 text-[10px] font-bold uppercase transition-all border border-primary/30 rounded px-1.5 py-1 bg-primary/10 active:scale-95 shadow-sm"
                    >
                        生成单号
                    </button>
                </div>
            </div>
        </header>
    );
};

export default CargoCreateHeader;
