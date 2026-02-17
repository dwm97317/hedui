import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Profile } from './auth.service';

export interface StaffProfile extends Profile {
    permissions: string[];
    is_master: boolean;
    email: string;
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
     * Remove a staff member from the company
     */
    async removeStaff(userId: string) {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;
        return true;
    },

    /**
     * In this simple version, creating an account requires a service role or edge function.
     * We provide a helper to invite via code or explain the flow.
     */
    async getRegistrationUrl(companyId: string) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#/login?companyId=${companyId}`;
    },

    /**
     * Create a staff member directly (Requires Secret Key in VITE_SUPABASE_SECRET_KEY)
     * This uses the Admin Auth API to create an account without logging the current user out.
     */
    async createStaffDirectly(params: {
        email: string;
        password: string;
        fullName: string;
        companyId: string;
        companyRole: string;
        permissions: string[];
    }) {
        const secretKey = import.meta.env.VITE_SUPABASE_SECRET_KEY;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

        if (!secretKey) {
            throw new Error('未配置管理密钥 (VITE_SUPABASE_SECRET_KEY)，无法直接创建。');
        }

        // Initialize admin client
        const adminClient = createClient(supabaseUrl, secretKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 1. Create User in Auth
        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
            email: params.email,
            password: params.password,
            email_confirm: true,
            user_metadata: { full_name: params.fullName }
        });

        if (authError) throw authError;

        // 2. Create Profile in public.profiles (Relying on triggers if they exist, but creating explicitly to be sure)
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: authUser.user.id,
                email: params.email,
                full_name: params.fullName,
                company_id: params.companyId,
                role: params.companyRole,
                permissions: params.permissions,
                is_master: false
            });

        if (profileError) {
            // Cleanup auth user if profile fails
            await adminClient.auth.admin.deleteUser(authUser.user.id);
            throw profileError;
        }

        return authUser.user;
    }
};
