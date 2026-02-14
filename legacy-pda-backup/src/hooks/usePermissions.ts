
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Batch, Role } from '../types';

export function usePermissions(activeBatch: Batch | null, role: Role, currentUserId: string) {
    const [canEdit, setCanEdit] = useState(false);

    useEffect(() => {
        const checkPermission = async () => {
            if (!activeBatch) {
                setCanEdit(false);
                return;
            }
            if (activeBatch.status === 'completed') {
                setCanEdit(false);
                return;
            }
            const { data } = await supabase.from('batch_user_roles').select('*')
                .eq('batch_id', activeBatch.id).eq('user_id', currentUserId).eq('role', role).eq('is_active', true).maybeSingle();
            setCanEdit(!!data);
        };
        checkPermission();
    }, [activeBatch, role, currentUserId]);

    return canEdit;
}
