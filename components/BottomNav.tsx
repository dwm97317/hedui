import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: 'home', label: '首页' },
    { path: '/create', icon: 'qr_code_scanner', label: '扫码' },
    { path: '/reports', icon: 'bar_chart', label: '报表' },
    { path: '/settings', icon: 'settings', label: '设置' },
  ];

  return (
    <nav className="bg-white dark:bg-[#1c1f27] border-t border-slate-200 dark:border-slate-800 px-4 py-2 safe-area-pb z-40 shrink-0">
      <div className="flex justify-between items-center h-12">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-full transition-all ${isActive(item.path) ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <span
              className={`material-icons-round transition-all ${isActive(item.path) ? '' : 'opacity-70'}`}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;