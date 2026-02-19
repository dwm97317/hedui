import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScannerStore } from '../../store/scanner.store';
import { useUserStore } from '../../store/user.store';
import { updateService, AppVersion } from '../../services/update.service';
import toast from 'react-hot-toast';
import pkg from '../../package.json';
import { StaffService, StaffProfile } from '../../services/staff.service';
import { supabase } from '../../services/supabase';
import { useBluetoothStore } from '../../store/bluetooth.store';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useUserStore();
    const {
        model: pdaModel, setModel, scanAction, scanExtra, setConfig,
        reprintMode, setReprintMode,
        weightAuditAbs, setWeightAuditAbs,
        weightAuditPercent, setWeightAuditPercent,
        exportMode, setExportMode
    } = useScannerStore();
    const btState = useBluetoothStore();
    const [showPrinterModal, setShowPrinterModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showPdaModal, setShowPdaModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [latestVersion, setLatestVersion] = useState<AppVersion | null>(null);
    const [checking, setChecking] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

    React.useEffect(() => {
        (window as any).onUpdateProgress = (progress: number) => {
            if (progress === -1) {
                setIsUpdating(false);
                setDownloadProgress(null);
                toast.error('下载失败，请重试');
                return;
            }
            setDownloadProgress(progress);
            if (progress === 100) {
                // Keep modal open briefly or close it as Android will pop up installer
                setTimeout(() => {
                    setIsUpdating(false);
                    setDownloadProgress(null);
                    setShowUpdateModal(false);
                }, 1000);
            }
        };
        return () => {
            delete (window as any).onUpdateProgress;
        };
    }, []);

    const currentVersion = pkg.version;

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

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
    const UpdateModal = () => {
        if (!latestVersion) return null;

        const hasNewVersion = latestVersion.version_name !== `v${currentVersion}` && latestVersion.version_name !== currentVersion;

        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                <div className="bg-surface-dark w-full max-w-sm rounded-xl overflow-hidden border border-white/10 shadow-2xl animate-scale">
                    <header className="p-6 text-center border-b border-white/10">
                        <h2 className="text-white text-xl font-bold">{hasNewVersion ? '发现新版本' : '检查更新'}</h2>
                    </header>
                    <main className="p-6">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <span className="material-icons text-primary text-3xl">
                                    {hasNewVersion ? 'rocket_launch' : 'check_circle'}
                                </span>
                            </div>
                            {hasNewVersion ? (
                                <p className="text-green-500 font-semibold text-lg">新版本 <span className="font-mono">{latestVersion.version_name}</span></p>
                            ) : (
                                <p className="text-gray-400 font-semibold text-lg">已是最新版本</p>
                            )}
                        </div>
                        <div className="space-y-4">
                            <p className="text-gray-400 text-sm">当前版本: <span className="font-mono">v{currentVersion}</span></p>
                            {hasNewVersion && (
                                <div className="bg-background-dark/50 rounded-lg p-4 border border-white/5">
                                    <h3 className="text-white font-semibold mb-2 text-sm">更新内容:</h3>
                                    <div className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
                                        {latestVersion.changelog || '优化系统体验，修复已知问题。'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                    <footer className="p-6 pt-2">
                        <div className="min-h-[56px] flex items-center justify-center">
                            {hasNewVersion ? (
                                <button
                                    onClick={() => {
                                        if ((window as any).Android?.startDownload) {
                                            setIsUpdating(true);
                                            setDownloadProgress(0);
                                            const apkName = `hedui_v${latestVersion.version_name.replace('v', '')}.apk`;
                                            (window as any).Android.startDownload(latestVersion.download_url, apkName);
                                            toast.success('开始下载新版本...');
                                        } else {
                                            setIsUpdating(true);
                                            window.open(latestVersion.download_url, '_blank');
                                            toast.success('正在打开浏览器下载...');
                                            setTimeout(() => {
                                                setIsUpdating(false);
                                                setShowUpdateModal(false);
                                            }, 3000);
                                        }
                                    }}
                                    disabled={isUpdating}
                                    className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all text-white font-bold rounded-lg py-3.5 shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    {isUpdating ? (
                                        <div className="w-full px-4">
                                            <div className="flex justify-between text-[10px] text-white/70 font-bold mb-1.5 uppercase tracking-wider">
                                                <span>正在同步数据包...</span>
                                                <span className="font-mono">{downloadProgress}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-white transition-all duration-300 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                                    style={{ width: `${downloadProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ) : (
                                        "立即更新"
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowUpdateModal(false)}
                                    className="w-full bg-surface-hover hover:bg-white/10 text-white font-bold rounded-lg py-3.5 border border-white/10 active:scale-[0.98] transition-all"
                                >
                                    我知道了
                                </button>
                            )}
                        </div>
                        {hasNewVersion && !isUpdating && (
                            <button
                                onClick={() => setShowUpdateModal(false)}
                                className="w-full text-gray-400 hover:text-white transition-colors py-3 text-sm font-medium mt-2"
                            >
                                稍后再说
                            </button>
                        )}
                    </footer>
                </div>
            </div>
        );
    };

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

                        {/* Custom Configuration Fields */}
                        {pdaModel === 'Custom' && (
                            <div className="mt-4 p-4 bg-background-dark/30 rounded-xl border border-white/5 space-y-4 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Broadcast Action (广播意图)</label>
                                    <input
                                        type="text"
                                        value={scanAction}
                                        onChange={(e) => setConfig(e.target.value, scanExtra)}
                                        className="w-full bg-surface-hover border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="e.g. android.intent.action.SCAN_RESULT"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Data Extra (数据标签)</label>
                                    <input
                                        type="text"
                                        value={scanExtra}
                                        onChange={(e) => setConfig(scanAction, e.target.value)}
                                        className="w-full bg-surface-hover border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="e.g. android.intent.extra.SCAN_BROADCAST_DATA"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 italic">
                                    * 请根据 PDA 厂商提供的文档设置对应的广播 Action 和 Data Extra。
                                </p>
                            </div>
                        )}
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

    // Staff Detail Modal (Permission Settings) - Screen 2 Style
    const StaffDetailModal = ({ staff, onClose, onRefresh }: { staff: StaffProfile; onClose: () => void; onRefresh: () => void }) => {
        const [isRemoving, setIsRemoving] = useState(false);

        const togglePermission = async (permission: string) => {
            let next = [...(staff.permissions || [])];
            if (next.includes(permission)) {
                next = next.filter(p => p !== permission);
            } else {
                next.push(permission);
            }
            try {
                await StaffService.updatePermissions(staff.id, next);
                toast.success('权限已更新');
                onRefresh();
            } catch (e) {
                toast.error('更新失败');
            }
        };

        const handleRemoveStaff = async () => {
            if (!window.confirm(`确定要移除员工 ${staff.full_name} 吗？\n移除后该员工将无法访问公司数据。`)) return;
            setIsRemoving(true);
            try {
                await StaffService.removeStaff(staff.id);
                toast.success('员工已移除');
                onRefresh();
                onClose();
            } catch (e) {
                toast.error('移除失败');
            } finally {
                setIsRemoving(false);
            }
        };

        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                <div className="relative w-full max-w-[360px] flex flex-col gap-6 overflow-hidden rounded-[24px] border border-white/10 bg-[#1e2330]/80 p-6 shadow-2xl backdrop-blur-xl animate-scale">
                    {/* Close Button */}
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                        <span className="material-icons text-[20px]">close</span>
                    </button>

                    {/* Profile Section */}
                    <div className="flex flex-col items-center gap-3 pt-2">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 p-0.5 shadow-lg ring-2 ring-white/5 flex items-center justify-center overflow-hidden">
                                {staff.full_name?.[0] || 'U'}
                            </div>
                            <div className="absolute bottom-0 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 ring-2 ring-[#1e2330]">
                                <span className="material-icons text-white text-[14px]">check</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white tracking-tight">{staff.full_name}</h2>
                            <p className="text-sm font-medium text-gray-400 mt-1">{staff.email}</p>
                            <div className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary ring-1 ring-inset ring-primary/20">
                                {staff.is_master ? 'MASTER OWNER' : 'OFFICIAL STAFF'}
                            </div>
                        </div>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                    {/* Permissions List */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 pl-1">权限设置 (Access Control)</h3>

                        {[
                            { id: 'warehouse', label: '仓库操作权限', desc: '入库、出库与盘点', icon: 'inventory_2', color: 'indigo' },
                            { id: 'finance', label: '财务对账权限', desc: '查看报表与对账', icon: 'account_balance_wallet', color: 'emerald' },
                            { id: 'manager', label: '企业管理权限', desc: '人员管理与系统设置', icon: 'admin_panel_settings', color: 'orange' }
                        ].map(p => (
                            <div key={p.id} className="group flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3.5 transition-colors border border-white/5">
                                <div className="flex items-center gap-3.5">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-${p.color}-500/20 text-${p.color}-400`}>
                                        <span className="material-icons text-xl">{p.icon}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white">{p.label}</span>
                                        <span className="text-[10px] text-gray-400 font-medium">{p.desc}</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={staff.permissions?.includes(p.id)}
                                        onChange={() => togglePermission(p.id)}
                                        disabled={staff.is_master}
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full outline-none"></div>
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                        <button
                            onClick={onClose}
                            className="flex w-full items-center justify-center rounded-xl bg-primary py-4 text-sm font-black text-white shadow-xl shadow-primary/30 active:scale-[0.98] transition-all"
                        >
                            保存并返回
                        </button>
                        {!staff.is_master && (
                            <button
                                onClick={handleRemoveStaff}
                                disabled={isRemoving}
                                className="flex w-full items-center justify-center rounded-xl bg-transparent py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                                <span className="material-icons mr-1.5 text-base">person_remove</span>
                                {isRemoving ? '正在移除...' : '移除该成员'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Add Staff Directly Modal - Generated from Stitch UI "create for employee"
    const AddStaffModal = ({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) => {
        const { user } = useUserStore();
        const [loading, setLoading] = useState(false);
        const [formData, setFormData] = useState({
            fullName: '',
            email: '',
            password: '',
            permissions: [] as string[]
        });
        const [showPassword, setShowPassword] = useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!user?.company_id) return;
            setLoading(true);

            try {
                await StaffService.createStaffDirectly({
                    ...formData,
                    companyId: user.company_id,
                    companyRole: user.role || 'sender', // Default to sender role if unknown
                });
                toast.success('员工账号已创建');
                if (onRefresh) onRefresh();
                onClose();
            } catch (error: any) {
                toast.error(error.message || '创建失败');
            } finally {
                setLoading(false);
            }
        };

        const togglePermission = (p: string) => {
            setFormData(prev => ({
                ...prev,
                permissions: prev.permissions.includes(p)
                    ? prev.permissions.filter(x => x !== p)
                    : [...prev.permissions, p]
            }));
        };

        return (
            <div className="fixed inset-0 z-[80] bg-[#0f172a] flex flex-col animate-slide-up">
                <header className="flex items-center justify-between px-4 py-3 bg-[#111827]/90 backdrop-blur-md border-b border-white/5">
                    <button onClick={onClose} className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                        <span className="material-icons">close</span>
                    </button>
                    <h1 className="text-lg font-black tracking-tight text-white">添加团队成员</h1>
                    <div className="w-10"></div>
                </header>

                <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-32">
                    <form id="add-staff-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Input Fields */}
                        <div className="space-y-5">
                            <div className="group">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2 block">姓名 (FULL NAME)</label>
                                <div className="relative">
                                    <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">person</span>
                                    <input
                                        required
                                        className="w-full h-14 pl-12 pr-4 bg-[#1e293b] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner"
                                        placeholder="请输入员工真实姓名"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData(x => ({ ...x, fullName: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2 block">邮箱 (EMAIL)</label>
                                <div className="relative">
                                    <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">alternate_email</span>
                                    <input
                                        required
                                        type="email"
                                        className="w-full h-14 pl-12 pr-4 bg-[#1e293b] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData(x => ({ ...x, email: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2 block">登录密码 (PASSWORD)</label>
                                <div className="relative">
                                    <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">lock</span>
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        className="w-full h-14 pl-12 pr-12 bg-[#1e293b] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner"
                                        placeholder="设置初始登录密码"
                                        value={formData.password}
                                        onChange={(e) => setFormData(x => ({ ...x, password: e.target.value }))}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 p-1"
                                    >
                                        <span className="material-icons text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Permissions Section */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 block">权限设置 (ACCESS CONTROL)</label>
                            <div className="bg-[#1e293b] rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                                {[
                                    { id: 'warehouse', label: '仓库操作权限', desc: '入库、出库与查验', icon: 'inventory_2', color: 'indigo' },
                                    { id: 'finance', label: '财务对账权限', desc: '查看报表与利润统计', icon: 'account_balance_wallet', color: 'emerald' },
                                    { id: 'manager', label: '管理员权限', desc: '人员管理与系统设置', icon: 'admin_panel_settings', color: 'orange' }
                                ].map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${p.color}-500/20 text-${p.color}-400`}>
                                                <span className="material-icons text-xl">{p.icon}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white">{p.label}</span>
                                                <span className="text-[10px] text-gray-500 font-medium">{p.desc}</span>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={formData.permissions.includes(p.id)}
                                                onChange={() => togglePermission(p.id)}
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full outline-none"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </main>

                <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/90 backdrop-blur-xl border-t border-white/5 p-6 z-[90]">
                    <button
                        form="add-staff-form"
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-black text-base shadow-2xl shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group overflow-hidden"
                    >
                        {loading ? (
                            <>
                                <span className="material-icons animate-spin">refresh</span>
                                正在创建账号...
                            </>
                        ) : (
                            <>
                                保存并创建账号
                                <span className="material-icons text-xl group-hover:translate-x-1 transition-transform">person_add</span>
                            </>
                        )}
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
                    </button>
                </div>
            </div>
        );
    };

    // Staff Management Modal - Screen 1 Style
    const StaffManagementModal = () => {
        const { user } = useUserStore();
        const [staff, setStaff] = React.useState<StaffProfile[]>([]);
        const [loading, setLoading] = React.useState(true);
        const [search, setSearch] = React.useState('');
        const [selectedStaff, setSelectedStaff] = React.useState<StaffProfile | null>(null);

        const fetchStaff = async () => {
            if (!user?.company_id) return;
            setLoading(true);
            try {
                const data = await StaffService.getStaff(user.company_id);
                setStaff(data);
                // Update selected staff if it's currently open
                if (selectedStaff) {
                    const updated = data.find(s => s.id === selectedStaff.id);
                    if (updated) setSelectedStaff(updated);
                }
            } catch (e) {
                toast.error('获取员工列表失败');
            } finally {
                setLoading(false);
            }
        };

        React.useEffect(() => {
            fetchStaff();
        }, []);

        const filteredStaff = staff.filter(s =>
            s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            s.email?.toLowerCase().includes(search.toLowerCase())
        );

        const copyToClipboard = (text: string) => {
            if (!text) return;
            navigator.clipboard.writeText(text);
            toast.success('邀请码已复制');
        };

        return (
            <div className="fixed inset-0 z-[60] bg-[#0f172a] flex flex-col animate-slide-up">
                <header className="flex items-center justify-between px-4 py-3 bg-[#111827]/90 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
                    <button onClick={() => setShowStaffModal(false)} className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                        <span className="material-icons">arrow_back_ios_new</span>
                    </button>
                    <h1 className="text-lg font-black tracking-tight text-white">团队管理</h1>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowAddStaffModal(true)}
                            className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 text-primary transition-colors"
                        >
                            <span className="material-icons">person_add_alt_1</span>
                        </button>
                        <button onClick={fetchStaff} className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                            <span className="material-icons">refresh</span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
                    {/* Screen 1 Company Card */}
                    <div className="p-4">
                        <div className="bg-[#1e293b] rounded-2xl p-5 border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>
                            <div className="relative z-10">
                                <div className="flex flex-col gap-1 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons text-primary" style={{ fontSize: '20px' }}>domain</span>
                                        <h2 className="text-lg font-black text-white">{user?.company?.name || '越通物流'}</h2>
                                    </div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-7 opacity-60">(中转方)</p>
                                </div>
                                <div className="flex flex-col gap-3 bg-[#0f172a]/50 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">团队邀请码 (JOIN CODE)</span>
                                        <span className="text-2xl font-mono font-black text-white tracking-[0.2em]">{user?.company?.code || 'HT-8890'}</span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(user?.company?.code || '')}
                                        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-95 text-white w-full py-3.5 rounded-xl text-sm font-black transition-all shadow-xl shadow-primary/20"
                                    >
                                        <span className="material-icons" style={{ fontSize: '18px' }}>content_copy</span>
                                        <span>复制邀请码</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="px-4 pb-2 sticky top-0 z-30 bg-[#0f172a]/95 backdrop-blur-sm pt-2 -mt-2">
                        <div className="relative group">
                            <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors text-lg">search</span>
                            <input
                                className="block w-full pl-12 pr-4 py-4 border-none rounded-2xl bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner"
                                placeholder="搜索员工姓名或邮箱..."
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-between items-center mt-4 mb-2 px-1">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">团队资源 ({loading ? '...' : filteredStaff.length})</h3>
                            <span className="text-[10px] text-primary font-black flex items-center gap-1 uppercase tracking-widest cursor-pointer">
                                <span className="material-icons" style={{ fontSize: '14px' }}>filter_list</span>
                                筛选
                            </span>
                        </div>
                    </div>

                    {/* Staff List */}
                    <div className="px-4 space-y-3 pb-4">
                        {loading ? (
                            <div className="py-12 flex flex-col items-center gap-4">
                                <span className="material-icons animate-spin text-4xl text-primary/30">refresh</span>
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">同步中...</span>
                            </div>
                        ) : filteredStaff.length === 0 ? (
                            <div className="py-12 text-center opacity-30">
                                <span className="material-icons text-6xl block mb-2">person_off</span>
                                <p className="text-sm font-bold uppercase tracking-widest">暂无记录</p>
                            </div>
                        ) : filteredStaff.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setSelectedStaff(s)}
                                className="bg-[#1e293b] hover:bg-[#1e293b]/80 rounded-2xl p-4 flex items-center gap-4 transition-all border border-white/5 cursor-pointer group active:scale-[0.98]"
                            >
                                <div className="relative shrink-0">
                                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-black text-white text-xl border-2 border-[#1e293b] group-hover:border-primary/50 transition-colors shadow-lg">
                                        {s.full_name?.[0] || 'U'}
                                    </div>
                                    <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#1e293b] ${s.is_master ? 'bg-primary' : 'bg-green-500'}`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className="text-white text-base font-black truncate">{s.full_name}</p>
                                        {s.is_master && (
                                            <span className="bg-primary/20 text-primary text-[9px] px-2 py-0.5 rounded-full font-black border border-primary/20 uppercase tracking-tighter">MASTER</span>
                                        )}
                                    </div>
                                    <p className="text-slate-400 text-[11px] font-medium truncate mb-2 opacity-60 italic">{s.email}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {s.permissions?.includes('warehouse') && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-slate-800 text-slate-400 border border-white/5">仓管</span>
                                        )}
                                        {s.permissions?.includes('finance') && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-slate-800 text-slate-400 border border-white/5">财务</span>
                                        )}
                                        {s.permissions?.includes('manager') && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-primary/20 text-primary border border-primary/10">主管</span>
                                        )}
                                        {(!s.permissions || s.permissions.length === 0) && !s.is_master && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-slate-800/50 text-slate-600 border border-white/5 italic">未指派权限</span>
                                        )}
                                    </div>
                                </div>
                                <div className="shrink-0 text-slate-600 group-hover:text-primary transition-colors">
                                    <span className="material-icons">chevron_right</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                {/* Bottom Bar */}
                <div className="bg-[#111827]/90 backdrop-blur-xl border-t border-white/5 pb-8 pt-3 z-50 fixed bottom-0 w-full px-6">
                    <button
                        onClick={() => setShowStaffModal(false)}
                        className="w-full py-4 rounded-2xl bg-white/5 text-white/50 text-sm font-black uppercase tracking-[0.2em] border border-white/5 active:scale-95 transition-all"
                    >
                        关闭控制台
                    </button>
                </div>

                {/* Detail Modal layer */}
                {selectedStaff && (
                    <StaffDetailModal
                        staff={selectedStaff}
                        onClose={() => setSelectedStaff(null)}
                        onRefresh={fetchStaff}
                    />
                )}

                {/* Add Staff Modal layer */}
                {showAddStaffModal && (
                    <AddStaffModal
                        onClose={() => setShowAddStaffModal(false)}
                        onRefresh={fetchStaff}
                    />
                )}
            </div>
        );
    };

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
                {(user?.is_master || user?.role === 'admin') && (
                    <section>
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">公司管理</h2>
                        <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden">
                            <button
                                onClick={() => setShowStaffModal(true)}
                                className="w-full flex items-center justify-between p-4 active:bg-surface-hover transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                        <span className="material-icons">manage_accounts</span>
                                    </div>
                                    <span className="text-base font-medium text-gray-200">员工账号与权限管理</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">管理</span>
                                    <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                                </div>
                            </button>
                        </div>
                    </section>
                )}

                {/* ─── Wallet Section ─── */}
                <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">财务钱包</h2>
                    <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden">
                        <button
                            onClick={() => navigate('/wallet')}
                            className="w-full flex items-center justify-between p-4 active:bg-surface-hover transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary border border-primary/10 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all">
                                    <span className="material-icons text-xl">account_balance_wallet</span>
                                </div>
                                <div className="text-left">
                                    <span className="text-base font-bold text-gray-200 block">我的钱包</span>
                                    <span className="text-[10px] font-medium text-gray-500">查看批次账单、余额与流水</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 uppercase">
                                    {user?.role === 'sender' ? 'Bill A+C' : user?.role === 'transit' ? 'Bill B' : user?.role === 'receiver' ? 'Bill C' : 'ALL'}
                                </span>
                                <span className="material-icons text-gray-500 text-sm group-hover:text-primary transition-colors">chevron_right</span>
                            </div>
                        </button>
                    </div>
                </section>

                <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">连接设置</h2>
                    <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden">
                        <button
                            onClick={() => navigate('/settings/bluetooth')}
                            className="w-full flex items-center justify-between p-4 border-b border-white/5 active:bg-surface-hover transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-primary">
                                    <span className="material-icons">monitor_weight</span>
                                </div>
                                <div>
                                    <span className="text-base font-medium text-gray-200 block">蓝牙电子秤</span>
                                    {btState.scaleDevice && (
                                        <span className="text-[10px] text-gray-500">{btState.scaleDevice.name}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {btState.scaleDevice ? (
                                    <span className="text-sm font-medium text-green-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        已连接
                                    </span>
                                ) : (
                                    <span className="text-sm text-gray-500">未连接</span>
                                )}
                                <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/settings/bluetooth')}
                            className="w-full flex items-center justify-between p-4 border-b border-white/5 active:bg-surface-hover transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                    <span className="material-icons">print</span>
                                </div>
                                <div>
                                    <span className="text-base font-medium text-gray-200 block">蓝牙标签打印机</span>
                                    {btState.printerDevice && (
                                        <span className="text-[10px] text-gray-500">{btState.printerDevice.name}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {btState.printerDevice ? (
                                    <span className="text-sm font-medium text-green-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        已连接
                                    </span>
                                ) : (
                                    <span className="text-sm text-gray-500">未连接</span>
                                )}
                                <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/settings/label-templates')}
                            className="w-full flex items-center justify-between p-4 border-b border-white/5 active:bg-surface-hover transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                    <span className="material-icons">label</span>
                                </div>
                                <span className="text-base font-medium text-gray-200">标签模板管理</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">可视化编辑</span>
                                <span className="material-icons text-gray-500 text-sm">chevron_right</span>
                            </div>
                        </button>
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
                        <div className="flex flex-col p-4 border-b border-white/5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                        <span className="material-icons">print</span>
                                    </div>
                                    <span className="text-base font-medium text-gray-200">Re-print 模式</span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">扫描已存在单号时</span>
                            </div>
                            <div className="flex bg-background-dark p-1 rounded-lg">
                                <button
                                    onClick={() => setReprintMode('copy')}
                                    className={`flex-1 py-2 rounded text-sm font-medium transition-all ${reprintMode === 'copy' ? 'bg-surface-hover text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    快速复制
                                </button>
                                <button
                                    onClick={() => setReprintMode('update')}
                                    className={`flex-1 py-2 rounded text-sm font-medium transition-all ${reprintMode === 'update' ? 'bg-surface-hover text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    称重更新
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col p-4 border-b border-white/5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                        <span className="material-icons">balance</span>
                                    </div>
                                    <span className="text-base font-medium text-gray-200">重量差异预警 (Audit)</span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">三方重量审计</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-background-dark p-3 rounded-xl border border-white/5">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">绝对值 (KG)</label>
                                    <input
                                        type="number"
                                        value={weightAuditAbs}
                                        onChange={(e) => setWeightAuditAbs(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-transparent text-white font-bold outline-none"
                                    />
                                </div>
                                <div className="bg-background-dark p-3 rounded-xl border border-white/5">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">百分比 (%)</label>
                                    <input
                                        type="number"
                                        value={weightAuditPercent}
                                        onChange={(e) => setWeightAuditPercent(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-transparent text-white font-bold outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex bg-background-dark p-1 rounded-lg">
                                <button
                                    onClick={() => setExportMode('anomaly')}
                                    className={`flex-1 py-2 rounded text-sm font-medium transition-all ${exportMode === 'anomaly' ? 'bg-orange-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    仅导出异常单
                                </button>
                                <button
                                    onClick={() => setExportMode('all')}
                                    className={`flex-1 py-2 rounded text-sm font-medium transition-all ${exportMode === 'all' ? 'bg-orange-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    全量数据标记
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-2 px-1">满足任一阈值即触发报警。红色单号代表差异异常。</p>
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
                            onClick={async () => {
                                if (checking) return;
                                setChecking(true);
                                const loadingToast = toast.loading('正在检查更新...');
                                try {
                                    const response = await updateService.getLatestVersion();
                                    if (response.success && response.data) {
                                        setLatestVersion(response.data);
                                        setShowUpdateModal(true);
                                        toast.dismiss(loadingToast);
                                    } else {
                                        toast.error('检查更新失败: ' + response.error, { id: loadingToast });
                                    }
                                } catch (e) {
                                    toast.error('检查更新出错', { id: loadingToast });
                                } finally {
                                    setChecking(false);
                                }
                            }}
                            disabled={checking}
                            className="w-full flex items-center justify-between p-4 active:bg-surface-hover transition-colors disabled:opacity-70"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-surface-hover text-gray-400">
                                    <span className={`material-icons ${checking ? 'animate-spin' : ''}`}>
                                        {checking ? 'sync' : 'system_update'}
                                    </span>
                                </div>
                                <span className="text-base font-medium text-gray-200">检查更新</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400 font-mono">v{currentVersion}</span>
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
                    <button onClick={handleLogout} className="w-full py-4 rounded-xl bg-surface-dark border border-danger/30 text-danger font-bold text-lg hover:bg-danger hover:text-white transition-all active:scale-[0.98] shadow-lg">
                        退出登录
                    </button>
                </div>
            </main>

            {/* Render Modals */}
            {showPrinterModal && <PrinterModal />}
            {showUpdateModal && <UpdateModal />}
            {showPdaModal && <PdaModal />}
            {showStaffModal && <StaffManagementModal />}
        </div>
    );
};

export default Settings;
