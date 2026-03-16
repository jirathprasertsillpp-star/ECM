import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClaims } from '../hooks/useClaims';
import useAuthStore from '../store/authStore';
import Table from '../components/common/Table';
import StatusBadge from '../components/Claims/StatusBadge';
import Modal from '../components/common/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
    CheckCircle, XCircle, Eye, Search, 
    MessageSquare, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Tooltip from '../components/common/Tooltip';

export default function ApprovalQueue() {
    const { user } = useAuthStore();
    const { claims, loading, fetchClaims, approveClaim, rejectClaim } = useClaims();
    const navigate = useNavigate();

    const [selectedClaim, setSelectedClaim] = useState(null);
    const [modalType, setModalType] = useState(null); // 'approve' | 'reject' | null
    const [note, setNote] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user?.role === 'accounting') {
            fetchClaims({ status: 'pending_accounting' });
        } else if (user?.role === 'pco') {
            fetchClaims({ status: 'pending_pco' });
        } else if (user?.role === 'pm') {
            fetchClaims({ status: 'pending_accounting' });
        }
    }, [fetchClaims, user]);

    const filteredClaims = useMemo(() => {
        return claims.filter(c =>
            (c.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.claim_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.user_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [claims, searchTerm]);

    const handleAction = async () => {
        if (!selectedClaim) return;

        if (modalType === 'approve') {
            const ok = await approveClaim(selectedClaim.id, note);
            if (ok) {
                setModalType(null);
                setNote('');
                fetchClaims({ status: user.role === 'accounting' ? 'pending_accounting' : 'pending_pco' });
            }
        } else if (modalType === 'reject') {
            if (!note.trim()) {
                toast.error('Please provide a reason for rejection.');
                return;
            }
            const ok = await rejectClaim(selectedClaim.id, note);
            if (ok) {
                setModalType(null);
                setNote('');
                fetchClaims({ status: user.role === 'accounting' ? 'pending_accounting' : 'pending_pco' });
            }
        }
    };

    const columns = [
        {
            header: 'REQUEST ID',
            accessor: 'claim_number',
            render: (row) => (
                <div className="flex flex-col gap-1">
                    <span className="font-mono font-black text-slate-900 tracking-tight">{row.claim_number}</span>
                    <span className="text-[10px] font-bold text-slate-400">{formatDate(row.created_at)}</span>
                </div>
            )
        },
        {
            header: 'PROJECT ARCHITECTURE',
            render: (row) => (
                <div className="flex flex-col gap-1">
                    <span className="font-black text-slate-900 text-sm">{row.project_name || 'N/A'}</span>
                    <span className="text-[9px] font-black text-[var(--color-accent)] bg-[var(--color-accent-soft)] px-1.5 py-0.5 rounded uppercase tracking-widest self-start">{row.project_code || 'UNASSIGNED'}</span>
                </div>
            )
        },
        {
            header: 'OPERATOR',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                        {row.user_name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-black text-xs text-slate-900 uppercase">{row.user_name}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{row.department}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'EXPENDITURE',
            render: (row) => (
                <span className="font-black text-lg text-slate-900 tabular-nums">
                    {formatCurrency(row.total_amount)}
                </span>
            )
        },
        { 
            header: 'STATUS', 
            render: (row) => <StatusBadge status={row.status} /> 
        },
        {
            header: '',
            render: (row) => (
                <div className="flex gap-2 justify-end">
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-black/5"
                        onClick={(e) => { e.stopPropagation(); navigate(`/claims/${row.id}`); }}
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                        onClick={(e) => { e.stopPropagation(); setSelectedClaim(row); setModalType('approve'); }}
                    >
                        <CheckCircle size={16} />
                    </button>
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
                        onClick={(e) => { e.stopPropagation(); setSelectedClaim(row); setModalType('reject'); }}
                    >
                        <XCircle size={16} />
                    </button>
                </div>
            )
        }
    ];

    if (user?.role !== 'accounting' && user?.role !== 'pco' && user?.role !== 'pm') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[40px] flex items-center justify-center mb-8 shadow-premium">
                    <AlertTriangle size={48} />
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Nexus Restriction</h2>
                <p className="text-slate-500 max-w-md font-bold text-sm leading-relaxed">
                    Authorization required. This portal is restricted to Governance Entities (Accounting) and Authorizing Officers (PCO).
                </p>
                <button className="btn btn-primary mt-12 !px-12" onClick={() => navigate('/')}>Return to Matrix</button>
            </div>
        );
    }

    return (
        <div className="space-y-12 max-w-7xl mx-auto pb-24 page-enter">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-12 border-b border-black/5">
                <div className="flex items-start gap-8">
                    <div className="w-20 h-20 bg-slate-900 text-white rounded-[32px] flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500">
                        <ShieldCheck size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-4 uppercase">
                            Governance <span className="text-[var(--color-accent)]">Queue</span>
                        </h1>
                        <p className="text-slate-500 font-bold max-w-2xl leading-relaxed text-sm">
                            Execute tactical approvals and maintain financial integrity. Review incoming expenditure requests and commit strategic authorizations.
                        </p>
                    </div>
                </div>
                
                <div className="w-full md:w-[400px]">
                    <div className="form-group mb-0">
                        <div className="input-wrapper">
                            <Search className="input-icon-left" size={20} />
                            <input
                                type="text"
                                className="form-input has-left-icon font-black"
                                placeholder="Filter by ID, Project, or Operator..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-10">
                {/* Meta Summary */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="px-5 py-2 bg-slate-100 rounded-full border border-black/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                Active Load: <strong className="text-slate-900">{filteredClaims.length}</strong> Tasks
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Security Protocol Active
                        </div>
                    </div>
                </div>

                <div className="table-wrapper group/table">
                    <Table
                        columns={columns}
                        data={filteredClaims}
                        loading={loading}
                        emptyMessage={
                            searchTerm
                                ? `No results for "${searchTerm}"`
                                : "Zero Latency. All governance tasks completed."
                        }
                        onRowClick={(row) => navigate(`/claims/${row.id}`)}
                    />
                </div>
            </div>

            <Modal
                isOpen={!!modalType}
                onClose={() => setModalType(null)}
                title={
                    <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-lg ${modalType === 'approve' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {modalType === 'approve' ? <CheckCircle size={28} /> : <XCircle size={28} />}
                        </div>
                        <div>
                            <span className="text-2xl font-black text-slate-900 tracking-tight uppercase block">
                                {modalType === 'approve' ? 'Verify Submission' : 'Security Escalation'}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Authorization Node</span>
                        </div>
                    </div>
                }
                footer={
                    <div className="flex gap-4 justify-end w-full pt-8 border-t border-black/5 mt-6">
                        <button className="btn btn-secondary !px-10" onClick={() => setModalType(null)}>Cancel</button>
                        <button
                            className={`btn ${modalType === 'approve' ? 'btn-accent' : 'btn-primary'}`}
                            onClick={handleAction}
                        >
                            {modalType === 'approve' ? <CheckCircle size={18} /> : <MessageSquare size={18} />}
                            {modalType === 'approve' ? 'Commit Authorization' : 'Transmit Anomaly Report'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-8 pt-4">
                    <div className="card bg-slate-50 border-transparent shadow-none !p-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Request ID</span>
                                <span className="font-mono font-black text-[var(--color-accent)] text-lg">{selectedClaim?.claim_number}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total Value</span>
                                <span className="font-black text-slate-900 tracking-tighter text-3xl tabular-nums">{formatCurrency(selectedClaim?.total_amount)}</span>
                            </div>
                            <div className="col-span-2 pt-6 border-t border-black/5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Project Vector</span>
                                <span className="font-black text-slate-900 text-lg uppercase">{selectedClaim?.project_name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Supplemental Intelligence / Rejection Reason</label>
                        <textarea
                            className="form-input min-h-[140px] pt-4 font-black"
                            placeholder={
                                modalType === 'approve'
                                    ? 'Add operational notes (optional)...'
                                    : 'Explain precisely why this request was returned...'
                            }
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            maxLength={500}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
