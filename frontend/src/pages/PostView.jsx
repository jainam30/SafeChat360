import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { formatTimeForUser, formatDateForUser } from '../utils/dateFormatter';
import { Shield, User, Clock, Heart, MessageCircle, Share2, AlertTriangle, ArrowLeft } from 'lucide-react';

const PostView = () => {
    const { postId } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, user } = useAuth();

    useEffect(() => {
        fetchPost();
    }, [postId, token]);

    const fetchPost = async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(getApiUrl(`/api/social/posts/${postId}`), { headers });

            if (res.ok) {
                const data = await res.json();
                setPost(data);
            } else {
                if (res.status === 403 || res.status === 404) {
                    setError("This content is not available. It might be private or deleted.");
                } else {
                    setError("Failed to load post.");
                }
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (isoString) => {
        // Fallback for user location if not logged in (could use browser locale if needed, but keeping consistent)
        return `${formatDateForUser(isoString, user?.phone_number)} at ${formatTimeForUser(isoString, user?.phone_number)}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-8 glass-card text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <Shield size={32} />
                </div>
                <h2 className="text-xl font-bold text-cyber-text mb-2">Access Denied</h2>
                <p className="text-cyber-muted mb-6">{error}</p>
                <Link to="/" className="text-cyber-primary hover:underline font-medium">Go back home</Link>
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="max-w-3xl mx-auto pb-10 pt-6 px-4">
            <Link to="/social" className="inline-flex items-center gap-2 text-cyber-muted hover:text-cyber-primary mb-6 transition-colors">
                <ArrowLeft size={18} /> Back to Feed
            </Link>

            <div className={`glass-card p-6 relative group bg-white/70 shadow-lg ${post.is_flagged ? 'border-red-500/30 bg-red-50/50' : ''}`}>
                {post.is_flagged && (
                    <div className="absolute top-4 right-4 text-red-500 flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                        <AlertTriangle size={14} />
                        FLAGGED: {post.flag_reason}
                    </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-primary to-purple-500 flex items-center justify-center text-white font-bold shadow-sm text-lg">
                            {(post.username || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-cyber-text font-bold text-lg">{post.username || "Unknown"}</div>
                            <div className="text-cyber-muted text-xs flex items-center gap-1">
                                <Clock size={12} />
                                {formatDate(post.created_at)}
                                <span className="mx-1">•</span>
                                {post.privacy === 'public' && <Share2 size={12} title="Public" />}
                                {post.privacy === 'friends' && <User size={12} title="Friends Only" />}
                                {post.privacy === 'private' && <Shield size={12} title="Private" />}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`space-y-4 ${post.is_flagged ? 'blur-[2px] opacity-50 hover:blur-none hover:opacity-100 transition-all' : ''}`}>
                    {post.content && (
                        <div className="text-cyber-text whitespace-pre-wrap leading-relaxed text-lg">{post.content}</div>
                    )}

                    {post.media_url && (
                        <div className="rounded-xl overflow-hidden border border-cyber-border bg-black/5 shadow-inner">
                            {post.media_type === 'video' ? (
                                <video src={post.media_url} controls className="w-full max-h-[600px] object-contain" />
                            ) : (
                                <img src={post.media_url} alt="Post content" className="w-full max-h-[600px] object-contain" />
                            )}
                        </div>
                    )}
                </div>

                {post.is_flagged && (
                    <p className="text-xs text-red-500 mt-2 italic font-medium">*Content hidden due to community guidelines. Hover to view.*</p>
                )}

                <div className="mt-6 pt-6 border-t border-cyber-border flex items-center gap-6">
                    <button className="flex items-center gap-2 text-cyber-muted hover:text-red-500 transition-colors text-sm font-medium">
                        <Heart size={20} /> Like
                    </button>
                    <button className="flex items-center gap-2 text-cyber-muted hover:text-blue-500 transition-colors text-sm font-medium">
                        <MessageCircle size={20} /> Comment
                    </button>
                    <button className="flex items-center gap-2 text-cyber-muted hover:text-green-500 transition-colors text-sm font-medium ml-auto">
                        <Share2 size={20} /> Share
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostView;
