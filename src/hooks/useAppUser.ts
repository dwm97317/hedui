
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAppUser() {
    const [currentUserId] = useState(() => localStorage.getItem('mock_user_id') || 'U001');
    const [systemRole, setSystemRole] = useState('operator');

    useEffect(() => {
        const syncUser = async () => {
            if (!currentUserId) return;
            await supabase.from('users').upsert({
                id: currentUserId,
                nickname: currentUserId === 'U001' ? '初始管理员' : `用户_${currentUserId.slice(-4)}`,
                last_login_at: new Date().toISOString()
            }, { onConflict: 'id' });

            const { data: user } = await supabase.from('users').select('*').eq('id', currentUserId).single();
            if (user) {
                setSystemRole(user.system_role);
            }
        };
        syncUser();
    }, [currentUserId]);

    return { currentUserId, systemRole };
}
