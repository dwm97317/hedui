import React, { useState } from 'react';
import { Currency } from '../../store/finance.store';

interface ExchangeRateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (baseCurrency: Currency, targetCurrency: Currency, rate: number) => Promise<void>;
    initialData?: {
        baseCurrency: Currency;
        targetCurrency: Currency;
        rate: number;
    };
}

const ExchangeRateModal: React.FC<ExchangeRateModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData
}) => {
    const [baseCurrency, setBaseCurrency] = useState<Currency>(initialData?.baseCurrency || Currency.VND);
    const [targetCurrency, setTargetCurrency] = useState<Currency>(initialData?.targetCurrency || Currency.CNY);
    const [rate, setRate] = useState<string>(initialData?.rate?.toString() || '');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const rateNum = parseFloat(rate);

        if (isNaN(rateNum) || rateNum <= 0) {
            alert('请输入有效的汇率');
            return;
        }

        setLoading(true);
        try {
            await onSave(baseCurrency, targetCurrency, rateNum);
            onClose();
        } catch (error) {
            console.error('Failed to save exchange rate:', error);
            alert('保存失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const getCurrencyFlag = (currency: Currency) => {
        return currency === Currency.VND ? '🇻🇳' : '🇨🇳';
    };

    const getCurrencyName = (currency: Currency) => {
        return currency === Currency.VND ? '越南盾 (VND)' : '人民币 (CNY)';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl animate-slide-up">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {initialData ? '编辑汇率' : '新增汇率'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Base Currency */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            基础货币
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[Currency.VND, Currency.CNY].map((curr) => (
                                <button
                                    key={curr}
                                    type="button"
                                    onClick={() => {
                                        setBaseCurrency(curr);
                                        // Auto-set target to the other currency
                                        setTargetCurrency(curr === Currency.VND ? Currency.CNY : Currency.VND);
                                    }}
                                    className={`
                    flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                    ${baseCurrency === curr
                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }
                  `}
                                >
                                    <span className="text-2xl">{getCurrencyFlag(curr)}</span>
                                    <div className="text-left">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{curr}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {curr === Currency.VND ? '越南盾' : '人民币'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-800">
                            <span className="material-icons text-slate-400">arrow_downward</span>
                        </div>
                    </div>

                    {/* Target Currency */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            目标货币
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[Currency.VND, Currency.CNY].map((curr) => (
                                <button
                                    key={curr}
                                    type="button"
                                    onClick={() => setTargetCurrency(curr)}
                                    disabled={curr === baseCurrency}
                                    className={`
                    flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                    ${curr === baseCurrency
                                            ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700'
                                            : targetCurrency === curr
                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }
                  `}
                                >
                                    <span className="text-2xl">{getCurrencyFlag(curr)}</span>
                                    <div className="text-left">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{curr}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {curr === Currency.VND ? '越南盾' : '人民币'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Exchange Rate */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            汇率
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="any"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                                placeholder="请输入汇率"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                required
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                1 {baseCurrency} = {rate || '?'} {targetCurrency}
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            例如: VND → CNY 输入 0.00029 表示 1越南盾 = 0.00029人民币
                        </p>
                    </div>

                    {/* Preview */}
                    {rate && !isNaN(parseFloat(rate)) && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-icons text-blue-500 text-sm">info</span>
                                <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">汇率预览</span>
                            </div>
                            <div className="text-sm text-blue-700 dark:text-blue-300">
                                1 {baseCurrency} = {parseFloat(rate).toFixed(6)} {targetCurrency}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {baseCurrency === Currency.VND ? '1,000,000' : '100'} {baseCurrency} ≈ {
                                    baseCurrency === Currency.VND
                                        ? (1000000 * parseFloat(rate)).toFixed(2)
                                        : (100 * parseFloat(rate)).toFixed(2)
                                } {targetCurrency}
                            </div>
                        </div>
                    )}

                    {/* Warning */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4">
                        <div className="flex gap-3">
                            <span className="material-icons text-orange-500 text-xl shrink-0">warning_amber</span>
                            <div>
                                <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                                    重要提示
                                </h4>
                                <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                                    新汇率将立即生效，并应用于后续生成的所有账单。已生成的账单将保持原有汇率不变。
                                </p>
                            </div>
                        </div>
                    </div>

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
                            disabled={loading || !rate || isNaN(parseFloat(rate))}
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

export default ExchangeRateModal;
