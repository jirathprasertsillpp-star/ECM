import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClaims } from '../hooks/useClaims';
import useAuthStore from '../store/authStore';
import Table from '../components/common/Table';
import StatusBadge from '../components/Claims/StatusBadge';
import Drawer from '../components/common/Drawer';
import { ClaimDetailContent } from './ClaimDetail';
import { formatCurrency, formatMonth } from '../utils/formatters';
import { Plus, Filter, Download, Search, RefreshCw, Calendar, Hash, ArrowRight } from 'lucide-react';
import { exportAPI } from '../api';
import toast from 'react-hot-toast';

export default function MyClaims() {
    const { user } = useAuthStore();
    const { claims, loading, fetchClaims } = useClaims();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedClaimId, setSelectedClaimId] = useState(null);

    useEffect(() => {
        fetchClaims({ user_id: user?.id });
    }, [fetchClaims, user]);

    const handleExportPDF = async (e, claimId, claimNum) => {
        e.stopPropagation();
        try {
            const res = await exportAPI.pdf(claimId);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ECMS-${claimNum}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('PDF Export Successful');
        } catch {
            toast.error('PDF Export Failed');
        }
    };

    const handleRefresh = () => {
        fetchClaims({ user_id: user?.id });
    };

    const filteredClaims = useMemo(() => {
        return claims.filter(claim => {
            const matchSearch = (claim.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (claim.claim_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (claim.project_code || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchStatus = statusFilter === 'all' || claim.status === statusFilter;
            const matchMonth = !monthFilter || claim.claim_month === monthFilter;

            return matchSearch && matchStatus && matchMonth;
        });
    }, [claims, searchTerm, statusFilter, monthFilter]);

    const columns = [
        {
            header: 'REQUEST ID',
            accessor: 'claim_number',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-black/5 text-slate-400">
                        <Hash size={14} />
                    </div>
                    <span className="font-mono text-xs font-black text-slate-900">{row.claim_number}</span>
                </div>
            )
        },
        {
            header: 'PROJECT ARCHITECTURE',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-sm uppercase">{row.project_name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{row.project_code || 'UNASSIGNED'}</span>
                </div>
            )
        },
        {
            header: 'TEMPORAL CYCLE',
            render: (row) => (
                <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-tight">
                    <Calendar size={12} />
                    {formatMonth(row.claim_month)}
                </span>
            )
        },
        {
            header: 'AGGREGATE (THB)',
            render: (row) => <span className="font-black text-slate-900 tabular-nums text-base">{formatCurrency(row.total_amount)}</span>
        },
        { header: 'STATUS', render: (row) => <StatusBadge status={row.status} /> },
        {
            header: '',
            render: (row) => (
                <div className="flex gap-2 justify-end">
                    {(row.status === 'approved' || row.status === 'pending_accounting' || row.status === 'pending_pco') && (
                        <button
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-black/5"
                            onClick={(e) => handleExportPDF(e, row.id, row.claim_number)}
                        >
                            <Download size={14} />
                        </button>
                    )}
                    <button 
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-black/5"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/claims/${row.id}`);
                        }}
                    >
                        <ArrowRight size={18} />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-16 max-w-[1400px] mx-auto pb-32 page-enter">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-16 border-b border-black/5">
                <div>
                    <h1 className="text-6xl font-black tracking-tighter text-slate-900 mb-4 leading-none uppercase">
                        Master <span className="text-[var(--color-accent)]">Archive</span>
                    </h1>
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-slate-900 shadow-premium"></span>
                        Intelligence Ledger v3.0 &bull; {user?.name}
                    </p>
                </div>

                <div className="flex gap-5">
                    <button 
                        className="w-16 h-16 rounded-[24px] bg-white border border-black/5 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-black/10 transition-all duration-500 shadow-premium"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        className={`h-16 px-10 rounded-[24px] border transition-all duration-500 font-black text-xs uppercase tracking-widest flex items-center gap-4 ${isFilterOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-black/5 hover:border-black/10 shadow-premium'}`}
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                        <Filter size={18} /> Filters {filteredClaims.length !== claims.length && "•"}
                    </button>
                    <button
                        className="h-16 px-12 rounded-[24px] bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all duration-500 flex items-center gap-4 border border-white/10"
                        onClick={() => navigate('/claims/new')}
                    >
                        <Plus size={22} strokeWidth={4} /> New Record
                    </button>
                </div>
            </div>

            {/* ── Filter Card ── */}
            {isFilterOpen && (
                <div className="card !p-12 !bg-white/90 border border-black/5 backdrop-blur-3xl shadow-premium animate-in fade-in slide-in-from-top-4 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-900 opacity-10" />
                    <div className="lg:col-span-12">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 uppercase">Parameter Configuration</h3>
                    </div>
                    <div className="lg:col-span-5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Identity Search</label>
                        <div className="input-wrapper group">
                            <Search className="input-icon-left text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                            <input
                                type="text"
                                className="form-input has-left-icon !bg-slate-50 border-transparent focus:!bg-white font-black text-sm"
                                placeholder="EXP-NODE / PROJECT_ALPHA..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="lg:col-span-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Status Node</label>
                        <select
                            className="form-input !bg-slate-50 border-transparent focus:!bg-white font-black text-sm uppercase tracking-widest"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Frequency</option>
                            <option value="draft">Draft Node</option>
                            <option value="pending_accounting">Accounting Verification</option>
                            <option value="pending_pco">PCO Authorization</option>
                            <option value="approved">Approved Status</option>
                            <option value="rejected">Revision Required</option>
                        </select>
                    </div>
                    <div className="lg:col-span-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Temporal Cycle</label>
                        <input
                            type="month"
                            className="form-input !bg-slate-50 border-transparent focus:!bg-white font-black text-sm uppercase tracking-widest"
                            value={monthFilter}
                            onChange={e => setMonthFilter(e.target.value)}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <button
                            className="h-16 w-full rounded-2xl bg-slate-100 text-slate-400 hover:text-slate-900 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center border border-transparent hover:border-black/5"
                            onClick={() => { setSearchTerm(''); setStatusFilter('all'); setMonthFilter(''); }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            )}

            {/* ── Summary Bento Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
                {[
                    { label: 'Total Dossiers', count: claims.length, icon: Hash },
                    { label: 'Review Queue', count: claims.filter(c => c.status.startsWith('pending')).length, color: 'text-amber-500' },
                    { label: 'Authorized', count: claims.filter(c => c.status === 'approved').length, color: 'text-emerald-500' },
                    { label: 'Revisions', count: claims.filter(c => c.status === 'rejected').length, color: 'text-rose-500' }
                ].map((item, i) => (
                    <div key={i} className={`card !p-10 shadow-premium group hover:-translate-y-2 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4`} style={{ animationDelay: `${i * 100}ms` }}>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-4 group-hover:text-slate-900 transition-colors">{item.label}</span>
                        <div className="flex items-center justify-between">
                            <span className={`text-6xl font-black tracking-tighter tabular-nums ${item.color || 'text-slate-900'}`}>{item.count}</span>
                            {item.icon && <item.icon size={24} className="text-slate-100 group-hover:text-slate-300 transition-colors" />}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Ledger Table ── */}
            <div className="table-wrapper group/table">
                <Table
                    columns={columns}
                    data={filteredClaims}
                    loading={loading}
                    onRowClick={(row) => setSelectedClaimId(row.id)}
                />

                {!loading && filteredClaims.length > 0 && (
                    <div className="px-12 py-12 bg-slate-50 border-t border-black/5 flex flex-col lg:flex-row justify-between items-center gap-10">
                        <div className="flex items-center gap-8">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Index Capacity</span>
                            <div className="px-5 py-3 bg-white rounded-2xl border border-black/5 text-slate-900 text-xs font-black shadow-premium">
                                {filteredClaims.length} / {claims.length} Nodes Synchronized
                            </div>
                        </div>
                        <div className="flex items-center gap-10">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Cumulative Aggregate</span>
                            <span className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">
                                {formatCurrency(filteredClaims.reduce((sum, item) => sum + Number(item.total_amount), 0))}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Detail Drawer */}
            <Drawer 
                isOpen={!!selectedClaimId} 
                onClose={() => setSelectedClaimId(null)}
                title="Intelligence Summary"
                width="850px"
            >
                {selectedClaimId && (
                    <div className="page-enter p-4">
                        <div className="flex justify-between items-center mb-12 pb-8 border-b border-black/5">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-slate-900 animate-ping"></div>
                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Inspection Vector Active</span>
                            </div>
                            <button 
                                className="btn btn-secondary !rounded-2xl !py-3 !px-8 shadow-premium font-black text-[10px] uppercase tracking-widest flex items-center gap-3"
                                onClick={() => navigate(`/claims/${selectedClaimId}`)}
                            >
                                <ExternalLink size={16} /> Full View Detail
                            </button>
                        </div>
                        <ClaimDetailContent id={selectedClaimId} isDrawer={true} />
                    </div>
                )}
            </Drawer>
        </div>
    );
}

const ExternalLink = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
);
