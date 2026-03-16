import React, { useEffect } from 'react';
import { useLiff } from '../hooks/useLiff';
import useAuthStore from '../store/authStore';
import api from '../api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MessageSquare, AlertCircle, Link as LinkIcon, X } from 'lucide-react';

export default function LineLink() {
    const { liff, lineProfile, isReady } = useLiff();
    const { user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error('Identity required. Please authenticate.');
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    async function handleLink() {
        if (!user || !lineProfile) return;
        
        try {
            await api.post('/line/link', {
                userId: user.id,
                lineUserId: lineProfile.userId,
                lineDisplayName: lineProfile.displayName
            });
            
            toast.success('Nexus Link established successfully.');
            
            if (liff && liff.isInClient()) {
                liff.closeWindow();
            } else {
                navigate('/');
            }
        } catch (err) {
            toast.error('Nexus Link failure. Transmission error.');
            console.error(err);
        }
    }

    if (!isReady || !lineProfile) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12">
                <div className="w-24 h-24 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mb-10 shadow-xl"></div>
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Initializing Nexus Node...</span>
                    <span className="text-[10px] font-black text-[#06C755] uppercase tracking-widest">Protocol: LINE LIFF v3.0</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 page-enter">
            <div className="card !p-12 shadow-premium text-center w-full max-w-md border border-black/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#06C755]"></div>
                
                <div className="w-24 h-24 bg-[#06C755] rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl relative group">
                    <div className="absolute inset-0 bg-white/20 rounded-[32px] scale-0 group-hover:scale-100 transition-transform"></div>
                    <MessageSquare size={48} className="text-white relative z-10" strokeWidth={2.5} />
                </div>
                
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 uppercase">Nexus Link Authorization</h2>
                <p className="text-sm font-bold text-slate-400 tracking-wide mb-12 leading-relaxed">
                    Establish a persistent bridge between your operator ID and the LINE mobile node for real-time tactical intelligence.
                </p>
                
                <div className="bg-slate-50 p-6 rounded-2xl mb-12 border border-black/5 shadow-inner">
                    <p className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase mb-3">Identified Mobile Node</p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{lineProfile.displayName}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-5">
                    <button 
                        onClick={handleLink} 
                        className="w-full bg-[#06C755] text-white py-5 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] border border-white/10 flex items-center justify-center gap-4"
                    >
                        <LinkIcon size={20} strokeWidth={3} /> Establish Link Now
                    </button>
                    <button 
                        onClick={() => navigate('/')} 
                        className="w-full py-4 text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-[0.3em] transition-colors flex items-center justify-center gap-3"
                    >
                        <X size={14} strokeWidth={3} /> Abort Operation
                    </button>
                </div>
                
                <div className="mt-12 pt-8 border-t border-black/5">
                    <div className="flex items-center justify-center gap-3 text-slate-300">
                        <ShieldCheck size={16} />
                        <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Cryptography Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
