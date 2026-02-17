import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useBillDetail, useBillById, useMarkBillPaid, useCancelBill, useAddPayment } from '../../hooks/useBilling';
import { useBatchDetail } from '../../hooks/useBatches';
import { useUserStore } from '../../store/user.store';
import { toast } from 'react-hot-toast';

const BillDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id: billParamId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batchId');

  // Fetch by Bill ID if provided (from Bill List), or by Batch ID (from Batch completion)
  const { data: billById, isLoading: loadingBillById } = useBillById(billParamId || '');
  const { data: billByBatch, isLoading: loadingBillByBatch } = useBillDetail(batchId || '');

  // Mutators
  const markPaid = useMarkBillPaid();
  const cancelBill = useCancelBill();
  const addPayment = useAddPayment();
  const isAdmin = useUserStore(state => state.checkRole(['admin']));

  const bill = billById || billByBatch;
  const isLoading = loadingBillById || loadingBillByBatch;

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');

  const handlePay = async () => {
    if (!bill) return;
    if (window.confirm('确认全额标记支付此账单？')) {
      await markPaid.mutateAsync(bill.id);
    }
  };

  const handleAddPayment = async () => {
    if (!bill || paymentAmount <= 0) return;
    try {
      await addPayment.mutateAsync({
        billId: bill.id,
        amount: paymentAmount,
        method: paymentMethod,
        reference: ''
      });
      setPaymentAmount(0);
    } catch (e) {
      // toast handled in hook
    }
  };

  const handleCancel = async () => {
    if (!bill) return;
    if (window.confirm('确定要取消此账单吗？')) {
      await cancelBill.mutateAsync(bill.id);
    }
  };

  // We might not have the full batch info if we fetched by Bill ID (unless we joined it)
  // Our updated BillingService.getById joins batch info.
  const batch = bill?.batch;

  if (isLoading) return <div className="text-white p-8 animate-pulse">正在获取财务记录...</div>;
  if (!bill) return <div className="text-white p-8">暂未生成该批次的账单。</div>;

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 antialiased h-screen flex flex-col overflow-hidden selection:bg-primary/30">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shrink-0 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-full active:bg-slate-100 dark:active:bg-slate-800 transition-colors">
            <span className="material-icons text-xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold leading-tight">账单明细 (Bill Details)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{bill.bill_no}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bill.status === 'paid' ? 'bg-success text-white' :
              bill.status === 'partially_paid' ? 'bg-blue-500 text-white' :
                'bg-yellow-500/20 text-yellow-500'
            }`}>
            {bill.status}
          </span>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        {/* Bill Info Card */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 mb-2 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold uppercase text-slate-500 tracking-wider">当前批次 (Batch)</span>
                <span className="font-medium text-slate-900 dark:text-white">{batch?.batch_no || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold uppercase text-slate-500 tracking-wider">生成日期 (Date)</span>
                <span className="font-medium text-slate-900 dark:text-white">{new Date(bill.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          {/* Summary Dashboard */}
          <div className="bg-background-light dark:bg-slate-800 rounded-lg p-3 grid grid-cols-2 gap-2 text-center divide-x divide-slate-200 dark:divide-slate-700">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">已付 / 总计</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                <span className="text-primary">{bill.paid_amount.toLocaleString()}</span> / {bill.total_amount.toLocaleString()} <span className="text-xs text-gray-400">{bill.currency}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">状态 (Status)</p>
              <p className={`text-sm font-bold flex items-center justify-center gap-1 ${bill.status === 'paid' ? 'text-success' :
                  bill.status === 'partially_paid' ? 'text-blue-500' :
                    'text-yellow-500'
                }`}>
                <span className="material-icons text-sm">{bill.status === 'paid' ? 'check_circle' : (bill.status === 'partially_paid' ? 'payments' : 'schedule')}</span>
                {bill.status === 'paid' ? '已收全款' : (bill.status === 'partially_paid' ? '部分支付' : '等待支付')}
              </p>
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="px-4 py-4 space-y-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase px-1">费用明细 (Line Items)</h2>

          {bill.bill_items?.map((item: any, idx: number) => (
            <div key={item.id || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-4 active:scale-[0.99] transition-transform">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{item.description}</span>
                <span className="text-lg font-mono font-bold text-primary">{item.amount.toLocaleString()}</span>
              </div>
              <div className="text-[10px] text-gray-400">核算基于: 批次总重量 {(batch?.total_weight || 0).toFixed(2)}kg</div>
            </div>
          ))}

          {!bill.bill_items?.length && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-4 flex justify-between items-center">
              <span className="text-sm italic text-gray-500">基础运费 (Freight Charges)</span>
              <span className="text-lg font-bold">{bill.total_amount.toLocaleString()}</span>
            </div>
          )}

          {/* Payment Records Section */}
          <div className="mt-8">
            <h2 className="text-xs font-bold text-gray-500 uppercase px-1 mb-3">支付记录 (Payment History)</h2>
            <div className="space-y-2">
              {bill.bill_payments?.map((payment: any) => (
                <div key={payment.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 flex justify-between items-center border border-slate-100 dark:border-slate-700">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {payment.payment_method === 'bank_transfer' ? '银行转账' : payment.payment_method}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(payment.payment_date).toLocaleString()}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">+{Number(payment.amount).toLocaleString()}</span>
                </div>
              ))}
              {(!bill.bill_payments || bill.bill_payments.length === 0) && (
                <p className="text-xs text-slate-400 italic px-1">暂无支付记录</p>
              )}
            </div>
          </div>

          {/* Admin Payment Form */}
          {isAdmin && bill.status !== 'paid' && bill.status !== 'cancelled' && (
            <div className="mt-8 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-4">录入新支付 (Admin Only)</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">支付金额 ({bill.currency})</label>
                  <input
                    type="number"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                    placeholder="输入实收金额"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">支付方式</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none"
                  >
                    <option value="bank_transfer">银行转账</option>
                    <option value="cash">现金支付</option>
                    <option value="other">其他方式</option>
                  </select>
                </div>
                <button
                  onClick={handleAddPayment}
                  disabled={addPayment.isPending || paymentAmount <= 0}
                  className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-sm shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {addPayment.isPending ? '提交中...' : '提交支付记录'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 mt-4 mb-24">
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800/50">
            <div className="flex gap-3">
              <span className="material-icons text-primary">info</span>
              <div>
                <h4 className="text-sm font-bold">Billing Logic</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  This bill was automatically generated upon batch completion based on the final measured weight of <b>{(batch?.total_weight || 0).toFixed(2)}kg</b>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Footer Action Bar - Only shown for Admin */}
      {isAdmin && (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shrink-0 pb-8 safe-pb z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3">
            {(bill.status === 'pending' || bill.status === 'partially_paid') && (
              <>
                <button
                  onClick={handleCancel}
                  disabled={cancelBill.isPending}
                  className="flex-1 py-3.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-icons text-lg">close</span>
                  取消账单
                </button>
                <button
                  onClick={handlePay}
                  disabled={markPaid.isPending}
                  className="flex-1 py-3.5 px-4 bg-primary hover:bg-primary/90 text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-icons text-lg">check</span>
                  直接标为已收全款
                </button>
              </>
            )}
            {bill.status === 'paid' && (
              <button className="flex-1 py-3.5 px-4 bg-success text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2">
                <span className="material-icons text-lg">check_circle</span>
                已支付 (Paid)
              </button>
            )}
            {bill.status === 'cancelled' && (
              <button className="flex-1 py-3.5 px-4 bg-slate-200 text-slate-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                <span className="material-icons text-lg">block</span>
                已取消 (Cancelled)
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
};

export default BillDetail;