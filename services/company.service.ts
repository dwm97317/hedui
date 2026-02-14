import { supabase, ServiceResponse, handleServiceCall } from './supabase';

export interface Company {
    id: string;
    name: string;
    code: string;
    role: 'sender' | 'transit' | 'receiver' | 'admin';
    created_at: string;
}

export const CompanyService = {
    async list(): Promise<ServiceResponse<Company[]>> {
        return handleServiceCall(
            supabase.from('companies').select('*').order('name')
        );
    },
    async getById(id: string): Promise<ServiceResponse<Company>> {
        return handleServiceCall(
            supabase.from('companies').select('*').eq('id', id).single()
        );
    }
};
