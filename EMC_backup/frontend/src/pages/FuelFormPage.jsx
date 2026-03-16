import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fuelSchema } from '../utils/validators';
import { useClaims } from '../hooks/useClaims';
import { useAI } from '../hooks/useAI';
import { fuelAPI } from '../api';
import api from '../api';
import { formatCurrency } from '../utils/formatters';
import {
    MapPin, Navigation, Map as MapIcon, ShieldCheck, AlertTriangle,
    Upload, X, Sparkles, Loader2, Image, FileText, File, Eye, CheckCircle,
    ArrowLeft, Hash, Info, RefreshCw, Plus, Cpu, Activity, Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import Tooltip from '../components/common/Tooltip';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// ─── File helpers ───
const getFileIcon = (mimeType) => {
    if (!mimeType) return <File size={18} className="text-slate-300" />;
    if (mimeType.startsWith('image/')) return <Image size={18} className="text-[var(--color-accent)]" />;
    if (mimeType === 'application/pdf') return <FileText size={18} className="text-rose-500" />;
    return <File size={18} className="text-slate-400" />;
};

const getFileSizeLabel = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Receipt Upload Panel ───
function FuelReceiptPanel({ itemId }) {
    const [receipts, setReceipts] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState({});
    const [ocrResults, setOcrResults] = useState({});
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef();

    useEffect(() => {
        if (itemId) loadReceipts();
    }, [itemId]);

    const loadReceipts = async () => {
        try {
            const res = await api.get(`/items/${itemId}/receipts`);
            setReceipts(res.data.receipts || []);
        } catch { /* ignore */ }
    };

    const handleFiles = useCallback(async (files) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        const newReceipts = [];
        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append('receipt', file);
                const res = await api.post(`/items/${itemId}/receipts`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                newReceipts.push(res.data.receipt);
                toast.success(`Asset "${file.name}" synchronized.`);
            } catch {
                toast.error(`Transmission failure: "${file.name}"`);
            }
        }
        setReceipts(prev => [...prev, ...newReceipts]);
        setUploading(false);
    }, [itemId]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.target.files);
    }, [handleFiles]);

    const handleDelete = async (receiptId) => {
        try {
            await api.delete(`/items/receipts/${receiptId}`);
            setReceipts(prev => prev.filter(r => r.id !== receiptId));
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
            if (warning) toast(warning, { icon: '⚠️' });
            else toast.success('Neural scan complete. Extracted parameters.');
        } catch {
            toast.error('Neural engine failure.');
        } finally {
            setOcrLoading(prev => ({ ...prev, [receiptId]: false }));
        }
    };

    return (
        <div className="card !p-12 shadow-premium mt-16 bg-white !rounded-[48px]">
            <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center shadow-2xl rotate-6 transition-transform">
                    <Upload size={32} />
                </div>
                <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Document Assets</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Multi-modal Receipt Evidence</p>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[32px] p-24 text-center cursor-pointer transition-all duration-700 mb-12 ${
                    dragOver
                        ? 'border-slate-900 bg-slate-50 scale-[1.01]'
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
                    <div className="flex flex-col items-center gap-6">
                        <Loader2 size={40} className="animate-spin text-slate-900" />
                        <p className="text-[11px] font-black text-slate-900 animate-pulse uppercase tracking-[0.4em]">Establishing Uplink...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-8">
                        <div className="w-20 h-20 rounded-[32px] bg-white text-slate-300 flex items-center justify-center shadow-premium border border-black/5">
                            <Upload size={36} strokeWidth={2.5} />
                        </div>
                        <div>
                            <span className="text-xl font-black text-slate-900 uppercase tracking-tighter block mb-2">Connect Receipt Artifact</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Neural Scanner will autonomously extract parameters</span>
                        </div>
                    </div>
                )}
            </div>

            {/* File List */}
            {receipts.length > 0 && (
                <div className="space-y-6">
                    {receipts.map(receipt => (
                        <div key={receipt.id} className="border border-black/5 rounded-[24px] overflow-hidden bg-slate-50/30">
                            <div className="flex items-center gap-6 px-10 py-6 hover:bg-white transition-all duration-700">
                                <span className="flex-shrink-0 p-4 bg-white rounded-2xl shadow-premium border border-black/5">{getFileIcon(receipt.mime_type)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight mb-1">{receipt.original_name}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{getFileSizeLabel(receipt.file_size)}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {receipt.mime_type && (receipt.mime_type.startsWith('image/') || receipt.mime_type === 'application/pdf') && (
                                        ocrResults[receipt.id] ? (
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 px-5 py-2 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                                                <CheckCircle size={14} strokeWidth={3} /> Deciphered
                                            </span>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOCR(receipt.id); }}
                                                disabled={ocrLoading[receipt.id]}
                                                className="btn !py-2 !h-auto !px-4 text-[9px] font-black uppercase tracking-widest text-slate-900 border border-black/5 bg-white hover:bg-slate-900 hover:text-white transition-all flex items-center gap-3 shadow-sm"
                                            >
                                                {ocrLoading[receipt.id] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                Neural Scan
                                            </button>
                                        )
                                    )}
                                    <a
                                        href={receipt.file_url ? `${API_BASE}${receipt.file_url}` : `${API_BASE}/uploads/${receipt.filename}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-900 hover:text-white text-slate-400 border border-black/5 bg-white shadow-sm transition-all"
                                    >
                                        <Eye size={18} />
                                    </a>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(receipt.id); }}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-100 bg-white shadow-sm transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* OCR Result */}
                            {ocrResults[receipt.id] && (
                                <div className="px-10 pb-8 bg-white border-t border-black/5 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex items-center justify-between pt-6 mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-lg">
                                                <Sparkles size={14} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Neural Extract</span>
                                        </div>
                                        <span className={`text-[10px] px-3 py-1 rounded-lg font-black tabular-nums border ${(ocrResults[receipt.id].confidence || 0) >= 0.7 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            Confidence: {Math.round((ocrResults[receipt.id].confidence || 0) * 100)}%
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                        {[
                                            { label: 'Merchant', val: ocrResults[receipt.id].vendor },
                                            { label: 'Fiscal Sum', val: ocrResults[receipt.id].amount > 0 ? formatCurrency(ocrResults[receipt.id].amount) : null, color: 'text-[var(--color-accent)]' },
                                            { label: 'Temporal Node', val: ocrResults[receipt.id].date },
                                        ].map((f, idx) => f.val && (
                                            <div key={idx}>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{f.label}</span>
                                                <span className={`text-sm font-black uppercase tracking-tight ${f.color || 'text-slate-900'}`}>{f.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {(ocrResults[receipt.id].confidence || 0) < 0.7 && (
                                        <div className="mt-8 flex gap-4 items-center text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                            <AlertTriangle size={16} /> Low confidence relay &mdash; verify details manually
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Map Component ───
function MapComponent({ origin, destination, setDistance }) {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [directionsService, setDirectionsService] = useState(null);
    const [directionsRenderer, setDirectionsRenderer] = useState(null);

    useEffect(() => {
        if (mapRef.current && !map) {
            const newMap = new window.google.maps.Map(mapRef.current, {
                center: { lat: 13.7563, lng: 100.5018 },
                zoom: 12,
                styles: [
                    { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }] },
                    { "featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{ "color": "#a0c3d1" }, { "lightness": "20" }] },
                    { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#e9e9e9" }, { "lightness": "17" }] }
                ],
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false
            });
            setMap(newMap);
            setDirectionsService(new window.google.maps.DirectionsService());
            setDirectionsRenderer(new window.google.maps.DirectionsRenderer({
                map: newMap,
                polylineOptions: { strokeColor: '#0284c7', strokeWeight: 8, strokeOpacity: 0.8 }
            }));
        }
    }, [mapRef, map]);

    useEffect(() => {
        if (directionsService && directionsRenderer && origin && destination) {
            directionsService.route(
                { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING },
                (response, status) => {
                    if (status === 'OK') {
                        directionsRenderer.setDirections(response);
                        const dist = response.routes[0].legs[0].distance.value / 1000;
                        setDistance(dist);
                    }
                }
            );
        }
    }, [origin, destination, directionsService, directionsRenderer, setDistance]);

    return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '24px' }} />;
}

// ─── Main Page ───
export default function FuelFormPage() {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const { saveFuel } = useClaims();
    const { verifyFuel, verifying } = useAI();
    const [fuelData, setFuelData] = useState(null);
    const [mapsDistance, setMapsDistance] = useState(0);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(fuelSchema),
        defaultValues: {
            odometer_start: 0,
            odometer_end: 0,
            origin_address: '',
            destination_address: '',
            project_task: '',
            work_type: '',
            work_category: 'Engineering',
        }
    });

    const originInput = watch('origin_address');
    const destInput = watch('destination_address');
    const odoStart = watch('odometer_start');
    const odoEnd = watch('odometer_end');

    useEffect(() => {
        fuelAPI.get(itemId).then(res => {
            if (res.data.fuel) {
                setFuelData(res.data.fuel);
                const f = res.data.fuel;
                setValue('odometer_start', f.odometer_start);
                setValue('odometer_end', f.odometer_end);
                setValue('origin_address', f.origin_address);
                setValue('destination_address', f.destination_address);
                setValue('project_task', f.project_task);
                setValue('work_type', f.work_type || '');
                setValue('work_category', f.work_category || 'Engineering');
                setMapsDistance(f.maps_distance_km || 0);
            }
        }).catch(() => { /* ignore 404 */ });
    }, [itemId, setValue]);

    const onSubmit = async (data) => {
        const payload = {
            ...data,
            origin_lat: 0, origin_lng: 0, destination_lat: 0, destination_lng: 0,
            maps_distance_km: mapsDistance
        };
        const result = await saveFuel(itemId, payload);
        if (result) setFuelData(result);
    };

    const handleVerify = async () => {
        if (!fuelData) {
            toast.error('Commit changes before executing neural verification.');
            return;
        }
        const result = await verifyFuel(fuelData.id);
        if (result) {
            setFuelData({ ...fuelData, ai_verified: result.isVerified, ai_verification_note: result.note });
        }
    };

    const renderMap = (status) => {
        if (status === Status.LOADING) return (
            <div className="h-full flex flex-col items-center justify-center gap-6">
                <Loader2 size={40} className="animate-spin text-slate-300" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Initializing Geospace...</span>
            </div>
        );
        if (status === Status.FAILURE) return <div className="h-full flex items-center justify-center text-rose-500 font-black uppercase tracking-widest text-[10px]">Geospatial Engine Offline</div>;
        return <MapComponent origin={originInput} destination={destInput} setDistance={setMapsDistance} />;
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-16 page-enter pb-40">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-16 border-b border-black/5">
                <div className="flex items-center gap-10">
                    <button className="w-16 h-16 flex items-center justify-center rounded-[24px] bg-white border border-black/5 text-slate-300 hover:text-slate-900 shadow-xl transition-all" onClick={() => navigate(-1)}>
                        <ArrowLeft size={32} strokeWidth={2.5} />
                    </button>
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-none uppercase mb-4">
                            Fuel <span className="text-[var(--color-accent)]">Dynamics</span>
                        </h1>
                        <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-3">
                            <Activity size={14} className="text-slate-900" /> Telemetry & Mapping Suite
                        </p>
                    </div>
                </div>
                <div className="flex bg-slate-50 px-8 py-4 rounded-3xl border border-black/5 shadow-premium">
                    <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Neural Sync Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                {/* ── Form Column ── */}
                <div className="lg:col-span-6 card !p-16 shadow-premium bg-white !rounded-[48px]">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
                        <div>
                             <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-12 flex items-center gap-5">
                                <div className="w-3 h-10 bg-slate-900 rounded-full"></div>
                                Odometer Metrics
                            </h3>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">STARTING ODOMETER</label>
                                    <input type="number" className={`form-input !h-20 !px-8 !text-2xl font-black tabular-nums border-none !bg-slate-50 focus:!bg-white ${errors.odometer_start ? '!bg-rose-50 !text-rose-500' : ''}`} {...register('odometer_start', { valueAsNumber: true })} />
                                    {errors.odometer_start && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-2">{errors.odometer_start.message}</p>}
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">ENDING ODOMETER</label>
                                    <input type="number" className={`form-input !h-20 !px-8 !text-2xl font-black tabular-nums border-none !bg-slate-50 focus:!bg-white ${errors.odometer_end ? '!bg-rose-50 !text-rose-500' : ''}`} {...register('odometer_end', { valueAsNumber: true })} />
                                    {errors.odometer_end && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-2">{errors.odometer_end.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-12 rounded-[40px] flex justify-between items-center shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3">Calculated Operational Delta</p>
                                <div className="flex items-baseline gap-4">
                                    <span className="text-6xl font-black text-white group-hover:text-[var(--color-accent)] transition-colors duration-700 tabular-nums leading-none">
                                        {Math.max(0, (odoEnd || 0) - (odoStart || 0))} 
                                    </span>
                                    <span className="text-lg font-black text-slate-500 uppercase tracking-widest">km</span>
                                </div>
                            </div>
                            <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:scale-110 group-hover:text-white/10 transition-all">
                                <Activity size={48} />
                            </div>
                        </div>

                        <div className="space-y-8 pt-6 border-t border-black/5">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">ORIGIN POINT ADDRESS</label>
                                <div className="input-wrapper group relative">
                                    <MapPin className="input-icon-left text-slate-300 group-focus-within:text-slate-900 transition-colors" size={24} />
                                    <input type="text" className="form-input has-left-icon !h-16 border-none !bg-slate-50 focus:!bg-white font-black text-sm uppercase tracking-tight" placeholder="Identify starting node..." {...register('origin_address')} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">DESTINATION TERMINAL ADDRESS</label>
                                <div className="input-wrapper group relative">
                                    <Navigation className="input-icon-left text-slate-300 group-focus-within:text-slate-900 transition-colors" size={24} />
                                    <input type="text" className="form-input has-left-icon !h-16 border-none !bg-slate-50 focus:!bg-white font-black text-sm uppercase tracking-tight" placeholder="Identify target node..." {...register('destination_address')} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-10">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-12 flex items-center gap-5">
                                <div className="w-3 h-10 bg-[var(--color-accent)] rounded-full"></div>
                                Tactical Mission Parameters
                            </h3>

                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">LOGISTICS MISSION PURPOSE</label>
                                    <textarea rows="4" className={`form-input !px-8 !py-6 border-none !bg-slate-50 focus:!bg-white font-black text-sm leading-relaxed uppercase tracking-tight ${errors.project_task ? '!bg-rose-50' : ''}`} placeholder="State the mission objective..." {...register('project_task')}></textarea>
                                    {errors.project_task && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-2">{errors.project_task.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">TASK SECTOR</label>
                                        <div className="relative">
                                            <select className="form-input !h-16 !px-8 border-none !bg-slate-50 focus:!bg-white font-black text-[13px] uppercase tracking-[0.2em] appearance-none cursor-pointer" {...register('work_category')}>
                                                <option value="Engineering">Engineering Sector</option>
                                                <option value="IT">Neural / IT Ops</option>
                                                <option value="Sales">Market Intelligence</option>
                                                <option value="Admin">Governance Ops</option>
                                                <option value="Other">Ancillary Channel</option>
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                                <Database size={16} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">MISSION CLASSIFICATION</label>
                                        <input type="text" className="form-input !h-16 !px-8 border-none !bg-slate-50 focus:!bg-white font-black text-sm uppercase tracking-tight" placeholder="e.g., Installation 01" {...register('work_type')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse md:flex-row gap-8 pt-12 border-t border-black/5">
                            {fuelData && (
                                <button
                                    type="button"
                                    className={`btn !h-20 !px-10 rounded-[28px] text-[var(--color-accent)] border border-black/5 bg-white hover:bg-slate-900 hover:text-white font-black uppercase tracking-widest text-[11px] shadow-sm flex items-center justify-center gap-4 transition-all ${verifying ? 'opacity-50' : ''}`}
                                    onClick={handleVerify}
                                    disabled={verifying}
                                >
                                    {verifying ? <Loader2 size={24} className="animate-spin" /> : <ShieldCheck size={28} strokeWidth={2.5} />}
                                    <div className="text-left">
                                        <div className="text-[10px] font-black leading-none mb-1">EXECUTE</div>
                                        <div>Neural Audit</div>
                                    </div>
                                </button>
                            )}
                            <button type="submit" className="btn btn-primary !h-20 !rounded-[28px] flex-1 !py-5 font-black uppercase tracking-[0.3em] text-[13px] shadow-premium group">
                                <Plus size={24} className="group-hover:rotate-90 transition-transform text-[var(--color-accent)]" strokeWidth={4} />
                                Commit Dynamics
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Map Column ── */}
                <div className="lg:col-span-6 space-y-16 lg:sticky lg:top-12">
                    <div className="card shadow-premium !h-[700px] flex flex-col !p-0 !rounded-[48px] overflow-hidden border-none bg-white relative">
                        <div className="absolute top-10 left-10 z-10">
                            <div className="bg-slate-900/95 backdrop-blur-3xl px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4">
                                <div className="w-3 h-3 rounded-full bg-[var(--color-accent)] animate-pulse"></div>
                                <span className="text-[10px] font-black text-white tracking-[0.4em] uppercase">Tactical Mapping Active</span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <Wrapper apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_DUMMY_KEY"} render={renderMap} />
                        </div>

                        <div className="p-12 bg-slate-50 border-t border-black/5 flex justify-between items-center group-hover:bg-white transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center shadow-xl">
                                    <MapIcon size={32} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-2">Geospatial Resolution</span>
                                    <span className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">
                                        {mapsDistance ? `${mapsDistance.toFixed(1)} ` : '---'}
                                        {mapsDistance ? <span className="text-base font-black ml-2 text-slate-300 uppercase tracking-widest leading-none">km</span> : ''}
                                    </span>
                                </div>
                            </div>
                            <button className="w-14 h-14 rounded-2xl border border-black/5 bg-white flex items-center justify-center text-slate-300 hover:text-slate-900 hover:rotate-12 hover:shadow-premium transition-all">
                                <RefreshCw size={24} />
                            </button>
                        </div>
                    </div>

                    {/* AI Verification Result */}
                    {fuelData && typeof fuelData.ai_verified === 'boolean' && (
                        <div className={`card shadow-premium !p-12 !rounded-[48px] border-none relative overflow-hidden animate-in fade-in slide-in-from-right-10 duration-1000 ${fuelData.ai_verified ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 scale-150">
                                <ShieldCheck size={280} />
                            </div>
                            
                            <div className="flex items-center justify-between mb-12 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl transition-transform hover:rotate-12 ${fuelData.ai_verified ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                        {fuelData.ai_verified ? <ShieldCheck size={36} strokeWidth={2.5} /> : <AlertTriangle size={36} strokeWidth={2.5} />}
                                    </div>
                                    <div>
                                        <h3 className={`text-3xl font-black tracking-tighter uppercase leading-none ${fuelData.ai_verified ? 'text-emerald-900' : 'text-rose-900'}`}>
                                            Neural Audit Case
                                        </h3>
                                        <p className={`text-[10px] font-black uppercase tracking-[0.4em] mt-2 ${fuelData.ai_verified ? 'text-emerald-600' : 'text-rose-600'}`}>Pattern Analysis Complete</p>
                                    </div>
                                </div>
                                <div className="bg-white/50 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 border border-black/5 shadow-sm">Decision Validated</div>
                            </div>
                            
                            <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[32px] mb-12 relative z-10 border border-white/20 shadow-inner">
                                <p className="text-sm font-black text-slate-900 leading-relaxed uppercase tracking-tight italic opacity-80">
                                    "{fuelData.ai_verification_note || 'Autonomous analysis complete. Mission parameters align with established geospace markers.'}"
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                                <div className="flex flex-col gap-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Variance Parameter</span>
                                    <div className="flex items-baseline gap-4">
                                        <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">
                                            {mapsDistance > 0 ? `${Math.abs((odoEnd - odoStart) - mapsDistance).toFixed(1)} km` : '---'}
                                        </span>
                                        <span className={`text-sm font-black uppercase tracking-widest ${Math.abs((odoEnd - odoStart) - mapsDistance) / mapsDistance < 0.1 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            ({mapsDistance > 0 ? (((Math.abs((odoEnd - odoStart) - mapsDistance)) / mapsDistance) * 100).toFixed(1) : 0}%)
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Consistency Maturity</span>
                                    <span className={`text-2xl font-black uppercase tracking-widest ${fuelData.ai_verified ? 'text-emerald-600' : 'text-rose-600'}`}>{fuelData.ai_verified ? 'Nominal (Secure)' : 'Critical (Verify)'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Receipt Upload ── */}
            <FuelReceiptPanel itemId={itemId} />
        </div>
    );
}
