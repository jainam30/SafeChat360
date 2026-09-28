import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import toast from 'react-hot-toast';
import { 
    CheckCircle, XCircle, AlertTriangle, MessageSquare, 
    Image as ImageIcon, Mic, Film, Clock, ShieldAlert,
    Check, ArrowLeft, MoreHorizontal, User, ShieldCheck
} from 'lucide-react';

export default function ReviewQueue() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // UX Role check (Backend should ultimately enforce this)
    const isAuthorized = user?.role === 'admin' || user?.role === 'moderator';

    useEffect(() => {
        if (!isAuthorized) return;

        const fetchQueue = async () => {
            setLoading(true);
            try {
                const res = await fetch(getApiUrl('/api/review/queue'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) {
                    if (res.status === 403 || res.status === 401) throw new Error('Forbidden');
                    throw new Error('Failed to load review queue');
                }
                
                const data = await res.json();
                setQueue(data);
            } catch (err) {
                setError(err.message === 'Forbidden' ? 'You do not have permission to access the review queue.' : 'Unable to connect to the moderation service.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchQueue();
        }
    }, [token, isAuthorized]);

    const handleAction = async (id, action) => {
        setActionLoading(id);
        try {
            const res = await fetch(getApiUrl(`/api/review/${id}/resolve`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: action })
            });

            if (res.ok) {
                setQueue(queue.filter(item => item.id !== id));
                toast.success(action === 'dismiss' ? 'Content marked as safe' : 'Violation confirmed');
            } else {
                toast.error('Failed to resolve moderation item');
            }
        } catch (err) {
            toast.error('Network error. Unable to process action.');
        } finally {
            setActionLoading(null);
        }
    };

    const getTypeIcon = (type) => {
        if (type === 'text') return <MessageSquare size={16} />;
        if (type === 'image') return <ImageIcon size={16} />;
        if (type === 'audio') return <Mic size={16} />;
        if (type.startsWith('video')) return <Film size={16} />;
        return <AlertTriangle size={16} />;
    };

    if (!isAuthorized || error === 'You do not have permission to access the review queue.') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <ShieldAlert size={64} className="text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
                <p className="text-slate-500 max-w-md mb-6">You do not have the required permissions to view the Review Queue. This area is restricted to administrators and moderators.</p>
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

    return (
        <div className="max-w-5xl mx-auto pb-12 px-4 md:px-0">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <Link to="/moderation" className="text-sm font-bold text-slate-400 hover:text-cyber-primary mb-3 inline-flex items-center gap-1 transition-colors">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                        <AlertTriangle className="text-amber-500" size={32} />
                        Review Queue
                    </h1>
                    <p className="text-slate-500 text-lg">Verify content flagged by the automated Machine Learning systems.</p>
                </div>
                <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    {queue.length} Pending
                </div>
            </div>

            {queue.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-16 text-center shadow-sm">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Queue Empty</h3>
                    <p className="text-slate-500 text-lg max-w-md mx-auto">There are no pending items requiring manual review. The automated systems are handling everything beautifully.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {queue.map(item => (
                        <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row gap-6 items-start shadow-sm hover:border-slate-300 transition-colors">
                            
                            {/* ITEM DETAILS */}
                            <div className="flex-1 min-w-0 w-full space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
                                        {getTypeIcon(item.content_type)}
                                        {item.content_type}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                        <Clock size={14} />
                                        {new Date(item.created_at).toLocaleString()}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">
                                        ID: {item.id}
                                    </span>
                                </div>
                                
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                                    {item.content_excerpt || <span className="text-slate-400 italic">No text content attached</span>}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 text-red-500 font-bold bg-red-50 px-3 py-1 rounded-md border border-red-100">
                                        <AlertTriangle size={14} />
                                        System Flag
                                    </div>
                                    {item.source && (
                                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                            <User size={14} className="text-slate-400" />
                                            Source: {item.source}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex flex-row md:flex-col gap-3 w-full md:w-40 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                <button
                                    onClick={() => handleAction(item.id, 'dismiss')}
                                    disabled={actionLoading === item.id}
                                    className="flex-1 md:flex-none px-4 py-2.5 bg-white border-2 border-green-200 hover:border-green-500 text-green-600 hover:bg-green-50 rounded-xl flex items-center justify-center gap-2 transition-all font-bold disabled:opacity-50"
                                >
                                    <CheckCircle size={18} />
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => handleAction(item.id, 'confirm')}
                                    disabled={actionLoading === item.id}
                                    className="flex-1 md:flex-none px-4 py-2.5 bg-red-50 hover:bg-red-500 border border-red-100 text-red-600 hover:text-white rounded-xl flex items-center justify-center gap-2 transition-all font-bold disabled:opacity-50"
                                >
                                    <XCircle size={18} />
                                    Confirm
                                </button>
                                {actionLoading === item.id && (
                                    <span className="text-xs text-slate-400 text-center animate-pulse">Processing...</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* INFORMATIVE DISCLAIMER */}
            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5 flex gap-4 items-start">
                <ShieldCheck className="text-slate-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h3 className="font-bold text-slate-700 text-sm">E2EE Privacy Guarantee</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        SafeChat360 respects End-to-End Encryption. Only content actively flagged by the client or unencrypted public posts/groups are routed to this review queue. Private encrypted message payloads are never exposed to moderators.
                    </p>
                </div>
            </div>

        </div>
    );
}
