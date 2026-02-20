import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    useLabelTemplateStore,
    LABEL_SIZES,
    LabelElement,
    ElementType,
    DATA_FIELDS,
    DataFieldKey,
    LABEL_BLOCKS,
} from '../../store/label-template.store';
import toast from 'react-hot-toast';

// ─── Constants ───────────────────────────────────────────────
const PX_PER_MM = 3; // Canvas scale: 3px = 1mm (good for mobile)

const ELEMENT_PALETTE: { type: ElementType; icon: string; label: string }[] = [
    { type: 'text', icon: 'text_fields', label: '文本' },
    { type: 'barcode', icon: 'barcode', label: '条形码' },
    { type: 'qrcode', icon: 'qr_code_2', label: '二维码' },
    { type: 'rect', icon: 'crop_landscape', label: '矩形' },
    { type: 'line', icon: 'horizontal_rule', label: '线条' },
    { type: 'image', icon: 'image', label: '图片' },
];

const SAMPLE_DATA: Record<string, string> = {
    tracking_no: 'HD2024021800001',
    receiver_name: '张三',
    receiver_phone: '13800138000',
    receiver_address: '广东省深圳市南山区科技园路88号',
    sender_name: '李四',
    sender_phone: '13900139000',
    sender_address: '上海市浦东新区陆家嘴金融中心',
    shipper_name: '嘉里物流',
    weight: '12.50 kg',
    volume_weight: '15.20 kg',
    dimensions: '40 * 30 * 25 cm',
    pieces: '3',
    batch_no: 'B20240218-001',
    transport_mode: '陆运专线',
    item_category: '电子配件',
    package_tag: '加急',
    remark: '易碎品 轻拿轻放',
    date: new Date().toLocaleDateString('zh-CN'),
    print_time: new Date().toLocaleTimeString('zh-CN'),
    operator: '仓库 A1',
    custom: '',
};

// ─── Component ───────────────────────────────────────────────
const LabelTemplateEditor: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { templates, updateTemplate } = useLabelTemplateStore();

    const template = templates.find(t => t.id === id);

    const [elements, setElements] = useState<LabelElement[]>(template?.elements || []);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showPalette, setShowPalette] = useState(true);
    const [showProps, setShowProps] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [paletteTab, setPaletteTab] = useState<'elements' | 'blocks'>('elements');

    const canvasRef = useRef<HTMLDivElement>(null);

    if (!template) {
        return (
            <div className="flex items-center justify-center h-full bg-background-dark">
                <div className="text-center">
                    <span className="material-icons text-5xl text-gray-600 mb-4 block">error_outline</span>
                    <p className="text-gray-400 font-bold">模板不存在</p>
                    <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold">
                        返回
                    </button>
                </div>
            </div>
        );
    }

    const { w, h } = LABEL_SIZES[template.size];
    const canvasW = w * PX_PER_MM;
    const canvasH = h * PX_PER_MM;

    const selectedElement = elements.find(el => el.id === selectedId);

    // ─── Element CRUD ────────────────────────────────────────
    const addElement = (type: ElementType) => {
        const newId = 'el_' + Math.random().toString(36).slice(2, 8);
        const base: LabelElement = {
            id: newId,
            type,
            x: 5,
            y: 5,
            width: 30,
            height: 10,
        };

        switch (type) {
            case 'text':
                Object.assign(base, {
                    text: '文本',
                    fontSize: 10,
                    fontWeight: 'normal' as const,
                    textAlign: 'left' as const,
                    dataField: 'custom' as DataFieldKey,
                    width: 40,
                    height: 8,
                });
                break;
            case 'barcode':
                Object.assign(base, {
                    dataField: 'tracking_no' as DataFieldKey,
                    barcodeFormat: 'CODE128',
                    width: w - 10,
                    height: 16,
                });
                break;
            case 'qrcode':
                Object.assign(base, {
                    dataField: 'tracking_no' as DataFieldKey,
                    width: 20,
                    height: 20,
                });
                break;
            case 'rect':
                Object.assign(base, {
                    borderWidth: 1,
                    filled: false,
                    width: 30,
                    height: 20,
                });
                break;
            case 'line':
                Object.assign(base, {
                    lineWidth: 1,
                    width: w - 10,
                    height: 0,
                });
                break;
            case 'image':
                Object.assign(base, {
                    imageUrl: '',
                    width: 20,
                    height: 20,
                });
                break;
        }

        setElements(prev => [...prev, base]);
        setSelectedId(newId);
        setShowPalette(false);
        setShowProps(true);
        setHasChanges(true);
    };

    const addBlock = (blockId: string) => {
        const block = LABEL_BLOCKS.find(b => b.id === blockId);
        if (!block) return;

        const { w: width } = LABEL_SIZES[template.size];
        // Calculate insert Y (at bottom of existing elements or top)
        const lastY = elements.reduce((max, el) => Math.max(max, el.y + el.height), 10);

        const newElements = block.elements(width - 10).map(el => ({
            ...el,
            id: 'el_' + Math.random().toString(36).slice(2, 8),
            x: el.x + 5,
            y: el.y + lastY + 5,
        } as LabelElement));

        setElements(prev => [...prev, ...newElements]);
        setHasChanges(true);
        toast.success(`已添加 ${block.name}`);
    };

    const updateElement = (id: string, updates: Partial<LabelElement>) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
        setHasChanges(true);
    };

    const deleteElement = (id: string) => {
        setElements(prev => prev.filter(el => el.id !== id));
        if (selectedId === id) {
            setSelectedId(null);
            setShowProps(false);
        }
        setHasChanges(true);
    };

    // ─── Save ────────────────────────────────────────────────
    const handleSave = () => {
        updateTemplate(template.id, { elements });
        setHasChanges(false);
        toast.success('模板已保存');
    };

    // ─── Drag Handling ────────────────────────────────────────
    const handlePointerDown = (e: React.PointerEvent, el: LabelElement) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedId(el.id);
        setShowProps(true);
        setShowPalette(false);

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const px = (e.clientX - rect.left) / PX_PER_MM;
        const py = (e.clientY - rect.top) / PX_PER_MM;
        setDragOffset({ x: px - el.x, y: py - el.y });
        setIsDragging(true);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !selectedId) return;
        e.preventDefault();

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        let newX = (e.clientX - rect.left) / PX_PER_MM - dragOffset.x;
        let newY = (e.clientY - rect.top) / PX_PER_MM - dragOffset.y;

        // Snap to grid (1mm)
        newX = Math.round(newX);
        newY = Math.round(newY);

        // Clamp
        newX = Math.max(0, Math.min(w - 5, newX));
        newY = Math.max(0, Math.min(h - 5, newY));

        updateElement(selectedId, { x: newX, y: newY });
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    // Resize handle
    const handleResizeDown = (e: React.PointerEvent, el: LabelElement) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        setSelectedId(el.id);

        const startX = e.clientX;
        const startY = e.clientY;
        const startW = el.width;
        const startH = el.height;

        const onMove = (ev: PointerEvent) => {
            const dx = (ev.clientX - startX) / PX_PER_MM;
            const dy = (ev.clientY - startY) / PX_PER_MM;
            updateElement(el.id, {
                width: Math.max(5, Math.round(startW + dx)),
                height: Math.max(el.type === 'line' ? 0 : 3, Math.round(startH + dy)),
            });
        };

        const onUp = () => {
            setIsResizing(false);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    // ─── Render Element on Canvas ──────────────────────────────
    const renderElement = (el: LabelElement) => {
        const isSelected = selectedId === el.id;
        const style: React.CSSProperties = {
            position: 'absolute',
            left: el.x * PX_PER_MM,
            top: el.y * PX_PER_MM,
            width: el.width * PX_PER_MM,
            height: el.type === 'line' ? 2 : el.height * PX_PER_MM,
            cursor: isDragging && isSelected ? 'grabbing' : 'grab',
            zIndex: isSelected ? 50 : 1,
            touchAction: 'none',
        };

        const displayText = el.dataField && el.dataField !== 'custom'
            ? SAMPLE_DATA[el.dataField] || `{${el.dataField}}`
            : el.text || '';

        return (
            <div
                key={el.id}
                style={style}
                onPointerDown={(e) => handlePointerDown(e, el)}
                className={`group ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-white' : 'hover:ring-1 hover:ring-blue-300'}`}
            >
                {/* Element content */}
                {el.type === 'text' && (
                    <div
                        className="w-full h-full overflow-hidden"
                        style={{
                            fontSize: (el.fontSize || 10) * PX_PER_MM / 3.5,
                            fontWeight: el.fontWeight || 'normal',
                            textAlign: el.textAlign || 'left',
                            lineHeight: 1.3,
                            color: '#000',
                            wordBreak: 'break-all',
                        }}
                    >
                        {displayText}
                    </div>
                )}

                {el.type === 'barcode' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white overflow-hidden">
                        <div className="flex-1 w-full flex items-end justify-center gap-[1px] py-1 px-2">
                            {Array.from({ length: 40 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-full bg-black"
                                    style={{ width: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1 }}
                                />
                            ))}
                        </div>
                        <div className="text-[8px] text-black font-mono tracking-wider pb-0.5 truncate max-w-full px-1">
                            {displayText}
                        </div>
                    </div>
                )}

                {el.type === 'qrcode' && (
                    <div className="w-full h-full bg-white flex items-center justify-center p-1">
                        <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-[1px]">
                            {Array.from({ length: 25 }).map((_, i) => (
                                <div key={i} className={`${[0, 1, 2, 5, 6, 10, 12, 14, 18, 20, 21, 22, 23, 24].includes(i) ? 'bg-black' : 'bg-white'}`} />
                            ))}
                        </div>
                    </div>
                )}

                {el.type === 'line' && (
                    <div className="w-full border-t border-black" style={{ borderWidth: el.lineWidth || 1 }} />
                )}

                {el.type === 'rect' && (
                    <div
                        className="w-full h-full"
                        style={{
                            border: `${el.borderWidth || 1}px solid black`,
                            backgroundColor: el.filled ? '#eee' : 'transparent',
                        }}
                    />
                )}

                {el.type === 'image' && (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="material-icons text-gray-400" style={{ fontSize: Math.min(el.width, el.height) * PX_PER_MM * 0.5 }}>
                            image
                        </span>
                    </div>
                )}

                {/* Resize handle */}
                {isSelected && (
                    <div
                        onPointerDown={(e) => handleResizeDown(e, el)}
                        className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white cursor-se-resize z-50 shadow-md"
                    />
                )}
            </div>
        );
    };

    // ─── Properties Panel ──────────────────────────────────────
    const PropertiesPanel = () => {
        if (!selectedElement) return null;
        const el = selectedElement;

        return (
            <div className="fixed bottom-0 left-0 right-0 z-[70] bg-[#0f172a] border-t border-white/10 rounded-t-2xl max-h-[45vh] overflow-y-auto pb-8 animate-slide-up">
                {/* Handle + header */}
                <div className="sticky top-0 bg-[#0f172a] z-10">
                    <div className="flex justify-center pt-2 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
                    <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-2">
                            <span className="material-icons text-primary text-sm">
                                {ELEMENT_PALETTE.find(p => p.type === el.type)?.icon || 'widgets'}
                            </span>
                            <span className="text-white font-bold text-sm">
                                {ELEMENT_PALETTE.find(p => p.type === el.type)?.label || '元素'}属性
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => deleteElement(el.id)}
                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-90 transition-all"
                            >
                                <span className="material-icons text-sm">delete</span>
                            </button>
                            <button
                                onClick={() => { setShowProps(false); setSelectedId(null); }}
                                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 active:scale-90 transition-all"
                            >
                                <span className="material-icons text-sm">close</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-4 pt-2 space-y-3">
                    {/* Position */}
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { label: 'X', key: 'x', value: el.x },
                            { label: 'Y', key: 'y', value: el.y },
                            { label: 'W', key: 'width', value: el.width },
                            { label: 'H', key: 'height', value: el.height },
                        ].map(f => (
                            <div key={f.key}>
                                <label className="text-[9px] text-gray-500 font-bold uppercase">{f.label} (mm)</label>
                                <input
                                    type="number"
                                    value={f.value}
                                    onChange={e => updateElement(el.id, { [f.key]: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Data Binding */}
                    {(el.type === 'text' || el.type === 'barcode' || el.type === 'qrcode') && (
                        <div>
                            <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">数据绑定</label>
                            <select
                                value={el.dataField || 'custom'}
                                onChange={e => updateElement(el.id, { dataField: e.target.value as DataFieldKey })}
                                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 appearance-none"
                            >
                                {DATA_FIELDS.map(f => (
                                    <option key={f.key} value={f.key}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Custom text */}
                    {el.type === 'text' && el.dataField === 'custom' && (
                        <div>
                            <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">自定义文本</label>
                            <input
                                value={el.text || ''}
                                onChange={e => updateElement(el.id, { text: e.target.value })}
                                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                                placeholder="输入文本内容"
                            />
                        </div>
                    )}

                    {/* Text styling */}
                    {el.type === 'text' && (
                        <>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">字号</label>
                                    <input
                                        type="number"
                                        value={el.fontSize || 10}
                                        onChange={e => updateElement(el.id, { fontSize: parseInt(e.target.value) || 10 })}
                                        className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30"
                                        min={6}
                                        max={72}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">粗体</label>
                                    <button
                                        onClick={() => updateElement(el.id, { fontWeight: el.fontWeight === 'bold' ? 'normal' : 'bold' })}
                                        className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${el.fontWeight === 'bold'
                                            ? 'bg-primary/20 text-primary border border-primary/20'
                                            : 'bg-white/5 text-gray-400 border border-white/5'
                                            }`}
                                    >
                                        B
                                    </button>
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">对齐</label>
                                    <div className="flex gap-0.5 bg-[#1e293b] rounded-lg border border-white/10 p-0.5">
                                        {(['left', 'center', 'right'] as const).map(align => (
                                            <button
                                                key={align}
                                                onClick={() => updateElement(el.id, { textAlign: align })}
                                                className={`flex-1 py-1 rounded text-xs transition-all ${el.textAlign === align ? 'bg-primary/20 text-primary' : 'text-gray-500'
                                                    }`}
                                            >
                                                <span className="material-icons text-xs">format_align_{align}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Barcode format */}
                    {el.type === 'barcode' && (
                        <div>
                            <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">条码格式</label>
                            <div className="grid grid-cols-4 gap-1">
                                {(['CODE128', 'CODE39', 'EAN13', 'UPC'] as const).map(fmt => (
                                    <button
                                        key={fmt}
                                        onClick={() => updateElement(el.id, { barcodeFormat: fmt })}
                                        className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${el.barcodeFormat === fmt
                                            ? 'bg-primary/20 text-primary border border-primary/20'
                                            : 'bg-white/5 text-gray-500 border border-white/5'
                                            }`}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Line width */}
                    {(el.type === 'line' || el.type === 'rect') && (
                        <div>
                            <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">线宽 (px)</label>
                            <input
                                type="range"
                                min={1}
                                max={5}
                                value={el.type === 'line' ? (el.lineWidth || 1) : (el.borderWidth || 1)}
                                onChange={e => {
                                    const val = parseInt(e.target.value);
                                    updateElement(el.id, el.type === 'line' ? { lineWidth: val } : { borderWidth: val });
                                }}
                                className="w-full accent-primary"
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0f1e] select-none" style={{ touchAction: 'none' }}>
            {/* Top Bar */}
            <header className="bg-[#0f172a]/95 backdrop-blur shadow-md z-[60] sticky top-0 flex-shrink-0 border-b border-white/5">
                <div className="px-3 py-3 flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (hasChanges && !window.confirm('有未保存的更改，确定离开？')) return;
                            navigate(-1);
                        }}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons text-xl">arrow_back_ios</span>
                    </button>

                    <div className="text-center">
                        <h1 className="text-sm font-bold text-white tracking-wide">编辑模板</h1>
                        <p className="text-[10px] text-gray-500">{template.name} • {LABEL_SIZES[template.size].label}</p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${hasChanges
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white/5 text-gray-600'
                            }`}
                    >
                        保存
                    </button>
                </div>
            </header>

            {/* Canvas Area */}
            <div
                className="flex-1 overflow-auto flex items-start justify-center p-4 pt-6"
                onClick={() => { setSelectedId(null); setShowProps(false); }}
            >
                <div
                    ref={canvasRef}
                    className="bg-white relative shadow-2xl rounded-sm"
                    style={{
                        width: canvasW,
                        height: canvasH,
                        minWidth: canvasW,
                        minHeight: canvasH,
                    }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Grid lines (subtle) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width={10 * PX_PER_MM} height={10 * PX_PER_MM} patternUnits="userSpaceOnUse">
                                <path d={`M ${10 * PX_PER_MM} 0 L 0 0 0 ${10 * PX_PER_MM}`} fill="none" stroke="#ddd" strokeWidth="0.5" />
                            </pattern>
                            <pattern id="gridSmall" width={5 * PX_PER_MM} height={5 * PX_PER_MM} patternUnits="userSpaceOnUse">
                                <path d={`M ${5 * PX_PER_MM} 0 L 0 0 0 ${5 * PX_PER_MM}`} fill="none" stroke="#eee" strokeWidth="0.3" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#gridSmall)" />
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>

                    {/* Elements */}
                    {elements.map(el => renderElement(el))}
                </div>
            </div>

            {/* Floating Element Palette (Repositioned to Right) */}
            {showPalette && !showProps && (
                <div className="fixed top-24 right-4 z-[60] w-20 animate-slide-in-right">
                    <div className="bg-[#1e293b] backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-2 flex flex-col gap-2">
                        {/* Vertical Tab Switcher */}
                        <div className="flex flex-col gap-1 p-1 bg-black/40 rounded-xl">
                            <button
                                onClick={() => setPaletteTab('elements')}
                                className={`p-2 rounded-lg transition-all ${paletteTab === 'elements' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                title="基础组件"
                            >
                                <span className="material-icons text-sm">widgets</span>
                            </button>
                            <button
                                onClick={() => setPaletteTab('blocks')}
                                className={`p-2 rounded-lg transition-all ${paletteTab === 'blocks' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                title="智能模块"
                            >
                                <span className="material-icons text-sm">auto_awesome</span>
                            </button>
                        </div>

                        <div className="flex flex-col gap-2 py-2 overflow-y-auto max-h-[60vh] scrollbar-hide">
                            {paletteTab === 'elements' ? (
                                ELEMENT_PALETTE.map(item => (
                                    <button
                                        key={item.type}
                                        onClick={() => addElement(item.type)}
                                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all group"
                                    >
                                        <span className="material-icons text-gray-300 group-hover:text-primary transition-colors text-xl">
                                            {item.icon}
                                        </span>
                                        <span className="text-[10px] text-gray-400 group-hover:text-white font-medium">{item.label}</span>
                                    </button>
                                ))
                            ) : (
                                LABEL_BLOCKS.map(block => (
                                    <button
                                        key={block.id}
                                        onClick={() => addBlock(block.id)}
                                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all group"
                                    >
                                        <span className="material-icons text-blue-400 group-hover:text-primary transition-colors text-xl">
                                            {block.icon}
                                        </span>
                                        <span className="text-[9px] text-gray-300 group-hover:text-white font-medium text-center leading-tight">{block.name.replace('块', '')}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Palette / Props */}
            <div className="fixed bottom-6 right-4 z-[65] flex flex-col gap-2">
                {!showPalette && !showProps && (
                    <button
                        onClick={() => setShowPalette(true)}
                        className="w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-all"
                    >
                        <span className="material-icons">add</span>
                    </button>
                )}
                {selectedId && !showProps && (
                    <button
                        onClick={() => setShowProps(true)}
                        className="w-12 h-12 rounded-full bg-[#1e293b] text-gray-300 border border-white/10 shadow-lg flex items-center justify-center active:scale-90 transition-all"
                    >
                        <span className="material-icons">tune</span>
                    </button>
                )}
            </div>

            {/* Properties Panel */}
            {showProps && <PropertiesPanel />}
        </div>
    );
};

export default LabelTemplateEditor;
