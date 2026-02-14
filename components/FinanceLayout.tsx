import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const FinanceBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 w-full bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 px-6 z-50 safe-area-pb">
      <div className="flex justify-between items-center pb-4">
        <button 
          onClick={() => navigate('/finance')}
          className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/finance') ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <span className="material-icons text-2xl">dashboard</span>
          <span className="text-[10px] font-medium">概览</span>
        </button>
        
        <button 
          onClick={() => navigate('/finance/bills')}
          className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/finance/bills') ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <span className="material-icons text-2xl">receipt_long</span>
          <span className="text-[10px] font-medium">账单</span>
        </button>

        {/* Center Action Button */}
        <div className="relative -top-5">
          <button className="w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/40 flex items-center justify-center transform hover:scale-105 transition-transform">
            <span className="material-icons">add</span>
          </button>
        </div>

        <button 
          onClick={() => navigate('/finance/reconciliation')}
          className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/finance/reconciliation') ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <span className="material-icons text-2xl">account_balance_wallet</span>
          <span className="text-[10px] font-medium">资金</span>
        </button>

        <button 
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/profile') ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <span className="material-icons text-2xl">person</span>
          <span className="text-[10px] font-medium">我的</span>
        </button>
      </div>
    </nav>
  );
};
