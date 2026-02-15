import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/user.store';
import { useBatchStore } from '../store/batch.store';
import { useCreateBatch } from '../hooks/useBatches';
import { useCompanies } from '../hooks/useCompanies';
import { toast } from 'react-hot-toast';

const CreateBatch: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { setActiveBatchId } = useBatchStore();
  const { data: companies } = useCompanies();
  const createBatch = useCreateBatch();

  const [batchNo, setBatchNo] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = React.useState('');
  const [transitId, setTransitId] = React.useState('');
  const [receiverId, setReceiverId] = React.useState('');

  const transitCompanies = companies?.filter(c => c.role === 'transit' || c.role === 'admin') || [];
  const receiverCompanies = companies?.filter(c => c.role === 'receiver' || c.role === 'admin') || [];

  // Auto-generate on mount if empty
  React.useEffect(() => {
    generateBatchNo();
  }, []);

  const generateBatchNo = () => {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.floor(Math.random() * 900 + 100); // 100-999
    setBatchNo(`BT-${today}-${randomSuffix}`);
  };

  const handleCreate = async () => {
    if (!batchNo) {
      toast.error('请输入批次号');
      return;
    }
    if (!user?.company_id) {
      toast.error('当前用户未绑定公司，无法创建批次');
      return;
    }
    if (!transitId || !receiverId) {
      toast.error('请选择运输中转方和目的地接收方');
      return;
    }

    try {
      const res = await createBatch.mutateAsync({
        batch_no: batchNo,
        sender_company_id: user.company_id,
        transit_company_id: transitId,
        receiver_company_id: receiverId,
        currency: 'CNY',
        remarks: remarks || undefined
      });

      // Automatically set as active batch
      if (res && res.id) {
        setActiveBatchId(res.id);
        console.log('[CreateBatch] Active batch auto-switched to:', res.id);
        toast.success(`已切换到新批次: ${batchNo}`);
      }

      navigate('/');
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <div className="bg-background-dark font-display text-gray-100 min-h-screen flex flex-col overflow-hidden">
      <header className="bg-surface-dark/95 backdrop-blur shadow-md z-50">
        <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-400 border-b border-white/5">
          <span className="font-mono tracking-wider">操作员: {user?.full_name} ({user?.role})</span>
        </div>
        <div className="px-5 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-white/10">
            <span className="material-icons text-white">arrow_back_ios_new</span>
          </button>
          <h1 className="text-xl font-bold text-white tracking-wide">新建作业批次 (New Batch)</h1>
        </div>
      </header>

      <main className="flex-1 p-5 overflow-y-auto space-y-6">
        {/* Batch Number */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">批次号 (Batch Number)</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                className="w-full bg-input-bg border border-white/10 rounded-xl px-4 py-4 font-mono text-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="请输入或生成批次号"
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
              />
            </div>
            <button
              onClick={generateBatchNo}
              className="bg-primary/20 text-primary border border-primary/30 px-4 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="material-icons">autorenew</span>
            </button>
          </div>
        </div>

        {/* Transit Company */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">运输中转方 (Transit Carrier)</label>
          <div className="relative">
            <select
              className="w-full bg-input-bg border border-white/10 rounded-xl px-4 py-4 text-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none"
              value={transitId}
              onChange={(e) => setTransitId(e.target.value)}
            >
              <option value="">选择合作伙伴...</option>
              {transitCompanies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-icons text-primary pointer-events-none">local_shipping</span>
          </div>
        </div>

        {/* Receiver Company */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">目的地接收方 (Destination Warehouse)</label>
          <div className="relative">
            <select
              className="w-full bg-input-bg border border-white/10 rounded-xl px-4 py-4 text-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
            >
              <option value="">选择目的地...</option>
              {receiverCompanies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-icons text-primary pointer-events-none">warehouse</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">批次日期</label>
          <div className="relative">
            <input
              className="w-full bg-input-bg border border-white/10 rounded-xl px-4 py-4 text-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-icons text-primary pointer-events-none">calendar_today</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">备注信息</label>
          <textarea
            className="w-full bg-input-bg border border-white/10 rounded-xl px-4 py-3 text-base text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px]"
            placeholder="添加批次提示..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          ></textarea>
        </div>
      </main>

      <footer className="p-5 bg-surface-dark border-t border-white/5 space-y-3 safe-area-pb">
        <button
          onClick={handleCreate}
          disabled={createBatch.isPending}
          className="w-full bg-primary hover:bg-blue-600 text-white py-5 rounded-xl font-bold text-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {createBatch.isPending ? '创建中...' : (
            <>
              <span className="material-icons">check_circle</span>
              确认并开始作业
            </>
          )}
        </button>
      </footer>
    </div>
  );
};

export default CreateBatch;