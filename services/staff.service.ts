
import { supabase } from './supabase';
import { Profile } from './auth.service';

export interface StaffProfile extends Profile {
    permissions: string[];
    is_master: boolean;
}

export const StaffService = {
    /**
     * Get all staff for the current user's company
     */
    async getStaff(companyId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as StaffProfile[];
    },

    /**
     * Update staff permissions
     */
    async updatePermissions(userId: string, permissions: string[]) {
        const { error } = await supabase
            .from('profiles')
            .update({ permissions })
            .eq('id', userId);

        if (error) throw error;
        return true;
    },

    /**
     * Toggle a user as master (Admin only usually, but allowed by Master here if policy allows)
     */
    async toggleMaster(userId: string, isMaster: boolean) {
        const { error } = await supabase
            .from('profiles')
            .update({ is_master: isMaster })
            .eq('id', userId);

        if (error) throw error;
        return true;
    },

    /**
     * In this simple version, creating an account requires a service role or edge function.
     * We provide a helper to invite via code or explain the flow.
     */
    getRegistrationUrl(companyId: string) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#/login?companyId=${companyId}`;
    }
};
