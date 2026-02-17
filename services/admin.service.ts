
import { supabase } from './supabase';

export interface UserProfile {
    id: string;
    full_name: string | null;
    role: 'admin' | 'sender' | 'transit' | 'receiver';
    company_id: string | null;
    created_at: string;
    company?: {
        name: string;
    };
    email?: string;
}

export interface Company {
    id: string;
    name: string;
    code: string;
    role: 'sender' | 'transit' | 'receiver' | 'admin';
    created_at: string;
}

export const AdminService = {
    async getUsers() {
        // Since we can't easily join with auth.users to get email without service_role
        // We'll just fetch profiles and companies for now.
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                company:companies(name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as UserProfile[];
    },

    async getCompanies() {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as Company[];
    },

    async updateUserRole(userId: string, role: string) {
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);

        if (error) throw error;
        return true;
    },

    async toggleUserStatus(userId: string, isDisabled: boolean) {
        // Placeholder for disabled status
        console.log(`Toggling status for user ${userId} to ${isDisabled}`);
        return true;
    },

    async deleteUser(userId: string) {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
        if (error) throw error;
        return true;
    },

    async createCompany(company: Partial<Company>) {
        const { data, error } = await supabase
            .from('companies')
            .insert(company)
            .select()
            .single();
        if (error) throw error;
        return data as Company;
    },

    async updateCompany(companyId: string, company: Partial<Company>) {
        const { data, error } = await supabase
            .from('companies')
            .update(company)
            .eq('id', companyId)
            .select()
            .single();
        if (error) throw error;
        return data as Company;
    },

    async deleteCompany(companyId: string) {
        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', companyId);
        if (error) throw error;
        return true;
    }
};
