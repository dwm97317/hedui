
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
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center p-6 relative">
            <div className="w-full max-w-sm flex flex-col space-y-8 z-10 animate-fade-in">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                        <span className="material-icons text-primary text-4xl">person_add</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        新员工注册
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">加入您的团队</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">姓名</label>
                        <input
                            required
                            className="w-full h-12 px-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                            placeholder="您的真实姓名"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">公司代码 (必填)</label>
                        <input
                            required
                            className="w-full h-12 px-4 bg-primary/5 border-2 border-primary/20 border-dashed rounded-xl focus:ring-2 focus:ring-primary outline-none font-mono text-center text-lg placeholder:text-slate-400"
                            placeholder="询问您的主管获取"
                            value={companyCode}
                            onChange={(e) => setCompanyCode(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">邮箱</label>
                        <input
                            required
                            type="email"
                            className="w-full h-12 px-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">设置密码</label>
                        <input
                            required
                            type="password"
                            className="w-full h-12 px-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                            placeholder="至少 6 位字符"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-primary hover:bg-primary/90 disabled:bg-slate-400 text-white font-bold rounded-xl text-lg shadow-lg active:scale-[0.98] transition-all mt-4"
                    >
                        {loading ? '注册中...' : '立即注册'}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500">
                    已有账号？ <Link to="/login" className="text-primary font-bold hover:underline">返回登录</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
