import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Currency, useFinanceStore } from '../../store/finance.store';
import ExchangeRateModal from '../../components/finance/ExchangeRateModal';

interface ExchangeRate {
  id: string;
  base_currency: Currency;
  target_currency: Currency;
  rate: number;
  is_active: boolean;
  created_at: string;
}

const ExchangeRates: React.FC = () => {
  const navigate = useNavigate();
  const { updateExchangeRate } = useFinanceStore();

  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRates(data || []);
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRate = async (baseCurrency: Currency, targetCurrency: Currency, rate: number) => {
    await updateExchangeRate(baseCurrency, targetCurrency, rate);
    await fetchRates();
    setEditingRate(null);
  };

  const handleEditClick = (rate: ExchangeRate) => {
    setEditingRate(rate);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingRate(null);
    setIsModalOpen(true);
  };

  const getCurrencyFlag = (currency: Currency) => {
    return currency === Currency.VND ? '🇻🇳' : '🇨🇳';
  };

  const getCurrencyName = (currency: Currency) => {
    return currency === Currency.VND ? '越南盾' : '人民币';
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
  };

  const vndToCnyRate = rates.find(r => r.base_currency === Currency.VND && r.target_currency === Currency.CNY);
  const cnyToVndRate = rates.find(r => r.base_currency === Currency.CNY && r.target_currency === Currency.VND);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-800 dark:text-slate-100 flex flex-col font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-full transition-colors">
          <span className="material-icons">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">汇率管理</h1>
        <button className="p-2 -mr-2 text-primary hover:bg-primary/10 rounded-full transition-colors" onClick={fetchRates}>
          <span className="material-icons">refresh</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {/* Warning Banner */}
        <div className="p-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-lg p-3 flex gap-3 items-start shadow-sm">
            <span className="material-icons text-orange-500 text-xl mt-0.5 shrink-0">lock_clock</span>
            <div>
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">汇率锁定机制说明</h3>
              <p className="text-xs text-orange-700/80 dark:text-orange-300/80 leading-relaxed">
                账单一旦生成，将永久锁定当时汇率，后续汇率变动不影响历史账单。
              </p>
            </div>
          </div>
        </div>

        {/* Current Rates Section */}
        <div className="px-4 mb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">生效中的汇率</h2>
            <span className="text-xs text-slate-400">
              {rates.length > 0 && rates[0] ? `上次更新: ${getTimeAgo(rates[0].created_at)}` : '暂无数据'}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-icons animate-spin text-primary text-3xl">refresh</span>
            </div>
          ) : rates.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
              <span className="material-icons text-slate-300 dark:text-slate-600 text-5xl mb-3">currency_exchange</span>
              <p className="text-slate-500 dark:text-slate-400 mb-4">暂无汇率数据</p>
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                立即添加
              </button>
            </div>
          ) : (
            <>
              {/* VND to CNY Rate Card */}
              {vndToCnyRate && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      生效中
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex -space-x-2">
                      <div aria-label="Vietnam Flag" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-gray-800 text-lg shadow-sm">
                        {getCurrencyFlag(Currency.VND)}
                      </div>
                      <div aria-label="China Flag" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-gray-800 text-lg shadow-sm">
                        {getCurrencyFlag(Currency.CNY)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        VND <span className="material-icons text-xs align-middle px-1">arrow_forward</span> CNY
                      </div>
                      <div className="text-xs text-slate-400">越南盾 转 人民币</div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {vndToCnyRate.rate.toFixed(6)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span>生效日期: {new Date(vndToCnyRate.created_at).toLocaleString('zh-CN')}</span>
                    <button
                      onClick={() => handleEditClick(vndToCnyRate)}
                      className="text-primary font-medium hover:text-primary/80"
                    >
                      编辑
                    </button>
                  </div>
                </div>
              )}

              {/* CNY to VND Rate Card */}
              {cnyToVndRate && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      生效中
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex -space-x-2">
                      <div aria-label="China Flag" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-gray-800 text-lg shadow-sm">
                        {getCurrencyFlag(Currency.CNY)}
                      </div>
                      <div aria-label="Vietnam Flag" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-gray-800 text-lg shadow-sm">
                        {getCurrencyFlag(Currency.VND)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        CNY <span className="material-icons text-xs align-middle px-1">arrow_forward</span> VND
                      </div>
                      <div className="text-xs text-slate-400">人民币 转 越南盾</div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {cnyToVndRate.rate.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span>生效日期: {new Date(cnyToVndRate.created_at).toLocaleString('zh-CN')}</span>
                    <button
                      onClick={() => handleEditClick(cnyToVndRate)}
                      className="text-primary font-medium hover:text-primary/80"
                    >
                      编辑
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 pb-8 safe-area-pb z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleAddNew}
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg border border-primary/30 bg-primary/5 text-primary font-semibold hover:bg-primary/10 transition-colors active:scale-[0.98]"
          >
            <span className="material-icons text-xl">add_circle_outline</span>
            新增汇率
          </button>
          <button
            onClick={fetchRates}
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg bg-primary text-white font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <span className="material-icons text-xl">cloud_sync</span>
            刷新数据
          </button>
        </div>
      </div>

      {/* Exchange Rate Modal */}
      <ExchangeRateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRate(null);
        }}
        onSave={handleSaveRate}
        initialData={editingRate ? {
          baseCurrency: editingRate.base_currency,
          targetCurrency: editingRate.target_currency,
          rate: editingRate.rate
        } : undefined}
      />
    </div>
  );
};

export default ExchangeRates;