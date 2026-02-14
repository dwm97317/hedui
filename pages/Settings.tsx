
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScannerStore } from '../store/scanner.store';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { model: pdaModel, setModel } = useScannerStore();
    const [showPrinterModal, setShowPrinterModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showPdaModal, setShowPdaModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Printer Config Modal
    const PrinterModal = () => (
        <div className="fixed inset-0 z-[60] bg-background-light dark:bg-background-dark flex flex-col animate-slide-up">
            <header className="bg-surface-dark/95 backdrop-blur shadow-md z-50 sticky top-0 border-b border-white/5">
                <div className="px-4 py-4 flex items-center justify-between relative">
                    <button
                        onClick={() => setShowPrinterModal(false)}
                        className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full active:bg-white/10 transition-colors"
                    >
                        <span className="material-icons">close</span>
                    </button>
                    <h1 className="text-lg font-bold text-white tracking-wide">打印机配置</h1>
                    <div className="w-10"></div>
                </div>
            </header>
            <main className="flex-1 p-4 overflow-y-auto flex flex-col gap-5 pb-32 no-scrollbar">
                <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">当前设备</h2>
                    <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden shadow-sm">
                        <div className="p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-primary/20 text-primary border border-primary/20">
                                        <span className="material-icons text-xl">print</span>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">当前打印机</div>
                                        <div className="text-base font-semibold text-white">Zebra-ZD420</div>
                                    </div>
                                </div>
                                <button className="px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-white/10 text-xs font-medium text-primary border border-primary/30 transition-colors">
                                    切换
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="inline-flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    已连接
                                </span>
                                <span className="text-gray-500 font-mono text-[10px] pt-0.5">MAC: 00:11:22:33:44:55</span>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="flex-1">
                    <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden shadow-sm flex flex-col gap-0 divide-y divide-white/5">
                        <div className="p-4">
                            <label className="block text-sm font-medium text-gray-400 mb-3">打印尺寸</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-primary bg-primary/10 transition-all">
                                    <span className="material-icons-outlined text-primary mb-1 text-2xl">crop_portrait</span>
                                    <span className="text-xs font-bold text-white">76x130</span>
                                    <span className="text-[10px] text-primary/80">mm</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-3 rounded-lg border border-white/10 bg-surface-hover/50 hover:bg-surface-hover active:bg-surface-hover/80 transition-all">
                                    <span className="material-icons-outlined text-gray-500 mb-1 text-2xl">crop_landscape</span>
                                    <span className="text-xs font-medium text-gray-300">100x150</span>
                                    <span className="text-[10px] text-gray-600">mm</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-3 rounded-lg border border-white/10 bg-surface-hover/50 hover:bg-surface-hover active:bg-surface-hover/80 transition-all">
                                    <span className="material-icons-outlined text-gray-500 mb-1 text-2xl">label</span>
                                    <span className="text-xs font-medium text-gray-300">50x30</span>
                                    <span className="text-[10px] text-gray-600">mm</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-gray-400">打印浓度</label>
                                <span className="text-sm font-bold text-primary">85%</span>
                            </div>
                            <input className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary" type="range" min="0" max="100" defaultValue="85" />
                            <div className="flex justify-between mt-1 text-[10px] text-gray-600">
                                <span>淡</span>
                                <span>标准</span>
                                <span>深</span>
                            </div>
                        </div>
                    </div>
                </section>
                <div className="h-8"></div>
            </main>
            <div className="fixed bottom-0 left-0 right-0 bg-surface-dark/95 backdrop-blur border-t border-white/10 p-4 safe-area-pb z-50 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.5)]">
                <div className="flex gap-3 max-w-lg mx-auto">
                    <button className="flex-1 py-3.5 px-4 rounded-xl bg-surface-hover border border-white/10 text-gray-200 font-bold text-base hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm">
                        <span className="material-icons text-xl">print</span>
                        测试打印
                    </button>
                    <button
                        onClick={() => setShowPrinterModal(false)}
                        className="flex-[2] py-3.5 px-4 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-dark active:scale-[0.98] transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                    >
                        <span className="material-icons text-xl">save</span>
                        确认并保存
                    </button>
                </div>
            </div>
        </div>
    );

    // Update Check Modal
    const UpdateModal = () => (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface-dark w-full max-w-sm rounded-xl overflow-hidden border border-white/10 shadow-2xl animate-scale">
                <header className="p-6 text-center border-b border-white/10">
                    <h2 className="text-white text-xl font-bold">检查更新</h2>
                </header>
                <main className="p-6">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <span className="material-icons text-primary text-3xl">rocket_launch</span>
                        </div>
                        <p className="text-green-500 font-semibold text-lg">发现新版本 <span className="font-mono">v2.2.0</span></p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-gray-400 text-sm">当前版本: <span className="font-mono">v2.1.0</span></p>
                        <div className="bg-background-dark/50 rounded-lg p-4 border border-white/5">
                            <h3 className="text-white font-semibold mb-2 text-sm">更新内容:</h3>
                            <ul className="text-gray-300 text-sm space-y-3 leading-relaxed">
                                <li className="flex gap-2">
                                    <span className="text-primary">1.</span>
                                    <span>大幅提升扫码识别响应速度</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary">2.</span>
                                    <span>优化蓝牙电子秤连接稳定性</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary">3.</span>
                                    <span>修复报表导出时的数据偏差问题</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </main>
                <footer className="p-6 pt-2 space-y-3">
                    <button
                        onClick={() => {
                            setIsUpdating(true);
                            setTimeout(() => setShowUpdateModal(false), 2000);
                        }}
                        disabled={isUpdating}
                        className="w-full bg-primary hover:bg-primary-dark active:scale-95 transition-all text-white font-bold rounded-lg py-3.5 shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isUpdating ? (
                            <>
                                <span className="material-icons animate-spin text-sm mr-2">sync</span>
                                正在下载 v2.2.0...
                            </>
                        ) : (
                            "立即更新"
                        )}
                    </button>
                    {!isUpdating && (
                        <button
                            onClick={() => setShowUpdateModal(false)}
                            className="w-full text-gray-400 hover:text-white transition-colors py-3 text-sm font-medium"
                        >
                            稍后再说
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );

    // PDA Model Selection Modal
    const PdaModal = () => (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center animate-fade-in">
            <div className="bg-surface-dark w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-surface-dark sticky top-0 z-10">
                    <h3 className="text-xl font-bold text-white tracking-wide">选择 PDA 型号</h3>
                    <button onClick={() => setShowPdaModal(false)} className="p-1 rounded-full hover:bg-white/10 text-gray-400">
                        <span className="material-icons">close</span>
                    </button>
                </div>
                <div className="p-5 overflow-y-auto flex-1">
                    <div className="space-y-3">
                        <label className="relative group cursor-pointer block">
                            <input className="peer sr-only" name="pda_model" type="radio" value="NT20" checked={pdaModel === 'NT20'} onChange={() => setModel('NT20')} />
                            <div className="flex items-center p-4 rounded-xl border-2 border-transparent bg-surface-hover hover:border-white/20 transition-all peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:shadow-[0_0_15px_rgba(19,91,236,0.2)]">
                                <div className="h-12 w-12 rounded-lg bg-surface-dark border border-white/10 flex items-center justify-center shrink-0 text-white mr-4">
                                    <span className="material-icons text-2xl">smartphone</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-bold text-gray-200 peer-checked:text-white">NT20</div>
                                    {pdaModel === 'NT20' && <div className="text-sm text-primary font-medium">当前设备</div>}
                                </div>
                                <div className="h-6 w-6 rounded-full border-2 border-gray-600 peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                                    <span className="material-icons text-white text-sm">check</span>
                                </div>
                            </div>
                        </label>
                        <label className="relative group cursor-pointer block">
                            <input className="peer sr-only" name="pda_model" type="radio" value="DT50" checked={pdaModel === 'DT50'} onChange={() => setModel('DT50')} />
                            <div className="flex items-center p-4 rounded-xl border-2 border-transparent bg-surface-hover hover:border-white/20 transition-all peer-checked:border-primary peer-checked:bg-primary/10">
                                <div className="h-12 w-12 rounded-lg bg-background-dark/50 flex items-center justify-center shrink-0 text-gray-400 mr-4">
                                    <span className="material-icons text-2xl">ad_units</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-bold text-gray-200 peer-checked:text-white">DT50</div>
                                </div>
                                <div className="h-6 w-6 rounded-full border-2 border-gray-600 peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                                    <span className="material-icons text-white text-sm">check</span>
                                </div>
                            </div>
                        </label>
                        <label className="relative group cursor-pointer block">
                            <input className="peer sr-only" name="pda_model" type="radio" value="i6310" checked={pdaModel === 'i6310'} onChange={() => setModel('i6310')} />
                            <div className="flex items-center p-4 rounded-xl border-2 border-transparent bg-surface-hover hover:border-white/20 transition-all peer-checked:border-primary peer-checked:bg-primary/10">
                                <div className="h-12 w-12 rounded-lg bg-background-dark/50 flex items-center justify-center shrink-0 text-gray-400 mr-4">
                                    <span className="material-icons text-2xl">phone_android</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-bold text-gray-200 peer-checked:text-white">i6310</div>
                                </div>
                                <div className="h-6 w-6 rounded-full border-2 border-gray-600 peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                                    <span className="material-icons text-white text-sm">check</span>
                                </div>
                            </div>
                        </label>
                        <label className="relative group cursor-pointer block">
                            <input className="peer sr-only" name="pda_model" type="radio" value="Custom" checked={pdaModel === 'Custom'} onChange={() => setModel('Custom')} />
                            <div className="flex items-center p-4 rounded-xl border-2 border-transparent bg-surface-hover hover:border-white/20 transition-all peer-checked:border-primary peer-checked:bg-primary/10">
                                <div className="h-12 w-12 rounded-lg bg-background-dark/50 flex items-center justify-center shrink-0 text-gray-400 mr-4">
                                    <span className="material-icons text-2xl">devices_other</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-bold text-gray-200 peer-checked:text-white">Custom / 其他</div>
                                </div>
                                <div className="h-6 w-6 rounded-full border-2 border-gray-600 peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                                    <span className="material-icons text-white text-sm">check</span>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="p-5 border-t border-white/10 bg-surface-dark sticky bottom-0 z-10 pb-8 sm:pb-5">
                    <button onClick={() => setShowPdaModal(false)} className="w-full py-3.5 mb-3 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform flex items-center justify-center">
                        确认选择
                    </button>
                    <button onClick={() => setShowPdaModal(false)} className="w-full py-3.5 rounded-xl bg-transparent border border-white/10 text-gray-300 font-medium text-lg hover:bg-white/5 active:scale-[0.98] transition-all">
                        取消
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <header className="bg-surface-dark/95 backdrop-blur shadow-md z-50 sticky top-0 flex-shrink-0">
                <div className="px-4 py-4 flex items-center justify-between relative border-b border-white/5">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white">
                        <span className="material-icons">arrow_back_ios</span>
                    </button>
                    <h1 className="text-lg font-bold text-white tracking-wide ml-8">设置</h1>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                        <span className="text-primary cursor-pointer hover:text-white transition-colors">CN</span>
                        <span className="text-white/20">|</span>
                        <span className="cursor-pointer hover:text-white transition-colors">VN</span>
                        <span className="text-white/20">|</span>
                        <span className="cursor-pointer hover:text-white transition-colors">TH</span>
                        <span className="text-white/20">|</span>
                        <span className="cursor-pointer hover:text-white transition-colors">MM</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 overflow-y-auto flex flex-col gap-6 pb-24 no-scrollbar">
                <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">连接设置</h2>
                    <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-white/5 active:bg-surface-hover transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-primary">
                                    <span className="material-icons">bluetooth_connected</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">蓝牙秤</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-green-500">已连接</span>
                                <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-b border-white/5 active:bg-surface-hover transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                    <span className="material-icons">print</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">本地打印机</span>
                            </div>
                            <button
                                onClick={() => setShowPrinterModal(true)}
                                className="flex items-center gap-2"
                            >
                                <span className="text-sm text-gray-400">配置</span>
                                <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                            </button>
                        </div>
                        <button
                            onClick={() => navigate('/settings/bartender')}
                            className="w-full flex items-center justify-between p-4 active:bg-surface-hover transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
                                    <span className="material-icons">wysiwyg</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">BarTender 服务配置</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">云端模板</span>
                                <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                            </div>
                        </button>
                    </div>
                </section>

                <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">演示模式切换 (Demo Roles)</h2>
                    <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden">
                        <button onClick={() => navigate('/')} className="w-full flex items-center justify-between p-4 border-b border-white/5 active:bg-surface-hover transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                    <span className="material-icons">local_shipping</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">发出方视图 (Sender)</span>
                            </div>
                            <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                        </button>
                        <button onClick={() => navigate('/transit')} className="w-full flex items-center justify-between p-4 border-b border-white/5 active:bg-surface-hover transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                    <span className="material-icons">swap_horiz</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">中转方视图 (Transit)</span>
                            </div>
                            <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                        </button>
                        <button onClick={() => navigate('/receiver')} className="w-full flex items-center justify-between p-4 border-b border-white/5 active:bg-surface-hover transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                    <span className="material-icons">input</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">接收方视图 (Receiver)</span>
                            </div>
                            <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                        </button>
                        <button onClick={() => navigate('/finance')} className="w-full flex items-center justify-between p-4 border-b border-white/5 active:bg-surface-hover transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                    <span className="material-icons">account_balance_wallet</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">财务方视图 (Finance)</span>
                            </div>
                            <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                        </button>
                        <button onClick={() => navigate('/sender/monitor')} className="w-full flex items-center justify-between p-4 border-b border-white/5 active:bg-surface-hover transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                                    <span className="material-icons">dashboard</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">监控大屏 (Monitor)</span>
                            </div>
                            <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                        </button>
                        <button onClick={() => navigate('/supervisor/risk')} className="w-full flex items-center justify-between p-4 border-b border-white/5 active:bg-surface-hover transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                    <span className="material-icons">admin_panel_settings</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">主管面板 (Supervisor)</span>
                            </div>
                            <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                        </button>
                        <button onClick={() => navigate('/batch-manager')} className="w-full flex items-center justify-between p-4 active:bg-surface-hover transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                    <span className="material-icons">inventory</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">批次管理 (Batch Pro)</span>
                            </div>
                            <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                        </button>
                    </div>
                </section>

                <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">扫码配置</h2>
                    <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden">
                        <div className="flex flex-col p-4 border-b border-white/5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                        <span className="material-icons">qr_code_scanner</span>
                                    </div>
                                    <span className="text-base font-medium text-gray-200">扫码模式</span>
                                </div>
                                <button
                                    onClick={() => setShowPdaModal(true)}
                                    className="text-xs text-primary hover:text-primary-light transition-colors border border-primary/30 px-2 py-1 rounded hover:bg-primary/10"
                                >
                                    PDA型号设置
                                </button>
                            </div>
                            <div className="flex bg-background-dark p-1 rounded-lg">
                                <button className="flex-1 py-2 rounded text-sm font-medium bg-surface-hover text-white shadow text-center transition-all">广播模式</button>
                                <button className="flex-1 py-2 rounded text-sm font-medium text-gray-500 hover:text-gray-300 text-center transition-all">键盘输入</button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-surface-hover text-gray-400">
                                    <span className="material-icons">volume_up</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">提示音语言</span>
                            </div>
                            <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                <input defaultChecked type="checkbox" name="toggle" id="toggle-sound" className="absolute block w-6 h-6 rounded-full bg-white border-4 border-surface-dark appearance-none cursor-pointer transition-all duration-300 left-0 checked:right-0 checked:border-primary checked:translate-x-full peer" />
                                <label htmlFor="toggle-sound" className="block overflow-hidden h-6 rounded-full bg-surface-hover cursor-pointer border border-white/5 peer-checked:bg-primary"></label>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-surface-hover text-gray-400">
                                    <span className="material-icons">vibration</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">震动反馈</span>
                            </div>
                            <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                <input defaultChecked type="checkbox" name="toggle" id="toggle-vibrate" className="absolute block w-6 h-6 rounded-full bg-white border-4 border-surface-dark appearance-none cursor-pointer transition-all duration-300 left-0 checked:right-0 checked:border-primary checked:translate-x-full peer" />
                                <label htmlFor="toggle-vibrate" className="block overflow-hidden h-6 rounded-full bg-surface-hover cursor-pointer border border-white/5 peer-checked:bg-primary"></label>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">系统</h2>
                    <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                                    <span className="material-icons">wb_sunny</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">屏幕常亮</span>
                            </div>
                            <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="toggle-screen" className="absolute block w-6 h-6 rounded-full bg-white border-4 border-surface-dark appearance-none cursor-pointer transition-all duration-300 left-0 checked:right-0 checked:border-primary checked:translate-x-full peer" />
                                <label htmlFor="toggle-screen" className="block overflow-hidden h-6 rounded-full bg-surface-hover cursor-pointer border border-white/5 peer-checked:bg-primary"></label>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowUpdateModal(true)}
                            className="w-full flex items-center justify-between p-4 active:bg-surface-hover transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-surface-hover text-gray-400">
                                    <span className="material-icons">system_update</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">检查更新</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400 font-mono">v2.1.0</span>
                                <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                            </div>
                        </button>
                    </div>
                </section>

                <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">设备信息</h2>
                    <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">设备型号</span>
                            <span className="text-sm font-medium text-white font-mono">NT20</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">设备编号</span>
                            <span className="text-sm font-medium text-white font-mono">NT20-001</span>
                        </div>
                    </div>
                </section>

                <div className="mt-4">
                    <button onClick={() => navigate('/login')} className="w-full py-4 rounded-xl bg-surface-dark border border-danger/30 text-danger font-bold text-lg hover:bg-danger hover:text-white transition-all active:scale-[0.98] shadow-lg">
                        退出登录
                    </button>
                </div>
            </main>

            {/* Render Modals */}
            {showPrinterModal && <PrinterModal />}
            {showUpdateModal && <UpdateModal />}
            {showPdaModal && <PdaModal />}
        </div>
    );
};

export default Settings;
