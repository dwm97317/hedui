import React, { FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/user.store';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'sender' | 'transit' | 'receiver')[];
    requiredPermission?: 'warehouse' | 'finance' | 'manager';
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, allowedRoles, requiredPermission }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading, hasPermission } = useUserStore();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isLoading, isAuthenticated, navigate]);

    if (isLoading && !isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                <span className="ml-3 font-medium">Authenticating...</span>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    // Check Role
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-6 text-center">
                <span className="material-icons text-6xl text-red-500 mb-4">gpp_maybe</span>
                <h1 className="text-xl font-bold mb-2">权限不足</h1>
                <p className="text-slate-400">该页面需要 {allowedRoles.join(' 或 ')} 权限。您当前角色为 {user.role}。</p>
                <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-primary rounded-full font-bold">返回首页</button>
            </div>
        );
    }

    // Check Permission
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-6 text-center">
                <span className="material-icons text-6xl text-orange-500 mb-4">lock_person</span>
                <h1 className="text-xl font-bold mb-2">功能受限</h1>
                <p className="text-slate-400">您的账号没有 {requiredPermission === 'warehouse' ? '仓管' : requiredPermission === 'finance' ? '财务' : '主管'} 权限。</p>
                <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-slate-800 rounded-full font-bold">上一步</button>
            </div>
        );
    }

    return <>{children}</>;
};
