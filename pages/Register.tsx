
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyCode, setCompanyCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Verify Company Code
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .select('id, role')
                .eq('code', companyCode.trim())
                .single();

            if (companyError || !company) {
                throw new Error('无效的公司代码，请向主管确认。');
            }

            // 2. Sign Up
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });

            if (signUpError) throw signUpError;
            if (!authData.user) throw new Error('注册失败，请重试。');

            // 3. Create Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    company_id: company.id,
                    email,
                    role: company.role,
                    full_name: fullName,
                    is_master: false, // Employees are not masters by default
                    permissions: [] // Start with no permissions
                });

            if (profileError) {
                console.error('Profile creation error:', profileError);
                // Even if profile fails, user is created. We might want to alert them.
                throw new Error('账号已创建但个人信息初始化失败，请联系管理员。');
            }

            toast.success('注册成功！请登录。');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.message || '注册出错');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-sm flex flex-col space-y-8 z-10 animate-fade-in">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-700 rounded-[24px] flex items-center justify-center shadow-2xl shadow-primary/40 group rotate-3 hover:rotate-0 transition-all duration-500">
                        <span className="material-icons text-white text-5xl group-hover:scale-110 transition-transform">person_add_alt_1</span>
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
                            加入团队
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">高效物流 · 团队协作平台</p>
                    </div>
                </div>

                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-[32px] border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden relative">
                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">姓名 (Real Name)</label>
                            <div className="relative">
                                <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person</span>
                                <input
                                    required
                                    className="w-full h-14 pl-12 pr-4 bg-white/50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                                    placeholder="请输入您的真实姓名"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 border-dashed group hover:border-primary/40 transition-colors">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest block text-center mb-2">公司验证码 (Mandatory)</label>
                            <input
                                required
                                className="w-full h-14 bg-transparent outline-none font-mono text-center text-3xl font-black text-primary placeholder:text-primary/20 tracking-[8px]"
                                placeholder="······"
                                value={companyCode}
                                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                                maxLength={8}
                            />
                            <p className="text-[10px] text-primary/60 text-center mt-2 font-medium">输入主管提供的 6-8 位大写代码</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">账号 (Email)</label>
                            <div className="relative">
                                <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">alternate_email</span>
                                <input
                                    required
                                    type="email"
                                    className="w-full h-14 pl-12 pr-4 bg-white/50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">密码 (Password)</label>
                            <div className="relative">
                                <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                                <input
                                    required
                                    type="password"
                                    className="w-full h-14 pl-12 pr-4 bg-white/50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                                    placeholder="至少 6 位字符"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-primary to-blue-600 hover:shadow-2xl hover:shadow-primary/40 disabled:bg-slate-400 text-white font-black rounded-2xl text-base shadow-xl active:scale-[0.98] transition-all mt-4 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]"></div>
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <span className="material-icons animate-spin text-lg">refresh</span>
                                        处理中...
                                    </>
                                ) : (
                                    <>
                                        立即加入团队
                                        <span className="material-icons text-lg">arrow_forward</span>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <p className="text-center text-sm text-slate-500 font-medium">
                        已有账号？ <Link to="/login" className="text-primary font-black hover:underline underline-offset-4">立即登录</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
