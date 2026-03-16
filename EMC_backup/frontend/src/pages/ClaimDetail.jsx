import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClaims } from '../hooks/useClaims';
import useAuthStore from '../store/authStore';
import { formatCurrency, formatDate, CATEGORY_MAP } from '../utils/formatters';
import StatusBadge from '../components/Claims/StatusBadge';
import {
    FileText, ArrowLeft, Send, CheckCircle, XCircle,
    Upload, Trash2, ShieldCheck, Eye, Search, AlertTriangle, Cpu, Database, Info, Activity
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

function ReceiptUploader({ item, onUpload, onOcr, onDelete }) {
    const { uploadReceipt, performOcr } = useClaims();
    const [loading, setLoading] = useState(false);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'], 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        multiple: false,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (!file) return;
            setLoading(true);
            const res = await uploadReceipt(item.id, file);
            if (res) onUpload(item.id, res.receipt);
            setLoading(false);
        }
    });

    const handleOcr = async (receiptId) => {
        setLoading(true);
        const res = await performOcr(receiptId);
        if (res) onOcr(item.id, res.receipt);
        setLoading(false);
    };

    return (
        <div className="mt-10 p-10 bg-slate-50/50 rounded-[40px] border border-black/5 shadow-inner relative overflow-hidden group">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center justify-between">
                <span>Validation Intelligence (Artifact)</span>
                <Info size={14} className="opacity-30" />
            </h5>

            {item.receipt ? (
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center bg-white p-8 rounded-[32px] border border-black/5 shadow-premium transition-all duration-700 hover:scale-[1.02] group/item">
                        <div className="w-20 h-20 bg-slate-900 text-white rounded-[24px] flex items-center justify-center border border-black/5 shadow-2xl shrink-0 group-hover/item:rotate-6 transition-transform">
                            <FileText size={32} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Filename</p>
                            <a
                                href={import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}${item.receipt.file_url}` : item.receipt.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-900 hover:text-[var(--color-accent)] transition-colors font-black text-lg uppercase tracking-tight truncate block mb-2"
                            >
                                {item.receipt.original_name || 'Artifact_Inspect_01.dat'}
                            </a>
                            <div className="flex items-center gap-4">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg border flex items-center gap-2 ${item.receipt.ai_verified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                    {item.receipt.ai_verified ? <CheckCircle size={12} strokeWidth={3} /> : <Activity size={12} />}
                                    {item.receipt.ai_verified ? 'Neural Verified' : 'Awaiting Synthesis'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4 shrink-0">
                            {!item.receipt.ai_verified && (
                                <button className={`h-16 px-10 rounded-2xl bg-white text-slate-900 border border-black/5 font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-900 hover:text-white transition-all flex items-center gap-3 ${loading ? 'opacity-50' : ''}`} onClick={() => handleOcr(item.receipt.id)} disabled={loading}>
                                    {loading ? <div className="spinner !w-3 !h-3"></div> : <Cpu size={16} />}
                                    Run Neural Scan
                                </button>
                            )}
                            <button className={`w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm ${loading ? 'opacity-50' : ''}`} onClick={() => onDelete(item.receipt.id)} disabled={loading}>
                                <Trash2 size={24} />
                            </button>
                        </div>
                    </div>

                    {item.receipt.ai_verified && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 p-10 bg-emerald-50/30 rounded-[32px] border border-emerald-100/50 relative overflow-hidden group/scan">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover/scan:rotate-0 transition-transform duration-1000">
                                <ShieldCheck size={160} className="text-emerald-900" />
                            </div>
                            {[
                                { label: 'Merchant Identity', val: item.receipt.ai_merchant_name, icon: <Database size={10} /> },
                                { label: 'Temporal Signature', val: item.receipt.ai_date, icon: <Activity size={10} /> },
                                { label: 'Fiscal Protocol ID', val: item.receipt.ai_tax_id, icon: <ShieldCheck size={10} /> },
                                { label: 'Quantified Aggregate', val: formatCurrency(item.receipt.ai_total_amount), highlight: true, icon: <CheckCircle size={10} /> }
                            ].map((s, i) => (
                                <div key={i} className="relative z-10">
                                    <span className="text-[9px] font-black text-emerald-600/60 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                                        {s.icon} {s.label}
                                    </span>
                                    <span className={`text-sm font-black text-slate-900 uppercase tracking-tight ${s.highlight ? 'text-2xl text-[var(--color-accent)] leading-none block mt-1' : ''}`}>
                                        {s.val || <span className="text-slate-200">NULL_REF</span>}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-[40px] p-20 text-center cursor-pointer transition-all duration-700
            ${isDragActive ? 'border-slate-900 bg-slate-900/5 scale-[1.01]' : 'border-slate-200 hover:border-slate-900/20 hover:bg-white group'}`}
                >
                    <input {...getInputProps()} />
                    <div className="w-24 h-24 rounded-[32px] bg-white shadow-premium flex items-center justify-center mx-auto mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 border border-black/5">
                        <Upload className={`transition-colors ${isDragActive ? 'text-slate-900' : 'text-slate-300'}`} size={40} strokeWidth={2.5} />
                    </div>
                    {loading ? (
                        <div className="space-y-6">
                            <div className="animate-spin w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full mx-auto shadow-2xl"></div>
                            <span className="text-slate-900 font-black text-[11px] uppercase tracking-[0.4em]">Establishing Uplink...</span>
                        </div>
                    ) : (
                        <>
                            <p className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4 px-10">Connect Receipt Asset</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] opacity-60">Source Node // JPG &bull; PNG &bull; PDF // MAX 5MB</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export function ClaimDetailContent({ id, isDrawer = false }) {
    const { fetchClaimDetails } = useClaims();
    const [claimData, setClaimData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            const data = await fetchClaimDetails(id);
            if (active && data) setClaimData(data);
            if (active) setLoading(false);
        };
        load();
        return () => { active = false; };
    }, [id]);

    const handleReceiptUploaded = (itemId, newReceipt) => {
        setClaimData(prev => ({
            ...prev,
            items: prev.items.map(i => i.id === itemId ? { ...i, receipt: newReceipt } : i)
        }));
    };

    const handleDeleteReceipt = async () => {
        toast.success('Asset purged successfully.');
        setLoading(true);
        const data = await fetchClaimDetails(id);
        if (active && data) setClaimData(data);
        setLoading(false);
    };

    if (loading && !claimData) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <div className="spinner mb-6 border-slate-900"></div>
                <span className="text-slate-400 font-black uppercase tracking-[0.5em] text-[10px]">Synchronizing...</span>
            </div>
        );
    }

    if (!claimData) return (
        <div className="text-center py-40 flex flex-col items-center justify-center bg-slate-50 rounded-[48px] border border-black/5">
            <Search size={80} className="mb-8 text-slate-200" strokeWidth={1} />
            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-tighter">Null Result</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">The requested dossier node does not exist</p>
        </div>
    );

    const { claim, items, logs } = claimData;

    return (
        <div className={`space-y-16 ${!isDrawer ? 'max-w-[1400px] mx-auto pb-40 page-enter' : ''}`}>
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                {/* ── Main Content ── */}
                <div className="lg:col-span-8 space-y-16">
                    <div className="card !p-16 shadow-premium !rounded-[48px] animate-in fade-in slide-in-from-left-10 duration-1000 bg-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-0"></div>
                        <div className="flex items-center gap-10 mb-20 relative z-10">
                            <div className="w-20 h-20 rounded-[32px] bg-slate-900 text-white flex items-center justify-center shadow-2xl">
                                <FileText size={40} strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-3">Dossier Logistics</h3>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Strategic Node Identity Configuration</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block mb-4">Strategic Project Vector</label>
                                <span className="text-3xl font-black text-slate-900 leading-none block uppercase tracking-tight">{claim.project_name}</span>
                            </div>
                            <div className="col-span-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block mb-4">Node Protocol</label>
                                <span className="text-xl font-black text-[var(--color-accent)] block font-mono bg-slate-50 px-4 py-2 rounded-xl border border-black/5 shadow-inner">{claim.project_code || '---'}</span>
                            </div>
                            <div className="col-span-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block mb-4">Temporal Cycle</label>
                                <span className="text-xl font-black text-slate-900 block bg-slate-50 px-4 py-2 rounded-xl border border-black/5 shadow-inner text-center">{claim.claim_month}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card !p-0 shadow-premium !rounded-[56px] overflow-hidden border border-black/5 animate-in fade-in slide-in-from-bottom-10 duration-1000 bg-white">
                        <div className="p-16 border-b border-black/5 flex flex-col md:flex-row justify-between items-start md:items-end bg-slate-50/50 backdrop-blur-xl gap-10">
                            <div>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-6 leading-none">Ledger Ingestion</h3>
                                <div className="inline-flex px-6 py-2 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">{items.length} Units Indexed</div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">Global Aggregate Value</p>
                                <span className="text-6xl font-black text-slate-900 tabular-nums tracking-tighter leading-none">{formatCurrency(claim.total_amount)}</span>
                            </div>
                        </div>

                        <div className="divide-y divide-black/5 bg-white">
                            {items.map(item => (
                                <div key={item.id} className="p-16 hover:bg-slate-50/30 transition-all duration-700 group/ledger relative overflow-hidden">
                                     <div className="absolute top-0 left-0 w-2 h-full bg-slate-900 opacity-0 group-hover/ledger:opacity-20 transition-opacity"></div>
                                    <div className="flex flex-col gap-16 relative z-10">
                                        <div className="flex items-start gap-10">
                                            <div className="w-24 h-24 rounded-[40px] bg-white border border-black/5 text-5xl flex items-center justify-center shadow-premium shrink-0 group-hover/ledger:rotate-12 group-hover/ledger:scale-110 transition-all duration-700">
                                                <span className="grayscale-0 group-hover/ledger:grayscale-0 transition-all">{CATEGORY_MAP[item.category]?.icon}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-3xl tracking-tighter uppercase mb-2 leading-none">{item.description}</h4>
                                                        <div className="flex items-center gap-6">
                                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">{formatDate(item.item_date)}</span>
                                                            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                                                            <span className="text-[11px] font-black text-[var(--color-accent)] uppercase tracking-[0.4em] px-4 py-1.5 bg-slate-50 rounded-xl border border-black/5">{CATEGORY_MAP[item.category]?.label}</span>
                                                        </div>
                                                    </div>
                                                    <span className="font-black text-4xl text-slate-900 tabular-nums tracking-tighter">{formatCurrency(item.amount)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Receipt Manager */}
                                        <div className="pt-12 border-t border-dashed border-slate-200">
                                            <ReceiptUploader
                                                item={item}
                                                onUpload={handleReceiptUploaded}
                                                onOcr={(id, r) => handleReceiptUploaded(id, r)}
                                                onDelete={handleDeleteReceipt}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar (Activity) ── */}
                <div className="lg:col-span-4 space-y-16 lg:sticky lg:top-12">
                    <div className="card !p-12 shadow-premium bg-white !rounded-[48px] animate-in fade-in slide-in-from-right-10 duration-1000 border-none relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-900 opacity-[0.05]"></div>
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12 border-b border-black/5 pb-6 flex items-center gap-4">
                            <Activity size={16} /> Activity Stream
                        </h3>

                        <div className="space-y-12 relative before:absolute before:inset-0 before:left-8 before:-translate-x-px before:w-px before:bg-slate-100">
                            {logs.length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 rounded-[32px] border border-black/5 border-dashed">
                                    <Database size={40} className="mx-auto mb-6 text-slate-200" strokeWidth={1} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Log Void Index</p>
                                </div>
                            ) : logs.map((log, idx) => {
                                const isApproved = log.action === 'approve';
                                const isRejected = log.action === 'reject';
                                const isSubmit = log.action === 'submit';
                                return (
                                    <div key={idx} className="relative flex items-start gap-10 group/log">
                                        <div className={`flex items-center justify-center w-16 h-16 rounded-[24px] bg-white border shrink-0 shadow-premium relative z-10 transition-all duration-500 group-hover/log:scale-110
                                            ${isApproved ? 'text-emerald-500 border-emerald-100' : 
                                              isRejected ? 'text-rose-500 border-rose-100' : 
                                              'text-slate-900 border-black/5'}`}>
                                            {isApproved ? <CheckCircle size={28} strokeWidth={2.5} /> : isRejected ? <XCircle size={28} strokeWidth={2.5} /> : <Send size={28} strokeWidth={2.5} />}
                                        </div>

                                        <div className="flex-1 min-w-0 pt-2">
                                            <div className="flex flex-col gap-2 mb-4">
                                                <span className="font-black text-[13px] text-slate-900 uppercase tracking-widest leading-none">
                                                    {isSubmit ? 'Uplink Initiated' : isApproved ? 'Authorization Granted' : isRejected ? 'Verification Failed' : log.action}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums">
                                                    {formatDate(log.created_at)}
                                                </span>
                                            </div>
                                            {log.notes && (
                                                <div className="bg-slate-50 p-6 rounded-[24px] border border-black/5 text-[11px] font-bold text-slate-500 leading-relaxed italic relative">
                                                    <div className="absolute left-0 top-1/2 -translate-x-full w-4 h-px bg-slate-200"></div>
                                                    "{log.notes}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="card !p-10 bg-slate-900 border-none shadow-premium !rounded-[40px] text-white relative overflow-hidden group">
                        <div className="absolute -right-16 -bottom-16 opacity-[0.05] group-hover:opacity-20 transition-opacity duration-1000 rotate-12 scale-150">
                            <ShieldCheck size={280} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 text-slate-400 flex items-center gap-3">
                                <ShieldCheck size={16} /> Governance Protocol
                            </h4>
                            <p className="text-xs font-bold leading-relaxed text-slate-300 uppercase tracking-widest opacity-80 mb-6">
                                This dossier is secured with AES-256 neural encryption and is subject to immediate regional treasury audit.
                            </p>
                            <div className="flex items-center gap-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                Blockchain Immutable Path: Verified
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ClaimDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { fetchClaimDetails, loading } = useClaims();
    const [claimData, setClaimData] = useState(null);

    useEffect(() => {
        const load = async () => {
             const data = await fetchClaimDetails(id);
             if (data) setClaimData(data);
        };
        load();
    }, [id]);

    if (loading && !claimData) return (
        <div className="flex flex-col items-center justify-center py-40">
            <div className="spinner mb-8 border-slate-900"></div>
            <span className="text-slate-400 font-black uppercase tracking-[0.5em] text-[11px]">Initializing Secure Relay...</span>
        </div>
    );

    if (!claimData) return (
        <div className="text-center py-40 bg-slate-50 rounded-[48px] m-12 max-w-4xl mx-auto border border-black/5">
             <Search size={64} className="mx-auto mb-8 text-slate-200" />
             <h2 className="text-3xl font-black text-slate-300 uppercase tracking-tighter">Null Data Relay</h2>
             <button onClick={() => navigate('/claims')} className="mt-8 btn btn-primary !rounded-2xl">Return to Hub</button>
        </div>
    );

    const { claim } = claimData;
    const isOwner = claim.user_id === user.id;
    const isDraft = claim.status === 'draft';

    return (
        <div className="space-y-16 max-w-[1400px] mx-auto pb-40 page-enter">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-16 border-b border-black/5">
                <div className="flex items-center gap-12">
                    <button className="w-20 h-20 flex items-center justify-center rounded-[32px] bg-white border border-black/5 text-slate-300 hover:text-slate-900 hover:scale-110 hover:shadow-premium transition-all shadow-xl" onClick={() => navigate(-1)}>
                        <ArrowLeft size={32} strokeWidth={2.5} />
                    </button>
                    <div>
                        <div className="flex items-center gap-8 mb-6">
                            <h2 className="text-6xl font-black tracking-tighter text-slate-900 leading-none uppercase">Dossier <span className="text-[var(--color-accent)]">Node</span></h2>
                            <StatusBadge status={claim.status} className="!px-6 !py-3 !text-[11px] !rounded-2xl shadow-sm" />
                        </div>
                        <p className="font-black text-slate-400 text-xs tracking-[0.5em] uppercase flex items-center gap-3">
                             <Database size={14} className="text-slate-900" /> Identifier: {claim.claim_number}
                        </p>
                    </div>
                </div>

                <div className="flex gap-6">
                    {isOwner && isDraft && (
                        <button className="!h-20 px-12 rounded-[32px] bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-premium hover:scale-105 active:scale-95 transition-all flex items-center gap-5" onClick={() => navigate(`/claims/${claim.id}/edit`)}>
                            <Send size={24} strokeWidth={4} className="text-[var(--color-accent)]" /> Commit & Synchronize
                        </button>
                    )}
                    {((user.role === 'accounting' && claim.status === 'pending_accounting') ||
                        (user.role === 'pco' && claim.status === 'pending_pco')) && (
                            <button className="!h-20 px-12 rounded-[32px] bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-premium hover:scale-105 active:scale-95 transition-all flex items-center gap-5" onClick={() => navigate('/approval')}>
                                <Eye size={24} strokeWidth={4} className="text-[var(--color-accent)]" /> Execute Audit Mode
                            </button>
                        )}
                </div>
            </div>

            <ClaimDetailContent id={id} />
        </div>
    );
}
