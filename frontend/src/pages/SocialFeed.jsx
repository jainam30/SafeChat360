import React, { useState, useEffect } from 'react';
import { formatTimeForUser, formatDateForUser } from '../utils/dateFormatter';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Shield, Send, AlertTriangle, User, Clock, Camera, Heart, MessageCircle, Share2, MoreHorizontal, Users, Check, Edit2, Trash2, Copy, Link as LinkIcon } from 'lucide-react';

const SocialFeed = () => {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState('');
    const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
    const [privacy, setPrivacy] = useState('public');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [showUserSelector, setShowUserSelector] = useState(false);

    // Actions State
    const [editingPost, setEditingPost] = useState(null); // Post being edited
    const [editContent, setEditContent] = useState('');
    const [editMediaFile, setEditMediaFile] = useState(null);
    const [editMediaPreview, setEditMediaPreview] = useState('');
    const [editMediaType, setEditMediaType] = useState('');
    const [isFullEdit, setIsFullEdit] = useState(false);
    const [activeMenuPostId, setActiveMenuPostId] = useState(null); // Which post has menu open

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { token, user } = useAuth();
    const fileInputRef = React.useRef(null);
    const editFileInputRef = React.useRef(null);

    useEffect(() => {
        fetchPosts();
        fetchFriends();
    }, [token]);

    // ... existing fetch functions ...

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

    const fetchFriends = async () => {
        if (!token) return;
        try {
            const res = await fetch(getApiUrl('/api/friends/'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFriends(data);
            }
        } catch (err) {
            console.error("Failed to fetch friends", err);
        }
    };

    const handleFileChange = (e) => {
        // ... existing logic ...
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert("File is too large (max 2MB)"); return; }
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
        if (!type) { alert("Only images and videos are supported"); return; }
        setMediaFile(file);
        setMediaType(type);
        const reader = new FileReader();
        reader.onloadend = () => { setMediaPreview(reader.result); };
        reader.readAsDataURL(file);
    };

    const handleEditFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert("File is too large (max 2MB)"); return; }
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
        if (!type) { alert("Only images and videos are supported"); return; }
        setEditMediaFile(file);
        setEditMediaType(type);
        const reader = new FileReader();
        reader.onloadend = () => { setEditMediaPreview(reader.result); };
        reader.readAsDataURL(file);
    };

    const handlePost = async () => {
        // ... existing logic ...
        if (!newPost.trim() && !mediaFile) return;
        if (privacy === 'private' && selectedUsers.length === 0) { alert("Please select at least one friend for private post."); return; }
        setSubmitting(true);
        try {
            const payload = {
                content: newPost,
                media_url: mediaPreview,
                media_type: mediaType,
                privacy: privacy,
                allowed_users: privacy === 'private' ? selectedUsers : []
            };
            const res = await fetch(getApiUrl('/api/social/posts'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setNewPost(''); setMediaFile(null); setMediaPreview(''); setMediaType(''); setPrivacy('public'); setSelectedUsers([]);
                fetchPosts();
            }
        } catch (err) { console.error(err); } finally { setSubmitting(false); }
    };

    // Action Handlers
    const deletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            const res = await fetch(getApiUrl(`/api/social/posts/${postId}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPosts(posts.filter(p => p.id !== postId));
                setActiveMenuPostId(null);
            } else {
                alert("Failed to delete post");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const initiateEdit = (post) => {
        // Check time diff for full edit (5 mins)
        // Parse UTC timestamp. Append 'Z' if missing to ensure it parses as UTC
        const createdDate = new Date(post.created_at.endsWith('Z') ? post.created_at : post.created_at + 'Z');
        const now = new Date();
        const diffInMinutes = (now - createdDate) / 1000 / 60;

        setIsFullEdit(diffInMinutes < 5);
        setEditingPost(post);
        setEditContent(post.content);
        setEditMediaPreview(post.media_url);
        setEditMediaType(post.media_type);
        setActiveMenuPostId(null);
    };

    const saveEdit = async () => {
        if (!editingPost) return;
        setSubmitting(true);
        try {
            const payload = {
                content: editContent,
                // Only send media updates if fully editing and changed
                ...(isFullEdit && editMediaPreview !== editingPost.media_url ? {
                    media_url: editMediaPreview,
                    media_type: editMediaType
                } : {})
            };

            const res = await fetch(getApiUrl(`/api/social/posts/${editingPost.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setEditingPost(null);
                setEditMediaFile(null);
                fetchPosts();
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to update post");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const sharePost = (postId) => {
        const url = `${window.location.origin}/post/${postId}`;
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
        setActiveMenuPostId(null);
    };

    const formatDate = (isoString) => {
        return `${formatDateForUser(isoString, user?.phone_number)} at ${formatTimeForUser(isoString, user?.phone_number)}`;
    };

    const toggleUserSelection = (userId) => {
        if (selectedUsers.includes(userId)) { setSelectedUsers(selectedUsers.filter(id => id !== userId)); }
        else { setSelectedUsers([...selectedUsers, userId]); }
    };

    return (
        <div className="max-w-3xl mx-auto pb-10 relative">
            {/* Edit Modal */}
            {editingPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-cyber-text">Edit Post</h3>
                            <button onClick={() => setEditingPost(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            {!isFullEdit && (
                                <div className="bg-yellow-50 text-yellow-700 text-sm p-3 rounded-lg flex items-center gap-2">
                                    <Clock size={16} />
                                    Edit window expired. You can only edit the text.
                                </div>
                            )}

                            <textarea
                                className="w-full bg-slate-50 border border-cyber-border rounded-xl p-4 focus:outline-none focus:border-cyber-primary resize-none"
                                rows={4}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                            />

                            {/* Media Section - Only if Full Edit or just viewing current media */}
                            {(editMediaPreview || isFullEdit) && (
                                <div className="relative">
                                    {editMediaPreview && (
                                        <div className="relative rounded-lg overflow-hidden border border-cyber-border bg-black/5">
                                            {editMediaType === 'video' ?
                                                <video src={editMediaPreview} className="w-full h-48 object-contain" controls /> :
                                                <img src={editMediaPreview} className="w-full h-48 object-contain" alt="preview" />
                                            }
                                            {isFullEdit && (
                                                <button
                                                    onClick={() => { setEditMediaPreview(''); setEditMediaFile(null); }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {isFullEdit && !editMediaPreview && (
                                        <div
                                            onClick={() => editFileInputRef.current.click()}
                                            className="border-2 border-dashed border-cyber-border rounded-lg p-8 flex flex-col items-center justify-center text-cyber-muted hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <Camera size={24} className="mb-2" />
                                            <span className="text-sm">Add Photo or Video</span>
                                        </div>
                                    )}
                                    <input type="file" ref={editFileInputRef} className="hidden" accept="image/*,video/*" onChange={handleEditFileChange} />
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-slate-50">
                            <button onClick={() => setEditingPost(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                            <button
                                onClick={saveEdit}
                                disabled={submitting}
                                className="px-4 py-2 bg-cyber-primary text-white font-medium rounded-lg hover:bg-cyber-primary_hover transition-colors shadow-lg shadow-indigo-200"
                            >
                                {submitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-cyber-text mb-2 flex items-center gap-3">
                    <User className="text-cyber-primary" />
                    Social Feed
                </h1>
                <p className="text-cyber-muted">Post updates, photos, and videos.</p>
            </div>

            {/* Create Post */}
            <div className="glass-card p-6 rounded-2xl mb-8 shadow-xl bg-white/80">
                <h2 className="text-lg font-bold text-cyber-text mb-4">Create New Post</h2>
                {/* ... existing Create Post UI ... */}
                <div className="relative space-y-4">
                    <textarea
                        className="w-full bg-slate-50/50 backdrop-blur-sm border border-cyber-border rounded-xl p-4 text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/20 transition-all resize-none shadow-inner"
                        rows={3}
                        placeholder="What's on your mind?"
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                    />

                    {mediaPreview && (
                        <div className="relative w-fit">
                            {mediaType === 'image' ? (
                                <img src={mediaPreview} alt="Preview" className="h-32 rounded-lg border border-cyber-border shadow-md" />
                            ) : (
                                <video src={mediaPreview} className="h-32 rounded-lg border border-cyber-border shadow-md" controls />
                            )}
                            <button
                                onClick={() => { setMediaFile(null); setMediaPreview(''); }}
                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 shadow-md"
                            >
                                <AlertTriangle size={12} />
                            </button>
                        </div>
                    )}

                    {/* Privacy Selector */}
                    {/* ... existing Privacy Selector ... */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                            {['public', 'friends', 'private'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setPrivacy(type)}
                                    className={`capitalize px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${privacy === type ? 'bg-white text-cyber-primary shadow-sm' : 'text-cyber-muted hover:text-cyber-text'}`}
                                >
                                    {type === 'public' && <Share2 size={16} />}
                                    {type === 'friends' && <User size={16} />}
                                    {type === 'private' && <Shield size={16} />}
                                    {type}
                                </button>
                            ))}
                        </div>

                        {privacy === 'private' && (
                            <div className="flex-1 min-w-[200px]">
                                <button
                                    onClick={() => setShowUserSelector(!showUserSelector)}
                                    className="w-full text-left px-4 py-2 bg-white border border-cyber-border rounded-lg text-sm flex justify-between items-center hover:bg-slate-50 transition-colors"
                                >
                                    <span className="truncate">
                                        {selectedUsers.length === 0 ? "Select Friends..." : `${selectedUsers.length} friends selected`}
                                    </span>
                                    <Users size={16} className="text-cyber-muted" />
                                </button>

                                {showUserSelector && (
                                    <div className="absolute z-10 mt-2 w-full max-w-sm bg-white border border-cyber-border rounded-xl shadow-xl p-2 max-h-60 overflow-y-auto">
                                        {friends.length === 0 ? (
                                            <p className="text-center text-cyber-muted text-sm py-2">No friends found.</p>
                                        ) : (
                                            friends.map(friend => (
                                                <div
                                                    key={friend.id}
                                                    onClick={() => toggleUserSelection(friend.id)}
                                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedUsers.includes(friend.id) ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedUsers.includes(friend.id) ? 'bg-cyber-primary border-cyber-primary' : 'border-cyber-muted'}`}>
                                                        {selectedUsers.includes(friend.id) && <Check size={10} className="text-white" />}
                                                    </div>
                                                    {/* Avatar */}
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-cyber-text overflow-hidden">
                                                        {friend.profile_photo ? <img src={friend.profile_photo} alt={friend.username} className="w-full h-full object-cover" /> : (friend.username || "U").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="text-sm font-medium text-cyber-text truncate">{friend.username}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-cyber-border">
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
                                className="text-cyber-primary hover:text-cyber-primary_hover text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
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
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
                    <div key={post.id} className={`glass-card p-6 relative group bg-white/70 hover:bg-white transition-colors shadow-sm hover:shadow-md ${post.is_flagged ? 'border-red-500/30 bg-red-50/50' : ''}`}>
                        {/* ... Flags ... */}
                        {post.is_flagged && (
                            <div className="absolute top-4 right-4 text-red-500 flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                                <AlertTriangle size={14} />
                                FLAGGED: {post.flag_reason}
                            </div>
                        )}

                        <div className="flex items-center gap-3 mb-4 relative">
                            <Link to={`/profile/${post.user_id}`} className="flex items-center gap-3 group/author">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-primary to-purple-500 flex items-center justify-center text-white font-bold group-hover/author:scale-105 transition-transform shadow-sm">
                                    {(post.username || "U").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-cyber-text font-bold group-hover/author:text-cyber-primary transition-colors">{post.username || "Unknown"}</div>
                                    <div className="text-cyber-muted text-xs flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatDate(post.created_at)}
                                        <span className="mx-1">•</span>
                                        {post.privacy === 'public' && <Share2 size={12} title="Public" />}
                                        {post.privacy === 'friends' && <User size={12} title="Friends Only" />}
                                        {post.privacy === 'private' && <Shield size={12} title="Private" />}
                                    </div>
                                </div>
                            </Link>

                            {/* Options Menu */}
                            <div className="ml-auto relative">
                                <button
                                    onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                                    className="text-cyber-muted hover:text-cyber-text p-2 rounded-full hover:bg-slate-100 transition-colors"
                                >
                                    <MoreHorizontal size={18} />
                                </button>

                                {activeMenuPostId === post.id && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-cyber-border rounded-xl shadow-xl z-10 py-1 overflow-hidden animate-fade-in-up">
                                        {(post.user_id === user?.id || user?.role === 'admin') && (
                                            <>
                                                <button
                                                    onClick={() => initiateEdit(post)}
                                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2 text-cyber-text group/item"
                                                >
                                                    <Edit2 size={16} className="text-cyber-muted group-hover/item:text-cyber-primary" /> Edit Post
                                                </button>
                                                <button
                                                    onClick={() => deletePost(post.id)}
                                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 group/item"
                                                >
                                                    <Trash2 size={16} /> Delete
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => sharePost(post.id)}
                                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2 text-cyber-text group/item border-t border-gray-100"
                                        >
                                            <LinkIcon size={16} className="text-cyber-muted group-hover/item:text-blue-500" /> Share Link
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>


                        <div className={`space-y-4 ${post.is_flagged ? 'blur-[2px] opacity-50 hover:blur-none hover:opacity-100 transition-all cursor-pointer' : ''}`}>
                            {post.content && (
                                <div className="text-cyber-text whitespace-pre-wrap leading-relaxed">{post.content}</div>
                            )}

                            {post.media_url && (
                                <div className="rounded-xl overflow-hidden border border-cyber-border bg-black/5 shadow-inner">
                                    {post.media_type === 'video' ? (
                                        <video src={post.media_url} controls className="w-full max-h-[500px] object-contain" />
                                    ) : (
                                        <img src={post.media_url} alt="Post content" className="w-full max-h-[500px] object-contain" />
                                    )}
                                </div>
                            )}
                        </div>

                        {post.is_flagged && (
                            <p className="text-xs text-red-500 mt-2 italic font-medium">*Content hidden due to community guidelines. Hover to view.*</p>
                        )}

                        <div className="mt-4 pt-4 border-t border-cyber-border flex items-center gap-6">
                            <button className="flex items-center gap-2 text-cyber-muted hover:text-red-500 transition-colors text-sm font-medium group/btn">
                                <Heart size={18} className="group-hover/btn:scale-110 transition-transform" /> Like
                            </button>
                            <button className="flex items-center gap-2 text-cyber-muted hover:text-blue-500 transition-colors text-sm font-medium group/btn">
                                <MessageCircle size={18} className="group-hover/btn:scale-110 transition-transform" /> Comment
                            </button>
                            <button className="flex items-center gap-2 text-cyber-muted hover:text-green-500 transition-colors text-sm font-medium group/btn ml-auto">
                                <Share2 size={18} className="group-hover/btn:scale-110 transition-transform" /> Share
                            </button>
                        </div>
                    </div>
                ))}

                {posts.length === 0 && !loading && (
                    <div className="text-center text-cyber-muted py-10 bg-white/50 rounded-2xl border border-dashed border-cyber-border">
                        {privacy === 'public' ? "No public posts yet." : "No posts found."} Be the first to share something!
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialFeed;
