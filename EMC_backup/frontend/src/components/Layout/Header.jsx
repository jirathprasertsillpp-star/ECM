import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, Bell, Settings } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Header({ onMenuClick }) {
    const { user } = useAuthStore();

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-10 py-8 bg-transparent transition-all duration-700">
            <div className="flex items-center gap-6">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-4 rounded-2xl bg-white text-slate-400 hover:text-slate-900 shadow-premium transition-all"
                >
                    <Menu size={24} />
                </button>

                <div className="hidden md:flex items-center text-[10px] tracking-[0.4em] font-black text-slate-400 space-x-6 uppercase">
                    <Link to="/" className="text-slate-900 group relative">
                        EMC
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-accent)] transition-all group-hover:w-full"></span>
                    </Link>
                    <span className="opacity-20 translate-y-px text-lg font-light">/</span>
                    <span className="text-slate-400 truncate max-w-[200px]">{user?.department || 'Operational Hub'}</span>
                </div>
            </div>

            <div className="flex items-center gap-12">
                <div className="hidden sm:flex items-center bg-white/40 backdrop-blur-xl border border-white/60 transition-all duration-700 rounded-3xl px-6 py-3 w-96 group focus-within:ring-4 focus-within:ring-[var(--color-accent)]/10 focus-within:border-[var(--color-accent)] shadow-premium">
                    <Search size={18} className="text-slate-300 mr-4 group-focus-within:text-[var(--color-accent)] transition-colors" />
                    <input
                        type="text"
                        placeholder="SEARCH INTELLIGENCE..."
                        className="bg-transparent border-none outline-none text-[11px] w-full font-black text-slate-900 placeholder-slate-300 tracking-[0.2em] uppercase"
                    />
                    <kbd className="hidden lg:inline-flex text-[9px] font-black text-slate-300 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 ml-4">
                        ⌘K
                    </kbd>
                </div>

                <div className="flex items-center gap-6">
                    <button className="p-4 bg-white/40 backdrop-blur-xl border border-white/60 text-slate-300 hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] rounded-2xl transition-all relative group shadow-premium">
                        <Bell size={20} />
                        <span className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full border-2 border-white group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(244,63,94,0.4)]"></span>
                    </button>
                    
                    <div className="h-10 w-px bg-slate-200/50 mx-2 hidden md:block"></div>
                    
                    <Link to="/profile" className="flex items-center gap-5 pl-2 group">
                        <div className="flex flex-col items-end hidden lg:flex">
                            <span className="text-sm font-black text-slate-900 leading-none group-hover:text-[var(--color-accent)] transition-colors uppercase tracking-tight">{user?.name || 'Operator'}</span>
                            <span className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-[0.3em]">{user?.role || 'Unit'}</span>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 text-white flex items-center justify-center font-black text-xl shadow-2xl group-hover:scale-110 group-hover:rotate-[5deg] transition-all duration-700">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    );
}
