import React, { useState } from 'react';

interface BillingPreferenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selected: string) => void;
    currentPreference?: string;
}

const BillingPreferenceModal: React.FC<BillingPreferenceModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    currentPreference = 'sender_pay'
}) => {
    const [selected, setSelected] = useState(currentPreference);

    if (!isOpen) return null;

    const options = [
        {
            id: 'sender_pay',
            title: '寄付现结',
            subtitle: 'Sender Pays Now',
            icon: 'account_balance_wallet'
        },
        {
            id: 'receiver_pay',
            title: '到付',
            subtitle: 'Receiver Pays',
            icon: 'call_received'
        },
        {
            id: 'monthly',
            title: '月结',
            subtitle: 'Monthly Settlement',
            icon: 'date_range'
        },
        {
            id: 'third_party',
            title: '第三方付',
            subtitle: 'Third Party Pays',
            icon: 'person_outline'
        }
    ];

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden border border-slate-700 shadow-2xl animate-scale-up">

                {/* Header */}
                <header className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h3 className="text-xl font-bold text-white tracking-wide">计费方式偏好</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/10 text-slate-400 transition-colors"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </header>

                {/* Body */}
                <div className="p-5 space-y-3">
                    {options.map((option) => (
                        <label
                            key={option.id}
                            className={`
                                relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer group
                                ${selected === option.id
                                    ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                    : 'border-slate-700 bg-slate-800 hover:border-slate-600 hover:bg-slate-700'
                                }
                            `}
                        >
                            <input
                                type="radio"
                                name="billing_type"
                                value={option.id}
                                checked={selected === option.id}
                                onChange={() => setSelected(option.id)}
                                className="peer sr-only"
                            />

                            {/* Icon Box */}
                            <div className={`
                                h-12 w-12 rounded-lg flex items-center justify-center shrink-0 mr-4 transition-colors
                                ${selected === option.id
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'
                                }
                            `}>
                                <span className="material-icons text-2xl">{option.icon}</span>
                            </div>

                            {/* Text Content */}
                            <div className="flex-1">
                                <div className={`font-bold text-lg mb-0.5 ${selected === option.id ? 'text-white' : 'text-slate-200'}`}>
                                    {option.title}
                                </div>
                                <div className={`text-xs ${selected === option.id ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {option.subtitle}
                                </div>
                            </div>

                            {/* Checkmark Indicator */}
                            <div className={`
                                h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all
                                ${selected === option.id
                                    ? 'border-blue-500 bg-blue-500 scale-100 opacity-100'
                                    : 'border-slate-600 scale-90 opacity-0'
                                }
                            `}>
                                <span className="material-icons text-white text-sm">check</span>
                            </div>
                        </label>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-700 bg-slate-800/30">
                    <button
                        onClick={() => onConfirm(selected)}
                        className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-icons">check_circle</span>
                        确认选择
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full mt-3 py-3 rounded-lg text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillingPreferenceModal;
