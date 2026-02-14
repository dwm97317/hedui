import React from 'react';
import { useNavigate } from 'react-router-dom';

const BartenderConfig: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen flex flex-col font-display pb-24 relative overflow-hidden">
       {/* Header */}
       <header className="bg-white dark:bg-surface-dark shadow-sm sticky top-0 z-40 border-b border-gray-200 dark:border-white/5">
         <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors">
                    <span className="material-icons">arrow_back</span>
                </button>
                <div className="flex flex-col">
                    <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">BarTender 配置</h1>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Hedui Logistics Platform</span>
                </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                A
            </div>
         </div>
       </header>

       {/* Main Content */}
       <main className="max-w-2xl mx-auto w-full p-4 space-y-4 overflow-y-auto no-scrollbar">
          {/* Status Banner */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-3">
             <span className="material-icons text-green-600 dark:text-green-400 text-sm mt-0.5">check_circle</span>
             <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">服务运行正常</p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">上次同步时间: 10分钟前</p>
             </div>
          </div>

          {/* Section 1: Service Connection */}
          <section className="bg-white dark:bg-surface-dark shadow-sm rounded-xl p-5 border border-gray-200 dark:border-white/5">
             <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-icons text-primary">dns</span>
                服务连接配置
             </h2>
             <div className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">API 服务地址 URL</label>
                   <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                         <span className="text-slate-400 sm:text-sm">https://</span>
                      </div>
                      <input className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 pl-16 pr-3" placeholder="bt2022.hedui.com/integration" type="text" defaultValue="api.printer-service.local:5050"/>
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">认证方式</label>
                   <div className="flex gap-4 mt-2">
                      <label className="flex items-center">
                         <input defaultChecked className="text-primary focus:ring-primary border-gray-300" name="auth_type" type="radio"/>
                         <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Basic</span>
                      </label>
                      <label className="flex items-center">
                         <input className="text-primary focus:ring-primary border-gray-300" name="auth_type" type="radio"/>
                         <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Token</span>
                      </label>
                      <label className="flex items-center">
                         <input className="text-primary focus:ring-primary border-gray-300" name="auth_type" type="radio"/>
                         <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">None</span>
                      </label>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">用户名</label>
                      <input className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3" type="text" defaultValue="admin_print"/>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">密码</label>
                      <input className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3" type="password" defaultValue="••••••••"/>
                   </div>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/5 mt-2">
                   <span className="text-xs text-slate-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      已连接
                   </span>
                   <button className="text-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1 py-2">
                      <span className="material-icons text-sm">refresh</span>
                      测试连接
                   </button>
                </div>
             </div>
          </section>

          {/* Section 2: Template Config */}
          <section className="bg-white dark:bg-surface-dark shadow-sm rounded-xl p-5 border border-gray-200 dark:border-white/5">
             <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-icons text-primary">description</span>
                模板参数
             </h2>
             <div className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">BTW 模板文件路径</label>
                   <div className="relative">
                      <input className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 pl-3 pr-10" type="text" defaultValue="C:\BarTender\Templates\Waybill_Standard_2024.btw"/>
                      <span className="material-icons absolute right-3 top-2.5 text-slate-400 text-sm">folder_open</span>
                   </div>
                   <p className="text-xs text-slate-500 mt-1">需填写服务器绝对路径</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                   <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">默认打印机</label>
                      <select className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3">
                         <option>Zebra ZT410 (Warehouse A)</option>
                         <option>HP LaserJet Pro</option>
                         <option>Datamax O'Neil</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">打印份数</label>
                      <input className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3" min="1" type="number" defaultValue="1"/>
                   </div>
                </div>
             </div>
          </section>

          {/* Section 3: Field Mapping */}
          <section className="bg-white dark:bg-surface-dark shadow-sm rounded-xl p-5 border border-gray-200 dark:border-white/5">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-0 flex items-center gap-2">
                   <span className="material-icons text-primary">compare_arrows</span>
                   字段映射
                </h2>
                <button className="text-xs text-primary font-medium">重置默认</button>
             </div>
             <div className="bg-slate-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/5 overflow-hidden">
                <table className="w-full text-sm text-left">
                   <thead className="bg-slate-100 dark:bg-white/5 text-xs uppercase text-slate-500 dark:text-slate-400">
                      <tr>
                         <th className="px-4 py-3 font-medium">系统字段</th>
                         <th className="px-4 py-3 font-medium">模板变量名</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                      {[
                        { label: 'order_no', value: 'OrderNumber' },
                        { label: 'weight', value: 'GrossWeight' },
                        { label: 'recipient_name', value: 'ReceiverName' },
                        { label: 'dimensions (l,w,h)', value: 'DimsString' }
                      ].map((row, i) => (
                        <tr key={i} className="bg-white dark:bg-surface-dark">
                             <td className="px-4 py-3">
                                <span className="font-mono text-xs bg-slate-100 dark:bg-white/10 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{row.label}</span>
                             </td>
                             <td className="px-4 py-2">
                                <input className="block w-full text-xs border-0 border-b border-transparent bg-transparent focus:border-primary focus:ring-0 p-0 text-slate-900 dark:text-white placeholder-slate-400" placeholder="Target Variable" type="text" defaultValue={row.value}/>
                             </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </section>

          {/* Section 4: Behavior Policies */}
          <section className="bg-white dark:bg-surface-dark shadow-sm rounded-xl p-5 border border-gray-200 dark:border-white/5">
             <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-icons text-primary">settings</span>
                行为策略
             </h2>
             <div className="space-y-3">
                {[
                  { label: '打印前自动保存', desc: '提交任务前将先保存当前订单状态', checked: true },
                  { label: '失败允许重试', desc: '如果 BarTender 服务未响应，尝试重连3次', checked: true },
                  { label: '重复打印确认', desc: '检测到已打印订单时弹出警告', checked: false }
                ].map((item, i) => (
                   <label key={i} className="flex items-start cursor-pointer">
                      <div className="flex items-center h-5">
                         <input defaultChecked={item.checked} className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" type="checkbox"/>
                      </div>
                      <div className="ml-3 text-sm">
                         <span className="font-medium text-slate-900 dark:text-white block">{item.label}</span>
                         <span className="text-xs text-slate-500 block">{item.desc}</span>
                      </div>
                   </label>
                ))}
             </div>
          </section>

          {/* Quick Test Area */}
          <section className="bg-white dark:bg-surface-dark shadow-sm rounded-xl p-5 border-l-4 border-l-primary/60 border border-gray-200 dark:border-white/5">
             <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                快速测试区域
             </h2>
             <div className="flex gap-3 items-end">
                <div className="flex-1">
                   <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">测试运单号 ID</label>
                   <input className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3" placeholder="例如: WAY-2023-001" type="text"/>
                </div>
                <button className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition-colors text-sm whitespace-nowrap">
                    测试打印
                </button>
             </div>
          </section>

          <div className="h-8"></div>
       </main>

       {/* Sticky Footer */}
       <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-t border-gray-200 dark:border-white/5 z-50">
          <div className="max-w-2xl mx-auto flex gap-3">
             <button className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2">
                <span className="material-icons text-sm">save</span>
                保存所有配置
             </button>
          </div>
       </div>
    </div>
  );
};

export default BartenderConfig;