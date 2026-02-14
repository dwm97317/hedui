import { useState, useEffect } from 'react';
import { message } from 'antd';
import { supabase } from '../lib/supabase';

export function useAdminData() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data);
    };

    const fetchBatches = async () => {
        const { data } = await supabase
            .from('batches')
            .select(`
                *,
                batch_user_roles (
                    id, role, user_id, is_active,
                    user:users(nickname, avatar_url)
                )
            `)
            .order('created_at', { ascending: false });
        if (data) setBatches(data);
    };

    const revokeRole = async (roleId: string) => {
        const { error } = await supabase
            .from('batch_user_roles')
            .update({ is_active: false, revoked_at: new Date().toISOString() })
            .eq('id', roleId);

        if (error) {
            message.error(error.message);
        } else {
            message.success('权限已撤销');
            fetchBatches();
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const userId = localStorage.getItem('mock_user_id') || 'U001';
            const { data: user } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (!user || !['admin', 'auditor'].includes(user.system_role)) {
                message.error('您无权访问后台管理系统');
                setTimeout(() => window.location.href = '/', 1500);
            } else {
                setCurrentUser(user);
                setLoading(false);
                fetchUsers();
                fetchBatches();
            }
        };
        checkAuth();
    }, []);

    return { currentUser, users, batches, loading, fetchUsers, fetchBatches, revokeRole };
}
