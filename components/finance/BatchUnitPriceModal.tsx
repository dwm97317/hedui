import React, { useState } from 'react';
import { supabase } from '../../services/supabase';

interface BatchUnitPriceModalProps {
    isOpen: boolean;
    onClose: () => void;
    batchId: string;
    batchNo: string;
    currentPrices: {
        unit_price_a: number;
        unit_price_b: number;
        unit_price_c: number;
    };
    onSave: (priceA: number, priceB: number, priceC: number) => Promise<void>;
}

const BatchUnitPriceModal: React.FC<BatchUnitPriceModalProps> = ({
    isOpen,
    onClose,
    batchId,
    batchNo,
    currentPrices,
    onSave
}) => {
    const [priceA, setPriceA] = useState(currentPrices.unit_price_a.toString());
    const [priceB, setPriceB] = useState(currentPrices.unit_price_b.toString());
    const [priceC, setPriceC] = useState(currentPrices.unit_price_c.toString());
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const priceANum = parseFloat(priceA);
        const priceBNum = parseFloat(priceB);
        const priceCNum = parseFloat(priceC);

        if (isNaN(priceANum) || isNaN(priceBNum) || isNaN(priceCNum)) {
            alert('请输入有效的单价');
            return;
        }

        if (priceANum < 0 || priceBNum < 0 || priceCNum < 0) {
            alert('单价不能为负数');
            return;
        }

        setLoading(true);
        try {
            await onSave(priceANum, priceBNum, priceCNum);
            onClose();
        } catch (error) {
            console.error('Failed to update unit prices:', error);
            alert('保存失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const calculateProfit = () => {
        const a = parseFloat(priceA) || 0;
        const b = parseFloat(priceB) || 0;
        return a - b;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                批次单价设置
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                批次编号: {batchNo}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Warning */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4">
                        <div className="flex gap-3">
                            <span className="material-icons text-orange-500 text-xl shrink-0">warning_amber</span>
                            <div>
                                <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                                    重要提示
                                </h4>
                                <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                                    修改单价后，该批次的所有账单金额将自动重新计算。请谨慎操作。
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Price A */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                <span className="material-icons">local_shipping</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                    账单 A (物流费)
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    发货方 → 平台管理
                                </p>
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                                VND
                            </span>
                        </div>
                        <input
                            type="number"
                            step="any"
                            value={priceA}
                            onChange={(e) => setPriceA(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-900 dark:text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="输入单价 (VND/kg)"
                            required
                        />
                    </div>

                    {/* Price B */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                                <span className="material-icons">flight</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                    账单 B (运输费)
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    平台管理 → 运输方
                                </p>
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                                VND
                            </span>
                        </div>
                        <input
                            type="number"
                            step="any"
                            value={priceB}
                            onChange={(e) => setPriceB(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-900 dark:text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="输入单价 (VND/kg)"
                            required
                        />
                    </div>

                    {/* Price C */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                                <span className="material-icons">payments</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                    账单 C (货款)
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    发货方 → 收货方
                                </p>
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                                CNY
                            </span>
                        </div>
                        <input
                            type="number"
                            step="any"
                            value={priceC}
                            onChange={(e) => setPriceC(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-900 dark:text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="输入单价 (CNY/kg)"
                            required
                        />
                    </div>

                    {/* Profit Preview */}
                    {priceA && priceB && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-icons text-emerald-500 text-sm">trending_up</span>
                                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                                    预计利润 (每公斤)
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                {calculateProfit().toLocaleString()} VND/kg
                            </div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                账单A - 账单B = {parseFloat(priceA || '0').toLocaleString()} - {parseFloat(priceB || '0').toLocaleString()}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/30"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="material-icons animate-spin text-sm">refresh</span>
                                    保存中...
                                </span>
                            ) : (
                                '确认保存'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BatchUnitPriceModal;
