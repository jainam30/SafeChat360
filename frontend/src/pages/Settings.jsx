import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, resolveMediaUrl } from '../config';
import toast from 'react-hot-toast';
import { 
    User, Shield, Lock, Bell, Palette, HelpCircle, 
    Camera, Mail, Phone, AlertTriangle, Trash2, Settings as SettingsIcon,
    Save, CheckCircle2
} from 'lucide-react';
import Security from './Security';
import Help from './Help';

export default function Settings() {
    const { user, setUser, token } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'account';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Form state for account settings
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [saving, setSaving] = useState(false);

    // Sync active tab with URL search parameter
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['account', 'privacy', 'security', 'notifications', 'appearance', 'help'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // Keep form state in sync with loaded user
    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setUsername(user.username || '');
        }
    }, [user]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };

    const handleSaveAccount = async (e) => {
        if (e) e.preventDefault();
        if (!token) return;
        setSaving(true);
        try {
            const res = await axios.put(getApiUrl('/api/users/me'), {
                full_name: fullName,
                username: username
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                toast.success("Profile updated successfully!");
                if (setUser) {
                    setUser(prev => ({ ...prev, full_name: fullName, username: username }));
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const avatarInputRef = useRef(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Photo exceeds 10MB limit");
            return;
        }

        setUploadingAvatar(true);
        const toastId = toast.loading("Uploading profile photo...");
        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await axios.post(getApiUrl('/api/upload'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            const photoUrl = uploadRes.data.url;
            await axios.put(getApiUrl('/api/users/me'), {
                profile_photo: photoUrl
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Profile photo updated!", { id: toastId });
            if (setUser) {
                setUser(prev => ({ ...prev, avatar_url: photoUrl, profile_photo: photoUrl }));
            }
        } catch (err) {
            console.error("Avatar upload failed:", err);
            toast.error(err.response?.data?.detail || "Failed to update profile photo", { id: toastId });
        } finally {
            setUploadingAvatar(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const menuItems = [
        { id: 'account', label: 'Account', icon: <User size={18}/> },
        { id: 'security', label: 'Security & Privacy', icon: <Shield size={18}/> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18}/> },
        { id: 'appearance', label: 'Preferences', icon: <Palette size={18}/> },
        { id: 'help', label: 'Help & Support', icon: <HelpCircle size={18}/> },
    ];

    const renderAccountSettings = () => (
        <form onSubmit={handleSaveAccount} className="max-w-3xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Account Settings</h2>
            
            {/* Profile Information */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Profile Information</h3>
                    <p className="text-xs text-slate-500">Update your public name, handle, and avatar photo.</p>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-6 mb-8">
                        <div 
                            className="relative group cursor-pointer"
                            onClick={() => avatarInputRef.current?.click()}
                            title="Click to change profile photo"
                        >
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                            {user?.avatar_url || user?.profile_photo ? (
                                <img 
                                    src={resolveMediaUrl(user.avatar_url || user.profile_photo)} 
                                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-sm" 
                                    alt="avatar"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                                    {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute inset-0 rounded-full bg-slate-900/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={22} className={uploadingAvatar ? 'animate-spin' : ''} />
                                <span className="text-[10px] font-bold mt-1">Upload</span>
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-base">{user?.full_name || user?.username || 'SafeChat User'}</p>
                            <p className="text-xs text-slate-500">@{user?.username || 'user'}</p>
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1.5 transition-colors"
                            >
                                <Camera size={13} /> {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                            <input 
                                type="text" 
                                value={fullName} 
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Username</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Contact Information</h3>
                    <p className="text-xs text-slate-500">Your registered contact information.</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="email" 
                                    disabled
                                    value={user?.email || 'N/A'} 
                                    className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed outline-none" 
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Verified with SafeChat360 authentication</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Role</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    disabled
                                    value={user?.role ? user.role.toUpperCase() : 'USER'} 
                                    className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed outline-none font-bold" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button 
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Profile Changes"}
                </button>
            </div>
        </form>
    );

    const renderPreferences = () => (
        <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Preferences & Notifications</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">Desktop Notifications</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Receive alerts when messages or calls arrive</p>
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">Enabled</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">Sound Alerts</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Play ringing chime for incoming 1-to-1 WebRTC calls</p>
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">Theme Appearance</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Current UI design system is Clean White & Slate</p>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">Light Mode</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-full w-full bg-slate-50 overflow-hidden text-slate-900">
            
            {/* LEFT SIDEBAR (Settings Menu) */}
            <div className="hidden md:flex w-[260px] flex-col border-r border-slate-200 bg-white shrink-0 p-4">
                <div className="mb-6 px-2">
                    <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                    <p className="text-xs font-medium text-slate-500 mt-1">Manage your account, privacy, and preferences</p>
                </div>

                <div className="space-y-1">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id)}
                            className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold text-sm transition-colors ${
                                activeTab === item.id 
                                ? 'bg-blue-50 text-blue-600' 
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <span className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN PANE */}
            <div className="flex-1 overflow-y-auto min-w-0 p-4 sm:p-6 md:p-8 bg-slate-50">
                {activeTab === 'account' && renderAccountSettings()}
                {(activeTab === 'security' || activeTab === 'privacy') && <Security />}
                {activeTab === 'help' && <Help />}
                {(activeTab === 'notifications' || activeTab === 'appearance') && renderPreferences()}
            </div>
        </div>
    );
}

