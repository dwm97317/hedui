import React from 'react';
import { useNavigate } from 'react-router-dom';

const BatchManager: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f8f7f5] dark:bg-[#221910] text-gray-800 dark:text-gray-100 font-display h-screen flex flex-col overflow-hidden relative shadow-2xl">
      <header className="bg-[#1a120b]/90 backdrop-blur-sm pt-12 pb-4 px-4 sticky top-0 z-30 border-b border-[#f27f0d]/10 shrink-0">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-[#f27f0d]/10 active:bg-[#f27f0d]/20 text-gray-800 dark:text-white transition-colors">
                    <span className="material-icons">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">批次 #HB-2024-X9</h1>
                    <p className="text-xs text-[#f27f0d]/80 font-medium">集货区 B</p>
                </div>
            </div>
            <div className="flex items-center bg-[#32261a] rounded-full p-1 border border-[#f27f0d]/20">
                <span className="material-icons text-xs text-gray-400 ml-2 mr-1">lock_open</span>
                <label className="flex items-center cursor-pointer relative" htmlFor="edit-lock">
                    <input defaultChecked className="sr-only peer" id="edit-lock" type="checkbox"/>
                    <div className="w-10 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#f27f0d]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f27f0d]"></div>
                    <span className="ml-2 text-xs font-medium text-white mr-2" id="lock-label">已锁定</span>
                </label>
            </div>
        </div>
        <div className="bg-[#32261a] p-1 rounded-xl flex relative">
            <div className="w-1/2 h-full absolute left-0 top-0 bg-transparent"></div>
            <button className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-[#f27f0d] shadow-lg flex items-center justify-center space-x-2 relative z-10">
                <span className="material-icons text-lg">call_merge</span>
                <span>合并</span>
            </button>
            <button className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white flex items-center justify-center space-x-2 relative z-10 transition-colors">
                <span className="material-icons text-lg">call_split</span>
                <span>拆分</span>
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 no-scrollbar">
        <section className="bg-[#32261a] rounded-xl p-4 shadow-lg border border-[#f27f0d]/10 relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <span className="material-icons text-9xl text-[#f27f0d] transform rotate-12 -mr-8 -mt-8">inventory_2</span>
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h2 className="text-sm text-gray-400 uppercase tracking-wider font-semibold">批次进度</h2>
                    <div className="flex items-baseline space-x-1 mt-1">
                        <span className="text-3xl font-bold text-white">45</span>
                        <span className="text-lg text-gray-500">/ 50</span>
                    </div>
                </div>
                <div className="relative w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'conic-gradient(#f27f0d 90%, #32261a 0)' }}>
                    <div className="w-11 h-11 bg-[#32261a] rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-[#f27f0d]">90%</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-[#f27f0d]/10 pt-4 relative z-10">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">总重量</span>
                    <div className="flex items-center text-white">
                        <span className="material-icons text-[#f27f0d] text-sm mr-1">scale</span>
                        <span className="font-mono font-medium">124.5 kg</span>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">总体积</span>
                    <div className="flex items-center text-white">
                        <span className="material-icons text-[#f27f0d] text-sm mr-1">aspect_ratio</span>
                        <span className="font-mono font-medium">2.1 m³</span>
                    </div>
                </div>
            </div>
        </section>

        <section className="space-y-3">
            <div className="flex justify-between items-end">
                <h3 className="text-gray-800 dark:text-white font-semibold text-lg flex items-center">
                    <span className="w-1 h-5 bg-[#f27f0d] rounded-full mr-2"></span>
                    选择包裹进行合并
                </h3>
                <span className="text-xs text-[#f27f0d] bg-[#f27f0d]/10 px-2 py-1 rounded">2 已选</span>
            </div>
            <div className="bg-[#32261a] rounded-xl p-4 border border-[#f27f0d] shadow-md relative group transition-all active:scale-[0.98]">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#f27f0d] rounded-l-xl"></div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-[#f27f0d] flex items-center justify-center text-white">
                            <span className="material-icons font-bold">check</span>
                        </div>
                        <div>
                            <div className="text-base font-bold text-white">#883921-A</div>
                            <div className="text-xs text-gray-400">库位: A-12 • 12.5kg</div>
                        </div>
                    </div>
                    <div className="bg-[#1a120b] p-2 rounded-lg">
                        <span className="material-icons text-gray-400">qr_code</span>
                    </div>
                </div>
            </div>
            <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-[#1a120b] border border-[#f27f0d]/30 rounded-full p-1.5 shadow-xl">
                    <span className="material-icons text-[#f27f0d]">link</span>
                </div>
            </div>
            <div className="bg-[#32261a] rounded-xl p-4 border border-[#f27f0d] shadow-md relative group transition-all active:scale-[0.98]">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#f27f0d] rounded-l-xl"></div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-[#f27f0d] flex items-center justify-center text-white">
                            <span className="material-icons font-bold">check</span>
                        </div>
                        <div>
                            <div className="text-base font-bold text-white">#883922-B</div>
                            <div className="text-xs text-gray-400">库位: A-12 • 8.2kg</div>
                        </div>
                    </div>
                    <div className="bg-[#1a120b] p-2 rounded-lg">
                        <span className="material-icons text-gray-400">qr_code</span>
                    </div>
                </div>
            </div>
            <div className="bg-[#32261a] rounded-xl p-4 border border-transparent shadow-sm opacity-60">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded border-2 border-gray-600 flex items-center justify-center">
                        </div>
                        <div>
                            <div className="text-base font-medium text-gray-300">#883945-X</div>
                            <div className="text-xs text-gray-500">库位: B-04 • 4.1kg</div>
                        </div>
                    </div>
                    <div className="bg-[#1a120b] p-2 rounded-lg opacity-50">
                        <span className="material-icons text-gray-500">qr_code</span>
                    </div>
                </div>
            </div>
        </section>

        <section className="opacity-40 pointer-events-none filter grayscale">
            <div className="flex justify-between items-end mb-2">
                <h3 className="text-gray-800 dark:text-white font-semibold text-lg flex items-center">
                    <span className="w-1 h-5 bg-gray-600 rounded-full mr-2"></span>
                    拆分预览
                </h3>
            </div>
            <div className="bg-[#32261a] rounded-xl p-4 border border-gray-700">
                <div className="relative">
                    <div className="flex items-center mb-4">
                        <span className="material-icons text-gray-400 mr-2">account_tree</span>
                        <span className="text-white font-medium">主单: #99001</span>
                    </div>
                    <div className="relative pl-8 mb-3">
                        <div className="absolute left-5 top-8 bottom-[-1rem] w-[2px] bg-[#524233]"></div>
                        <div className="absolute left-5 top-1/2 w-6 h-[2px] bg-[#524233]"></div>
                        <div className="bg-[#1a120b] p-3 rounded-lg border border-gray-700 flex justify-between items-center">
                            <span className="text-sm text-gray-300">子单: #99001-01</span>
                        </div>
                    </div>
                    <div className="relative pl-8">
                        <div className="absolute left-5 top-0 h-1/2 w-[2px] bg-[#524233]"></div>
                        <div className="absolute left-5 top-1/2 w-6 h-[2px] bg-[#524233]"></div>
                        <div className="bg-[#1a120b] p-3 rounded-lg border border-gray-700 flex justify-between items-center">
                            <span className="text-sm text-gray-300">子单: #99001-02</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-[#1a120b]/95 backdrop-blur border-t border-[#f27f0d]/10 p-4 pb-8 z-40 max-w-md mx-auto safe-area-pb">
        <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-gray-400 text-xs">新主单号: <span className="text-[#f27f0d] font-mono font-bold text-sm">#M-24-9982</span></span>
            <span className="text-gray-400 text-xs">件数: <span className="text-white font-bold">2</span></span>
        </div>
        <button className="w-full bg-[#f27f0d] hover:bg-[#f27f0d]/90 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-[#f27f0d]/20 flex items-center justify-center space-x-3 active:transform active:scale-[0.98] transition-all">
            <span className="material-icons text-2xl">link</span>
            <span className="text-lg">确认合并并生成单号</span>
        </button>
      </footer>
    </div>
  );
};

export default BatchManager;