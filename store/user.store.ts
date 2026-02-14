import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { AuthService, Profile, Company } from '../services/auth.service';

interface UserState {
    user: (Profile & { company?: Company, email: string }) | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    fetchUser: () => Promise<void>;
    signOut: () => Promise<void>;
    checkRole: (allowedRoles: ('admin' | 'sender' | 'transit' | 'receiver')[]) => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    fetchUser: async () => {
        set({ isLoading: true });
        try {
            const response = await AuthService.getCurrentUser();

            if (response.success && response.data) {
                set({ user: response.data, isAuthenticated: true });
            } else {
                set({ user: null, isAuthenticated: false });
            }
        } catch (e) {
            set({ user: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false });
        }
    },

    signOut: async () => {
        await AuthService.signOut();
        set({ user: null, isAuthenticated: false });
    },

    checkRole: (allowedRoles) => {
        const { user } = get();
        if (!user) return false;
        return allowedRoles.includes(user.role);
    }
}));
