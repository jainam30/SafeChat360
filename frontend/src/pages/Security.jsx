import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import toast from 'react-hot-toast';
import { 
    ShieldCheck, KeyRound, Smartphone, LockKeyhole, Eye, 
    AlertTriangle, Server, LogOut, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';

export default function Security() {
    const { user, token } = useAuth();
    const [devices, setDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(false);
    
    // Password state
    const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' });
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    useEffect(() => {
        if (token) fetchDevices();
    }, [token]);

    const fetchDevices = async () => {
        setLoadingDevices(true);
        try {
            const res = await fetch(getApiUrl('/api/security/devices'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDevices(data || []);
            }
        } catch (e) {
            console.error("Failed to fetch devices", e);
        } finally {
            setLoadingDevices(false);
        }
    };

    const handleRevokeDevice = async (deviceId) => {
        if (!confirm("Are you sure you want to sign out this device?")) return;
        try {
            const res = await fetch(getApiUrl(`/api/security/devices/${deviceId}/revoke`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Device revoked successfully');
                fetchDevices();
            } else {
                toast.error('Failed to revoke device');
            }
        } catch (e) {
            toast.error('Failed to revoke device');
            console.error(e);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!passwordForm.old_password || !passwordForm.new_password) {
            toast.error("Please fill in all password fields");
            return;
        }
        setIsSubmittingPassword(true);
        try {
            const res = await fetch(getApiUrl('/api/users/me/password'), {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(passwordForm)
            });
            if (res.ok) {
                toast.success('Password updated successfully');
                setPasswordForm({ old_password: '', new_password: '' });
            } else {
                const data = await res.json();
                toast.error(data.detail || 'Failed to update password');
            }
        } catch (e) {
            toast.error('Error updating password');
            console.error(e);
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12 px-4 md:px-0">
            {/* HEADER */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <ShieldCheck className="text-cyber-primary" size={32} />
                    Security & Privacy
                </h1>
                <p className="text-slate-500 text-lg">Manage your account security, privacy controls, messaging protection, sessions, and data.</p>
            </div>

            {/* SECURITY OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <LockKeyhole className="text-green-500" size={20} />
                        <h3 className="font-bold text-slate-900">Account Security</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">Your account is currently protected by standard authentication.</p>
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        <CheckCircle2 size={14} /> Protected
                    </div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="text-cyber-primary" size={20} />
                        <h3 className="font-bold text-slate-900">Messaging Security</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">End-to-end encryption available for supported private conversations.</p>
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                        <Server size={14} /> E2EE Active
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Smartphone className="text-indigo-500" size={20} />
                        <h3 className="font-bold text-slate-900">Active Sessions</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">Manage devices currently connected to your SafeChat360 account.</p>
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                        <Activity size={14} /> {devices.length} Devices
                    </div>
                </div>
            </div>

            <div className="space-y-10">
                
                {/* ACCOUNT SECURITY */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
                        <KeyRound className="text-slate-400" /> Account Security
                    </h2>
                    
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        {/* Password Change Form */}
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-1">Change Password</h3>
                            <p className="text-sm text-slate-500 mb-4">Ensure your account uses a long, random password to stay secure.</p>
                            
                            <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                                    <input 
                                        type="password" 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all"
                                        value={passwordForm.old_password}
                                        onChange={e => setPasswordForm({...passwordForm, old_password: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                    <input 
                                        type="password" 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all"
                                        value={passwordForm.new_password}
                                        onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})}
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isSubmittingPassword}
                                    className="px-5 py-2.5 bg-cyber-primary text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                                >
                                    {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                        
                        {/* 2FA - Unsupported State */}
                        <div className="p-6 bg-slate-50 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">Two-Factor Authentication</h3>
                                <p className="text-sm text-slate-500">Additional account protection is not currently available on the server.</p>
                            </div>
                            <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">Unavailable</span>
                        </div>
                    </div>
                </section>

                {/* SESSIONS & DEVICES */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
                        <Smartphone className="text-slate-400" /> Sessions & Devices
                    </h2>
                    
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <p className="text-sm text-slate-500">These devices are currently logged into your account. Revoke any devices you don't recognize.</p>
                        </div>
                        
                        {loadingDevices ? (
                            <div className="p-6 text-center text-slate-400">Loading sessions...</div>
                        ) : devices.length === 0 ? (
                            <div className="p-6 text-center text-slate-500">No active sessions found.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {devices.map(device => (
                                    <div key={device.device_id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shrink-0">
                                                <Smartphone size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">Device ID: <span className="font-mono text-xs ml-1 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">{device.device_id.substring(0, 8)}...</span></h4>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Last active: {new Date(device.last_active).toLocaleString()}
                                                </p>
                                                {device.is_active && (
                                                    <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-bold text-green-600 bg-green-50 px-2 rounded-full border border-green-100">Active</span>
                                                )}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRevokeDevice(device.device_id)}
                                            className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto shrink-0"
                                        >
                                            <LogOut size={16} /> Revoke
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* MESSAGING SECURITY */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
                        <LockKeyhole className="text-slate-400" /> Messaging Security
                    </h2>
                    
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6">
                        <h3 className="font-bold text-slate-900 mb-1">End-to-End Encryption</h3>
                        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                            Messages in supported private conversations use the application's existing encryption protocol. 
                            Keys are negotiated via X3DH and rotated using the Double Ratchet protocol natively.
                        </p>
                        
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                            <h4 className="font-bold text-slate-700 text-sm mb-1">Key Verification</h4>
                            <p className="text-xs text-slate-500 mb-3">Identity and pre-keys are automatically synchronized by the backend PKI infrastructure for trusted devices.</p>
                            <button className="text-sm font-semibold text-cyber-primary flex items-center gap-1 hover:underline disabled:opacity-50" disabled title="Integrated into chat UI automatically">
                                Verify a contact <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* PRIVACY CONTROLS */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
                        <Eye className="text-slate-400" /> Privacy Controls
                    </h2>
                    
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
                        <div className="p-6 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">Profile Visibility</h3>
                                <p className="text-sm text-slate-500">Determine who can see your SafeChat360 profile information.</p>
                            </div>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded border border-slate-200">Public by default</span>
                        </div>
                        <div className="p-6 flex items-start justify-between gap-4 bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">Last Seen & Online Status</h3>
                                <p className="text-sm text-slate-500">Granular privacy toggles are not currently supported by the backend.</p>
                            </div>
                            <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">Unavailable</span>
                        </div>
                    </div>
                </section>

                {/* DANGER ZONE */}
                <section>
                    <h2 className="text-xl font-bold text-red-600 mb-4 pb-2 border-b border-red-200 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" /> Danger Zone
                    </h2>
                    
                    <div className="bg-red-50 border border-red-100 rounded-xl shadow-sm overflow-hidden p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-red-900 mb-1">Delete Account</h3>
                                <p className="text-sm text-red-700 max-w-xl">
                                    Permanently remove your account, messages, and social posts. This action cannot be undone.
                                </p>
                            </div>
                            <button 
                                className="px-5 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-lg cursor-not-allowed opacity-70 shrink-0"
                                disabled
                                title="Not supported by current backend"
                            >
                                Contact Support
                            </button>
                        </div>
                        <p className="text-xs text-red-600/70 mt-3">Account deletion is currently managed by administrators. API support for self-deletion is pending.</p>
                    </div>
                </section>

            </div>
        </div>
    );
}
