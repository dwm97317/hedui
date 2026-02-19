import React from 'react';

interface CargoCreateFooterProps {
    handleCreate: () => void;
    handlePrint: () => void;
    handleReprint: () => void;
    isCreating: boolean;
    isPrinting: boolean;
    isReprintMode?: boolean;
    duplicateTrackingNo?: string;
    openConfirmModal: () => void;
}

const CargoCreateFooter: React.FC<CargoCreateFooterProps> = ({
    handleCreate,
    handlePrint,
    handleReprint,
    isCreating,
    isPrinting,
    isReprintMode = false,
    duplicateTrackingNo = '',
    openConfirmModal
}) => {
    return (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 p-4 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark to-transparent z-40 pointer-events-none">
            <div className="flex gap-3 max-w-lg mx-auto pointer-events-auto w-full">
                {isReprintMode ? (
                    <button
                        onClick={handleReprint}
                        disabled={isPrinting}
                        className={`flex-1 h-24 flex flex-col items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-xl shadow-purple-900/30 active:scale-[0.98] transition-all gap-1.5 animate-in slide-in-from-bottom duration-300 ${isPrinting ? 'opacity-70 grayscale' : ''}`}
                    >
                        <span className={`material-icons text-4xl ${isPrinting ? 'animate-spin' : 'animate-bounce'}`}>
                            {isPrinting ? 'sync' : 'print'}
                        </span>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-black uppercase tracking-widest">RE-PRINT 标签</span>
                            <span className="text-[10px] font-mono opacity-80">[{duplicateTrackingNo.slice(-4)}]</span>
                        </div>
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleCreate}
                            disabled={isCreating}
                            className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-surface-hover border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white py-3 rounded-xl shadow-lg active:scale-[0.95] transition-all text-xs gap-1 disabled:opacity-50"
                        >
                            <span className="material-icons text-gray-400 text-xl">{isCreating ? 'sync' : 'save'}</span>
                            <span className="font-bold">仅保存并建档</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={isPrinting}
                            className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-surface-hover border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white py-3 rounded-xl shadow-lg active:scale-[0.95] transition-all text-xs gap-1 disabled:opacity-50"
                        >
                            <span className="material-icons text-gray-400 text-xl">{isPrinting ? 'sync' : 'print'}</span>
                            <span className="font-bold">打印并建档</span>
                        </button>
                        <button
                            onClick={openConfirmModal}
                            className="flex-1 flex flex-col items-center justify-center bg-primary hover:bg-primary-dark text-white py-3 rounded-xl shadow-lg shadow-blue-900/30 active:scale-[0.95] transition-all text-xs gap-1"
                        >
                            <span className="material-icons text-white text-xl">local_shipping</span>
                            <span className="font-bold">确认发货</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default CargoCreateFooter;
