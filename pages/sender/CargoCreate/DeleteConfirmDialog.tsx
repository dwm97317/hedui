import React from 'react';

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    isOpen,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-[320px] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                        <span className="material-icons-round text-3xl text-red-500">warning</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">确认删除该单号？</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-6">删除后该货物将从当前批次中移除，需重新建档。</p>

                    <div className="w-full flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-red-900/20 active:scale-95 transition-all"
                        >
                            确认删除
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-full bg-slate-800 text-slate-400 font-bold py-3 rounded-2xl active:scale-95 transition-all"
                        >
                            取消
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmDialog;
