import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import {
    LayoutDashboard, Receipt, Fuel,
    Settings, LogOut, User, PanelLeftClose, 
    PanelLeftOpen, Cpu, ShieldCheck, Database, Zap, Plus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Tooltip from '../common/Tooltip';

// ──────── Config ────────
const NAV_MAIN = [
    { path: '/',              label: 'Command Hub',     icon: LayoutDashboard, desc: 'Central Control & Real-time Analytics' },
    { path: '/claims/my',    label: 'Dossier Ledger',   icon: Database, desc: 'Chronological Archive of Your Submissions' },
    { path: '/claims/new',   label: 'Initiate Request', icon: Plus, desc: 'Generate a New Financial Claim Node' },
    { path: '/fuel',         label: 'Fuel Telemetry',    icon: Fuel, desc: 'Geospatial Odometer & Energy Consumption Claims' },
    { path: '/email-scanner',label: 'Neural Scanner',   icon: Cpu, badge: 'AI', desc: 'Autonomous Artifact Extraction from Communications' },
    { path: '/reports',      label: 'Strategic Intel',   icon: BarChart3, desc: 'High-Level Aggregates and Data Visualizations' },
];

function BarChart3({ size, ...props }) {
    return (
        <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
        </svg>
    )
}

const NAV_APPROVAL = { path: '/approval', label: 'Verification Queue', icon: ShieldCheck, desc: 'Execute Administrative Governance Over Pending Nodes' };
const NAV_PROFILE =  { path: '/profile',  label: 'Identity Profile', icon: User, desc: 'Neural Signature Configuration & Security' };
const NAV_SETTINGS = { path: '/settings', label: 'Control Plane', icon: Settings, desc: 'Global System Parameterization & Preferences' };

// ──────── Nav Item ────────
const NavItem = ({ item, onClick, isCollapsed }) => {
    const Icon = item.icon;
    return (
        <Tooltip text={isCollapsed ? item.label : item.desc} position="right">
            <NavLink
                to={item.path}
                end={item.path === '/'}
                onClick={onClick}
                className={({ isActive }) => `
                    nav-item-luxury ${isActive ? 'active luxury-glow-active' : ''}
                    ${isCollapsed ? 'justify-center !px-0 mx-4' : 'mx-6'}
                `}
            >
                {({ isActive }) => (
                    <>
                        <div className="nav-icon-container">
                            <Icon size={isActive ? 24 : 20} strokeWidth={isActive ? 3 : 2.5} />
                        </div>
                        {!isCollapsed && (
                            <>
                                <span className="flex-1 whitespace-nowrap">{item.label}</span>
                                {item.badge && (
                                    <span className="badge-info badge animate-pulse">
                                        {item.badge}
                                    </span>
                                )}
                            </>
                        )}
                        {isActive && !isCollapsed && (
                            <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-ping" />
                        )}
                    </>
                )}
            </NavLink>
        </Tooltip>
    );
};

// ──────── Sidebar ────────
export default function Sidebar({ mobileOpen, setMobileOpen, isCollapsed, setIsCollapsed }) {
    const { user } = useAuthStore();
    const { logout } = useAuth();

    const navItems = [
        ...NAV_MAIN,
        ...(user?.role === 'accounting' || user?.role === 'pco' || user?.role === 'pm' ? [NAV_APPROVAL] : []),
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 md:hidden bg-slate-900/40 backdrop-blur-xl transition-all duration-700"
                    onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar container holds the floating bar */}
            <div className={`sidebar-container transition-all duration-700 ${isCollapsed ? 'w-[140px]' : 'w-[320px]'} ${mobileOpen ? 'fixed z-50' : 'hidden md:flex'}`}>
                <aside className={`
                    sidebar ${isCollapsed ? 'is-collapsed' : ''}
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
                    {/* ── Toggle Button ── */}
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`absolute -right-5 top-14 w-11 h-11 luxury-glass rounded-[16px] flex items-center justify-center text-slate-400 hover:text-slate-900 hover:scale-110 transition-all z-50 group`}
                    >
                        {isCollapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
                        <div className="absolute inset-0 rounded-[16px] bg-[var(--color-accent)]/5 scale-0 group-hover:scale-100 transition-transform -z-0"></div>
                    </button>

                    {/* ── Logo Section ── */}
                    <Link to="/" className={`py-12 flex items-center group transition-all duration-700 ${isCollapsed ? 'justify-center' : 'px-8 gap-6'}`}>
                        <div className="w-16 h-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-white font-black text-3xl shadow-premium group-hover:rotate-[15deg] group-hover:scale-110 transition-all duration-700 flex-shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-accent)] to-transparent opacity-40"></div>
                            <span className="relative z-10">E</span>
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col min-w-0">
                                <p className="text-3xl font-black tracking-[-0.05em] text-slate-900 leading-none uppercase">NEXUS</p>
                                <p className="text-[9px] uppercase tracking-[0.4em] font-black text-slate-400 mt-2">Intelligence</p>
                            </div>
                        )}
                    </Link>

                    {/* ── Navigation ── */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar mt-10 space-y-1">
                        {!isCollapsed && <div className="px-10 pb-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Operational Matrix</div>}
                        
                        {navItems.map((item) => (
                            <NavItem
                                key={item.path}
                                item={item}
                                isCollapsed={isCollapsed}
                                onClick={() => setMobileOpen(false)}
                            />
                        ))}

                        <div className="my-10 px-8">
                            <div className="h-px bg-slate-100 opacity-50" />
                        </div>

                        {!isCollapsed && <div className="px-10 pb-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Identity Persistence</div>}
                        <NavItem item={NAV_PROFILE} isCollapsed={isCollapsed} onClick={() => setMobileOpen(false)} />
                        <NavItem item={NAV_SETTINGS} isCollapsed={isCollapsed} onClick={() => setMobileOpen(false)} />
                    </div>

                    {/* ── User Footer ── */}
                    <div className={`mt-auto pt-8 border-t border-slate-50`}>
                        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-6' : 'gap-5'} px-4`}>
                            <div className="w-14 h-14 rounded-[20px] bg-white text-slate-900 border border-slate-100 shadow-sm flex items-center justify-center font-black text-xl flex-shrink-0 group hover:bg-slate-900 hover:text-white transition-all duration-700 cursor-pointer">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-900 text-sm truncate tracking-tight">{user?.name || 'Authorized Unit'}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{user?.role || 'Operator'}</p>
                                </div>
                            )}
                            <button 
                                onClick={logout}
                                className={`
                                    flex items-center justify-center rounded-2xl transition-all duration-500 hover:scale-110
                                    ${isCollapsed ? 'w-12 h-12 bg-rose-50 text-rose-500 border border-rose-100' : 'w-11 h-11 bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white'}
                                `}
                            >
                                <LogOut size={isCollapsed ? 22 : 18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </>
    );
}
