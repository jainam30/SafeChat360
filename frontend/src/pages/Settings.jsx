import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    User, Shield, Lock, Bell, Palette, HelpCircle, 
    Camera, Mail, Phone, AlertTriangle, Trash2
} from 'lucide-react';

export default function Settings() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('account');

    const menuItems = [
        { id: 'account', label: 'Account', icon: <User size={18}/> },
        { id: 'privacy', label: 'Privacy', icon: <Shield size={18}/> },
        { id: 'security', label: 'Security', icon: <Lock size={18}/> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18}/> },
        { id: 'appearance', label: 'Appearance', icon: <Palette size={18}/> },
        { id: 'help', label: 'Help & Support', icon: <HelpCircle size={18}/> },
    ];

    const renderAccountSettings = () => (
        <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Account Settings</h2>
            
            {/* Profile Information */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Profile Information</h3>
                    <p className="text-xs text-slate-500">Update your photo and personal details.</p>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="relative">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`} className="w-20 h-20 rounded-full object-cover border border-slate-200" alt="avatar"/>
                            <button className="absolute bottom-0 right-0 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-sm">
                                <Camera size={12}/>
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-sm rounded-lg hover:bg-blue-100 transition-colors">Change Photo</button>
                            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors">Remove</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                            <input type="text" defaultValue={user?.full_name || 'Jainam Jain'} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Username</label>
                            <input type="text" defaultValue={user?.username || 'jainamjain'} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Bio</label>
                        <textarea rows="3" defaultValue="Software Developer | Tech Enthusiast | Explorer 🚀" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none resize-none"></textarea>
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Contact Information</h3>
                    <p className="text-xs text-slate-500">Manage your email and phone number.</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="email" defaultValue={user?.email || 'jainamjainrj03@gmail.com'} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="tel" defaultValue="+91 9876543210" className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Management */}
            <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-red-100 bg-red-50/50">
                    <h3 className="font-bold text-red-600 flex items-center gap-2"><AlertTriangle size={16}/> Danger Zone</h3>
                    <p className="text-xs text-red-500/80">Irreversible account actions.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">Deactivate Account</h4>
                            <p className="text-xs text-slate-500">Temporarily disable your account and hide your profile.</p>
                        </div>
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors shrink-0">Deactivate</button>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">Delete Account</h4>
                            <p className="text-xs text-slate-500">Permanently delete your account and all your data.</p>
                        </div>
                        <button className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-lg hover:bg-red-100 transition-colors shrink-0 flex items-center gap-2"><Trash2 size={16}/> Delete Account</button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Save Changes</button>
            </div>
        </div>
    );

    const renderMockContent = (title) => (
        <div className="max-w-3xl flex flex-col items-center justify-center text-slate-500 py-20">
            <Settings size={48} className="text-slate-200 mb-4"/>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{title} Settings</h2>
            <p className="text-sm font-medium">This section is currently under construction in the mock.</p>
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
                            onClick={() => setActiveTab(item.id)}
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
            <div className="flex-1 overflow-y-auto min-w-0 p-6 md:p-8 bg-slate-50">
                {activeTab === 'account' ? renderAccountSettings() : renderMockContent(menuItems.find(i => i.id === activeTab)?.label)}
            </div>
        </div>
    );
}
