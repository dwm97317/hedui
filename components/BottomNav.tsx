import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: 'grid_view', label: '首页' },
    { path: '/create', icon: 'qr_code_scanner', label: '扫码' }, // Direct link to create for flow
    { path: '/reports', icon: 'insert_chart_outlined', label: '报表' },
    { path: '/settings', icon: 'settings', label: '设置' },
  ];

  return (
    <nav className="bg-surface-dark border-t border-white/5 safe-area-pb z-40 shrink-0">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive(item.path) ? 'text-primary' : 'text-gray-400 hover:text-white'
              }`}
          >
            <span className={`material-icons${isActive(item.path) ? '' : '-outlined'} text-2xl`}>
              {item.icon}
            </span>
            <span className="text-[10px] font-medium mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;