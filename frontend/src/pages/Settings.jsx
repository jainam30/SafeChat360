import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import toast from 'react-hot-toast';
import { 
    Settings as SettingsIcon, SlidersHorizontal, User, ShieldCheck, 
    Palette, Bell, HardDrive, ShieldAlert, Trash2, Plus, AlertCircle, ChevronRight, MessageSquare
} from 'lucide-react';

export default function Settings() {
    const { user, token, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeSection = searchParams.get('section') || 'general';

    const handleSectionChange = (section) => {
        setSearchParams({ section });
    };

    // --- BLOCKLIST STATE (Moderation) ---
    const [terms, setTerms] = useState([]);
    const [newTerm, setNewTerm] = useState('');
    const [loadingTerms, setLoadingTerms] = useState(false);

    useEffect(() => {
        if (token && activeSection === 'moderation') {
            fetchTerms();
        }
    }, [token, activeSection]);

    const fetchTerms = async () => {
        setLoadingTerms(true);
        try {
            const res = await fetch(getApiUrl('/api/blocklist/'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTerms(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTerms(false);
        }
    };

    const addTerm = async (e) => {
        e.preventDefault();
        if (!newTerm.trim()) return;
        try {
            const res = await fetch(getApiUrl('/api/blocklist/'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ term: newTerm })
            });
            if (res.ok) {
                setNewTerm('');
                fetchTerms();
                toast.success('Term added to blocklist');
            } else {
                toast.error('Failed to add term');
            }
        } catch (err) {
            toast.error('Error adding term');
        }
    };

    const removeTerm = async (id) => {
        if (!confirm('Remove this term?')) return;
        try {
            const res = await fetch(getApiUrl(`/api/blocklist/${id}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setTerms(terms.filter(t => t.id !== id));
                toast.success('Term removed');
            } else {
                toast.error('Failed to remove term');
            }
        } catch (err) {
            toast.error('Error removing term');
        }
    };

    const handleClearLocalData = () => {
        if (confirm("This will clear your local application cache and sign you out. Continue?")) {
            localStorage.clear();
            sessionStorage.clear();
            logout();
        }
    };

    const navItems = [
        { id: 'general', label: 'General', icon: <SlidersHorizontal size={18} /> },
        { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
        { id: 'chat', label: 'Chat & Media', icon: <MessageSquare size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { id: 'moderation', label: 'Moderation', icon: <ShieldAlert size={18} /> },
        { id: 'data', label: 'Data & Storage', icon: <HardDrive size={18} /> }
    ];

    return (
        <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0">
            {/* HEADER */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <SettingsIcon className="text-cyber-primary" size={32} />
                    Settings
                </h1>
                <p className="text-slate-500 text-lg">Manage your SafeChat360 preferences and application experience.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* LEFT NAVIGATION */}
                <div className="lg:w-64 shrink-0">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden sticky top-20">
                        <nav className="p-2 space-y-1">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSectionChange(item.id)}
                                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${activeSection === item.id ? 'bg-blue-50 text-cyber-primary' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                    <span className={activeSection === item.id ? 'text-cyber-primary' : 'text-slate-400'}>{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                        <div className="p-2 border-t border-slate-100 mt-2 space-y-1">
                            <Link to="/profile" className="w-full text-left px-4 py-2.5 flex items-center gap-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                                <User size={18} className="text-slate-400" /> Profile & Account
                            </Link>
                            <Link to="/security" className="w-full text-left px-4 py-2.5 flex items-center gap-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                                <ShieldCheck size={18} className="text-slate-400" /> Security & Privacy
                            </Link>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 min-w-0">
                    
                    {/* SECTION: GENERAL */}
                    {activeSection === 'general' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">General</h2>
                            
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-4">Account Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                                        <input type="email" value={user?.email || ''} disabled className="w-full max-w-md px-4 py-2 bg-slate-50 text-slate-500 rounded-lg border border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
                                        <div className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 text-sm font-bold rounded-full uppercase tracking-wide border border-blue-100">
                                            {user?.role || 'User'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-2">Language & Region</h3>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">Language configuration not currently available</p>
                                        <p className="text-xs text-slate-500 mt-1">SafeChat360 currently defaults to English (US). Granular locale settings are pending backend support.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: APPEARANCE */}
                    {activeSection === 'appearance' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Appearance</h2>
                            
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-2">Theme</h3>
                                <p className="text-sm text-slate-500 mb-4">Customize the look and feel of your SafeChat360 interface.</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                                    <div className="border-2 border-cyber-primary bg-slate-50 p-4 rounded-xl cursor-pointer">
                                        <div className="w-full h-24 bg-white border border-slate-200 rounded-md shadow-sm mb-3"></div>
                                        <p className="text-sm font-bold text-slate-900 text-center">Light Mode</p>
                                    </div>
                                    <div className="border-2 border-slate-100 bg-slate-100 p-4 rounded-xl opacity-50 cursor-not-allowed" title="Dark mode is not currently available">
                                        <div className="w-full h-24 bg-slate-800 border border-slate-700 rounded-md shadow-sm mb-3"></div>
                                        <p className="text-sm font-bold text-slate-500 text-center">Dark Mode</p>
                                    </div>
                                    <div className="border-2 border-slate-100 bg-slate-100 p-4 rounded-xl opacity-50 cursor-not-allowed" title="System sync is not currently available">
                                        <div className="w-full h-24 bg-gradient-to-r from-white to-slate-800 border border-slate-300 rounded-md shadow-sm mb-3"></div>
                                        <p className="text-sm font-bold text-slate-500 text-center">System</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-4 italic">Note: Dark mode implementation is not yet supported globally across all components.</p>
                            </div>
                        </div>
                    )}

                    {/* SECTION: CHAT & MEDIA */}
                    {activeSection === 'chat' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Chat & Media</h2>
                            
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-2">Chat Preferences</h3>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">Client preferences are not yet persistent</p>
                                        <p className="text-xs text-slate-500 mt-1">Features like "Enter to send" and "Read receipts toggles" are currently managed dynamically by the application.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-2 flex justify-between items-center">
                                    Media Management
                                    <Link to="/media" className="text-sm text-cyber-primary font-semibold hover:underline flex items-center">Open Library <ChevronRight size={16} /></Link>
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">View and manage media shared across your network.</p>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">Storage quotas unavailable</p>
                                        <p className="text-xs text-slate-500 mt-1">The server currently provides unmetered cloud storage. Per-user quota limits are not implemented.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: MODERATION */}
                    {activeSection === 'moderation' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Moderation & Safety</h2>
                            
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-2">Custom Blocked Words</h3>
                                <p className="text-sm text-slate-500 mb-4">Add specific words or phrases to automatically flag across the network.</p>

                                <form onSubmit={addTerm} className="flex gap-2 mb-6 max-w-md">
                                    <input
                                        type="text"
                                        value={newTerm}
                                        onChange={e => setNewTerm(e.target.value)}
                                        placeholder="Enter word to block..."
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-cyber-primary"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newTerm.trim()}
                                        className="px-4 py-2 bg-cyber-primary text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Plus size={18} /> Add
                                    </button>
                                </form>

                                <div>
                                    {loadingTerms ? (
                                        <p className="text-sm text-slate-400">Loading terms...</p>
                                    ) : terms.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">No custom rules added.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {terms.map(term => (
                                                <span key={term.id} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 flex items-center gap-2 border border-slate-200">
                                                    {term.term}
                                                    <button onClick={() => removeTerm(term.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Remove term">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: NOTIFICATIONS */}
                    {activeSection === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Notifications</h2>
                            
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-2 flex justify-between items-center">
                                    Notification Preferences
                                    <Link to="/notifications" className="text-sm text-cyber-primary font-semibold hover:underline flex items-center">View Notifications <ChevronRight size={16} /></Link>
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">Manage how SafeChat360 alerts you to new activity.</p>
                                
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">Fine-grained notification controls are not currently available.</p>
                                        <p className="text-xs text-slate-500 mt-1">The server dynamically handles WebSockets and push payloads. Mute toggles are pending.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: DATA & STORAGE */}
                    {activeSection === 'data' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Data & Storage</h2>
                            
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-2">Local Application Cache</h3>
                                <p className="text-sm text-slate-500 mb-4 max-w-2xl">
                                    Clearing local data will remove cached UI states, temporary files, and active session tokens from your browser. You will be signed out immediately.
                                </p>
                                <button 
                                    onClick={handleClearLocalData}
                                    className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Clear local data
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
