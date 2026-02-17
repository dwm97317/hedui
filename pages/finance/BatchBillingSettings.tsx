
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Batch, BillType, BillTemplate, BatchBillConfig, BatchPriceRule, CurrencyCode } from '../../types';
import { BillTemplateGallery } from '../../components/finance/BillTemplateGallery';
import { BillPriceSettingsModal } from '../../components/finance/BillPriceSettingsModal';

const BILL_TYPES: { type: BillType; label: string; currency: CurrencyCode }[] = [
    { type: 'SENDER_TO_ADMIN', label: '账单A：发货方 -> 平台 (Sender to Admin)', currency: 'VND' },
    { type: 'ADMIN_TO_TRANSIT', label: '账单B：平台 -> 中转方 (Admin to Transit)', currency: 'VND' },
    { type: 'SENDER_TO_RECEIVER', label: '账单C：发货方 -> 收货方 (Sender to Receiver)', currency: 'CNY' },
];

export const BatchBillingSettings: React.FC = () => {
    const { batchId } = useParams<{ batchId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [batch, setBatch] = useState<Batch | null>(null);
    const [configs, setConfigs] = useState<BatchBillConfig[]>([]);
    const [rules, setRules] = useState<BatchPriceRule[]>([]);
    const [templates, setTemplates] = useState<BillTemplate[]>([]);

    // Modal State
    const [activeBillType, setActiveBillType] = useState<BillType | null>(null);
    const [showTemplateGallery, setShowTemplateGallery] = useState(false);
    const [showPriceModal, setShowPriceModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, [batchId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (!batchId) return;

            // 1. Fetch Batch
            const { data: batchData } = await supabase.from('batches').select('*').eq('id', batchId).single();
            if (batchData) setBatch(batchData);

            // 2. Fetch Configs
            const { data: configData } = await supabase.from('batch_bill_configs').select('*, template:bill_templates(*)').eq('batch_id', batchId);
            if (configData) setConfigs(configData);

            // 3. Fetch Price Rules
            const { data: rulesData } = await supabase.from('batch_price_rules').select('*').eq('batch_id', batchId);
            if (rulesData) setRules(rulesData);

            // 4. Fetch Templates
            const { data: templatesData } = await supabase.from('bill_templates').select('*').eq('is_active', true);
            if (templatesData) setTemplates(templatesData);

        } catch (error) {
            console.error('Error fetching billing settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateSelect = async (templateId: string) => {
        if (!batchId || !activeBillType) return;

        try {
            const { error } = await supabase.from('batch_bill_configs').upsert({
                batch_id: batchId,
                bill_type: activeBillType,
                template_id: templateId,
                is_enabled: true
            }, { onConflict: 'batch_id,bill_type' });

            if (error) throw error;

            // Refresh
            await fetchData();
            setShowTemplateGallery(false);
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Failed to save template selection');
        }
    };

    const handlePriceSave = async (newRules: BatchPriceRule[]) => {
        if (!batchId || !activeBillType) return;

        try {
            // Prepare upsert data
            const upsertData = newRules.map(r => ({
                batch_id: batchId,
                bill_type: activeBillType,
                category: r.category,
                unit_price: r.unit_price,
                currency: r.currency
            }));

            // Find redundant IDs to update or clear? For now, simplistic upsert on unique constraint
            const { error } = await supabase.from('batch_price_rules').upsert(upsertData, { onConflict: 'batch_id,bill_type,category' });

            if (error) throw error;

            await fetchData();
            setShowPriceModal(false);
        } catch (error) {
            console.error('Error saving prices:', error);
            alert('Failed to save prices');
        }
    };

    const openTemplateGallery = (type: BillType) => {
        setActiveBillType(type);
        setShowTemplateGallery(true);
    };

    const openPriceModal = (type: BillType) => {
        setActiveBillType(type);
        setShowPriceModal(true);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">加载设置中...</div>;
    if (!batch) return <div className="p-8 text-center text-red-500">未找到批次</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">批次 #{batchId.slice(0, 8)} 账单设置</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">总重量: {batch.total_weight || 0} KG • 状态: {batch.status}</p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 space-y-6">
                {BILL_TYPES.map(({ type, label, currency }) => {
                    const config = configs.find(c => c.bill_type === type);
                    const typeRules = rules.filter(r => r.bill_type === type);
                    const generalRule = typeRules.find(r => r.category === 'general')?.unit_price;

                    return (
                        <div key={type} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{label}</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${config ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                    {config ? '已配置' : '待配置'}
                                </span>
                            </div>

                            <div className="p-5 flex flex-col sm:flex-row gap-6">
                                {/* Template Selection */}
                                <div className="flex-1 space-y-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">模板样式</p>
                                    {config?.template ? (
                                        <div className="flex items-start gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                            {config.template.preview_image_url && (
                                                <img src={config.template.preview_image_url} alt="Preview" className="w-16 h-20 object-cover rounded border border-slate-200" />
                                            )}
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{config.template.name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{config.template.description}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-sm text-slate-500">
                                            未选择模板
                                        </div>
                                    )}
                                    <button
                                        onClick={() => openTemplateGallery(type)}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-lg">style</span>
                                        选择模板
                                    </button>
                                </div>

                                {/* Vertical Divider */}
                                <div className="w-px bg-slate-100 dark:bg-slate-700 hidden sm:block"></div>

                                {/* Price Rules */}
                                <div className="flex-1 space-y-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">定价规则 ({currency})</p>
                                    <div className="space-y-2">
                                        {typeRules.length > 0 ? (
                                            typeRules.map(rule => (
                                                <div key={rule.id} className="flex justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400 capitalize">{rule.category}</span>
                                                    <span className="font-mono font-medium text-slate-900 dark:text-white">
                                                        {currency === 'CNY' ? '¥' : '₫'} {rule.unit_price.toFixed(2)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">使用系统默认费率</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => openPriceModal(type)}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                        配置价格
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </main>

            {/* Modals */}
            {showTemplateGallery && (
                <div className="fixed inset-0 z-40 bg-white dark:bg-slate-900 overflow-y-auto animate-in slide-in-from-bottom duration-300">
                    <div className="max-w-2xl mx-auto py-8">
                        <header className="px-4 mb-6 flex items-center gap-4">
                            <button onClick={() => setShowTemplateGallery(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                            <h2 className="text-xl font-bold">选择账单模板</h2>
                        </header>
                        <div className="px-4">
                            <BillTemplateGallery
                                templates={templates}
                                selectedTemplateId={configs.find(c => c.bill_type === activeBillType)?.template_id || null}
                                onSelect={handleTemplateSelect}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showPriceModal && activeBillType && (
                <BillPriceSettingsModal
                    isOpen={showPriceModal}
                    onClose={() => setShowPriceModal(false)}
                    onSave={handlePriceSave}
                    initialRules={rules.filter(r => r.bill_type === activeBillType)}
                    currency={BILL_TYPES.find(t => t.type === activeBillType)?.currency || 'VND'}
                />
            )}
        </div>
    );
};
