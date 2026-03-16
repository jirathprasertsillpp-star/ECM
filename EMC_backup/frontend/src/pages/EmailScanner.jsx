import React, { useState } from 'react';
import {
    Mail, RefreshCw, CheckCircle, XCircle, PlusCircle,
    SkipForward, Wifi, WifiOff, Clock, Filter, ToggleLeft,
    ToggleRight, Search, ChevronDown, AlertCircle, Inbox, Cpu, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import StatusBadge from '../components/Claims/StatusBadge';

const MOCK_EMAILS = [
    { id: 1, subject: 'Tax Invoice - PTT Station', from: 'noreply@pttstation.com', date: '2026-03-12T09:00:00Z', amount: 1850.00, vendor: 'PTT Station', status: 'pending', confidence: 0.97 },
    { id: 2, subject: 'Receipt from Grab Thailand', from: 'receipts@grab.com', date: '2026-03-11T18:32:00Z', amount: 245.00, vendor: 'Grab', status: 'pending', confidence: 0.95 },
    { id: 3, subject: 'Payment Confirmation - Lotus\'s', from: 'noreply@lotus.co.th', date: '2026-03-11T12:10:00Z', amount: 3200.00, vendor: "Lotus's", status: 'added', confidence: 0.91 },
    { id: 4, subject: 'Tax Invoice #INV-2026-04521', from: 'billing@amazon.com', date: '2026-03-10T08:00:00Z', amount: 5400.00, vendor: 'Amazon Web Services', status: 'skipped', confidence: 0.88 },
    { id: 5, subject: 'Receipt Starbucks Coffee', from: 'noreply@starbucks.co.th', date: '2026-03-09T14:22:00Z', amount: 185.00, vendor: 'Starbucks', status: 'pending', confidence: 0.93 },
];

const EmailStatusBadge = ({ status }) => {
    const map = {
        pending: { label: 'PENDING', className: 'bg-amber-50 text-amber-600 border-amber-100' },
        added: { label: 'SYNCHRONIZED', className: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        skipped: { label: 'SKIPPED', className: 'bg-slate-50 text-slate-400 border-black/5' },
    };
    const cfg = map[status] || map.pending;
    return (
        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${cfg.className}`}>
            {cfg.label}
        </span>
    );
};

const ConfidenceBadge = ({ score }) => {
    const pct = Math.round(score * 100);
    const colorClass = pct >= 95 ? 'bg-emerald-500' : pct >= 85 ? 'bg-amber-500' : 'bg-rose-500';

    return (
        <div className="flex items-center gap-4">
            <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden shadow-inner border border-black/5">
                <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-black text-slate-900 tracking-tighter">{pct}%</span>
        </div>
    );
};

export default function EmailScanner() {
    const [connected, setConnected] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [emails, setEmails] = useState(MOCK_EMAILS);
    const [autoScan, setAutoScan] = useState(false);
    const [filterKeyword, setFilterKeyword] = useState('');
    const [lastScanned, setLastScanned] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    const handleConnect = () => setConnected(true);

    const handleScan = async () => {
        setScanning(true);
        await new Promise(r => setTimeout(r, 2000));
        setScanning(false);
        setLastScanned(new Date());
    };

    const handleAdd = (id) => {
        setEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'added' } : e));
    };

    const handleSkip = (id) => {
        setEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'skipped' } : e));
    };

    const filtered = emails.filter(e => {
        if (activeTab === 'pending') return e.status === 'pending';
        if (activeTab === 'added') return e.status === 'added';
        if (activeTab === 'skipped') return e.status === 'skipped';
        return true;
    }).filter(e =>
        !filterKeyword || e.subject.toLowerCase().includes(filterKeyword.toLowerCase()) || e.vendor.toLowerCase().includes(filterKeyword.toLowerCase())
    );

    const pendingCount = emails.filter(e => e.status === 'pending').length;

    return (
        <div className="space-y-16 max-w-[1400px] mx-auto page-enter pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-16 border-b border-black/5">
                <div>
                    <h1 className="text-6xl font-black tracking-tighter text-slate-900 mb-4 leading-none uppercase">
                        Neural <span className="text-[var(--color-accent)]">Ingestion</span>
                    </h1>
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-3">
                        <Cpu size={14} className="text-slate-900" />
                        AI-Driven Document Extraction Node
                    </p>
                </div>
                {connected && (
                    <button
                        onClick={handleScan}
                        disabled={scanning}
                        className={`btn btn-primary !h-16 !px-12 shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 ${scanning ? 'loading' : ''}`}
                    >
                        {!scanning && <RefreshCw size={22} strokeWidth={3} className={scanning ? 'animate-spin' : ''} />}
                        {scanning ? 'PROBING INBOX...' : 'INITIATE NEURAL SCAN'}
                    </button>
                )}
            </div>

            {/* Connection Status Card */}
            <div className="card !p-12 shadow-premium flex flex-col md:flex-row items-center justify-between gap-10 bg-slate-50 border-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 rounded-full translate-x-1/2 -translate-y-1/2 -z-0"></div>
                
                <div className="flex items-center gap-8 w-full md:w-auto relative z-10">
                    <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center shrink-0 border shadow-2xl transition-all duration-500
                        ${connected ? 'bg-emerald-500 text-white border-transparent' : 'bg-white text-slate-300 border-black/5'}`}>
                        {connected ? <Wifi size={32} /> : <WifiOff size={32} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <span className="font-black text-2xl text-slate-900 uppercase tracking-tight">Enterprise Mail Bridge</span>
                            {connected
                                ? <span className="flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">Synchronized</span>
                                : <span className="flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 border border-black/5">Offline</span>}
                        </div>
                        {connected && lastScanned && (
                            <p className="text-[10px] flex items-center gap-3 font-black text-slate-400 uppercase tracking-widest">
                                <Clock size={14} />
                                Last Deciphered: {format(lastScanned, 'dd MMM yyyy • HH:mm', { locale: enUS })}
                            </p>
                        )}
                        {!connected && (
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting authentication protocol</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end relative z-10">
                    {connected && (
                        <div className="flex items-center gap-5 bg-white px-6 py-3 rounded-2xl border border-black/5 shadow-sm">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest uppercase">Autonomous Background Mode</span>
                            <button onClick={() => setAutoScan(!autoScan)} className="transition-all hover:scale-110">
                                {autoScan
                                    ? <ToggleRight size={44} className="text-slate-900" />
                                    : <ToggleLeft size={44} className="text-slate-200" />}
                            </button>
                        </div>
                    )}
                    {!connected && (
                        <button
                            onClick={handleConnect}
                            className="btn btn-primary !h-16 !px-12 shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                        >
                            <Mail size={22} strokeWidth={3} />
                            Ingest Gmail Identities
                        </button>
                    )}
                </div>
            </div>

            {/* Main Application Matrix */}
            {connected && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Panel: Search & Filters */}
                    <div className="lg:col-span-4 space-y-10">
                        <div className="card !p-10 shadow-premium sticky top-10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-black/5 pb-6 mb-10 uppercase">Ingestion Parameters</h3>
                            
                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Tactical Search</label>
                                    <div className="input-wrapper group">
                                        <Search className="input-icon-left text-slate-400 group-focus-within:text-slate-900" size={20} />
                                        <input
                                            type="text"
                                            className="form-input has-left-icon !bg-slate-50 border-transparent focus:!bg-white font-black"
                                            placeholder="SCAN_QUERY..."
                                            value={filterKeyword}
                                            onChange={e => setFilterKeyword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Keyword Priority</label>
                                    <div className="flex flex-wrap gap-3">
                                        {['Receipt', 'Invoice', 'Payment', 'Grab', 'PTT', 'Order'].map(kw => (
                                            <span key={kw} className="px-5 py-2 rounded-xl text-[10px] font-black text-slate-400 bg-slate-50 border border-black/5 cursor-pointer hover:bg-slate-900 hover:text-white transition-all">
                                                {kw.toUpperCase()}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-black/5">
                                    <div className="bg-slate-900 p-6 rounded-[24px] text-white flex items-center gap-5 shadow-2xl">
                                        <div className="w-12 h-12 bg-[var(--color-accent)] rounded-2xl flex items-center justify-center shadow-lg">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-widest mb-1">Neural Accuracy</p>
                                            <p className="text-2xl font-black tracking-tighter tabular-nums">98.4<span className="text-xs ml-1">%</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Data Stream */}
                    <div className="lg:col-span-8 space-y-10">
                        <div className="card !p-0 shadow-premium overflow-hidden border border-black/5">
                            <div className="flex items-center gap-1 p-3 border-b border-black/5 bg-slate-50/50">
                                {[
                                    { key: 'all', label: 'ALL LOGS', count: emails.length },
                                    { key: 'pending', label: 'PENDING', count: pendingCount },
                                    { key: 'added', label: 'SYNCHED', count: emails.filter(e => e.status === 'added').length },
                                    { key: 'skipped', label: 'SKIPPED', count: emails.filter(e => e.status === 'skipped').length },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                            ${activeTab === tab.key
                                                ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]'
                                                : 'text-slate-400 hover:text-slate-900 hover:bg-white'
                                            }`}
                                    >
                                        {tab.label}
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black
                                            ${activeTab === tab.key ? 'bg-[var(--color-accent)] text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="divide-y divide-black/5">
                                {filtered.length === 0 ? (
                                    <div className="py-32 flex flex-col items-center justify-center text-center px-12">
                                        <Inbox size={80} className="mb-8 text-slate-100" strokeWidth={1} />
                                        <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Zero Latency Detected</h3>
                                        <p className="text-sm font-bold text-slate-400 max-w-sm uppercase tracking-widest">No matching document assets found within the current ingestion group.</p>
                                    </div>
                                ) : filtered.map(email => (
                                    <div key={email.id} className="p-10 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/30 transition-all group gap-8">
                                        <div className="flex items-start gap-8 flex-1 min-w-0">
                                            <div className="w-16 h-16 rounded-[24px] flex items-center justify-center shrink-0 border border-black/5 bg-white shadow-premium group-hover:scale-110 transition-transform">
                                                <Mail size={24} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight truncate mb-2">{email.subject}</h4>
                                                <p className="text-xs font-bold text-slate-400 truncate mb-6 uppercase tracking-widest">{email.from}</p>
                                                
                                                <div className="flex items-center gap-8 flex-wrap">
                                                    <div className="flex items-center gap-3">
                                                        <Clock size={14} className="text-slate-300" />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                            {format(new Date(email.date), 'dd MMM yyyy • HH:mm', { locale: enUS })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VALUATION:</span>
                                                        <span className="text-lg font-black text-slate-900 tabular-nums">฿{email.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 pt-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NEURAL_CONF:</span>
                                                        <ConfidenceBadge score={email.confidence} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0 md:self-center self-start pl-24 md:pl-0">
                                            <EmailStatusBadge status={email.status} />
                                            {email.status === 'pending' && (
                                                <div className="flex items-center gap-3 ml-4">
                                                    <button
                                                        onClick={() => handleAdd(email.id)}
                                                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                        title="Ingest to Ledger"
                                                    >
                                                        <PlusCircle size={20} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSkip(email.id)}
                                                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-black/5 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                                        title="Skip Node"
                                                    >
                                                        <SkipForward size={20} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!connected && (
                <div className="card !p-24 shadow-premium border-dashed border-4 border-slate-100 flex flex-col items-center text-center bg-slate-50/20">
                    <div className="w-28 h-28 rounded-[40px] flex items-center justify-center mb-10 border border-black/5 bg-white shadow-2xl relative">
                        <div className="absolute inset-0 bg-slate-900 rounded-[40px] animate-ping opacity-5 scale-125"></div>
                        <Mail size={48} className="text-slate-200" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Unified Communication Ingestion</h3>
                    <p className="text-slate-400 font-bold mb-12 max-w-xl leading-relaxed text-sm uppercase tracking-widest">
                        Neural engine identifies, validates, and extracts fiscal assets directly from your communication stream. Reduce manual data injection by <span className="text-slate-900">85%</span>.
                    </p>
                    <button
                        onClick={handleConnect}
                        className="btn btn-primary !h-20 !px-16 shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm font-black uppercase tracking-[0.2em]"
                    >
                        Establish Google Nexus Connection
                    </button>
                    <p className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-widest">Encrypted via RSA-4096 &bull; Privacy Optimized</p>
                </div>
            )}
        </div>
    );
}
