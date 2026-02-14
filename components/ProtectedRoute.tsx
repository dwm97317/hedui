import React, { FC, useEffect } from 'react';
import { useUserStore } from '../store/user.store';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'sender' | 'transit' | 'receiver')[];
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, isAuthenticated, isLoading, fetchUser } = useUserStore();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                <span className="ml-3 font-medium">Authenticating...</span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-6 text-center">
                <span className="material-icons text-red-500 text-6xl mb-4">lock</span>
                <h1 className="text-xl font-bold mb-2">未登录或会话已过期</h1>
                <p className="text-slate-400 mb-6">请先登录后再访问此页面</p>
                <button
                    onClick={() => window.location.hash = '#/login'}
                    className="px-8 py-3 bg-primary rounded-xl font-bold"
                >
                    前往登录
                </button>
            </div>
        );
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return (
            <div className="error-screen">
                Access Denied: Requires role {allowedRoles.join(' or ')}. You are {user.role}.
            </div>
        );
    }

    return <>{children}</>;
};
