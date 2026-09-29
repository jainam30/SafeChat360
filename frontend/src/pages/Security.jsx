import React from 'react';
import { 
    ShieldCheck, Lock, Smartphone, Monitor, Globe, CheckCircle2, 
    LogOut, AlertCircle, RefreshCw
} from 'lucide-react';

export default function Security() {
    const loginActivity = [
        { id: 1, device: 'MacBook Pro 16"', location: 'Rajasthan, India', time: 'Active now', status: 'current', icon: <Monitor size={16}/> },
        { id: 2, device: 'iPhone 13 Pro', location: 'Rajasthan, India', time: '2 hours ago', status: 'success', icon: <Smartphone size={16}/> },
        { id: 3, device: 'Windows PC (Chrome)', location: 'Delhi, India', time: 'Yesterday', status: 'success', icon: <Globe size={16}/> },
        { id: 4, device: 'Unknown Device', location: 'Moscow, Russia', time: '3 days ago', status: 'failed', icon: <AlertCircle size={16}/> },
    ];

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 overflow-y-auto text-slate-900 p-6 md:p-8">
            <div className="max-w-4xl w-full mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex items-start gap-4 mb-8 border-b border-slate-200 pb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Security Dashboard</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">Your privacy matters. Manage your security settings and active sessions here.</p>
                    </div>
                </div>

                {/* Encryption Banner */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl shadow-sm overflow-hidden p-6 text-white relative">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <Lock size={20} className="text-white"/>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">End-to-End Encryption</h3>
                                <p className="text-sm text-green-50/90 max-w-md">
                                    Your messages, calls, and shared files are secured with industry-standard end-to-end encryption. No one outside of your chats, not even SafeChat360, can read or listen to them.
                                </p>
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full font-bold text-sm">
                            <CheckCircle2 size={16}/> Enabled
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column (2 spans) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Login Activity */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="font-bold text-slate-900">Login Activity</h3>
                                    <p className="text-xs text-slate-500">Recent sign-ins to your account.</p>
                                </div>
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <RefreshCw size={16}/>
                                </button>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {loginActivity.map(activity => (
                                    <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                                activity.status === 'failed' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {activity.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900">{activity.device}</h4>
                                                <p className="text-[11px] font-medium text-slate-500 mt-0.5">{activity.location} • {activity.time}</p>
                                            </div>
                                        </div>
                                        <div>
                                            {activity.status === 'current' && <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded border border-green-100">Active Now</span>}
                                            {activity.status === 'success' && <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">Success</span>}
                                            {activity.status === 'failed' && <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100">Failed</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Active Sessions */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="font-bold text-slate-900">Active Sessions</h3>
                                    <p className="text-xs text-slate-500">Manage devices currently logged into your account.</p>
                                </div>
                                <button className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1">
                                    Log out all <LogOut size={12}/>
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-blue-200 bg-blue-50/50 rounded-xl">
                                    <div className="flex items-start gap-4">
                                        <Monitor className="w-8 h-8 text-blue-600 shrink-0"/>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">MacBook Pro 16" (Current)</h4>
                                            <p className="text-xs text-slate-500 mt-0.5 mb-2">Chrome • Rajasthan, India</p>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Active session
                                            </div>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition-colors">
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (1 span) */}
                    <div className="space-y-6">
                        {/* 2FA Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-600">
                                <ShieldCheck size={24}/>
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Two-Factor Authentication</h3>
                            <p className="text-xs text-slate-500 mb-5 leading-relaxed">Add an extra layer of security to your account by enabling 2FA. We highly recommend turning this on.</p>
                            <button className="w-full py-2 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
                                Enable 2FA
                            </button>
                        </div>

                        {/* Password Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                            <h3 className="font-bold text-slate-900 mb-4">Password</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Last Changed</p>
                                    <p className="text-sm font-medium text-slate-900">3 months ago</p>
                                </div>
                                <button className="w-full py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                                    Change Password
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
