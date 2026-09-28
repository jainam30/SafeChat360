import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { 
    ShieldAlert, Activity, CheckCircle, AlertTriangle, 
    MessageSquare, ImageIcon, Mic, Film, Clock, BarChart3,
    Shield, ArrowRight, ShieldCheck, Database
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ModerationTools() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // UX Role check (Backend should ultimately enforce this)
    const isAuthorized = user?.role === 'admin' || user?.role === 'moderator';

    useEffect(() => {
        if (!isAuthorized) return;
        
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch stats
                const statsRes = await fetch(getApiUrl('/api/analytics/stats'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!statsRes.ok) {
                    if (statsRes.status === 403 || statsRes.status === 401) {
                        throw new Error('Forbidden');
                    }
                    throw new Error('Failed to fetch stats');
                }
                const statsData = await statsRes.json();
                setStats(statsData);

                // Fetch trends
                const trendsRes = await fetch(getApiUrl('/api/analytics/trends?days=7'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (trendsRes.ok) {
                    const trendsData = await trendsRes.json();
                    setTrends(trendsData.trends);
                }
            } catch (err) {
                setError(err.message === 'Forbidden' ? 'You do not have permission to access moderation tools.' : 'Unable to load moderation metrics.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchDashboardData();
        }
    }, [token, isAuthorized]);

    if (!isAuthorized || error === 'You do not have permission to access moderation tools.') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <ShieldAlert size={64} className="text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
                <p className="text-slate-500 max-w-md mb-6">You do not have the required permissions to view the Moderation Console. This area is restricted to administrators and moderators.</p>
                <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50">
                    Return Home
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-cyber-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center text-red-500 font-medium">
                {error}
            </div>
        );
    }

    const maxTrendValue = Math.max(...trends.map(t => t.total), 1);

    return (
        <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                        <ShieldAlert className="text-cyber-primary" size={32} />
                        Moderation Console
                    </h1>
                    <p className="text-slate-500 text-lg">System-wide automated content flagging and review metrics.</p>
                </div>
                <Link to="/moderation/review" className="px-5 py-2.5 bg-cyber-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2 justify-center shadow-sm">
                    <CheckCircle size={20} />
                    Open Review Queue
                </Link>
            </div>

            {/* OVERVIEW CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Scanned</h3>
                        <Database className="text-blue-400" size={20} />
                    </div>
                    <span className="text-3xl font-bold text-slate-900">{stats?.overview?.total_scanned?.toLocaleString() || 0}</span>
                </div>
                
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Flagged Content</h3>
                        <AlertTriangle className="text-red-400" size={20} />
                    </div>
                    <span className="text-3xl font-bold text-red-600">{stats?.overview?.flagged?.toLocaleString() || 0}</span>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Safe Content</h3>
                        <ShieldCheck className="text-green-400" size={20} />
                    </div>
                    <span className="text-3xl font-bold text-green-600">{stats?.overview?.safe?.toLocaleString() || 0}</span>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">System Health</h3>
                        <Activity className={stats?.overview?.system_status === 'Operational' ? 'text-green-400' : 'text-amber-500'} size={20} />
                    </div>
                    <span className={`text-xl font-bold mt-1 ${stats?.overview?.system_status === 'Operational' ? 'text-green-600' : 'text-amber-600'}`}>
                        {stats?.overview?.system_status || 'Unknown'}
                    </span>
                    <span className="text-xs font-medium text-slate-400 mt-1">{stats?.overview?.flag_rate}% flag rate</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 7-DAY TRENDS (BAR CHART) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <BarChart3 size={20} className="text-slate-400" />
                            7-Day Scan Activity
                        </h2>
                    </div>
                    
                    {trends.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                            No data available
                        </div>
                    ) : (
                        <div className="h-64 flex items-end justify-between gap-2 px-2 pb-6 relative">
                            {/* Y-axis lines (decorative) */}
                            <div className="absolute inset-x-0 bottom-6 border-b border-slate-100"></div>
                            <div className="absolute inset-x-0 bottom-[calc(6rem+1.5rem)] border-b border-slate-100"></div>
                            <div className="absolute inset-x-0 top-0 border-b border-slate-100"></div>

                            {trends.map((t, idx) => {
                                const totalHeight = (t.total / maxTrendValue) * 100;
                                const flagRatio = t.total > 0 ? (t.flagged / t.total) * 100 : 0;
                                
                                return (
                                    <div key={idx} className="flex flex-col items-center flex-1 z-10 group relative">
                                        {/* Bar */}
                                        <div 
                                            className="w-full max-w-[2rem] bg-blue-100 rounded-t-sm relative overflow-hidden flex flex-col justify-end"
                                            style={{ height: `${totalHeight}%`, minHeight: t.total > 0 ? '4px' : '0' }}
                                        >
                                            {/* Flagged inner bar */}
                                            <div 
                                                className="w-full bg-red-400"
                                                style={{ height: `${flagRatio}%` }}
                                            ></div>
                                        </div>
                                        {/* Date Label */}
                                        <div className="absolute -bottom-6 text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                            {new Date(t.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                        </div>
                                        {/* Tooltip */}
                                        <div className="absolute -top-12 bg-slate-900 text-white text-xs px-3 py-1.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                            {t.total} total / {t.flagged} flagged
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* DISTRIBUTION BY TYPE */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-slate-400" />
                        Violations by Type
                    </h2>
                    
                    <div className="flex-1 space-y-5">
                        {[
                            { label: 'Text Analysis', count: stats?.by_type?.text || 0, icon: <MessageSquare size={18} />, color: 'bg-blue-500' },
                            { label: 'Image Scanning', count: stats?.by_type?.image || 0, icon: <ImageIcon size={18} />, color: 'bg-purple-500' },
                            { label: 'Video Processing', count: stats?.by_type?.video || 0, icon: <Film size={18} />, color: 'bg-orange-500' },
                            { label: 'Audio Transcription', count: stats?.by_type?.audio || 0, icon: <Mic size={18} />, color: 'bg-green-500' },
                        ].map((item, idx) => {
                            const totalFlags = stats?.overview?.flagged || 1;
                            const percentage = Math.round((item.count / totalFlags) * 100);
                            return (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <span className="text-slate-400">{item.icon}</span>
                                            {item.label}
                                        </div>
                                        <span className="text-sm font-medium text-slate-500">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color}`} style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* ML TESTING SANDBOXES */}
            <div className="mt-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-2">ML Moderation Sandboxes</h2>
                <p className="text-sm text-slate-500 mb-6">Manually test the automated machine learning models used to flag content.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/text" className="p-4 border border-slate-200 rounded-xl hover:border-cyber-primary hover:bg-blue-50 transition-colors group flex flex-col items-center text-center">
                        <MessageSquare className="text-slate-400 group-hover:text-cyber-primary mb-2" size={24} />
                        <h3 className="font-bold text-slate-700 text-sm">Text Analysis</h3>
                    </Link>
                    <Link to="/image" className="p-4 border border-slate-200 rounded-xl hover:border-cyber-primary hover:bg-blue-50 transition-colors group flex flex-col items-center text-center">
                        <ImageIcon className="text-slate-400 group-hover:text-cyber-primary mb-2" size={24} />
                        <h3 className="font-bold text-slate-700 text-sm">Image Scanning</h3>
                    </Link>
                    <Link to="/audio" className="p-4 border border-slate-200 rounded-xl hover:border-cyber-primary hover:bg-blue-50 transition-colors group flex flex-col items-center text-center">
                        <Mic className="text-slate-400 group-hover:text-cyber-primary mb-2" size={24} />
                        <h3 className="font-bold text-slate-700 text-sm">Audio Analysis</h3>
                    </Link>
                    <Link to="/video" className="p-4 border border-slate-200 rounded-xl hover:border-cyber-primary hover:bg-blue-50 transition-colors group flex flex-col items-center text-center">
                        <Film className="text-slate-400 group-hover:text-cyber-primary mb-2" size={24} />
                        <h3 className="font-bold text-slate-700 text-sm">Video Processing</h3>
                    </Link>
                </div>
            </div>
            
            {/* INFORMATIVE DISCLAIMER */}
            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5 flex gap-4 items-start">
                <Shield className="text-slate-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h3 className="font-bold text-slate-700 text-sm">Manual User Reports</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Manual user-submitted reports and manual support tickets are not currently supported by the backend architecture. The statistics above reflect entirely automated Machine Learning classifications. User ban, suspension, and warning interfaces are pending backend database implementations.
                    </p>
                </div>
            </div>

        </div>
    );
}
