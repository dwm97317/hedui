import React, { useState } from 'react';

interface BillTemplate {
    id: string;
    name: string;
    description: string;
    image: string;
}

interface BillTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (templateId: string) => void;
    currentTemplateId?: string;
}

const templates: BillTemplate[] = [
    {
        id: 'standard',
        name: '标准商务风',
        description: '简洁明了，适合正式财务对账，重点突出实付金额。',
        image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=600&fit=crop'
    },
    {
        id: 'industrial',
        name: '极客工业风',
        description: '深色调搭配霓虹对比色，适合大屏展示和技术风格偏好。',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop'
    },
    {
        id: 'minimal',
        name: '极简主义',
        description: '去除多余修饰，仅显示核心批次和重量信息，阅读压力最小。',
        image: 'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?w=400&h=600&fit=crop'
    }
];

const BillTemplateModal: React.FC<BillTemplateModalProps> = ({ isOpen, onClose, onSelect, currentTemplateId = 'standard' }) => {
    const [selected, setSelected] = useState(currentTemplateId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <header className="p-8 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-3xl font-black text-white tracking-tight italic">BILL TEMPLATES</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">账单样式库</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                        <span className="material-icons">close</span>
                    </button>
                </header>

                {/* Body - Gallery */}
                <div className="flex-1 overflow-x-auto p-8 flex gap-6 no-scrollbar snap-x">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => setSelected(template.id)}
                            className={`
                                flex-none w-64 group cursor-pointer snap-center transition-all duration-300
                                ${selected === template.id ? 'scale-105' : 'opacity-50 grayscale hover:opacity-80 hover:grayscale-0'}
                            `}
                        >
                            <div className={`
                                relative aspect-[2/3] rounded-3xl overflow-hidden border-4 transition-all duration-500
                                ${selected === template.id ? 'border-primary shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'border-slate-800'}
                            `}>
                                <img src={template.image} alt={template.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-12">
                                    <h4 className="text-xl font-bold text-white mb-1">{template.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                                            <div className={`h-full bg-primary transition-all duration-1000 ${selected === template.id ? 'w-full' : 'w-0'}`}></div>
                                        </div>
                                        {selected === template.id && (
                                            <span className="material-icons text-primary text-sm">verified</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-slate-500 leading-relaxed px-2 text-center uppercase tracking-tighter font-bold">
                                {template.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <footer className="p-8 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
                    <div className="hidden sm:block">
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">Selection auto-saves to profile</p>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => onSelect(selected)}
                            className="flex-1 sm:flex-none px-10 py-4 rounded-2xl bg-white text-black font-black hover:bg-slate-200 transition-all active:scale-95 shadow-xl"
                        >
                            确认选用
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default BillTemplateModal;
