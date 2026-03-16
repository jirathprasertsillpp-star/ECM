import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Briefcase, Shield, Save, Lock, AlertCircle, ShieldCheck, Fingerprint } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import Tooltip from '../components/common/Tooltip';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [password, setPassword] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await api.get('/auth/profile');
            setProfile(res.data.user);
        } catch {
            toast.error('Unable to synchronize profile data.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/auth/profile', {
                name: profile.name,
                phone: profile.phone,
                position: profile.position,
                password: password || undefined
            });
            
            // Update global state
            useAuthStore.getState().updateUser({
                name: profile.name,
                phone: profile.phone,
                position: profile.position
            });

            toast.success('Core Identity Updated');
            setPassword('');
        } catch {
            toast.error('Identity transmission error.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 animate-pulse">
            <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-8"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Deciphering Identity...</span>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-16 page-enter pb-32">
            <div className="pb-12 border-b border-black/5 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-6xl font-black tracking-tighter text-slate-900 mb-4 leading-none uppercase">
                        Operator <span className="text-[var(--color-accent)]">Portal</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-sm max-w-lg leading-relaxed">
                        Secure management of your enterprise credentials and operational profile. Maintain identity integrity within the Nexus system.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-black/5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Core Session</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left: Summary Card */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="card !p-12 shadow-premium text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-24 bg-slate-900 -z-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"></div>
                        <div className="w-28 h-28 rounded-[40px] bg-slate-900 text-white flex items-center justify-center text-5xl font-black mx-auto mb-8 shadow-2xl relative z-10 hover:scale-105 transition-transform duration-500">
                            {profile.name?.charAt(0)}
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">{profile.name}</h3>
                        <p className="text-[11px] font-black text-[var(--color-accent)] uppercase tracking-[0.3em] mb-10">{profile.role}</p>
                        
                        <div className="pt-10 border-t border-black/5 space-y-6">
                            <div className="flex items-center justify-between text-[11px] font-black">
                                <span className="text-slate-400 uppercase tracking-widest">Division Node</span>
                                <span className="text-slate-900 uppercase">{profile.department}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-black">
                                <span className="text-slate-400 uppercase tracking-widest">Clearance Level</span>
                                <span className="text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded">Certified</span>
                            </div>
                        </div>
                    </div>

                    <div className="card !p-8 bg-amber-50 border-amber-100 shadow-none">
                        <div className="flex items-center gap-4 text-amber-600 mb-4">
                            <ShieldCheck size={24} />
                            <span className="font-black text-xs uppercase tracking-widest">Security Advisory</span>
                        </div>
                        <p className="text-[12px] font-bold text-amber-900/70 leading-relaxed">
                            Your password is a critical entry point. Ensure rotation every 90 cycles to maintain peak security status across the architecture.
                        </p>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="lg:col-span-8">
                    <form onSubmit={handleSave} className="card !p-12 shadow-premium space-y-12">
                        <div className="flex items-center gap-4 mb-4 border-b border-black/5 pb-6">
                            <Fingerprint className="text-slate-900" size={24} />
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Identity Parameters</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block uppercase">Full Legal Identity</label>
                                <div className="input-wrapper group">
                                    <User className="input-icon-left text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                                    <input 
                                        type="text" 
                                        className="form-input has-left-icon !bg-slate-50 border-transparent focus:!bg-white font-black"
                                        value={profile.name}
                                        onChange={e => setProfile({...profile, name: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-3 opacity-60">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block uppercase">Relay Address (ReadOnly)</label>
                                <div className="relative">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input type="text" className="form-input !pl-16 !bg-transparent border-dashed cursor-not-allowed font-black" value={profile.email} readOnly />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block uppercase">Communication Frequency</label>
                                <div className="input-wrapper group">
                                    <Phone className="input-icon-left text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                                    <input 
                                        type="text" 
                                        className="form-input has-left-icon !bg-slate-50 border-transparent focus:!bg-white font-black"
                                        placeholder="08X-XXX-XXXX"
                                        value={profile.phone || ''}
                                        onChange={e => setProfile({...profile, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block uppercase">Designated Position</label>
                                <div className="input-wrapper group">
                                    <Briefcase className="input-icon-left text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                                    <input 
                                        type="text" 
                                        className="form-input has-left-icon !bg-slate-50 border-transparent focus:!bg-white font-black"
                                        placeholder="Structural Architect"
                                        value={profile.position || ''}
                                        onChange={e => setProfile({...profile, position: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-12 border-t border-black/5">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] mb-10 flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                    <Lock size={16} />
                                </div>
                                Security Credential Update
                            </h4>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Binary Passcode Reset (Leave blank to maintain current state)</label>
                                <input 
                                    type="password" 
                                    className="form-input !bg-slate-50 border-transparent focus:!bg-white font-black"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={saving}
                            className={`btn btn-primary !rounded-[24px] w-full !py-5 shadow-2xl mt-12 flex items-center justify-center gap-4 border border-white/10 ${saving ? 'loading' : ''}`}
                        >
                            <Save size={22} strokeWidth={2.5} />
                            Commit Identity Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
