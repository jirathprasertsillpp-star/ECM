import React, { useState, useEffect } from 'react';
import { exportAPI, dashboardAPI } from '../api';
import { Download, PieChart, FileSpreadsheet, Calendar, Filter, TrendingUp, Search, Info, CheckCircle, Cpu, ShieldCheck, Box } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';

export default function Reports() {
    const [loading, setLoading] = useState(false);
    const [, setStatsLoading] = useState(false);
    const [params, setParams] = useState({ month: '', status: '' });
    const [previewStats, setPreviewStats] = useState(null);

    // Load some preview stats based on current filter whenever params change
    useEffect(() => {
        const fetchPreview = async () => {
            try {
                setStatsLoading(true);
                // Using dashboard stats as a mock for report preview
                const res = await dashboardAPI.stats(params);
                if (res.data && res.data.stats) {
                    setPreviewStats(res.data.stats);
                }
            } catch {
                // Silently fail preview stats
            } finally {
                setStatsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchPreview();
        }, 500);

        return () => clearTimeout(timer);
    }, [params]);

    const handleExport = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const promise = exportAPI.excel(params);
            
            toast.promise(promise, {
                loading: 'Compiling Excel Manifest...',
                success: 'Manifest generated successfully.',
                error: 'Generation failed. Check uplink.',
            }, { id: 'export-excel' });

            const res = await promise;
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `NEXUS_REPORT_${params.month || 'GLOBAL'}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClearParams = () => {
        setParams({ month: '', status: '' });
    }

    return (
        <div className="space-y-16 max-w-[1400px] mx-auto page-enter pb-32">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-16 border-b border-black/5">
                <div>
                    <h1 className="text-6xl font-black tracking-tighter text-slate-900 mb-4 leading-none uppercase">
                        Tactical <span className="text-[var(--color-accent)]">Reports</span>
                    </h1>
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-3">
                        <PieChart size={14} className="text-slate-900" />
                        Multi-Dimensional Intelligence Output
                    </p>
                </div>
                <div className="flex bg-slate-50 px-8 py-4 rounded-3xl border border-black/5 shadow-premium">
                    <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Uplink Status: Synchronized</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                {/* ── Configuration Sidebar ── */}
                <div className="lg:col-span-4 space-y-10 lg:sticky lg:top-12">
                    <div className="card !p-12 shadow-premium bg-white relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-900 opacity-[0.05]"></div>
                        <div className="flex items-center gap-5 mb-12 pb-8 border-b border-black/5">
                            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center group-hover:rotate-12 transition-transform shadow-2xl">
                                <FileSpreadsheet size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Control Node</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Manifest Configuration</p>
                            </div>
                        </div>

                        <form onSubmit={handleExport} className="space-y-12">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Temporal Window (Month)</label>
                                <div className="input-wrapper group">
                                    <Calendar className="input-icon-left text-slate-400 group-focus-within:text-slate-900" size={20} />
                                    <input
                                        type="month"
                                        className="form-input has-left-icon !bg-slate-50 border-transparent focus:!bg-white font-black"
                                        value={params.month}
                                        onChange={e => setParams({ ...params, month: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Clearance Protocol (Status)</label>
                                <div className="input-wrapper group relative">
                                    <Filter className="input-icon-left text-slate-400 group-focus-within:text-slate-900" size={20} />
                                    <select
                                        className="form-input has-left-icon !bg-slate-50 border-transparent focus:!bg-white font-black appearance-none cursor-pointer"
                                        value={params.status}
                                        onChange={e => setParams({ ...params, status: e.target.value })}
                                    >
                                        <option value="">Full Ingestion Snapshot</option>
                                        <option value="approved">Approved & Committed</option>
                                        <option value="pending_accounting">Accounting Verification</option>
                                        <option value="pending_pco">PCO Governance Review</option>
                                        <option value="rejected">Policy Violation / Rejected</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                        <Box size={14} />
                                    </div>
                                </div>
                            </div>

                            {(params.month !== '' || params.status !== '') && (
                                <button type="button" onClick={handleClearParams} className="w-full text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center gap-2">
                                    <XCircle size={14} /> Purge Constraints
                                </button>
                            )}

                            <button
                                type="submit"
                                className={`btn btn-primary w-full !h-24 shadow-2xl group/btn !text-[11px] !tracking-[0.2em] relative overflow-hidden ${loading ? 'opacity-50' : ''}`}
                                disabled={loading}
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform"></div>
                                <div className="relative z-10 flex items-center justify-center gap-5">
                                    <Download size={28} className="group-hover/btn:translate-y-1 transition-transform" strokeWidth={3} />
                                    <span className="font-black uppercase">Compile Excel Manifest</span>
                                </div>
                            </button>
                        </form>
                    </div>

                    <div className="card !p-10 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:opacity-30 transition-opacity duration-1000 rotate-12 scale-150">
                            <TrendingUp size={280} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-slate-400 flex items-center gap-3">
                                <Cpu size={14} /> Neural Advisory
                            </h4>
                            <p className="text-xs font-bold leading-relaxed text-slate-300 uppercase tracking-widest opacity-80">
                                Global Intelligence recommends bi-weekly manifest extraction to maintain absolute synchronicity with regional treasury nodes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Intelligence Display Area ── */}
                <div className="lg:col-span-8 space-y-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="card !p-12 shadow-premium hover:border-[var(--color-accent)] transition-all duration-700 bg-white group">
                             <div className="flex justify-between items-start mb-12">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Current Population</div>
                                <div className="p-4 bg-slate-50 rounded-2xl text-slate-900 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all">
                                    <FileSpreadsheet size={24} />
                                </div>
                             </div>
                             <div className="text-7xl font-black text-slate-900 tracking-tighter mb-6 tabular-nums">
                                {previewStats ? previewStats.total : '0'}
                             </div>
                             <div className="flex items-center gap-3 text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]">
                                <ShieldCheck size={14} strokeWidth={3} />
                                System Integrity: nominal
                             </div>
                        </div>

                        <div className="card !p-12 shadow-premium bg-slate-50 border-transparent hover:scale-[1.02] transition-transform duration-500">
                            <div className="flex justify-between items-start mb-12">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Aggregated Value</div>
                                <div className="p-4 bg-white rounded-2xl text-[var(--color-accent)] shadow-premium">
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                            <div className="text-6xl font-black text-[var(--color-accent)] tracking-tighter mb-6 tabular-nums">
                                {previewStats ? formatCurrency(previewStats.this_month_amount || 0) : '฿0.00'}
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">Global Projection Matrix (Active Filters)</div>
                        </div>
                    </div>

                    <div className="card !p-12 shadow-premium bg-white">
                        <div className="flex items-center gap-8 mb-20 pb-10 border-b border-black/5">
                            <div className="w-20 h-20 rounded-[32px] bg-slate-900 text-white flex items-center justify-center shadow-2xl">
                                <Info size={40} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Manifest Architecture</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Output Logic & Specification Protocols</p>
                            </div>
                        </div>

                        <div className="space-y-20">
                            {[
                                { 
                                    step: '01', 
                                    title: 'Decision Summary', 
                                    icon: FileSpreadsheet, 
                                    color: 'text-[var(--color-accent)]', 
                                    bg: 'bg-slate-50',
                                    desc: 'Master layer of all authorized vectors, capital allocation, and command statuses. Essential for quarterly treasury reconciliation and audit trails.'
                                },
                                { 
                                    step: '02', 
                                    title: 'Atomic Telemetry', 
                                    icon: TrendingUp, 
                                    color: 'text-indigo-500', 
                                    bg: 'bg-indigo-50',
                                    desc: 'Deep-dive granular extraction of individual ledger nodes, including high-res proof-of-purchase validation and categorical intelligence.'
                                },
                                { 
                                    step: '03', 
                                    title: 'Mobility Analysis', 
                                    icon: Cpu, 
                                    color: 'text-emerald-500', 
                                    bg: 'bg-emerald-50',
                                    desc: 'Specialized analysis of mobility expenditures, odometer telemetry, and AI-predicted efficiency models based on historical route data.'
                                }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-16 items-start group/step">
                                    <div className="relative pt-4">
                                        <div className="w-20 h-20 rounded-[32px] bg-white border-4 border-slate-50 flex items-center justify-center text-2xl font-black text-slate-200 group-hover/step:border-slate-900 group-hover/step:text-slate-900 group-hover/step:scale-110 transition-all duration-700 relative z-10 shadow-sm">
                                            {item.step}
                                        </div>
                                        {idx < 2 && <div className="absolute top-24 left-1/2 -translate-x-1/2 w-1.5 h-32 bg-slate-50 -z-0"></div>}
                                    </div>
                                    <div className={`p-12 rounded-[48px] border border-black/5 hover:border-transparent hover:shadow-premium transition-all duration-700 flex-1 relative overflow-hidden group/card bg-slate-50/30 hover:bg-white`}>
                                        <div className="absolute -right-24 -top-24 w-64 h-64 bg-slate-100/50 rounded-full group-hover/card:scale-150 transition-transform duration-1000 rotate-45"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-5 mb-8">
                                                <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shadow-lg`}>
                                                    <item.icon size={28} strokeWidth={2.5} />
                                                </div>
                                                <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{item.title}</h4>
                                            </div>
                                            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-2xl opacity-80">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const XCircle = ({ size, ...props }) => (
    <svg 
        width={size || 24} 
        height={size || 24} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);
