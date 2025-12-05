import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Shield, Send, AlertTriangle, User, Clock } from 'lucide-react';

const SocialFeed = () => {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { token, user } = useAuth();

    useEffect(() => {
        fetchPosts();
    }, [token]);

    const fetchPosts = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/social/posts'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async () => {
        if (!newPost.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(getApiUrl('/api/social/posts'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: newPost })
            });
            if (res.ok) {
                setNewPost('');
                fetchPosts(); // Refresh feed
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleString();
    };

    return (
        <div className="max-w-3xl mx-auto pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <User className="text-cyber-primary" />
                    Social Feed
                </h1>
                <p className="text-cyber-muted">Post updates and see real-time moderation in action.</p>
            </div>

            {/* Create Post */}
            <div className="glass-panel p-6 rounded-2xl mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Create New Post</h2>
                <div className="relative">
                    <textarea
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all resize-none"
                        rows={3}
                        placeholder="What's on your mind?"
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                    />
                    <div className="flex justify-end mt-3">
                        <button
                            onClick={handlePost}
                            disabled={submitting || !newPost.trim()}
                            className="glass-button-primary disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting ? (
                                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                            ) : (
                                <Send size={18} />
                            )}
                            Post
                        </button>
                    </div>
                </div>
            </div>

            {/* Feed */}
            <div className="space-y-6">
                {posts.map(post => (
                    <div key={post.id} className={`glass-card p-6 relative group ${post.is_flagged ? 'border-red-500/30' : ''}`}>
                        {post.is_flagged && (
                            <div className="absolute top-4 right-4 text-red-400 flex items-center gap-2 bg-red-900/20 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">
                                <AlertTriangle size={14} />
                                FLAGGED: {post.flag_reason}
                            </div>
                        )}

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-primary to-purple-600 flex items-center justify-center text-white font-bold">
                                {post.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-white font-medium">{post.username}</div>
                                <div className="text-cyber-muted text-xs flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatDate(post.created_at)}
                                </div>
                            </div>
                        </div>

                        <div className={`text-gray-200 whitespace-pre-wrap ${post.is_flagged ? 'blur-[2px] hover:blur-none transition-all cursor-pointer' : ''}`}>
                            {post.content}
                        </div>

                        {post.is_flagged && (
                            <p className="text-xs text-red-400 mt-2 italic">*Content hidden due to community guidelines. Hover to view.*</p>
                        )}
                    </div>
                ))}

                {posts.length === 0 && !loading && (
                    <div className="text-center text-cyber-muted py-10">
                        No posts yet. Be the first to share something!
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialFeed;
