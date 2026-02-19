import { create } from 'zustand';
import { queryClient } from '../services/queryClient';
import { supabase } from '../services/supabase';
import { AuthService, Profile, Company } from '../services/auth.service';

interface UserState {
    user: (Profile & { company?: Company, email: string }) | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    fetchUser: () => Promise<void>;
    signOut: () => Promise<void>;
    setUser: (user: Profile | null) => void;
    checkRole: (allowedRoles: ('admin' | 'sender' | 'transit' | 'receiver')[]) => boolean;
    hasPermission: (permission: 'warehouse' | 'finance' | 'manager') => boolean;
}

const fetchUserLock = {
    promise: null as Promise<void> | null
};

export const useUserStore = create<UserState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    fetchUser: async () => {
        // If there's an active fetch promise, return it to avoid redundancy
        if (fetchUserLock.promise) {
            console.log('[UserStore] ⏩ fetchUser: Request already in progress, joining existing promise');
            return fetchUserLock.promise;
        }

        console.log('[UserStore] 🔄 fetchUser: Starting...');

        // Only set global loading for initial auth or if we don't have a user
        if (!get().isAuthenticated || !get().user) {
            set({ isLoading: true });
        }

        fetchUserLock.promise = (async () => {
            try {
                console.log('[UserStore] 📡 fetchUser: Calling AuthService.getCurrentUser()');
                const response = await AuthService.getCurrentUser();
                console.log('[UserStore] 📦 fetchUser: Response received:', {
                    success: response.success,
                    hasData: !!response.data,
                    userId: response.data?.id
                });

                if (response.success && response.data) {
                    console.log('[UserStore] ✅ fetchUser: User authenticated', {
                        role: response.data.role,
                        email: response.data.email
                    });
                    set({ user: response.data, isAuthenticated: true });
                } else {
                    console.log('[UserStore] ❌ fetchUser: No user data, setting unauthenticated');
                    set({ user: null, isAuthenticated: false });
                }
            } catch (e) {
                console.error('[UserStore] 💥 fetchUser: Error occurred:', e);
                set({ user: null, isAuthenticated: false });
            } finally {
                console.log('[UserStore] 🏁 fetchUser: Complete, clearing promise lock');
                set({ isLoading: false });
                fetchUserLock.promise = null;
            }
        })();

        return fetchUserLock.promise;
    },

    setUser: (user) => {
        console.log('[UserStore] 👤 setUser: Setting user', {
            hasUser: !!user,
            role: user?.role,
            email: user?.email
        });
        set({ user, isAuthenticated: !!user, isLoading: false });
    },

    signOut: async () => {
        console.log('[UserStore] 🚪 signOut: Step 1 - Clearing local state');
        // Clear local state immediately to avoid race conditions
        set({ user: null, isAuthenticated: false, isLoading: false });

        console.log('[UserStore] 🗑️ signOut: Step 2 - Clearing React Query cache');
        // Clear Query Cache to prevent cross-user data leakage and ensure freshness
        queryClient.removeQueries();
        queryClient.cancelQueries();
        console.log('[UserStore] ✅ signOut: Cache cleared');

        try {
            console.log('[UserStore] 📤 signOut: Step 3 - Calling AuthService.signOut()');
            await AuthService.signOut();
            console.log('[UserStore] ✅ signOut: AuthService.signOut() completed');
        } catch (e) {
            console.error('[UserStore] 💥 signOut: Error during AuthService.signOut():', e);
        } finally {
            console.log('[UserStore] 🔄 signOut: Step 4 - Reloading page in 100ms...');
            // Small delay to ensure logs are visible
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    },

    checkRole: (allowedRoles) => {
        const { user } = get();
        if (!user) return false;
        return allowedRoles.includes(user.role);
    },

    hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'admin' || user.is_master) return true;
        if (!user.permissions) return false;
        return user.permissions.includes(permission) || user.permissions.includes('manager');
    }
}));
