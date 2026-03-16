import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClaims } from '../hooks/useClaims';
import ClaimForm from '../components/Claims/ClaimForm';
import Table from '../components/common/Table';
import { CATEGORY_MAP, formatCurrency, formatDateInput } from '../utils/formatters';
import { Check, ChevronRight, FilePlus, Receipt, Navigation, Plus, Trash2, Fuel, Upload, X, Loader2, Sparkles, FileText, Image, File, Eye, CheckCircle, AlertTriangle, Box, Database, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── File type helper ───
const getFileIcon = (mimeType) => {
    if (!mimeType) return <File size={22} className="text-slate-300" />;
    if (mimeType.startsWith('image/')) return <Image size={22} className="text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileText size={22} className="text-rose-500" />;
    return <File size={22} className="text-slate-500" />;
};

const getFileSizeLabel = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Receipt Row ───
function ReceiptUploadRow({ item, onReceiptsChange }) {
    const [receipts, setReceipts] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState({});
    const [ocrResults, setOcrResults] = useState({});
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef();

    const loadReceipts = useCallback(async () => {
        try {
            const res = await api.get(`/items/${item.id}/receipts`);
            setReceipts(res.data.receipts || []);
        } catch { /* ignore */ }
    }, [item.id]);

    useEffect(() => {
        loadReceipts();
    }, [loadReceipts]);

    const handleFiles = useCallback(async (files) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        const newReceipts = [];

        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append('receipt', file);
                const res = await api.post(`/items/${item.id}/receipts`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                newReceipts.push(res.data.receipt);
                toast.success(`Asset "${file.name}" synchronized successfully.`);
            } catch {
                toast.error(`Transmission failure for "${file.name}"`);
            }
        }

        const updated = [...receipts, ...newReceipts];
        setReceipts(updated);
        if (onReceiptsChange) onReceiptsChange(item.id, updated);
        setUploading(false);
    }, [receipts, item.id, onReceiptsChange]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleDelete = async (receiptId) => {
        try {
            await api.delete(`/items/receipts/${receiptId}`);
            const updated = receipts.filter(r => r.id !== receiptId);
            setReceipts(updated);
            if (onReceiptsChange) onReceiptsChange(item.id, updated);
            toast.success('Asset purged.');
        } catch {
            toast.error('Purge failure.');
        }
    };

    const handleOCR = async (receiptId) => {
        setOcrLoading(prev => ({ ...prev, [receiptId]: true }));
        try {
            const res = await api.post(`/items/receipts/${receiptId}/ocr`);
            const { ocr, warning } = res.data;
            setOcrResults(prev => ({ ...prev, [receiptId]: ocr }));
            if (warning) {
                toast(warning, { icon: '⚠️' });
            } else {
                toast.success('Neural scan complete. Parameters extracted.');
            }
        } catch {
            toast.error('Neural engine failure.');
        } finally {
            setOcrLoading(prev => ({ ...prev, [receiptId]: false }));
        }
    };

    const icon = CATEGORY_MAP[item.category]?.icon || '📎';

    return (
        <div className="border border-black/5 rounded-[40px] overflow-hidden bg-white shadow-premium hover:shadow-2xl transition-all duration-700 group/row mb-10">
            {/* Item Header */}
            <div className="flex items-center gap-8 px-10 py-8 bg-slate-50 border-b border-black/5">
                <div className="w-16 h-16 rounded-[24px] bg-white border border-black/5 flex items-center justify-center text-3xl shadow-xl flex-shrink-0 group-hover/row:rotate-6 transition-transform duration-500">{icon}</div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 truncate uppercase tracking-tight text-lg">{item.description}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{CATEGORY_MAP[item.category]?.label} &bull; {formatDate(item.item_date)}</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">{formatCurrency(item.amount)}</p>
                    {receipts.length > 0 && (
                        <p className="text-[9px] font-black text-emerald-500 flex items-center gap-2 justify-end mt-2 uppercase tracking-widest">
                            <CheckCircle size={12} /> {receipts.length} Assets Linked
                        </p>
                    )}
                </div>
            </div>

            {/* Upload Zone */}
            <div className="p-10">
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-[32px] p-12 text-center cursor-pointer transition-all duration-700 ${
                        dragOver
                            ? 'border-[var(--color-accent)] bg-slate-50 scale-[1.02]'
                            : 'border-slate-100 hover:border-slate-900/10 hover:bg-slate-50/50'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                    />
                    {uploading ? (
                        <div className="flex flex-col items-center gap-6 py-4">
                            <Loader2 size={32} className="animate-spin text-slate-900" />
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Establishing Data Bridge...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 py-4">
                            <div className="w-16 h-16 rounded-3xl bg-white shadow-premium flex items-center justify-center text-slate-400 border border-black/5">
                                <Upload size={32} strokeWidth={2.5} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                                <span className="text-slate-900">Select Source Artifact</span> or drop assets here
                            </span>
                        </div>
                    )}
                </div>

                {/* Uploaded Files List */}
                {receipts.length > 0 && (
                    <div className="mt-8 space-y-4">
                        {receipts.map(receipt => (
                            <div key={receipt.id} className="border border-black/5 rounded-[24px] overflow-hidden bg-slate-50/30">
                                {/* File row */}
                                <div className="flex items-center gap-6 px-10 py-6 hover:bg-white transition-all duration-500 group/file">
                                    <span className="flex-shrink-0 p-4 bg-white rounded-2xl shadow-premium border border-black/5 group-hover/file:scale-110 transition-transform">{getFileIcon(receipt.mime_type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight mb-1">{receipt.original_name}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{getFileSizeLabel(receipt.file_size)}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {receipt.mime_type && (receipt.mime_type.startsWith('image/') || receipt.mime_type === 'application/pdf') && (
                                            <>
                                                {ocrResults[receipt.id] ? (
                                                    <span className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-2">
                                                        <CheckCircle size={12} strokeWidth={3} /> Deciphered
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOCR(receipt.id); }}
                                                        disabled={ocrLoading[receipt.id]}
                                                        className="btn !px-5 !py-2.5 !h-auto !text-[9px] font-black uppercase tracking-widest text-slate-900 border border-black/5 bg-white hover:bg-slate-900 hover:text-white transition-all flex items-center gap-3 shadow-sm"
                                                    >
                                                        {ocrLoading[receipt.id] ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <Sparkles size={12} />
                                                        )}
                                                        Neural Scan
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        <div className="w-px h-6 bg-slate-200" />
                                        <a
                                            href={receipt.file_url ? `${API_BASE}${receipt.file_url}` : `${API_BASE}/uploads/${receipt.filename}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm bg-white"
                                        >
                                            <Eye size={16} />
                                        </a>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(receipt.id); }}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:bg-rose-500 hover:text-white transition-all shadow-sm bg-white"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* OCR Result Panel */}
                                {ocrResults[receipt.id] && (
                                    <div className="px-10 pb-8 bg-white border-t border-black/5">
                                        <div className="flex items-center justify-between pt-6 mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-lg">
                                                    <Sparkles size={14} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Extracted Intelligence</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Neural Confidence</span>
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-lg border tabular-nums ${(ocrResults[receipt.id].confidence || 0) >= 0.7 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    {Math.round((ocrResults[receipt.id].confidence || 0) * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                            {[
                                                { label: 'Merchant', val: ocrResults[receipt.id].vendor },
                                                { label: 'Valuation', val: ocrResults[receipt.id].amount > 0 ? formatCurrency(ocrResults[receipt.id].amount) : null, color: 'text-emerald-600' },
                                                { label: 'Temporal Node', val: ocrResults[receipt.id].date },
                                                { label: 'Classification', val: ocrResults[receipt.id].category },
                                                { label: 'Description', val: ocrResults[receipt.id].description, span: true },
                                            ].map((f, idx) => f.val && (
                                                <div key={idx} className={f.span ? 'md:col-span-3' : ''}>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{f.label}</label>
                                                    <p className={`text-sm font-black uppercase tracking-tight ${f.color || 'text-slate-900'}`}>{f.val}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {(ocrResults[receipt.id].confidence || 0) < 0.7 && (
                                            <div className="mt-8 flex gap-4 items-center text-amber-600 text-[10px] font-black uppercase tracking-widest bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                                <AlertTriangle size={16} />
                                                Low Confidence Relay — Manual verification mandated
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───
export default function NewClaim() {
    const { id } = useParams();
    const [step, setStep] = useState(id ? 2 : 1);
    const [claim, setClaim] = useState(null);
    const [items, setItems] = useState([]);
    const [receiptCounts, setReceiptCounts] = useState({});
    const { createClaim, fetchClaimDetails, addItem, deleteItem, submitClaim } = useClaims();
    const navigate = useNavigate();

    useEffect(() => {
        const loadClaim = async () => {
            const data = await fetchClaimDetails(id);
            if (data) {
                setClaim(data.claim);
                setItems(data.items || []);
            }
        };
        if (id) loadClaim();
    }, [id, fetchClaimDetails]);

    const steps = [
        { num: 1, title: 'LOGISTICS', icon: FilePlus },
        { num: 2, title: 'INVENTORY', icon: Receipt },
        { num: 3, title: 'ASSETS', icon: Upload },
        { num: 4, title: 'COMMIT', icon: Check },
    ];

    const handleStep1Submit = async (data) => {
        if (claim) {
            setStep(2);
        } else {
            const newClaim = await createClaim(data);
            if (newClaim) {
                setClaim(newClaim);
                navigate(`/claims/${newClaim.id}/edit`, { replace: true });
                setStep(2);
            }
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            item_date: formData.get('item_date'),
            category: formData.get('category'),
            description: formData.get('description'),
            amount: parseFloat(formData.get('amount')),
        };

        if (!data.item_date || !data.category || !data.description || isNaN(data.amount) || data.amount <= 0) {
            toast.error('Parameters invalid. Ensure all nodes are occupied.');
            return;
        }

        const newItem = await addItem(claim.id, data);
        if (newItem) {
            setItems([...items, newItem]);
            e.target.reset();
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (await deleteItem(claim.id, itemId)) {
            setItems(items.filter(i => i.id !== itemId));
        }
    };

    const calculateTotal = () => items.reduce((sum, item) => sum + Number(item.amount), 0);

    const handleSubmitFinal = async () => {
        if (items.length === 0) {
            toast.error('Dossier empty. Minimum 1 node required.');
            return;
        }
        const note = prompt('Enter operational note (Optional):', '');
        const success = await submitClaim(claim.id, note || '');
        if (success) navigate(`/claims/${claim.id}`);
    };

    const totalAttachments = Object.values(receiptCounts).reduce((s, c) => s + c, 0);

    return (
        <div className="space-y-16 max-w-[1200px] mx-auto pb-32 page-enter">
            {/* ── Page Header ── */}
            <div className="pb-12 border-b border-black/5 flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div>
                    <h1 className="text-6xl font-black tracking-tighter text-slate-900 mb-4 leading-none uppercase">
                        New <span className="text-[var(--color-accent)]">Dossier</span>
                    </h1>
                    {claim && (
                        <div className="flex items-center gap-4">
                            <span className="px-5 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl">
                                {claim.claim_number}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Active</span>
                        </div>
                    )}
                    {!claim && <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em]">Initialize Strategic Ingestion v2026</p>}
                </div>
                <div className="flex gap-4">
                     <div className="px-6 py-3 bg-white border border-black/5 rounded-2xl flex items-center gap-4 shadow-premium">
                        <Database size={18} className="text-slate-900" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nodes: <span className="text-slate-900">{items.length}</span></span>
                    </div>
                </div>
            </div>

            {/* Stepper Card */}
            <div className="card !p-10 !rounded-[40px] shadow-premium relative overflow-hidden bg-white">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-900 opacity-[0.05]"></div>
                <div className="step-wizard max-w-4xl mx-auto">
                    <div className="step-progress-fill !bg-slate-900 shadow-xl" style={{ width: `calc(${(step - 1) / (steps.length - 1)} * 100% - 36px)` }}></div>
                    {steps.map((s) => (
                        <div key={s.num} className={`step-item ${step > s.num ? 'completed' : step === s.num ? 'active' : ''}`}>
                            <div className={`step-circle !w-16 !h-16 !rounded-[24px] shadow-2xl transition-all duration-700 ${step >= s.num ? 'scale-110 !bg-slate-900 !text-white' : 'bg-slate-50 text-slate-300 border-black/5'}`}>
                                {step > s.num ? <Check size={24} strokeWidth={4} /> : <s.icon size={24} />}
                            </div>
                            <span className={`step-label text-[10px] font-black uppercase tracking-[0.2em] mt-6 ${step >= s.num ? 'text-slate-900' : 'text-slate-300'}`}>{s.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="page-enter">

                {/* Step 1 */}
                {step === 1 && (
                    <div className="card !p-16 shadow-premium bg-white !rounded-[48px]">
                        <div className="flex items-center gap-6 mb-16 pb-10 border-b border-black/5">
                            <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center shadow-2xl rotate-6 hover:rotate-0 transition-all duration-500"><FilePlus size={32} /></div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Primary Logistics</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Foundational Dossier Identification</p>
                            </div>
                        </div>
                        <ClaimForm initialData={claim} onSubmit={handleStep1Submit} isDraft={true} />
                    </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <div className="space-y-12">
                         <div className="card !p-16 shadow-premium bg-white !rounded-[48px]">
                            <div className="flex items-center gap-6 mb-16 pb-10 border-b border-black/5">
                                <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center shadow-2xl"><Plus size={32} strokeWidth={3} /></div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Inventory Injection</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Disburse records into the secure buffer</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddItem} className="bg-slate-50 p-12 rounded-[40px] border border-black/5 mb-16 grid grid-cols-1 md:grid-cols-12 gap-10 items-end relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 rounded-full translate-x-1/2 -translate-y-1/2 -z-0"></div>
                                
                                <div className="md:col-span-3 space-y-4 relative z-10">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Temporal Key</label>
                                    <input type="date" name="item_date" className="w-full px-8 py-5 bg-white border-transparent rounded-2xl text-slate-900 font-black text-sm shadow-sm focus:shadow-premium transition-all" defaultValue={formatDateInput(claim?.claim_month)} required />
                                </div>
                                <div className="md:col-span-3 space-y-4 relative z-10">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Classification Node</label>
                                    <select name="category" className="w-full px-8 py-5 bg-white border-transparent rounded-2xl text-slate-900 font-black text-[13px] uppercase tracking-widest shadow-sm appearance-none cursor-pointer focus:shadow-premium transition-all" required defaultValue="">
                                        <option value="" disabled>Segment Select</option>
                                        <option value="fuel">Fuel Operations</option>
                                        <option value="meal">Cognitive Fuel</option>
                                        <option value="transport">Logistic Transition</option>
                                        <option value="accommodation">Staging Point</option>
                                        <option value="other">Fragment Data</option>
                                    </select>
                                </div>
                                <div className="md:col-span-4 space-y-4 relative z-10">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Vector Descriptor</label>
                                    <input type="text" name="description" className="w-full px-8 py-5 bg-white border-transparent rounded-2xl text-slate-900 font-black text-sm placeholder:text-slate-300 shadow-sm focus:shadow-premium transition-all" placeholder="Enter operational context..." required />
                                </div>
                                <div className="md:col-span-2 space-y-4 relative z-10">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Fiat Asset Value</label>
                                    <input type="number" step="0.01" name="amount" className="w-full px-8 py-5 bg-white border-transparent rounded-2xl text-slate-900 font-black text-lg tabular-nums shadow-sm focus:shadow-premium transition-all" placeholder="0.00" required min="1" />
                                </div>
                                <div className="md:col-span-12 relative z-10 flex justify-end">
                                    <button type="submit" className="!h-20 !px-12 rounded-[24px] bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                        <Plus size={24} strokeWidth={4} className="text-[var(--color-accent)]" /> 
                                        Commit Record
                                    </button>
                                </div>
                            </form>

                            <Table
                                emptyMessage="Zero records detected in buffer."
                                data={items}
                                columns={[
                                    { header: 'TEMPORAL', render: (r) => <span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">{formatDate(r.item_date)}</span> },
                                    {
                                        header: 'SEGMENT', render: (r) => (
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-black/5 flex items-center justify-center text-xl shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all">{CATEGORY_MAP[r.category]?.icon || '📎'}</div>
                                                <span className="font-black text-slate-900 text-[11px] uppercase tracking-widest">{CATEGORY_MAP[r.category]?.label || r.category}</span>
                                            </div>
                                        )
                                    },
                                    { header: 'DESCRIPTION', accessor: 'description', render: (r) => <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{r.description}</span> },
                                    { header: 'ASSET VALUE', cellClassName: 'text-right', render: (r) => <span className="font-black text-slate-900 tabular-nums text-2xl tracking-tighter">{formatCurrency(r.amount)}</span> },
                                    {
                                        header: '',
                                        render: (r) => (
                                            <div className="flex justify-end gap-3">
                                                {r.is_fuel && r.category === 'fuel' && (
                                                    <button className="h-12 px-6 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all" onClick={() => navigate(`/fuel/${r.id}`)}>
                                                        <Fuel size={16} /> Fuel Log
                                                    </button>
                                                )}
                                                <button type="button" className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-300 hover:bg-rose-500 hover:text-white transition-all shadow-sm bg-white" onClick={() => handleDeleteItem(r.id)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )
                                    }
                                ]}
                            />

                            <div className="mt-20 flex justify-between items-center bg-slate-50 p-12 rounded-[48px] border border-black/5 shadow-inner relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-slate-900 opacity-10"></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] relative z-10">Cumulative Aggregate Value</span>
                                <span className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter relative z-10">{formatCurrency(calculateTotal())}</span>
                            </div>

                            <div className="mt-16 flex justify-between items-center pt-10 border-t border-black/5">
                                <button className="h-16 px-10 rounded-[24px] bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all" onClick={() => setStep(1)}>Backtrack Logistics</button>
                                <button className="h-16 px-12 rounded-[24px] bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all" onClick={() => setStep(3)} disabled={items.length === 0}>
                                    Transition to Assets <ChevronRight size={20} strokeWidth={4} className="text-[var(--color-accent)]" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <div className="space-y-12">
                        <div className="card !p-16 shadow-premium bg-white !rounded-[48px]">
                            <div className="flex items-center gap-8 mb-16 pb-10 border-b border-black/5">
                                <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center shadow-2xl"><Upload size={32} /></div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Verification Assets</h3>
                                    {totalAttachments > 0 && (
                                        <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                            <CheckCircle size={14} /> {totalAttachments} Dossiers Synchronized
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Neural Advisory Banner */}
                            <div className="bg-slate-900 p-10 rounded-[40px] mb-12 shadow-2xl flex items-start gap-10 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.03] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
                                <div className="w-20 h-20 bg-white/10 rounded-[28px] flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-12 transition-transform">
                                    <Cpu size={36} className="text-[var(--color-accent)]" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black text-xl uppercase tracking-tighter mb-3">Neural Engine Online</h4>
                                    <p className="text-slate-400 font-bold text-sm leading-relaxed uppercase tracking-widest opacity-80 max-w-2xl">
                                        Inject document imagery and execute <span className="text-[var(--color-accent)] font-black">NEURAL SCAN</span> to autonomously extract fiscal parameters, merchant identities, and temporal nodes.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {items.map(item => (
                                    <ReceiptUploadRow
                                        key={item.id}
                                        item={item}
                                        onReceiptsChange={(itemId, receipts) =>
                                            setReceiptCounts(prev => ({ ...prev, [itemId]: receipts.length }))
                                        }
                                    />
                                ))}
                            </div>

                            <div className="mt-16 flex justify-between items-center pt-10 border-t border-black/5">
                                <button className="h-16 px-10 rounded-[24px] bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all" onClick={() => setStep(2)}>Backtrack Inventory</button>
                                <button className="h-16 px-12 rounded-[24px] bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all" onClick={() => setStep(4)}>
                                    Proceed to Authentication <ChevronRight size={20} strokeWidth={4} className="text-[var(--color-accent)]" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4 */}
                {step === 4 && (
                    <div className="card !p-16 shadow-premium bg-white !rounded-[48px]">
                        <div className="flex items-center gap-8 mb-16 pb-10 border-b border-black/5">
                            <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center shadow-2xl"><Check size={32} strokeWidth={4} /></div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Final Commitment</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Authorize dossier transmission to the core</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-black/5 p-12 rounded-[48px] mb-16 shadow-inner relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-1000 scale-150">
                                <FileText size={240} />
                            </div>
                            
                            <div className="flex items-center justify-between mb-16 border-b border-black/5 pb-8">
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Final Manifest Summary</h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verification Status: Nominal</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
                                <div>
                                    <label className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] block mb-3">Dossier ID</label>
                                    <span className="font-black text-slate-900 text-lg tracking-widest">{claim?.claim_number}</span>
                                </div>
                                <div>
                                    <label className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] block mb-3">Project Vector</label>
                                    <span className="font-black text-slate-900 text-2xl tracking-tighter uppercase">{claim?.project_name}</span>
                                </div>
                                <div className="text-right">
                                    <label className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] block mb-3">Aggregate Value</label>
                                    <span className="font-black text-[var(--color-accent)] text-4xl tabular-nums tracking-tighter">{formatCurrency(calculateTotal())}</span>
                                </div>
                            </div>

                            <div className="border-t border-black/5 pt-12">
                                <div className="flex items-center justify-between mb-10">
                                    <span className="text-slate-900 font-black text-[11px] uppercase tracking-[0.4em]">Operational Payload ({items.length} Units)</span>
                                </div>
                                <div className="space-y-6">
                                    {items.map(i => (
                                        <div key={i.id} className="flex justify-between items-center p-6 bg-white rounded-3xl border border-black/5 shadow-premium hover:scale-[1.01] transition-all">
                                            <div className="flex items-center gap-8">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner border border-black/5">{CATEGORY_MAP[i.category]?.icon}</div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-base tracking-tight uppercase mb-1">{i.description}</p>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{CATEGORY_MAP[i.category]?.label}</span>
                                                        {receiptCounts[i.id] > 0 && (
                                                            <span className="text-[9px] font-black text-emerald-600 flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">
                                                                <CheckCircle size={10} strokeWidth={3} /> {receiptCounts[i.id]} Assets
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="font-black tabular-nums text-slate-900 text-2xl tracking-tighter">{formatCurrency(i.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 flex justify-between items-center pt-10 border-t border-black/5">
                            <button className="h-16 px-10 rounded-[24px] bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all" onClick={() => setStep(3)}>Backtrack Assets</button>
                            <button className="h-16 px-16 rounded-[24px] bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-5 shadow-2xl hover:scale-105 active:scale-95 transition-all" onClick={handleSubmitFinal}>
                                <Navigation size={24} strokeWidth={4} className="text-[var(--color-accent)]" /> 
                                Transmit Final Dossier
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
