import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Shield, Send, AlertTriangle, User, Clock, Camera } from 'lucide-react';

const SocialFeed = () => {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState('');
    const [mediaType, setMediaType] = useState(''); // 'image' or 'video'

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { token, user } = useAuth();
    const fileInputRef = React.useRef(null);

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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Simple validation
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("File is too large (max 2MB)");
            return;
        }

        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
        if (!type) {
            alert("Only images and videos are supported");
            return;
        }

        setMediaFile(file);
        setMediaType(type);

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setMediaPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handlePost = async () => {
        if (!newPost.trim() && !mediaFile) return;
        setSubmitting(true);

        try {
            // Prepare payload
            const payload = {
                content: newPost,
                media_url: mediaPreview, // Sending base64 directly for prototype
                media_type: mediaType
            };

            const res = await fetch(getApiUrl('/api/social/posts'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setNewPost('');
                setMediaFile(null);
                setMediaPreview('');
                setMediaType('');
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
                <p className="text-cyber-muted">Post updates, photos, and videos.</p>
            </div>

            {/* Create Post */}
            <div className="glass-panel p-6 rounded-2xl mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Create New Post</h2>
                <div className="relative space-y-4">
                    <textarea
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all resize-none"
                        rows={3}
                        placeholder="What's on your mind?"
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                    />

                    {mediaPreview && (
                        <div className="relative w-fit">
                            {mediaType === 'image' ? (
                                <img src={mediaPreview} alt="Preview" className="h-32 rounded-lg border border-white/10" />
                            ) : (
                                <video src={mediaPreview} className="h-32 rounded-lg border border-white/10" controls />
                            )}
                            <button
                                onClick={() => { setMediaFile(null); setMediaPreview(''); }}
                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
                            >
                                <AlertTriangle size={12} />
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-3">
                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                            />
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="text-cyber-primary hover:text-cyber-secondary text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <Camera size={18} /> Add Photo/Video
                            </button>
                        </div>

                        <button
                            onClick={handlePost}
                            disabled={submitting || (!newPost.trim() && !mediaFile)}
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
                            <Link to={`/profile/${post.user_id}`} className="flex items-center gap-3 group/author">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-primary to-purple-600 flex items-center justify-center text-white font-bold group-hover/author:scale-105 transition-transform">
                                    {(post.username || "U").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-white font-medium group-hover/author:text-cyber-primary transition-colors">{post.username || "Unknown"}</div>
                                    <div className="text-cyber-muted text-xs flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatDate(post.created_at)}
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className={`space-y-4 ${post.is_flagged ? 'blur-[2px] hover:blur-none transition-all cursor-pointer' : ''}`}>
                            {post.content && (
                                <div className="text-gray-200 whitespace-pre-wrap">{post.content}</div>
                            )}

                            {post.media_url && (
                                <div className="rounded-xl overflow-hidden border border-white/5 bg-black/20">
                                    {post.media_type === 'video' ? (
                                        <video src={post.media_url} controls className="w-full max-h-[500px] object-contain" />
                                    ) : (
                                        <img src={post.media_url} alt="Post content" className="w-full max-h-[500px] object-contain" />
                                    )}
                                </div>
                            )}
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
