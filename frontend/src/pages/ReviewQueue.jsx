import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { CheckCircle, XCircle, AlertTriangle, MessageSquare, Image as ImageIcon, Mic, Film } from 'lucide-react';

const ReviewQueue = () => {
    const { token } = useAuth();
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        try {
            const res = await fetch(getApiUrl('/api/review/queue'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQueue(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, [token]);

    const handleAction = async (id, action) => {
        try {
            const res = await fetch(getApiUrl(`/api/review/${id}/resolve`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: action }) // "dismiss" or "confirm"
            });
            if (res.ok) {
                // Remove from local list
                setQueue(queue.filter(item => item.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getTypeIcon = (type) => {
        if (type === 'text') return <MessageSquare size={16} />;
        if (type === 'image') return <ImageIcon size={16} />;
        if (type === 'audio') return <Mic size={16} />;
        if (type.startsWith('video')) return <Film size={16} />;
        return <AlertTriangle size={16} />;
    };

    if (loading) return <div className="p-8 text-center text-cyber-muted">Loading queue...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 drop-shadow-md">
                    <AlertTriangle className="text-white" />
                    Review Queue
                </h1>
                <p className="text-white/80 font-medium">Manual verification of flagged content.</p>
            </div>

            {queue.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-12 text-center">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">All Caught Up!</h3>
                    <p className="text-slate-600">No pending items in the review queue.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {queue.map(item => (
                        <div key={item.id} className="bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start transition-all hover:scale-[1.01]">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wide">
                                        {getTypeIcon(item.content_type)}
                                        {item.content_type}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                        ID: {item.id} • {new Date(item.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                                    {item.content_excerpt}
                                </div>
                                <div className="text-xs font-bold text-red-500 flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    Flagged by System
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-3 min-w-[150px]">
                                <button
                                    onClick={() => handleAction(item.id, 'dismiss')}
                                    className="px-4 py-2 bg-green-500/10 hover:bg-green-500 text-green-600 hover:text-white border border-green-500/20 rounded-xl flex items-center gap-2 justify-center transition-all font-bold shadow-sm"
                                >
                                    <CheckCircle size={16} />
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => handleAction(item.id, 'confirm')}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-500/20 rounded-xl flex items-center gap-2 justify-center transition-all font-bold shadow-sm"
                                >
                                    <XCircle size={16} />
                                    Confirm
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewQueue;
