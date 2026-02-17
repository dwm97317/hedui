
import React, { useState, useEffect } from 'react';
import { BatchPriceRule, CurrencyCode } from '../../types';

interface BillPriceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (rules: BatchPriceRule[]) => void;
    initialRules: BatchPriceRule[];
    currency: CurrencyCode;
}

interface Category {
    id: string;
    label: string;
    code: string;
    isCustom?: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: 'electronics', label: '电子产品', code: 'Category A' },
    { id: 'cosmetics', label: '化妆品', code: 'Category B' },
    { id: 'general', label: '普货', code: 'Category C' },
    { id: 'hazardous', label: '液体/粉末', code: 'Category D' },
];

export const BillPriceSettingsModal: React.FC<BillPriceSettingsModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialRules,
    currency,
}) => {
    const [rules, setRules] = useState<BatchPriceRule[]>(initialRules);
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingLabel, setEditingLabel] = useState('');

    useEffect(() => {
        if (isOpen) {
            // 从 initialRules 中提取所有类别
            const existingCategories = initialRules.map(r => r.category);
            const customCategories = existingCategories
                .filter(cat => !DEFAULT_CATEGORIES.find(dc => dc.id === cat))
                .map((cat, index) => ({
                    id: cat,
                    label: cat,
                    code: `Custom ${index + 1}`,
                    isCustom: true
                }));

            setCategories([...DEFAULT_CATEGORIES, ...customCategories]);
            setRules(initialRules.length > 0 ? initialRules : DEFAULT_CATEGORIES.map(c => ({
                id: crypto.randomUUID(),
                batch_id: '',
                bill_type: 'SENDER_TO_RECEIVER',
                category: c.id,
                unit_price: 0,
                currency: currency
            })));
        }
    }, [isOpen, initialRules, currency]);

    const handlePriceChange = (categoryId: string, price: number) => {
        setRules(prev => {
            const existing = prev.find(r => r.category === categoryId);
            if (existing) {
                return prev.map(r => r.category === categoryId ? { ...r, unit_price: price } : r);
            }
            return [...prev, {
                id: crypto.randomUUID(),
                batch_id: '',
                bill_type: 'SENDER_TO_RECEIVER',
                category: categoryId,
                unit_price: price,
                currency
            }];
        });
    };

    const handleAddCategory = () => {
        const newId = `custom_${Date.now()}`;
        const newCategory: Category = {
            id: newId,
            label: '新类别',
            code: `Custom ${categories.filter(c => c.isCustom).length + 1}`,
            isCustom: true
        };
        setCategories([...categories, newCategory]);
        setRules([...rules, {
            id: crypto.randomUUID(),
            batch_id: '',
            bill_type: 'SENDER_TO_RECEIVER',
            category: newId,
            unit_price: 0,
            currency
        }]);
        // 自动进入编辑模式
        setEditingCategoryId(newId);
        setEditingLabel('新类别');
    };

    const handleDeleteCategory = (categoryId: string) => {
        setCategories(categories.filter(c => c.id !== categoryId));
        setRules(rules.filter(r => r.category !== categoryId));
    };

    const handleStartEdit = (categoryId: string, currentLabel: string) => {
        setEditingCategoryId(categoryId);
        setEditingLabel(currentLabel);
    };

    const handleSaveEdit = (categoryId: string) => {
        if (editingLabel.trim()) {
            setCategories(categories.map(c =>
                c.id === categoryId ? { ...c, label: editingLabel.trim() } : c
            ));
            // 更新 rules 中的 category 名称（如果需要）
            setRules(rules.map(r =>
                r.category === categoryId ? { ...r, category: editingLabel.trim() } : r
            ));
        }
        setEditingCategoryId(null);
        setEditingLabel('');
    };

    const handleCancelEdit = () => {
        setEditingCategoryId(null);
        setEditingLabel('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                        货款结算单价设置
                    </h2>
                    <div className="flex items-center gap-2 mt-2 text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined text-sm">payments</span>
                        <p className="text-sm font-medium">结算币种：{currency === 'CNY' ? '人民币 (CNY)' : '越南盾 (VND)'}</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                    {categories.map((cat) => {
                        const rule = rules.find(r => r.category === cat.id || r.category === cat.label);
                        const price = rule ? rule.unit_price : '';
                        const isEditing = editingCategoryId === cat.id;

                        return (
                            <div key={cat.id} className="group relative">
                                <div className="flex items-center justify-between mb-2">
                                    {isEditing ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                type="text"
                                                value={editingLabel}
                                                onChange={(e) => setEditingLabel(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveEdit(cat.id);
                                                    if (e.key === 'Escape') handleCancelEdit();
                                                }}
                                                className="flex-1 px-2 py-1 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleSaveEdit(cat.id)}
                                                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                            >
                                                <span className="material-symbols-outlined text-sm">check</span>
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                                                    {cat.label}
                                                </label>
                                                <button
                                                    onClick={() => handleStartEdit(cat.id, cat.label)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-opacity"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-widest font-mono">
                                                    {cat.code}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-opacity"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="relative flex items-center group-focus-within:text-blue-600">
                                    <span className="absolute left-4 text-slate-400 dark:text-slate-500 font-mono font-medium group-focus-within:text-blue-500 transition-colors">
                                        {currency === 'CNY' ? '¥' : '₫'}
                                    </span>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => handlePriceChange(cat.id, parseFloat(e.target.value) || 0)}
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full h-12 pl-10 pr-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    />
                                    <span className="absolute right-4 text-slate-400 dark:text-slate-500 text-xs font-medium">
                                        {currency === 'VND' ? 'VND/KG' : '元/KG'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Category Button */}
                    <button
                        onClick={handleAddCategory}
                        className="w-full h-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        添加自定义类别
                    </button>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-6 space-y-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={() => onSave(rules)}
                        className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-white font-semibold text-base shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:to-blue-400"
                    >
                        <span className="material-symbols-outlined text-lg">save</span>
                        确认保存
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full h-12 bg-transparent border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 transition-all"
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    );
};
