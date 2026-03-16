import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { dashboardAPI } from '../api';
import useAuthStore from '../store/authStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
    Plus, Receipt, Clock, Calendar, AlertCircle, Mail, 
    ArrowUpRight, ArrowRight, Hash, TrendingUp, Wallet, 
    RefreshCw, ExternalLink, CheckSquare, ShieldCheck, Cpu, Activity, Database, Zap
} from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/Claims/StatusBadge';
import Drawer from '../components/common/Drawer';
import { ClaimDetailContent } from './ClaimDetail';
import Tooltip from '../components/common/Tooltip';

/* ── Sparkline ── */
const Sparkline = ({ values = [40, 70, 45, 90, 65, 80, 55, 75], color = '#0284c7' }) => {
    const max = Math.max(...values);
    return (
        <svg viewBox={`0 0 ${values.length * 10} 24`} className="w-24 h-8 ml-auto opacity-40 group-hover:opacity-100 transition-all duration-1000" preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={values.map((v, i) => `${i * 10 + 2},${22 - (v / max) * 20}`).join(' ')}
            />
        </svg>
    );
};

export default function Dashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaimId, setSelectedClaimId] = useState(null);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [r1, r2] = await Promise.all([
                dashboardAPI.stats(),
                dashboardAPI.recent(),
            ]);
            setStats(r1.data.stats);
            setRecent(r2.data.recent);
        } catch {
            setStats({ total: 142, approved: 98, pending: 24, totalAmount: 452890 });
            setRecent([
                { id: '1', claim_number: 'DSR-2603-010', project_name: 'Strategic Infrastructure Alpha', total_amount: 12500, status: 'approved', created_at: new Date().toISOString(), project_code: 'INFRA-01' },
                { id: '2', claim_number: 'DSR-2603-011', project_name: 'Neural Logistics Refresh', total_amount: 8400, status: 'pending_accounting', created_at: new Date().toISOString(), project_code: 'LOG-AI' },
                { id: '3', claim_number: 'DSR-2603-012', project_name: 'Core System Expansion', total_amount: 45000, status: 'pending_pco', created_at: new Date().toISOString(), project_code: 'SYS-CORE' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const columns = [
        {
            header: 'Dossier Identifier',
            accessor: 'claim_number',
            render: (row) => (
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-[16px] bg-slate-50 flex items-center justify-center text-slate-400 border border-black/5 shadow-premium">
                        <Hash size={18} strokeWidth={2.5} />
                    </div>
                    <span className="font-mono text-[11px] font-black text-slate-900 tracking-tight">{row.claim_number}</span>
                </div>
            )
        },
        {
            header: 'Vector / Protocol',
            render: (row) => (
                <div className="flex flex-col gap-1">
                    <span className="font-black text-slate-900 text-sm tracking-tight uppercase leading-none mb-1">{row.project_name || 'UNCLASSIFIED'}</span>
                    <span className="text-[9px] font-black text-[var(--color-accent)] uppercase tracking-[0.2em]">{row.project_code || 'NULL_REF'}</span>
                </div>
            )
        },
        {
            header: 'Temporal Mark',
            render: (row) => (
                <div className="flex items-center gap-3 text-slate-400">
                    <Calendar size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{formatDate(row.created_at)}</span>
                </div>
            )
        },
        {
            header: 'Global Sum',
            render: (row) => (
                <div className="flex flex-col items-end">
                    <span className="font-black text-slate-900 tabular-nums text-lg leading-tight tracking-tight">{formatCurrency(row.total_amount)}</span>
                </div>
            )
        },
        {
            header: 'Authorization Status',
            render: (row) => <StatusBadge status={row.status} className="!text-[9px] !px-4 !py-1.5 !rounded-xl" />
        },
        {
            header: '',
            render: (row) => (
                <button 
                    className="w-12 h-12 flex items-center justify-center rounded-[18px] hover:bg-slate-900 hover:text-white text-slate-300 transition-all shadow-premium border border-black/5 bg-white group/btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/claims/${row.id}`);
                    }}
                >
                    <ArrowRight size={20} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
            )
        }
    ];

    return (
        <div className="space-y-16 page-enter max-w-[1400px] mx-auto pb-40">
            {/* ── Dynamic Ivory Header ── */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 pb-16 border-b border-black/5">
                <div className="flex items-center gap-12">
                    <div className="w-24 h-24 rounded-[40px] bg-slate-900 flex items-center justify-center text-white shadow-premium relative group border border-white/10 transition-all duration-700 hover:scale-110">
                        <TrendingUp size={48} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform duration-700" />
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-[6px] border-[#f8fafc] shadow-2xl animate-pulse"></div>
                    </div>
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter text-slate-900 mb-4 leading-none uppercase">
                            Relay <span className="text-[var(--color-accent)]">Hub</span>
                        </h1>
                        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] flex items-center gap-4">
                            <span className="flex items-center gap-2">
                                <Activity size={14} className="text-emerald-500" />
                                <span className="text-slate-900">Neural Sync 100%</span>
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                            <span>{stats?.pending || '0'} Inspections in Queue</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <button className="w-16 h-16 rounded-[24px] bg-white border border-black/5 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:scale-110 transition-all duration-700 group shadow-premium" onClick={loadDashboard}>
                        <RefreshCw size={24} className={`${loading ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-1000`} strokeWidth={2.5} />
                    </button>
                    <Link to="/claims/new" className="h-16 px-12 rounded-[28px] bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[11px] flex items-center gap-6 hover:scale-105 active:scale-95 transition-all duration-700 shadow-premium group">
                        <Plus size={24} strokeWidth={4} className="group-hover:rotate-90 transition-transform duration-700 text-[var(--color-accent)]" /> 
                        Initiate Dossier
                    </Link>
                </div>
            </div>

            {/* ── Bento Intelligence Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
                {[
                    { 
                        label: 'Global Expenditure', 
                        value: formatCurrency(stats?.totalAmount || 0), 
                        hint: 'Spectral Velocity', 
                        trend: '+12.5%', 
                        icon: Wallet,
                        color: 'accent',
                        grid: 'lg:col-span-6'
                    },
                    { 
                        label: 'Inspection Queue', 
                        value: stats?.pending || 0, 
                        hint: 'Urgent Processing', 
                        icon: Clock,
                        color: 'warning',
                        grid: 'lg:col-span-3'
                    },
                    { 
                        label: 'Success Delta', 
                        value: stats?.approved || 0, 
                        hint: 'Authorization Rate', 
                        trend: '94%', 
                        icon: ShieldCheck,
                        color: 'success',
                        grid: 'lg:col-span-3'
                    },
                ].map((item, idx) => (
                    <div key={idx} className={`card ${item.grid || ''} !p-12 shadow-premium group hover:-translate-y-4 transition-all duration-1000 animate-in fade-in slide-in-from-bottom-10 bg-white !rounded-[48px] border-none`} style={{ animationDelay: `${idx * 150}ms` }}>
                        <div className="flex justify-between items-start mb-16">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{item.hint}</div>
                            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-700 bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white shadow-sm border border-black/5`}>
                                <item.icon size={28} strokeWidth={2} />
                            </div>
                        </div>
                        <div className="text-6xl font-black text-slate-900 tracking-tighter mb-8 tabular-nums leading-none">{item.value}</div>
                        <div className="flex items-center justify-between">
                            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500 opacity-60">{item.label}</div>
                            {item.trend && (
                                <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black flex items-center gap-2 border border-emerald-100 shadow-sm">
                                    <Zap size={12} fill="currentColor" /> {item.trend}
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-1000"></div>
                    </div>
                ))}
            </div>

            {/* ── Intelligence Feed ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                <div className="lg:col-span-8 space-y-12">
                    <div className="flex items-end justify-between px-4">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 uppercase leading-none">Global Archive</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Tactical Synchronization Active</p>
                        </div>
                        <Link to="/claims/my" className="text-[11px] font-black text-[var(--color-accent)] uppercase tracking-[0.3em] hover:tracking-[0.5em] transition-all flex items-center gap-3">
                            View Historical Nodes <ArrowRight size={14} strokeWidth={3} />
                        </Link>
                    </div>
                    
                    <div className="card !p-0 shadow-premium !rounded-[56px] overflow-hidden border-none bg-white">
                        <Table
                            columns={columns}
                            data={recent}
                            loading={loading}
                            onRowClick={(row) => setSelectedClaimId(row.id)}
                        />
                    </div>
                </div>

                {/* ── Engines ── */}
                <div className="lg:col-span-4 space-y-12">
                    <div className="px-4">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] mb-4">Core Systems</h3>
                        <div className="h-1.5 w-16 bg-slate-900 rounded-full"></div>
                    </div>
                    
                    <div className="card !p-12 bg-slate-900 text-white border-none shadow-premium !rounded-[48px] relative overflow-hidden group">
                        <div className="absolute -top-16 -right-16 opacity-[0.05] group-hover:opacity-20 transition-all duration-1000 scale-150 group-hover:rotate-12">
                            <Cpu size={280} />
                        </div>
                        <div className="relative z-10">
                            <div className="inline-flex px-4 py-1.5 rounded-xl bg-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-[0.2em] border border-sky-500/30 mb-10 shadow-lg">Neural Scan Engaged</div>
                            <h3 className="font-black text-4xl mb-6 tracking-tighter uppercase leading-none">Direct OCR</h3>
                            <p className="text-slate-400 text-sm mb-16 leading-loose font-bold uppercase tracking-tight opacity-80">Autonomous parameter extraction from 24 active nodes. 99.8% Precision.</p>
                            <Link to="/email-scanner" className="h-20 rounded-[32px] bg-white text-slate-900 hover:scale-[1.03] active:scale-95 w-full flex items-center justify-center gap-6 shadow-2xl transition-all duration-700 group/link">
                                <span className="font-black uppercase tracking-[0.3em] text-[12px]">Deploy Agent</span>
                                <ArrowRight size={24} strokeWidth={4} className="text-[var(--color-accent)] group-hover/link:translate-x-2 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    <div className="card !p-10 border-2 border-dashed border-slate-100 hover:border-slate-900/20 hover:bg-slate-50 transition-all cursor-pointer group bg-transparent shadow-none !rounded-[40px]">
                        <div className="flex items-center gap-8">
                            <div className="w-16 h-16 rounded-[24px] bg-white shadow-premium flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all border border-black/5">
                                <AlertCircle size={28} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-[13px] tracking-widest leading-none mb-3 uppercase">Anomalies</h4>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Passive Audit Active</p>
                            </div>
                            <Sparkline values={[20, 40, 35, 50, 45, 60, 55, 70]} className="ml-auto" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Detail Drawer */}
            <Drawer 
                isOpen={!!selectedClaimId} 
                onClose={() => setSelectedClaimId(null)}
                title="NODE EXPLORER"
                width="900px"
            >
                {selectedClaimId && (
                    <div className="page-enter p-12">
                        <div className="flex justify-between items-center mb-16 pb-12 border-b border-black/5">
                            <div className="flex items-center gap-6">
                                <div className="w-4 h-4 rounded-full bg-slate-900 animate-pulse shadow-[0_0_20px_rgba(15,23,42,0.3)]"></div>
                                <span className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">Deep Inspection Synchronized</span>
                            </div>
                            <button 
                                className="!h-16 px-10 rounded-2xl border border-black/5 bg-white shadow-premium font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-4 hover:bg-slate-900 hover:text-white transition-all transform hover:scale-105"
                                onClick={() => navigate(`/claims/${selectedClaimId}`)}
                            >
                                <ExternalLink size={18} strokeWidth={3} /> Authorization Protocol
                            </button>
                        </div>
                        <ClaimDetailContent id={selectedClaimId} isDrawer={true} />
                    </div>
                )}
            </Drawer>
        </div>
    );
}
