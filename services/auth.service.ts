import { supabase, ServiceResponse, handleServiceCall } from './supabase';

export interface Profile {
    id: string;
    company_id: string;
    role: 'admin' | 'sender' | 'transit' | 'receiver';
    full_name?: string;
    is_active: boolean;
    email: string; // Not in profile table by default, usually in auth metadata, but can be managed here
    created_at: string;
}

export interface Company {
    id: string;
    name: string;
    code: string;
    role: 'admin' | 'sender' | 'transit' | 'receiver';
}

export const AuthService = {
    /**
     * Get current authenticated user
     */
    async getCurrentUser(): Promise<ServiceResponse<Profile & { company?: Company }>> {
        console.log('[AuthService] 🔍 getCurrentUser: Checking session');
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            console.log('[AuthService] ℹ️ no active session found');
            return { data: null, error: authError?.message || 'No active session', success: false };
        }

        console.log('[AuthService] 📡 Fetching profile for user:', session.user.id);

        // Use handleServiceCall which has retries and better error handling
        const response = await handleServiceCall<Profile & { company: Company }>(
            supabase
                .from('profiles')
                .select('*, company:companies(*)')
                .eq('id', session.user.id)
                .single()
        );

        if (!response.success || !response.data) {
            console.error('[AuthService] ❌ profile fetch failed:', response.error);
            return { data: null, error: response.error, success: false };
        }

        return {
            data: { ...response.data, email: session.user.email || '' },
            error: null,
            success: true
        };
    },

    /**
     * Sign In (Use standard flow, redirect or password)
     */
    // ... Login methods usually handled by UI forms directly calling supabase.auth.signInWithPassword

    /**
     * Sign Out
     */
    async signOut(): Promise<void> {
        await supabase.auth.signOut();
        // Specific cleanup for Supabase keys to avoid wiping app settings (like scanner configs)
        Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
                localStorage.removeItem(key);
            }
        });
        sessionStorage.clear();
    }
};
