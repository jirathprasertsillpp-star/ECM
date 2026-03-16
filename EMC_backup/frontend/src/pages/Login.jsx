import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2, User, Lock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const success = await login({ employeeId, password });
            if (success) {
                toast.success('Access Granted. Authorization Synchronized.', {
                    icon: '🛡️',
                    style: {
                        borderRadius: '24px',
                        background: '#0f172a',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                        padding: '16px 24px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    },
                });
                navigate('/dashboard');
            } else {
                toast.error('Identity Verification Failed.');
            }
        } catch (error) {
            toast.error('System Communications Interrupted.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container relative overflow-hidden bg-[#f8fafc]">
            <div className="live-bg" />
            <div className="noise-overlay" />
            
            {/* Architectural Background Elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--color-accent)]/5 rounded-full blur-[160px] animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-[120px] animate-pulse duration-[12s]" />

            <div className="auth-card relative z-10 animate-in fade-in zoom-in-95 duration-1000 !bg-white/80 backdrop-blur-[60px] !p-20 !rounded-[60px] shadow-premium-dark border border-white/50">
                <div className="text-center mb-20">
                    <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-700 border border-white/20 group">
                        <span className="text-white text-4xl font-black tracking-tighter group-hover:scale-110 transition-transform">EM</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-6 uppercase leading-none">
                        Tactical <br/><span className="text-[var(--color-accent)]">Access</span>
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Enterprise Dynamics &bull; Ver 2026</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="form-group">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-4 px-1">Infrastructure Hub ID</label>
                        <div className="input-wrapper relative group">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={24} />
                            <input
                                type="text"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                className="form-input !h-20 !pl-16 !pr-8 border-none !bg-slate-50/50 focus:!bg-white font-black text-sm uppercase tracking-widest transition-all"
                                placeholder="IDENTIFIER_NODE"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-4 px-1">Security Protocol Key</label>
                        <div className="input-wrapper relative group">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={24} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input !h-20 !pl-16 !pr-8 border-none !bg-slate-50/50 focus:!bg-white font-black text-sm uppercase tracking-widest transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full !h-20 !rounded-[32px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-500 group"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={28} strokeWidth={3} />
                            ) : (
                                <div className="flex items-center gap-5">
                                    <span className="text-[13px] font-black uppercase tracking-[0.3em]">Authorize Session</span>
                                    <ArrowRight size={24} strokeWidth={4} className="group-hover:translate-x-2 transition-transform text-[var(--color-accent)]" />
                                </div>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-20 pt-10 border-t border-black/5 flex flex-col items-center gap-6">
                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] hover:text-[var(--color-accent)] transition-colors flex items-center gap-4 group">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse group-hover:shadow-[0_0_15px_#10b981]" />
                        Encryption Uplink Secure
                    </button>
                    <div className="flex gap-4">
                        <ShieldCheck size={20} className="text-slate-200" />
                        <Zap size={20} className="text-slate-200" />
                    </div>
                </div>
            </div>
            
            {/* Luxury Footer */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] whitespace-nowrap">
                <span className="opacity-50">Build 2026.IVORY</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span className="opacity-50">Region: Southeast Asia</span>
            </div>
        </div>
    );
};

export default Login;
