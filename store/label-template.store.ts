import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const generateId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ─── Types ───────────────────────────────────────────────────

export type LabelSize = '76x130' | '100x100' | '100x130';

export const LABEL_SIZES: Record<LabelSize, { w: number; h: number; label: string }> = {
    '76x130': { w: 76, h: 130, label: '76 × 130 mm' },
    '100x100': { w: 100, h: 100, label: '100 × 100 mm' },
    '100x130': { w: 100, h: 130, label: '100 × 130 mm' },
};

export type ElementType = 'text' | 'barcode' | 'qrcode' | 'rect' | 'line' | 'image';

/** Data fields available for binding */
export const DATA_FIELDS = [
    { key: 'tracking_no', label: '运单号' },
    { key: 'receiver_name', label: '收件人姓名' },
    { key: 'receiver_phone', label: '收件人电话' },
    { key: 'receiver_address', label: '收件人地址' },
    { key: 'sender_name', label: '发件人姓名' },
    { key: 'sender_phone', label: '发件人电话' },
    { key: 'sender_address', label: '发件人地址' },
    { key: 'shipper_name', label: '发货客户' },
    { key: 'weight', label: '重量 (kg)' },
    { key: 'volume_weight', label: '体积重 (kg)' },
    { key: 'dimensions', label: '尺寸 (L*W*H)' },
    { key: 'pieces', label: '件数' },
    { key: 'batch_no', label: '批次号' },
    { key: 'transport_mode', label: '运输方式' },
    { key: 'item_category', label: '物品类型' },
    { key: 'package_tag', label: '包裹标签' },
    { key: 'remark', label: '备注' },
    { key: 'date', label: '日期' },
    { key: 'print_time', label: '打印时间' },
    { key: 'operator', label: '操作员' },
    { key: 'custom', label: '自定义文本' },
] as const;

export type DataFieldKey = typeof DATA_FIELDS[number]['key'];

export interface LabelElement {
    id: string;
    type: ElementType;
    x: number;       // mm from left
    y: number;       // mm from top
    width: number;   // mm
    height: number;  // mm
    // Text props
    text?: string;
    fontSize?: number;   // pt
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    dataField?: DataFieldKey;  // bind to data
    // Barcode/QR props
    barcodeFormat?: 'CODE128' | 'CODE39' | 'EAN13' | 'UPC';
    // Line props
    lineWidth?: number;
    // Rect props
    borderWidth?: number;
    filled?: boolean;
    // Image
    imageUrl?: string;
    // Common
    rotation?: number;
}

export interface LabelTemplate {
    id: string;
    name: string;
    size: LabelSize;
    elements: LabelElement[];
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

/** Pre-composed modular blocks */
export const LABEL_BLOCKS = [
    {
        id: 'block_receiver',
        name: '收件人信息块',
        icon: 'contact_page',
        elements: (w: number): Omit<LabelElement, 'id'>[] => [
            { type: 'text', x: 0, y: 0, width: 20, height: 5, text: '收件人', fontSize: 8, fontWeight: 'bold' },
            { type: 'text', x: 0, y: 6, width: w, height: 8, dataField: 'receiver_name', fontSize: 14, fontWeight: 'bold' },
            { type: 'text', x: 0, y: 15, width: w, height: 5, dataField: 'receiver_phone', fontSize: 10 },
            { type: 'text', x: 0, y: 21, width: w, height: 12, dataField: 'receiver_address', fontSize: 9 },
        ]
    },
    {
        id: 'block_sender',
        name: '发件人信息块',
        icon: 'person',
        elements: (w: number): Omit<LabelElement, 'id'>[] => [
            { type: 'text', x: 0, y: 0, width: 20, height: 5, text: '发件人', fontSize: 8, fontWeight: 'bold' },
            { type: 'text', x: 0, y: 6, width: w, height: 5, dataField: 'sender_name', fontSize: 9 },
            { type: 'text', x: 0, y: 12, width: w, height: 10, dataField: 'sender_address', fontSize: 8 },
        ]
    },
    {
        id: 'block_logistics',
        name: '物流条码块',
        icon: 'barcode',
        elements: (w: number): Omit<LabelElement, 'id'>[] => [
            { type: 'barcode', x: 0, y: 0, width: w, height: 18, dataField: 'tracking_no', barcodeFormat: 'CODE128' },
            { type: 'text', x: 0, y: 20, width: w, height: 6, dataField: 'tracking_no', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
        ]
    },
    {
        id: 'block_goods',
        name: '货物参数块',
        icon: 'inventory_2',
        elements: (w: number): Omit<LabelElement, 'id'>[] => [
            { type: 'text', x: 0, y: 0, width: 25, height: 6, dataField: 'weight', fontSize: 11, fontWeight: 'bold' },
            { type: 'text', x: 30, y: 0, width: 20, height: 6, dataField: 'pieces', fontSize: 10, text: '件数: ' },
            { type: 'text', x: 0, y: 8, width: 40, height: 5, dataField: 'dimensions', fontSize: 8 },
        ]
    },
    {
        id: 'block_meta',
        name: '打印页脚块',
        icon: 'info',
        elements: (w: number): Omit<LabelElement, 'id'>[] => [
            { type: 'line', x: 0, y: 0, width: w, height: 0, lineWidth: 0.5 },
            { type: 'text', x: 0, y: 2, width: 30, height: 4, dataField: 'print_time', fontSize: 7, textAlign: 'left' },
            { type: 'text', x: w - 30, y: 2, width: 30, height: 4, dataField: 'operator', fontSize: 7, textAlign: 'right' },
        ]
    }
] as const;

// ─── Default Templates ──────────────────────────────────────

const createDefaultTemplate = (size: LabelSize): LabelTemplate => {
    const { w, h } = LABEL_SIZES[size];
    const id = generateId();
    return {
        id,
        name: `标准快递面单 (${LABEL_SIZES[size].label})`,
        size,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        elements: [
            // Barcode at top
            {
                id: 'el_barcode',
                type: 'barcode',
                x: 5,
                y: 5,
                width: w - 10,
                height: 18,
                dataField: 'tracking_no',
                barcodeFormat: 'CODE128',
            },
            // Tracking number text
            {
                id: 'el_tracking',
                type: 'text',
                x: 5,
                y: 25,
                width: w - 10,
                height: 6,
                text: '',
                dataField: 'tracking_no',
                fontSize: 12,
                fontWeight: 'bold',
                textAlign: 'center',
            },
            // Divider line
            {
                id: 'el_divider1',
                type: 'line',
                x: 3,
                y: 33,
                width: w - 6,
                height: 0,
                lineWidth: 1,
            },
            // Receiver section title
            {
                id: 'el_recv_title',
                type: 'text',
                x: 5,
                y: 35,
                width: 20,
                height: 5,
                text: '收件人',
                fontSize: 8,
                fontWeight: 'bold',
                textAlign: 'left',
                dataField: 'custom',
            },
            // Receiver name
            {
                id: 'el_recv_name',
                type: 'text',
                x: 5,
                y: 41,
                width: w - 10,
                height: 6,
                dataField: 'receiver_name',
                fontSize: 14,
                fontWeight: 'bold',
                textAlign: 'left',
            },
            // Receiver phone
            {
                id: 'el_recv_phone',
                type: 'text',
                x: 5,
                y: 48,
                width: w - 10,
                height: 5,
                dataField: 'receiver_phone',
                fontSize: 10,
                fontWeight: 'normal',
                textAlign: 'left',
            },
            // Receiver address
            {
                id: 'el_recv_addr',
                type: 'text',
                x: 5,
                y: 54,
                width: w - 10,
                height: 12,
                dataField: 'receiver_address',
                fontSize: 9,
                fontWeight: 'normal',
                textAlign: 'left',
            },
            // Divider
            {
                id: 'el_divider2',
                type: 'line',
                x: 3,
                y: 68,
                width: w - 6,
                height: 0,
                lineWidth: 1,
            },
            // Sender section title
            {
                id: 'el_send_title',
                type: 'text',
                x: 5,
                y: 70,
                width: 20,
                height: 5,
                text: '发件人',
                fontSize: 8,
                fontWeight: 'bold',
                textAlign: 'left',
                dataField: 'custom',
            },
            // Sender name
            {
                id: 'el_send_name',
                type: 'text',
                x: 5,
                y: 76,
                width: w - 10,
                height: 5,
                dataField: 'sender_name',
                fontSize: 9,
                fontWeight: 'normal',
                textAlign: 'left',
            },
            // Sender address
            {
                id: 'el_send_addr',
                type: 'text',
                x: 5,
                y: 82,
                width: w - 10,
                height: 10,
                dataField: 'sender_address',
                fontSize: 8,
                fontWeight: 'normal',
                textAlign: 'left',
            },
            // Weight display
            {
                id: 'el_weight',
                type: 'text',
                x: 5,
                y: h - 30,
                width: 30,
                height: 6,
                dataField: 'weight',
                fontSize: 11,
                fontWeight: 'bold',
                textAlign: 'left',
            },
            // QR Code
            {
                id: 'el_qr',
                type: 'qrcode',
                x: w - 25,
                y: h - 30,
                width: 20,
                height: 20,
                dataField: 'tracking_no',
            },
        ],
    };
};

// ─── Store ───────────────────────────────────────────────────

interface LabelTemplateState {
    templates: LabelTemplate[];
    activeTemplateId: string | null;

    // Actions
    addTemplate: (template: LabelTemplate) => void;
    updateTemplate: (id: string, updates: Partial<LabelTemplate>) => void;
    deleteTemplate: (id: string) => void;
    duplicateTemplate: (id: string) => string;
    setDefault: (id: string) => void;
    setActiveTemplate: (id: string | null) => void;
    getTemplatesBySize: (size: LabelSize) => LabelTemplate[];
    getDefaultTemplate: (size: LabelSize) => LabelTemplate | undefined;
    createBlankTemplate: (size: LabelSize, name?: string) => string;
    initDefaults: () => void;
}

export const useLabelTemplateStore = create<LabelTemplateState>()(
    persist(
        (set, get) => ({
            templates: [],
            activeTemplateId: null,

            addTemplate: (template) =>
                set((s) => ({ templates: [...s.templates, template] })),

            updateTemplate: (id, updates) =>
                set((s) => ({
                    templates: s.templates.map((t) =>
                        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
                    ),
                })),

            deleteTemplate: (id) =>
                set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

            duplicateTemplate: (id) => {
                const original = get().templates.find((t) => t.id === id);
                if (!original) return '';
                const newId = Math.random().toString(36).slice(2, 10);
                const copy: LabelTemplate = {
                    ...JSON.parse(JSON.stringify(original)),
                    id: newId,
                    name: original.name + ' (副本)',
                    isDefault: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                set((s) => ({ templates: [...s.templates, copy] }));
                return newId;
            },

            setDefault: (id) =>
                set((s) => {
                    const target = s.templates.find((t) => t.id === id);
                    if (!target) return s;
                    return {
                        templates: s.templates.map((t) =>
                            t.size === target.size
                                ? { ...t, isDefault: t.id === id }
                                : t
                        ),
                    };
                }),

            setActiveTemplate: (id) => set({ activeTemplateId: id }),

            getTemplatesBySize: (size) => get().templates.filter((t) => t.size === size),

            getDefaultTemplate: (size) => get().templates.find((t) => t.size === size && t.isDefault),

            createBlankTemplate: (size, name) => {
                const newId = Math.random().toString(36).slice(2, 10);
                const template: LabelTemplate = {
                    id: newId,
                    name: name || `新模板 (${LABEL_SIZES[size].label})`,
                    size,
                    elements: [],
                    isDefault: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                set((s) => ({ templates: [...s.templates, template] }));
                return newId;
            },

            initDefaults: () => {
                const { templates } = get();
                const sizes: LabelSize[] = ['76x130', '100x100', '100x130'];
                const newTemplates: LabelTemplate[] = [];

                for (const size of sizes) {
                    if (!templates.some((t) => t.size === size)) {
                        newTemplates.push(createDefaultTemplate(size));
                    }
                }

                if (newTemplates.length > 0) {
                    set((s) => ({ templates: [...s.templates, ...newTemplates] }));
                }
            },
        }),
        {
            name: 'hedui-label-templates',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
