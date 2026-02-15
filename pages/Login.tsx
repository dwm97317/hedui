import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useUserStore } from '../store/user.store';
import { toast } from 'react-hot-toast';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { fetchUser, user, isAuthenticated, isLoading: isCheckingSession } = useUserStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Track if we've already redirected to prevent duplicate navigation
    const hasRedirected = useRef(false);

    // 1. Check Session on Mount (Session Recovery)
    useEffect(() => {
        console.log('[Login] 🔍 useEffect[1]: Checking session on mount');
        fetchUser();
    }, [fetchUser]);

    const handleRedirect = React.useCallback((role: string) => {
        console.log('[Login] 🧭 handleRedirect: Called with role:', role);
        switch (role) {
            case 'sender':
                console.log('[Login] ➡️ Navigating to /sender');
                navigate('/sender', { replace: true });
                break;
            case 'transit':
                console.log('[Login] ➡️ Navigating to /transit');
                navigate('/transit', { replace: true });
                break;
            case 'receiver':
                console.log('[Login] ➡️ Navigating to /receiver');
                navigate('/receiver', { replace: true });
                break;
            case 'admin':
                console.log('[Login] ➡️ Navigating to /admin/dashboard');
                navigate('/admin/dashboard', { replace: true });
                break;
            default:
                console.warn('[Login] ⚠️ Unknown role:', role);
                toast.error('未知的用户角色');
                navigate('/login', { replace: true });
        }
    }, [navigate]);

    // 2. Auto-redirect if already logged in (but only once)
    useEffect(() => {
        console.log('[Login] 🔍 useEffect[2]: Auto-redirect check', {
            isAuthenticated,
            hasUser: !!user,
            userRole: user?.role,
            hasRedirected: hasRedirected.current,
            isCheckingSession
        });

        if (isAuthenticated && user && !hasRedirected.current && !isCheckingSession) {
            console.log('[Login] ✅ useEffect[2]: Conditions met, triggering auto-redirect');
            console.log('[Login] 👤 Auto-redirect for already logged-in user:', user.role);
            hasRedirected.current = true;
            handleRedirect(user.role);
        } else {
            console.log('[Login] ⏸️ useEffect[2]: Conditions not met, skipping redirect');
        }
    }, [isAuthenticated, user, isCheckingSession, handleRedirect]);


    if (isCheckingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <span className="material-icons animate-spin text-primary text-4xl">refresh</span>
            </div>
        );
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[Login] 🔐 handleLogin: Starting login process');
        console.log('[Login] 📧 Email:', email);
        setLoading(true);

        try {
            console.log('[Login] 📤 Step 1: Calling supabase.auth.signInWithPassword()');
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('[Login] ❌ Step 1 Failed: Auth error:', error);
                throw error;
            }

            console.log('[Login] ✅ Step 1 Complete: Auth successful', {
                userId: data.user?.id,
                email: data.user?.email
            });

            if (data.user) {
                toast.success('登录成功');

                console.log('[Login] 📤 Step 2: Fetching user profile from database');
                // Query profile once and use it for both store update and redirect
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*, company:companies(*)')
                    .eq('id', data.user.id)
                    .single();

                if (profileError || !profile) {
                    console.error('[Login] ❌ Step 2 Failed: Profile error:', profileError);
                    throw new Error('无法获取用户信息');
                }

                console.log('[Login] ✅ Step 2 Complete: Profile fetched', {
                    role: profile.role,
                    companyId: profile.company_id,
                    hasCompany: !!profile.company
                });

                console.log('[Login] 📤 Step 3: Updating UserStore with profile data');
                // Update store with profile data
                const userWithEmail = { ...profile, email: data.user.email };
                useUserStore.getState().setUser(userWithEmail);
                console.log('[Login] ✅ Step 3 Complete: UserStore updated');

                console.log('[Login] 🚩 Step 4: Setting hasRedirected flag');
                // Mark as redirected to prevent useEffect from triggering
                hasRedirected.current = true;

                console.log('[Login] 🧭 Step 5: Redirecting to role-specific page');
                // Immediate redirect
                console.log('[Login] 🎯 Direct redirect after login for role:', profile.role);
                handleRedirect(profile.role);
            }
        } catch (error: any) {
            console.error('[Login] 💥 Login failed:', error);
            toast.error(error.message || '登录失败');
        } finally {
            console.log('[Login] 🏁 handleLogin: Complete, setLoading(false)');
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center p-6 relative">
            <div className="w-full max-w-sm flex flex-col space-y-8 z-10">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center">
                        <span className="material-icons text-primary text-5xl">local_shipping</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        物流通 PDA 系统
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">仓库作业管理端</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">账号 (Email)</label>
                        <div className="relative">
                            <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person_outline</span>
                            <input
                                className="w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-lg"
                                placeholder="name@company.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">密码</label>
                        <div className="relative">
                            <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock_outline</span>
                            <input
                                className="w-full h-14 pl-12 pr-12 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-lg"
                                placeholder="••••••••"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-2">
                        <label className="flex items-center cursor-pointer select-none">
                            <div className="relative">
                                <input
                                    className="peer hidden"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 rounded-md peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-colors">
                                    <span className="material-icons text-white text-lg scale-0 peer-checked:scale-100 transition-transform">check</span>
                                </div>
                            </div>
                            <span className="ml-3 text-slate-600 dark:text-slate-400">记住登录信息</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-primary hover:bg-primary/90 disabled:bg-slate-400 text-white font-bold rounded-xl text-lg shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center"
                    >
                        {loading ? (
                            <span className="material-icons animate-spin mr-2">refresh</span>
                        ) : null}
                        {loading ? '登录中...' : '登录'}
                    </button>
                </form>

                <div className="relative py-4 flex items-center">
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-sm">测试账号</span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                {/* Quick Login for Dev/Demo */}
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => { setEmail('sender@test.com'); setPassword('password'); }} className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">Use Sender</button>
                    <button onClick={() => { setEmail('transit@test.com'); setPassword('password'); }} className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">Use Transit</button>
                    <button onClick={() => { setEmail('receiver@test.com'); setPassword('password'); }} className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">Use Receiver</button>
                </div>
            </div>
            <div className="fixed top-0 right-0 p-8 opacity-5 pointer-events-none">
                <span className="material-icons text-[200px]">inventory_2</span>
            </div>
        </div>
    );
};

export default Login;