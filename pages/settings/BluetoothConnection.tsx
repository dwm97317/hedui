import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBluetoothStore, PrintSize } from '../../store/bluetooth.store';
import { bluetoothService, DeviceType } from '../../services/bluetooth.service';
import toast from 'react-hot-toast';

const PRINT_SIZES: { value: PrintSize; label: string; icon: string }[] = [
    { value: '76x130', label: '76×130', icon: 'crop_portrait' },
    { value: '100x150', label: '100×150', icon: 'crop_landscape' },
    { value: '50x30', label: '50×30', icon: 'label' },
];

const BluetoothConnection: React.FC = () => {
    const navigate = useNavigate();
    const {
        scaleDevice, scaleConnecting, lastWeight,
        printerDevice, printerConnecting, printSize,
        isScanning, scanTarget,
        connectScale, connectScaleAll, disconnectScale,
        connectPrinter, connectPrinterAll, disconnectPrinter,
        setPrintSize,
    } = useBluetoothStore();

    const [showScanModal, setShowScanModal] = useState(false);
    const [scanType, setScanType] = useState<DeviceType>('scale');
    const [weightPulse, setWeightPulse] = useState(false);
    const btSupported = bluetoothService.isSupported();

    // Weight pulse animation
    useEffect(() => {
        if (lastWeight) {
            setWeightPulse(true);
            const t = setTimeout(() => setWeightPulse(false), 300);
            return () => clearTimeout(t);
        }
    }, [lastWeight?.weight]);

    const handleConnect = async (type: DeviceType, acceptAll = false) => {
        try {
            if (type === 'scale') {
                acceptAll ? await connectScaleAll() : await connectScale();
                toast.success('电子秤已连接');
            } else {
                acceptAll ? await connectPrinterAll() : await connectPrinter();
                toast.success('打印机已连接');
            }
            setShowScanModal(false);
        } catch (err: any) {
            if (err.message !== '未选择设备') {
                toast.error(err.message || '连接失败');
            }
        }
    };

    const handleDisconnect = (type: DeviceType) => {
        if (type === 'scale') {
            disconnectScale();
            toast('电子秤已断开', { icon: '⚡' });
        } else {
            disconnectPrinter();
            toast('打印机已断开', { icon: '⚡' });
        }
    };

    const openScanModal = (type: DeviceType) => {
        setScanType(type);
        setShowScanModal(true);
    };

    // ─── Scan Modal ─────────────────────────────────────────────
    const ScanModal = () => (
        <div className="fixed inset-0 z-[80] flex items-end justify-center" onClick={() => setShowScanModal(false)}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Bottom Sheet */}
            <div
                className="relative w-full max-w-lg bg-[#0f172a] rounded-t-3xl border-t border-white/10 animate-slide-up overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="p-6 text-center">
                    <div className="relative inline-flex items-center justify-center mb-4">
                        {/* Pulse rings */}
                        <div className="absolute w-24 h-24 rounded-full bg-primary/5 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute w-16 h-16 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 relative z-10">
                            <span className="material-icons text-primary text-3xl animate-pulse">
                                {scanType === 'scale' ? 'monitor_weight' : 'print'}
                            </span>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">
                        搜索{scanType === 'scale' ? '电子秤' : '打印机'}设备
                    </h2>
                    <p className="text-sm text-gray-500">
                        请确保设备已开启并处于蓝牙配对模式
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-4 space-y-3">
                    {/* Filtered search */}
                    <button
                        onClick={() => handleConnect(scanType, false)}
                        disabled={scaleConnecting || printerConnecting}
                        className="w-full flex items-center gap-4 p-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 group"
                    >
                        <div className="p-3 rounded-xl bg-primary/20 text-primary border border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all">
                            <span className="material-icons text-2xl">bluetooth_searching</span>
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-white font-bold text-base">智能搜索</div>
                            <div className="text-gray-500 text-xs">
                                自动筛选{scanType === 'scale' ? '电子秤' : '打印机'}设备
                            </div>
                        </div>
                        {(scaleConnecting || printerConnecting) ? (
                            <span className="material-icons text-primary animate-spin text-xl">refresh</span>
                        ) : (
                            <span className="material-icons text-primary/50 text-xl">chevron_right</span>
                        )}
                    </button>

                    {/* Accept all */}
                    <button
                        onClick={() => handleConnect(scanType, true)}
                        disabled={scaleConnecting || printerConnecting}
                        className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 group"
                    >
                        <div className="p-3 rounded-xl bg-white/10 text-gray-400 border border-white/10 group-hover:text-white transition-all">
                            <span className="material-icons text-2xl">sensors</span>
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-gray-300 font-bold text-base">搜索全部设备</div>
                            <div className="text-gray-600 text-xs">
                                显示所有蓝牙设备（含未识别设备）
                            </div>
                        </div>
                        <span className="material-icons text-gray-600 text-xl">chevron_right</span>
                    </button>
                </div>

                {/* Tips area */}
                <div className="mx-6 mb-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <div className="flex items-start gap-2">
                        <span className="material-icons text-amber-500 text-sm mt-0.5">tips_and_updates</span>
                        <div className="text-[11px] text-amber-500/80 leading-relaxed">
                            <strong>提示：</strong>选择设备后，浏览器会弹出蓝牙配对窗口，请在窗口中选择您要连接的设备并点击"配对"。
                        </div>
                    </div>
                </div>

                {/* Cancel */}
                <div className="px-6 pb-8">
                    <button
                        onClick={() => setShowScanModal(false)}
                        className="w-full py-3.5 rounded-2xl bg-white/5 text-gray-500 text-sm font-bold uppercase tracking-widest border border-white/5 hover:bg-white/10 active:scale-95 transition-all"
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="bg-surface-dark/95 backdrop-blur shadow-md z-50 sticky top-0 flex-shrink-0">
                <div className="px-4 py-4 flex items-center justify-between relative border-b border-white/5">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
                        <span className="material-icons">arrow_back_ios</span>
                    </button>
                    <h1 className="text-lg font-bold text-white tracking-wide">蓝牙设备管理</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="flex-1 p-4 overflow-y-auto flex flex-col gap-6 pb-32 no-scrollbar">
                {/* BT Support Warning */}
                {!btSupported && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                        <span className="material-icons text-red-500 text-xl mt-0.5">error_outline</span>
                        <div>
                            <div className="text-red-400 font-bold text-sm">蓝牙不可用</div>
                            <div className="text-red-500/70 text-xs mt-1">
                                当前浏览器或设备不支持 Web Bluetooth API。请使用 Chrome / Edge 浏览器，或在 Android 设备上打开应用。
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Section: Bluetooth Scale ─── */}
                <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                        <span className="material-icons text-sm text-primary">monitor_weight</span>
                        蓝牙电子秤
                    </h2>

                    <div className="bg-surface-dark rounded-2xl border border-white/5 overflow-hidden shadow-lg">
                        {scaleDevice ? (
                            <>
                                {/* Connected device info */}
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 text-primary border border-primary/20 shadow-lg shadow-primary/5">
                                                <span className="material-icons text-2xl">monitor_weight</span>
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-base">{scaleDevice.name}</div>
                                                <div className="text-gray-500 text-[11px] font-mono mt-0.5">ID: {scaleDevice.id.slice(0, 12)}...</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-green-500 text-xs font-bold">已连接</span>
                                        </div>
                                    </div>

                                    {/* Weight Display */}
                                    <div className="bg-black/30 rounded-2xl p-6 text-center border border-white/5 relative overflow-hidden">
                                        <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">实时重量</div>
                                        <div className={`text-5xl font-black text-white tabular-nums transition-all duration-200 ${weightPulse ? 'scale-105 text-primary' : ''}`}>
                                            {lastWeight ? lastWeight.weight.toFixed(2) : '0.00'}
                                        </div>
                                        <div className="text-gray-500 text-sm font-bold mt-1">
                                            {lastWeight?.unit || 'kg'}
                                            {lastWeight && (
                                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${lastWeight.stable ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {lastWeight.stable ? '稳定' : '不稳定'}
                                                </span>
                                            )}
                                        </div>
                                        {/* Subtle gradient decoration */}
                                        <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-primary/5 blur-2xl" />
                                    </div>
                                </div>

                                {/* Disconnect action */}
                                <div className="px-5 pb-4">
                                    <button
                                        onClick={() => handleDisconnect('scale')}
                                        className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-bold border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all"
                                    >
                                        断开连接
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* Not connected state */
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                                    <span className="material-icons text-4xl text-gray-600">monitor_weight</span>
                                </div>
                                <div className="text-gray-400 font-bold text-sm mb-1">未连接电子秤</div>
                                <div className="text-gray-600 text-xs mb-5">连接蓝牙电子秤以获取实时重量数据</div>
                                <button
                                    onClick={() => openScanModal('scale')}
                                    disabled={!btSupported}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm rounded-xl border border-primary/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-icons text-lg">bluetooth_searching</span>
                                    搜索电子秤
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* ─── Section: Bluetooth Printer ─── */}
                <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                        <span className="material-icons text-sm text-orange-500">print</span>
                        蓝牙标签打印机
                    </h2>

                    <div className="bg-surface-dark rounded-2xl border border-white/5 overflow-hidden shadow-lg">
                        {printerDevice ? (
                            <>
                                {/* Connected printer info */}
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-500/5">
                                                <span className="material-icons text-2xl">print</span>
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-base">{printerDevice.name}</div>
                                                <div className="text-gray-500 text-[11px] font-mono mt-0.5">ID: {printerDevice.id.slice(0, 12)}...</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-green-500 text-xs font-bold">已连接</span>
                                        </div>
                                    </div>

                                    {/* Print Size Selector */}
                                    <div>
                                        <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">打印尺寸</div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {PRINT_SIZES.map((s) => (
                                                <button
                                                    key={s.value}
                                                    onClick={() => setPrintSize(s.value)}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95 ${printSize === s.value
                                                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5'
                                                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <span className={`material-icons-outlined text-xl mb-1 ${printSize === s.value ? 'text-primary' : 'text-gray-500'
                                                        }`}>{s.icon}</span>
                                                    <span className={`text-xs font-bold ${printSize === s.value ? 'text-white' : 'text-gray-400'
                                                        }`}>{s.label}</span>
                                                    <span className={`text-[9px] ${printSize === s.value ? 'text-primary/80' : 'text-gray-600'
                                                        }`}>mm</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Test Print + Disconnect */}
                                <div className="px-5 pb-4 flex gap-3">
                                    <button
                                        onClick={async () => {
                                            try {
                                                await bluetoothService.printText('Test Print / 测试打印\n' + new Date().toLocaleString());
                                                toast.success('测试打印已发送');
                                            } catch (err: any) {
                                                toast.error(err.message || '打印失败');
                                            }
                                        }}
                                        className="flex-1 py-3 rounded-xl bg-orange-500/10 text-orange-400 text-sm font-bold border border-orange-500/20 hover:bg-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons text-base">receipt_long</span>
                                        测试打印
                                    </button>
                                    <button
                                        onClick={() => handleDisconnect('printer')}
                                        className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-bold border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all"
                                    >
                                        断开连接
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* Not connected state */
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                                    <span className="material-icons text-4xl text-gray-600">print</span>
                                </div>
                                <div className="text-gray-400 font-bold text-sm mb-1">未连接打印机</div>
                                <div className="text-gray-600 text-xs mb-5">连接蓝牙标签打印机以进行面单打印</div>
                                <button
                                    onClick={() => openScanModal('printer')}
                                    disabled={!btSupported}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-bold text-sm rounded-xl border border-orange-500/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-icons text-lg">bluetooth_searching</span>
                                    搜索打印机
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* ─── Quick Info ─── */}
                <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">连接帮助</h2>
                    <div className="bg-surface-dark rounded-2xl border border-white/5 p-5 space-y-4">
                        {[
                            { icon: 'bluetooth', color: 'text-blue-500', bg: 'bg-blue-500/10', title: '开启蓝牙', desc: '确保设备蓝牙已打开，电子秤/打印机处于可发现状态' },
                            { icon: 'near_me', color: 'text-green-500', bg: 'bg-green-500/10', title: '靠近设备', desc: '蓝牙连接距离建议在 3 米以内' },
                            { icon: 'battery_charging_full', color: 'text-amber-500', bg: 'bg-amber-500/10', title: '检查电量', desc: '确保蓝牙设备电量充足，避免连接中断' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${item.bg} ${item.color} shrink-0`}>
                                    <span className="material-icons text-lg">{item.icon}</span>
                                </div>
                                <div>
                                    <div className="text-white text-sm font-bold">{item.title}</div>
                                    <div className="text-gray-500 text-xs mt-0.5">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Bottom Action Button */}
            <div className="bg-[#111827]/90 backdrop-blur-xl border-t border-white/5 pb-8 pt-3 z-50 fixed bottom-0 w-full px-6">
                <div className="max-w-lg mx-auto flex gap-3">
                    {!scaleDevice && (
                        <button
                            onClick={() => openScanModal('scale')}
                            disabled={!btSupported}
                            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                            <span className="material-icons text-lg">monitor_weight</span>
                            连接秤
                        </button>
                    )}
                    {!printerDevice && (
                        <button
                            onClick={() => openScanModal('printer')}
                            disabled={!btSupported}
                            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                            <span className="material-icons text-lg">print</span>
                            连接打印机
                        </button>
                    )}
                    {scaleDevice && printerDevice && (
                        <button
                            onClick={() => navigate(-1)}
                            className="flex-1 py-4 rounded-2xl bg-green-500/10 text-green-500 text-sm font-black uppercase tracking-wider border border-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-icons text-lg">check_circle</span>
                            全部已连接
                        </button>
                    )}
                </div>
            </div>

            {/* Scan Modal */}
            {showScanModal && <ScanModal />}
        </div>
    );
};

export default BluetoothConnection;
