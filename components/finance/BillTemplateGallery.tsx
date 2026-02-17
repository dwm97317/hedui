
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Assuming framer-motion is installed, or I'll use CSS
// If framer-motion is not installed, I'll remove it. Let's use standard React state for now to be safe.
import { BillTemplate } from '../../types';

interface BillTemplateGalleryProps {
    templates: BillTemplate[];
    selectedTemplateId: string | null;
    onSelect: (id: string) => void;
}

export const BillTemplateGallery: React.FC<BillTemplateGalleryProps> = ({
    templates,
    selectedTemplateId,
    onSelect,
}) => {
    const [previewTemplate, setPreviewTemplate] = useState<BillTemplate | null>(null);

    const handlePreview = (template: BillTemplate, e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewTemplate(template);
    };

    return (
        <div className="space-y-6">
            <div className="px-1">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">选择模版</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">为您的财务报表选择最佳视觉呈现方式</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {templates.map((template) => {
                    const isSelected = selectedTemplateId === template.id;
                    return (
                        <div
                            key={template.id}
                            className="group relative flex flex-col gap-3 cursor-pointer"
                            onClick={() => onSelect(template.id)}
                        >
                            <div
                                className={`relative w-full aspect-[3/4] overflow-hidden rounded-xl border-2 transition-all duration-300 ${isSelected
                                    ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                    }`}
                            >
                                {template.preview_image_url ? (
                                    <img
                                        src={template.preview_image_url}
                                        alt={template.name}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800">
                                        <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                                        <span className="text-xs text-slate-400 mt-2">暂无预览</span>
                                    </div>
                                )}

                                {/* Overlay Tint */}
                                <div className={`absolute inset-0 transition-opacity ${isSelected ? 'bg-blue-500/10' : 'bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5'}`}></div>

                                {/* Checkmark Badge */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                                    </div>
                                )}

                                {/* Zoom Preview Button */}
                                <div
                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                >
                                    <button
                                        className="h-10 w-10 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-lg flex items-center justify-center pointer-events-auto transform hover:scale-110 transition-transform"
                                        onClick={(e) => handlePreview(template, e)}
                                    >
                                        <span className="material-symbols-outlined text-slate-700 dark:text-slate-200">zoom_in</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <p className={`font-bold text-base ${isSelected ? 'text-blue-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {template.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                                    {template.description}
                                </p>
                                {isSelected && (
                                    <span className="inline-flex mt-2 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wider">
                                        当前选择
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Preview Modal Overlay */}
            {previewTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewTemplate(null)}>
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={() => setPreviewTemplate(null)}
                                className="h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                        {previewTemplate.preview_image_url && (
                            <img src={previewTemplate.preview_image_url} alt="Preview" className="w-full h-auto" />
                        )}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{previewTemplate.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{previewTemplate.description}</p>
                            <button
                                onClick={() => { onSelect(previewTemplate.id); setPreviewTemplate(null); }}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
                            >
                                选择此样式
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
