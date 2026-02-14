import React, { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useUserStore } from '../store/user.store';
import TransitHome from './transit/TransitHome';
import ReceiverHome from './receiver/ReceiverHome';

const Home: React.FC = () => {
  const { user, isLoading } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-dark text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  switch (user.role) {
    case 'sender':
      return <Navigate to="/sender" replace />;
    case 'transit':
      return <TransitHome />;
    case 'receiver':
      return <ReceiverHome />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-background-dark text-white gap-4">
          <span className="material-icons text-6xl text-yellow-500">warning</span>
          <h1 className="text-xl font-bold">未授权的角色</h1>
          <p className="text-gray-400">您的账号角色 ({user.role}) 暂无访问权限</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            返回登录
          </button>
        </div>
      );
  }
};

export default Home;
