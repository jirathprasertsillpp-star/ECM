import React, { useState } from 'react';
import {
    User, Bell, MessageSquare, Mail, Users, Settings as SettingsIcon,
    Camera, Save, Check, ChevronRight, ToggleLeft, ToggleRight,
    Shield, Moon, Sun, Key, Trash2, UserPlus,
    AlertCircle, ShieldCheck, Database, Sliders, Globe, Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const TABS = [
    { id: 'account', label: 'Primary Identity', icon: User },
    { id: 'notifications', label: 'Relay Notifications', icon: Bell },
    { id: 'line', label: 'LINE Integration', icon: MessageSquare },
    { id: 'email', label: 'Communications Protocol', icon: Mail },
    { id: 'team', label: 'Nexus Personnel', icon: Users },
    { id: 'system', label: 'Core Dynamics', icon: SettingsIcon },
];

const MOCK_TEAM = [
    { id: 1, name: 'Operator Prime', email: 'pm@emc.com', role: 'user', department: 'Operations', active: true },
    { id: 2, name: 'Liaison Delta', email: 'accounting@emc.com', role: 'accounting', department: 'Governance', active: true },
    { id: 3, name: 'Executive Alpha', email: 'pco@emc.com', role: 'pco', department: 'Strategic Command', active: true },
];

const Toggle = ({ checked, onChange }) => (
    <button onClick={() => onChange(!checked)} className="transition-all hover:scale-110 active:scale-90 outline-none">
        {checked
            ? <ToggleRight size={44} className="text-slate-900" />
            : <ToggleLeft size={44} className="text-slate-200" />}
    </button>
);

const SettingRow = ({ label, sublabel, children }) => (
    <div className="flex items-center justify-between py-6 border-b border-black/5 last:border-0 hover:bg-slate-50/50 transition-colors -mx-6 px-6 relative z-10 group">
        <div className="pr-4">
            <p className="font-black text-xs text-slate-900 mb-1 uppercase tracking-tight">{label}</p>
            {sublabel && <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">{sublabel}</p>}
        </div>
        <div className="shrink-0 group-hover:drop-shadow-sm transition-all">{children}</div>
    </div>
);

// ──────── TAB PANELS ────────

function AccountTab({ user }) {
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || 'Operator Prime',
        email: user?.email || 'pm@emc.com',
        phone: '08X-XXX-XXXX',
        department: user?.department || 'Operations',
    });

    const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Identity Header */}
            <div className="card !p-10 shadow-premium flex items-center gap-10">
                <div className="relative group">
                    <div className="w-28 h-28 rounded-[32px] bg-slate-900 text-white flex items-center justify-center text-4xl font-black shadow-2xl relative overflow-hidden">
                        {form.name.charAt(0)}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-md">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Update</span>
                        </div>
                    </div>
                    <button className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl flex items-center justify-center bg-white text-slate-900 shadow-premium border border-black/5 hover:bg-slate-900 hover:text-white transition-all z-10">
                        <Camera size={20} />
                    </button>
                </div>
                <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 uppercase">{form.name}</h3>
                    <p className="text-slate-400 font-bold text-sm mb-4">{form.email}</p>
                    <span className="inline-flex items-center gap-3 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-black/5 shadow-sm">
                        <Shield size={14} className="text-[var(--color-accent)]" /> Clearance: <strong className="text-slate-900">{user?.role || 'user'}</strong>
                    </span>
                </div>
            </div>

            {/* Profile Matrix */}
            <div className="card !p-12 shadow-premium">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-black/5 pb-6 mb-10">Historical Ledger Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {[
                        { label: 'Primary Alias', key: 'name', type: 'text' },
                        { label: 'Relay Frequency (Email)', key: 'email', type: 'email' },
                        { label: 'Communication Node', key: 'phone', type: 'tel' },
                        { label: 'Assigned Division', key: 'department', type: 'text' },
                    ].map(field => (
                        <div className="form-group mb-0" key={field.key}>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">{field.label}</label>
                            <input
                                type={field.type}
                                value={form[field.key]}
                                onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                                className="form-input !bg-slate-50 border-transparent focus:!bg-white font-black"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end border-t border-black/5 pt-10 mt-12">
                    <button
                        onClick={handleSave}
                        className={`btn min-w-[240px] !py-4 ${saved ? 'bg-emerald-500 text-white border-transparent' : 'btn-primary'}`}
                    >
                        {saved ? <><Check size={20} className="mr-3" /> State Synchronized</> : <><Save size={20} className="mr-3" /> Commit Changes</>}
                    </button>
                </div>
            </div>

            {/* Security Config */}
            <div className="card !p-12 shadow-premium bg-slate-50/50 border-transparent">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-black/5 pb-6 mb-10 flex items-center gap-4">
                    <Key size={16} className="text-slate-400" /> Credential Encryption
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {['Active Passcode', 'Target Passcode', 'Verify Target'].map(lbl => (
                        <div key={lbl} className="form-group mb-0">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">{lbl}</label>
                            <input type="password" placeholder="••••••••••••" className="form-input !bg-white border-transparent shadow-sm font-black" />
                        </div>
                    ))}
                </div>
                <div className="pt-10 mt-10 border-t border-black/5 flex justify-end">
                    <button className="btn btn-secondary !px-10 font-black text-[10px] uppercase tracking-widest shadow-premium !bg-white">
                        <ShieldCheck size={18} className="mr-3 text-[var(--color-accent)]" /> Initiate Protocol Reset
                    </button>
                </div>
            </div>
        </div>
    );
}

function NotificationsTab() {
    const [settings, setSettings] = useState({
        claim_submitted: true,
        claim_approved: true,
        claim_rejected: true,
        pending_approval: true,
        weekly_summary: false,
        ai_alerts: true,
        email_notifications: true,
        line_notifications: false,
    });
    const toggle = key => setSettings(p => ({ ...p, [key]: !p[key] }));
    const notifGroups = [
        {
            title: 'Operational Status Relays',
            items: [
                { key: 'claim_submitted', label: 'Injection Success', sub: 'Confirm when a new data record enters the queue' },
                { key: 'claim_approved', label: 'Authorization Granted', sub: 'Immediate alert when expenditure is cleared' },
                { key: 'claim_rejected', label: 'Security Anomaly / Rejection', sub: 'High-priority relay when verification fails' },
            ]
        },
        {
            title: 'Intelligence & Pattern Recognition',
            items: [
                { key: 'weekly_summary', label: 'Temporal Aggregate', sub: 'Comprehensive weekly expenditure intelligence report' },
                { key: 'ai_alerts', label: 'Neural Guard Alerts', sub: 'Detection of anomalies or policy violations via ML' },
            ]
        },
        {
            title: 'Transmission Channels',
            items: [
                { key: 'email_notifications', label: 'SMTP External Relay', sub: 'Archive alerts into the standard communication hub' },
                { key: 'line_notifications', label: 'Nexus Link (LINE)', sub: 'Synchronize high-priority pings to mobile nodes' },
            ]
        }
    ];

    return (
        <div className="space-y-10 animate-fade-in">
            {notifGroups.map(group => (
                <div key={group.title} className="card !p-12 shadow-premium">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-black/5 pb-6 mb-4">{group.title}</h3>
                    <div className="flex flex-col">
                        {group.items.map((item) => (
                            <SettingRow key={item.key} label={item.label} sublabel={item.sub}>
                                <Toggle checked={settings[item.key]} onChange={() => toggle(item.key)} />
                            </SettingRow>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function LineTab() {
    const { user } = useAuthStore();
    const connected = !!user?.line_user_id;

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="card !p-16 shadow-premium text-center flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-[#06C755] opacity-20"></div>
                <div className="w-28 h-28 rounded-[40px] flex items-center justify-center mb-10 shadow-2xl border border-[#06C755]/10 bg-[#06C755]/5 hover:scale-110 transition-transform duration-500">
                    <MessageSquare size={54} className="text-[#06C755]" />
                </div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 uppercase">Nexus Mobile Link</h3>
                <p className="text-slate-400 font-bold mb-12 max-w-lg leading-relaxed text-sm">
                    Synchronize your operational state with the LINE core. Receive real-time tactical alerts, execute remote authorizations, and probe system health via the official mobile node.
                </p>

                {connected ? (
                    <div className="flex flex-col items-center gap-6 p-10 bg-slate-50 rounded-[32px] border border-black/5 w-full max-w-md shadow-inner">
                        <span className="flex items-center gap-3 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm">
                            <Check size={16} strokeWidth={3} /> Node Link Established
                        </span>
                        <div className="p-6 bg-white rounded-2xl shadow-premium border border-black/5 w-full flex items-center justify-between">
                            <div>
                                <p className="text-[9px] text-slate-400 font-black tracking-[0.3em] uppercase mb-2">Authenticated Identity</p>
                                <p className="text-slate-900 font-black text-lg">{user.line_display_name || user.line_user_id}</p>
                            </div>
                            <div className="w-14 h-14 bg-[#06C755]/10 rounded-2xl flex items-center justify-center">
                                <MessageSquare size={24} className="text-[#06C755]" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <Link
                        to="/line-link"
                        className="btn btn-lg !h-20 !px-12 shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-5 text-white border border-white/10"
                        style={{ backgroundColor: '#06C755' }}
                    >
                        <MessageSquare size={24} strokeWidth={2.5} /> Establish Nexus Link
                    </Link>
                )}
            </div>

            <div className="card !p-12 shadow-premium">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-black/5 pb-6 mb-8 uppercase">Tactical Commands (LINE)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                        { cmd: 'STATE', desc: 'Query latest operational status of pending requests' },
                        { cmd: 'AGGREGATE', desc: 'Summary of expenditure across current temporal cycle' },
                        { cmd: '📷 (UPLOAD)', desc: 'Transmit a receipt asset; AI will perform neural scan' },
                        { cmd: 'PROBE', desc: 'Check connectivity status and clearance level' }
                    ].map(item => (
                        <div key={item.cmd} className="flex items-start gap-6 p-6 rounded-[24px] border border-black/5 bg-slate-50/50 hover:bg-white transition-all shadow-sm group">
                            <code className="px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap bg-slate-900 text-white shadow-lg group-hover:bg-[#06C755] transition-colors">
                                {item.cmd}
                            </code>
                            <span className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">{item.desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TeamTab() {
    const [team] = useState(MOCK_TEAM);
    const roleConfig = {
        user: { color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' },
        accounting: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        pco: { color: 'text-[var(--color-accent)]', bg: 'bg-slate-50', border: 'border-black/5' },
    };
    const roleLabels = { user: 'Sub-Operator', accounting: 'Governance Auditor', pco: 'Authorizing Officer' };

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Nexus Population: <strong className="text-slate-900 text-lg mx-2">{team.length}</strong> Nodes</p>
                <button className="btn btn-primary !rounded-2xl shadow-premium !px-8">
                    <UserPlus size={18} className="mr-3" strokeWidth={3} /> Recruit Personnel
                </button>
            </div>

            <div className="card !p-0 shadow-premium overflow-hidden border border-black/5">
                <div className="divide-y divide-black/5">
                    {team.map((member) => {
                        const rc = roleConfig[member.role] || roleConfig.user;
                        return (
                            <div key={member.id} className="flex flex-col md:flex-row md:items-center justify-between p-8 hover:bg-slate-50/50 transition-all gap-8 group/member">
                                <div className="flex items-center gap-6 min-w-0">
                                    <div className="w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-slate-900 bg-slate-50 border border-black/5 shrink-0 text-2xl shadow-sm group-hover/member:bg-slate-900 group-hover/member:text-white transition-all duration-500">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-slate-900 text-lg uppercase tracking-tight truncate mb-1">{member.name}</p>
                                        <p className="text-xs text-slate-400 font-bold truncate">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 shrink-0 md:pl-0">
                                    <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${rc.bg} ${rc.color} ${rc.border}`}>
                                        {roleLabels[member.role]}
                                    </span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                    <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function SystemTab() {
    const [theme, setTheme] = useState('light');
    const [lang, setLang] = useState('en');
    const [tz, setTz] = useState('Asia/Bangkok');

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="card !p-12 shadow-premium">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-black/5 pb-6 mb-4 uppercase">Interface Dynamics</h3>
                <div className="flex flex-col">
                    <SettingRow label="Visual Aesthetic" sublabel="Toggle core interface luminosity profile">
                        <div className="flex gap-4 p-2 bg-slate-50 rounded-[20px] border border-black/5">
                            {[{ v: 'light', icon: Sun, label: 'Luminous' }, { v: 'dark', icon: Moon, label: 'Obscura' }].map(t => (
                                <button key={t.v} onClick={() => setTheme(t.v)}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm
                                        ${theme === t.v
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white text-slate-400 hover:text-slate-900 border border-black/5'
                                        }`}>
                                    <t.icon size={14} /> {t.label}
                                </button>
                            ))}
                        </div>
                    </SettingRow>
                    <SettingRow label="Global Localization" sublabel="Configure linguistic relay architecture">
                        <select value={lang} onChange={e => setLang(e.target.value)}
                            className="form-input !w-auto !py-3 !px-8 !bg-slate-50 border-transparent font-black text-[10px] uppercase tracking-widest cursor-pointer hover:!bg-white shadow-sm">
                            <option value="th">🇹🇭 Indochina (TH)</option>
                            <option value="en">🇺🇸 Global Core (EN)</option>
                        </select>
                    </SettingRow>
                    <SettingRow label="Temporal Horizon" sublabel="Lock system clock to specific timezone node">
                        <select value={tz} onChange={e => setTz(e.target.value)}
                            className="form-input !w-auto !py-3 !px-8 !bg-slate-50 border-transparent font-black text-[10px] uppercase tracking-widest cursor-pointer hover:!bg-white shadow-sm">
                            <option value="Asia/Bangkok">(GMT+7) Bangkok / SE Asia</option>
                            <option value="UTC">Universal Temporal Core (UTC)</option>
                        </select>
                    </SettingRow>
                </div>
            </div>

            <div className="card !p-12 shadow-premium bg-rose-50/30 border-rose-100">
                <h3 className="text-[10px] font-black text-rose-600 border-b border-rose-100 pb-6 flex items-center gap-4 uppercase tracking-[0.4em]">
                    <AlertCircle size={20} /> Danger Protocol Buffer
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-10 gap-10">
                    <div>
                        <p className="font-black text-slate-900 text-lg uppercase tracking-tight mb-2">Binary System Wipe (Total Reset)</p>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-sm uppercase tracking-wider line-clamp-2">IRREVERSIBLE ACTION: Purge all local data logs, cached documents, and synchronized assets from this node.</p>
                    </div>
                    <button className="btn !h-16 !px-10 bg-white text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white hover:border-transparent shadow-premium whitespace-nowrap font-black text-[10px] uppercase tracking-widest">
                        <Trash2 size={18} className="mr-3" /> Execute System Purge
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────── MAIN COMPONENT ────────

export default function SettingsPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('account');

    const renderTab = () => {
        switch (activeTab) {
            case 'account': return <AccountTab user={user} />;
            case 'notifications': return <NotificationsTab />;
            case 'line': return <LineTab />;
            case 'email': return (
                <div className="card !p-20 shadow-premium border-dashed border-4 border-slate-100 flex flex-col items-center justify-center text-center bg-slate-50/30 min-h-[500px]">
                    <div className="w-24 h-24 rounded-[32px] flex items-center justify-center bg-white border border-black/5 shadow-premium mb-8">
                        <Mail size={40} className="text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Relay Module Offline</h3>
                    <p className="text-[11px] font-black text-slate-400 max-w-sm leading-relaxed uppercase tracking-[0.2em]">SMTP protocol configuration required. Contact systems architect to establish communication bridge.</p>
                </div>
            );
            case 'team': return <TeamTab />;
            case 'system': return <SystemTab />;
            default: return null;
        }
    };

    return (
        <div className="space-y-16 max-w-[1400px] mx-auto page-enter pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-16 border-b border-black/5">
                <div>
                    <h1 className="text-6xl font-black tracking-tighter text-slate-900 mb-4 leading-none uppercase">
                        Core <span className="text-[var(--color-accent)]">Dynamics</span>
                    </h1>
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-3">
                        <Sliders size={14} className="text-slate-900" />
                        System Parameters &bull; Nexus v3.0
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl flex items-center gap-4 shadow-2xl">
                        <Cpu size={20} className="text-[var(--color-accent)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Latency: 24ms</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-16 items-start">
                {/* Sidebar Tabs */}
                <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-12">
                    <nav className="card p-4 shadow-premium space-y-2 !rounded-[40px]">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-5 px-6 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all text-left relative
                                        ${active
                                            ? 'bg-slate-900 text-white shadow-2xl scale-[1.05] z-10'
                                            : 'bg-transparent text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon size={20} className={active ? 'text-[var(--color-accent)]' : 'text-slate-300'} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 w-full">
                    <div className="page-enter">
                        {renderTab()}
                    </div>
                </div>
            </div>
        </div>
    );
}
