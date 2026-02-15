import React, { FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/user.store';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'sender' | 'transit' | 'receiver')[];
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading } = useUserStore();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isLoading, isAuthenticated, navigate]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                <span className="ml-3 font-medium">Authenticating...</span>
            </div>
        );
    }

    if (!isAuthenticated) return null; // Logic handled by useEffect redirect

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return (
            <div className="error-screen">
                Access Denied: Requires role {allowedRoles.join(' or ')}. You are {user.role}.
            </div>
        );
    }

    return <>{children}</>;
};
