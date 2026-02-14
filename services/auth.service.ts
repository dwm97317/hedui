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
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
            return { data: null, error: authError?.message || 'No active session', success: false };
        }

        // Now fetch profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*, company:companies(*)') // Joint Fetch
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.error('Failed to fetch profile', profileError);
            return { data: null, error: profileError.message, success: false };
        }

        return {
            data: { ...profile, email: session.user.email },
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
    }
};
