import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    ShieldCheck, Lock, Smartphone, Monitor, Globe, CheckCircle2, 
    LogOut, AlertCircle, RefreshCw, KeyRound, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import toast from 'react-hot-toast';

export default function Security() {
    const { token, user } = useAuth();
    const [devices, setDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [revokingId, setRevokingId] = useState(null);
    
    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [updatingPassword, setUpdatingPassword] = useState(false);

    const fetchDevices = async () => {
        if (!token) return;
        setLoadingDevices(true);
        try {
            const res = await axios.get(getApiUrl('/api/security/devices'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(res.data)) {
                setDevices(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch devices:", err);
        } finally {
            setLoadingDevices(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, [token]);

    const handleRevokeDevice = async (deviceId) => {
        if (!token) return;
        setRevokingId(deviceId);
        try {
            await axios.post(getApiUrl(`/api/security/devices/${deviceId}/revoke`), {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Device revoked successfully");
            setDevices(prev => prev.filter(d => d.device_id !== deviceId));
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to revoke device");
        } finally {
            setRevokingId(null);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        setUpdatingPassword(true);
        try {
            await axios.put(getApiUrl('/api/users/me/password'), {
                old_password: oldPassword,
                new_password: newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Password updated successfully!");
            setShowPasswordModal(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to update password");
        } finally {
            setUpdatingPassword(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 overflow-y-auto text-slate-900 p-6 md:p-8">
            <div className="max-w-4xl w-full mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex items-start gap-4 mb-8 border-b border-slate-200 pb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Security & Privacy</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">Manage encryption status, active device sessions, and account credentials.</p>
                    </div>
                </div>

                {/* Encryption Banner */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-sm overflow-hidden p-6 text-white relative">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <Lock size={20} className="text-white"/>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Double Ratchet End-to-End Encryption</h3>
                                <p className="text-sm text-emerald-50/90 max-w-md">
                                    Your 1-on-1 private messages and voice/video sessions are secured with cryptographic key exchange. Only you and the intended recipient can decrypt the content.
                                </p>
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full font-bold text-sm">
                            <CheckCircle2 size={16}/> Active & Verified
                        </div>
                    </div>
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column (2 spans) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Active Sessions */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="font-bold text-slate-900">Active Devices & Sessions</h3>
                                    <p className="text-xs text-slate-500">Authorized devices associated with your account.</p>
                                </div>
                                <button 
                                    onClick={fetchDevices} 
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Refresh devices"
                                >
                                    <RefreshCw size={16} className={loadingDevices ? "animate-spin text-blue-600" : ""} />
                                </button>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {loadingDevices ? (
                                    <div className="p-8 text-center text-slate-400 text-xs">
                                        Loading active devices...
                                    </div>
                                ) : devices.length > 0 ? (
                                    devices.map((device, idx) => (
                                        <div key={device.device_id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                                                    <Monitor size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 truncate max-w-xs">
                                                        Device: {device.device_id?.slice(0, 16)}...
                                                    </h4>
                                                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                                        Last active: {device.last_active ? new Date(device.last_active).toLocaleString() : 'Recently'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {device.is_active ? (
                                                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-200">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                                                        Revoked
                                                    </span>
                                                )}
                                                {device.is_active && (
                                                    <button 
                                                        disabled={revokingId === device.device_id}
                                                        onClick={() => handleRevokeDevice(device.device_id)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 disabled:opacity-50"
                                                    >
                                                        {revokingId === device.device_id ? "Revoking..." : "Revoke"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400">
                                        <Monitor className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                                        <p className="text-xs font-medium">Current session active</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">No additional remote devices registered</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Security Guidelines */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                            <h3 className="font-bold text-slate-900 text-sm mb-2">Account Protection Tips</h3>
                            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                                <li>Always sign out when using a public or shared computer.</li>
                                <li>Use a unique, complex password not reused on other platforms.</li>
                                <li>Review authorized devices periodically and revoke any sessions you don't recognize.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column (1 span) */}
                    <div className="space-y-6">
                        {/* Password Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <KeyRound className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-slate-900">Password</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-4">
                                Update your password regularly to keep your private messages and account safe.
                            </p>
                            <button 
                                onClick={() => setShowPasswordModal(true)}
                                className="w-full py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                Change Password
                            </button>
                        </div>

                        {/* Identity & Account Info */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                            <h3 className="font-bold text-slate-900 mb-3 text-sm">Security Profile</h3>
                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium">Username:</span>
                                    <p className="font-bold text-slate-800">@{user?.username || 'user'}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium">Email Address:</span>
                                    <p className="font-bold text-slate-800">{user?.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium">Role:</span>
                                    <p className="font-bold text-slate-800 capitalize">{user?.role || 'User'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Change Account Password</h3>
                        <p className="text-xs text-slate-500 mb-5">Enter your current password and your new password.</p>
                        
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">New Password (min 6 characters)</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingPassword}
                                    className="px-5 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {updatingPassword ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

