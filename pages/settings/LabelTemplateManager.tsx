import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLabelTemplateStore, LabelSize, LABEL_SIZES, LabelTemplate } from '../../store/label-template.store';
import toast from 'react-hot-toast';

const SIZES: LabelSize[] = ['76x130', '100x100', '100x130'];

const LabelTemplateManager: React.FC = () => {
    const navigate = useNavigate();
    const { templates, deleteTemplate, duplicateTemplate, setDefault, initDefaults, createBlankTemplate } = useLabelTemplateStore();
    const [activeSize, setActiveSize] = useState<LabelSize>('76x130');
    const [showNewModal, setShowNewModal] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        initDefaults();
    }, []);

    const filteredTemplates = templates.filter(t => t.size === activeSize);

    const handleDelete = (t: LabelTemplate) => {
        if (window.confirm(`确定删除模板「${t.name}」？`)) {
            deleteTemplate(t.id);
            toast.success('模板已删除');
        }
    };

    const handleDuplicate = (t: LabelTemplate) => {
        duplicateTemplate(t.id);
        toast.success('模板已复制');
    };

    const handleSetDefault = (t: LabelTemplate) => {
        setDefault(t.id);
        toast.success(`「${t.name}」已设为默认`);
    };

    const handleCreateNew = () => {
        const name = newName.trim() || undefined;
        const id = createBlankTemplate(activeSize, name);
        setShowNewModal(false);
        setNewName('');
        navigate(`/settings/label-editor/${id}`);
    };

    // Mini preview of label elements
    const LabelPreview = ({ template }: { template: LabelTemplate }) => {
        const { w, h } = LABEL_SIZES[template.size];
        const scale = 80 / w; // fit in ~80px wide preview
        return (
            <div
                className="bg-white rounded-lg overflow-hidden border border-white/20 relative"
                style={{ width: w * scale, height: h * scale }}
            >
                {template.elements.map(el => (
                    <div
                        key={el.id}
                        className="absolute"
                        style={{
                            left: el.x * scale,
                            top: el.y * scale,
                            width: el.width * scale,
                            height: el.height * scale,
                        }}
                    >
                        {el.type === 'text' && (
                            <div className="w-full h-full bg-gray-200 rounded-[1px]" style={{ fontSize: 3 }} />
                        )}
                        {el.type === 'barcode' && (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                                <div className="w-full h-3/4 flex gap-[0.5px]">
                                    {Array.from({ length: 20 }).map((_, i) => (
                                        <div key={i} className="h-full bg-gray-800" style={{ width: i % 3 === 0 ? 2 : 1 }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {el.type === 'qrcode' && (
                            <div className="w-full h-full bg-gray-800 rounded-[1px]" />
                        )}
                        {el.type === 'line' && (
                            <div className="w-full border-t border-gray-400" style={{ marginTop: el.height * scale / 2 }} />
                        )}
                        {el.type === 'rect' && (
                            <div className="w-full h-full border border-gray-400 rounded-[1px]" />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="bg-surface-dark/95 backdrop-blur shadow-md z-50 sticky top-0 flex-shrink-0">
                <div className="px-4 py-4 flex items-center justify-between relative border-b border-white/5">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
                        <span className="material-icons">arrow_back_ios</span>
                    </button>
                    <h1 className="text-lg font-bold text-white tracking-wide">标签模板管理</h1>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-sm font-bold rounded-lg border border-primary/20 hover:bg-primary/20 active:scale-95 transition-all"
                    >
                        <span className="material-icons text-sm">add</span>
                        新建
                    </button>
                </div>

                {/* Size Tabs */}
                <div className="flex px-4 gap-2 py-3 border-b border-white/5">
                    {SIZES.map(size => (
                        <button
                            key={size}
                            onClick={() => setActiveSize(size)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${activeSize === size
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {LABEL_SIZES[size].label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Template List */}
            <main className="flex-1 p-4 overflow-y-auto pb-24 no-scrollbar">
                {filteredTemplates.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-5 border border-white/5">
                            <span className="material-icons text-5xl text-gray-600">label_off</span>
                        </div>
                        <div className="text-gray-400 font-bold text-base mb-2">暂无模板</div>
                        <div className="text-gray-600 text-sm mb-6">该尺寸还没有标签模板</div>
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm rounded-xl border border-primary/20 active:scale-95 transition-all"
                        >
                            <span className="material-icons text-lg">add_circle_outline</span>
                            创建第一个模板
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredTemplates.map(template => (
                            <div
                                key={template.id}
                                className="bg-surface-dark rounded-2xl border border-white/5 p-4 shadow-lg group hover:border-primary/20 transition-all"
                            >
                                <div className="flex gap-4">
                                    {/* Preview thumbnail */}
                                    <div className="shrink-0 p-2 bg-black/30 rounded-xl flex items-center justify-center">
                                        <LabelPreview template={template} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-white font-bold text-sm truncate">{template.name}</h3>
                                            {template.isDefault && (
                                                <span className="shrink-0 bg-primary/20 text-primary text-[9px] font-black px-2 py-0.5 rounded-full border border-primary/20 uppercase">
                                                    默认
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                            <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-mono">
                                                {LABEL_SIZES[template.size].label}
                                            </span>
                                            <span>{template.elements.length} 元素</span>
                                        </div>
                                        <div className="text-[10px] text-gray-600">
                                            更新于 {new Date(template.updatedAt).toLocaleDateString('zh-CN')}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                                    <button
                                        onClick={() => navigate(`/settings/label-editor/${template.id}`)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 active:scale-95 transition-all"
                                    >
                                        <span className="material-icons text-sm">edit</span>
                                        编辑
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(template)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-bold hover:bg-white/10 active:scale-95 transition-all"
                                    >
                                        <span className="material-icons text-sm">content_copy</span>
                                        复制
                                    </button>
                                    {!template.isDefault && (
                                        <button
                                            onClick={() => handleSetDefault(template)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/10 text-green-500 text-xs font-bold hover:bg-green-500/20 active:scale-95 transition-all"
                                        >
                                            <span className="material-icons text-sm">check_circle</span>
                                            设默认
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(template)}
                                        className="py-2 px-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
                                    >
                                        <span className="material-icons text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* New Template Modal */}
            {showNewModal && (
                <div className="fixed inset-0 z-[80] flex items-end justify-center" onClick={() => setShowNewModal(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-lg bg-[#0f172a] rounded-t-3xl border-t border-white/10 animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-white mb-1">新建标签模板</h2>
                            <p className="text-sm text-gray-500 mb-5">尺寸: {LABEL_SIZES[activeSize].label}</p>

                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">模板名称</label>
                            <input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="输入模板名称（可选）"
                                className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 mb-5"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowNewModal(false)}
                                    className="flex-1 py-3.5 rounded-2xl bg-white/5 text-gray-500 font-bold border border-white/5 active:scale-95 transition-all"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleCreateNew}
                                    className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                >
                                    创建并编辑
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabelTemplateManager;
