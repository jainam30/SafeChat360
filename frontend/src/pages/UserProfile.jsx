import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, resolveMediaUrl } from '../config';
import { 
    Camera, MapPin, Calendar, Edit3, MoreHorizontal,
    Image as ImageIcon, Video, Bookmark, Heart, MessageSquare, 
    Share2, Shield, Check, Grid, Compass, Users, UserPlus, 
    UserCheck, Clock, X, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function UserProfile() {
    const { username } = useParams();
    const { user, setUser, token } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('posts');
    const [userPosts, setUserPosts] = useState([]);
    const [friendsCount, setFriendsCount] = useState(0);
    const [groupsCount, setGroupsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [publicProfile, setPublicProfile] = useState(null);
    const [userNotFound, setUserNotFound] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const avatarInputRef = useRef(null);

    const isOwnProfile = !username || (user?.username && username.toLowerCase() === user?.username.toLowerCase());

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Photo exceeds 10MB limit");
            return;
        }

        setUploadingAvatar(true);
        const toastId = toast.loading("Uploading profile photo...");
        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await axios.post(getApiUrl('/api/upload'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            const photoUrl = uploadRes.data.url;
            await axios.put(getApiUrl('/api/users/me'), {
                profile_photo: photoUrl
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Profile photo updated!", { id: toastId });
            if (setUser) {
                setUser(prev => ({ ...prev, avatar_url: photoUrl, profile_photo: photoUrl }));
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to update profile photo", { id: toastId });
        } finally {
            setUploadingAvatar(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const handleSendFriendRequest = async (targetUserId) => {
        setActionLoading(true);
        try {
            const res = await axios.post(getApiUrl(`/api/friends/request/${targetUserId}`), {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Friend request sent!");
            setPublicProfile(prev => ({
                ...prev,
                friendship_status: 'outgoing_request',
                friendship_id: res.data?.friendship_id
            }));
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to send friend request");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptRequest = async (friendshipId) => {
        setActionLoading(true);
        try {
            await axios.post(getApiUrl(`/api/friends/accept/${friendshipId}`), {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Friend request accepted!");
            setPublicProfile(prev => ({
                ...prev,
                friendship_status: 'accepted'
            }));
            setFriendsCount(prev => prev + 1);
        } catch (err) {
            toast.error("Failed to accept friend request");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectRequest = async (friendshipId) => {
        setActionLoading(true);
        try {
            await axios.post(getApiUrl(`/api/friends/reject/${friendshipId}`), {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Friend request declined");
            setPublicProfile(prev => ({
                ...prev,
                friendship_status: 'none',
                friendship_id: null
            }));
        } catch (err) {
            toast.error("Failed to decline friend request");
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;

        const fetchProfileData = async () => {
            setLoading(true);
            setUserNotFound(false);
            try {
                const headers = { Authorization: `Bearer ${token}` };

                // If viewing someone else, load their public profile first
                if (!isOwnProfile && username) {
                    try {
                        const profRes = await axios.get(getApiUrl(`/api/users/profile/${username}`), { headers });
                        setPublicProfile(profRes.data);
                    } catch (pErr) {
                        if (pErr.response?.status === 404) {
                            setUserNotFound(true);
                            setLoading(false);
                            return;
                        }
                    }
                }

                const [postsRes, friendsRes, groupsRes] = await Promise.allSettled([
                    axios.get(getApiUrl('/api/social/posts?limit=50'), { headers }),
                    axios.get(getApiUrl('/api/friends/'), { headers }),
                    axios.get(getApiUrl('/api/groups/'), { headers })
                ]);

                if (postsRes.status === 'fulfilled' && Array.isArray(postsRes.value.data)) {
                    const filtered = postsRes.value.data.filter(p => 
                        isOwnProfile 
                            ? (p.author_id === user?.id || p.author_username === user?.username)
                            : (p.author_username && p.author_username.toLowerCase() === username.toLowerCase())
                    );
                    setUserPosts(filtered);
                }

                if (friendsRes.status === 'fulfilled' && Array.isArray(friendsRes.value.data)) {
                    setFriendsCount(friendsRes.value.data.length);
                }

                if (groupsRes.status === 'fulfilled' && Array.isArray(groupsRes.value.data)) {
                    setGroupsCount(groupsRes.value.data.length);
                }
            } catch (err) {
                console.error("Failed to load profile data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [token, username, user?.id, user?.username, isOwnProfile]);

    if (userNotFound) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                <h2 className="text-xl font-bold text-slate-800">User not found</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    No SafeChat360 user exists with the username <strong className="text-slate-600">@{username}</strong>.
                </p>
                <button 
                    onClick={() => navigate('/contacts')}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                >
                    Back to Contacts
                </button>
            </div>
        );
    }

    const filteredContent = userPosts.filter(post => {
        if (activeTab === 'photos') return post.media_url && post.media_type !== 'video';
        if (activeTab === 'videos') return post.media_url && post.media_type === 'video';
        return true;
    });

    const displayName = isOwnProfile ? (user?.full_name || user?.username) : (publicProfile?.full_name || username);
    const displayHandle = isOwnProfile ? (user?.username || 'user') : (publicProfile?.username || username);
    const avatarUrl = isOwnProfile ? user?.avatar_url : publicProfile?.profile_photo;
    const targetUserId = publicProfile?.id;
    const friendshipStatus = publicProfile?.friendship_status;
    const friendshipId = publicProfile?.friendship_id;

    return (
        <div className="flex h-full w-full bg-slate-50 md:bg-white text-slate-900 overflow-hidden">
            
            {/* MAIN PANE (Profile Feed) */}
            <div className="flex-1 overflow-y-auto bg-slate-50 min-w-0">
                {/* Header Banner */}
                <div className="relative w-full h-[180px] sm:h-[220px] bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900">
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>

                {/* Profile Header Card */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-14 mb-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 pt-0">
                        
                        <div className="flex justify-between items-start">
                            {/* Avatar */}
                            <div className="relative -mt-10 mb-4 inline-block">
                                <div 
                                    className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white overflow-hidden bg-blue-600 text-white flex items-center justify-center shadow-md relative group ${isOwnProfile ? 'cursor-pointer' : ''}`}
                                    onClick={() => isOwnProfile && avatarInputRef.current?.click()}
                                    title={isOwnProfile ? "Change profile photo" : ""}
                                >
                                    {isOwnProfile && (
                                        <input
                                            ref={avatarInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarUpload}
                                        />
                                    )}
                                    {avatarUrl ? (
                                        <img src={resolveMediaUrl(avatarUrl)} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <span className="font-bold text-3xl">
                                            {(displayName || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                    {isOwnProfile && (
                                        <div className="absolute inset-0 bg-slate-900/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={22} className={uploadingAvatar ? 'animate-spin' : ''} />
                                            <span className="text-[10px] font-bold mt-1">Upload</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="mt-4 flex items-center gap-2">
                                {isOwnProfile ? (
                                    <button 
                                        onClick={() => navigate('/settings')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
                                    >
                                        <Edit3 size={14} /> Edit Profile
                                    </button>
                                ) : (
                                    <>
                                        {/* Status: Friends */}
                                        {friendshipStatus === 'accepted' && (
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-200">
                                                    <UserCheck size={14} /> Friends
                                                </span>
                                                <button 
                                                    onClick={() => navigate(`/chats/${targetUserId}`)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
                                                >
                                                    <MessageSquare size={14} /> Message
                                                </button>
                                            </div>
                                        )}

                                        {/* Status: Request Pending */}
                                        {friendshipStatus === 'outgoing_request' && (
                                            <span className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200">
                                                <Clock size={14} className="text-amber-500" /> Request Pending
                                            </span>
                                        )}

                                        {/* Status: Incoming Request */}
                                        {friendshipStatus === 'incoming_request' && (
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    disabled={actionLoading}
                                                    onClick={() => handleAcceptRequest(friendshipId)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                                >
                                                    <Check size={14} /> Accept Request
                                                </button>
                                                <button 
                                                    disabled={actionLoading}
                                                    onClick={() => handleRejectRequest(friendshipId)}
                                                    className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-3 py-2 rounded-xl font-bold text-xs border border-slate-200 transition-colors disabled:opacity-50"
                                                >
                                                    <X size={14} /> Decline
                                                </button>
                                            </div>
                                        )}

                                        {/* Status: Not Friends */}
                                        {(!friendshipStatus || friendshipStatus === 'none') && (
                                            <button 
                                                disabled={actionLoading || !targetUserId}
                                                onClick={() => handleSendFriendRequest(targetUserId)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                <UserPlus size={14} />
                                                <span>{actionLoading ? "Sending..." : "Add Friend"}</span>
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="mb-6">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                                {displayName} 
                                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Check size={10} strokeWidth={4} className="text-white" />
                                </div>
                            </h1>
                            <p className="text-slate-400 font-medium text-xs mb-3">@{displayHandle}</p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                                <span className="flex items-center gap-1.5"><Shield size={14} className="text-blue-500"/> Verified Member</span>
                                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400"/> Active on SafeChat360</span>
                            </div>
                        </div>

                        {/* Truthful Stats */}
                        <div className="flex gap-8 border-t border-slate-100 pt-5 pb-1">
                            <div className="text-center">
                                <div className="text-lg font-bold text-slate-900">{userPosts.length}</div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Posts</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-slate-900">{friendsCount}</div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Contacts</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-slate-900">{groupsCount}</div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Groups</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs & Grid */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 flex overflow-x-auto scrollbar-hide">
                        <button 
                            onClick={() => setActiveTab('posts')} 
                            className={`flex-1 py-3 text-xs font-bold flex justify-center items-center gap-2 border-b-2 transition-colors ${
                                activeTab === 'posts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Grid size={16} /> All Posts ({userPosts.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('photos')} 
                            className={`flex-1 py-3 text-xs font-bold flex justify-center items-center gap-2 border-b-2 transition-colors ${
                                activeTab === 'photos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <ImageIcon size={16} /> Photos
                        </button>
                        <button 
                            onClick={() => setActiveTab('videos')} 
                            className={`flex-1 py-3 text-xs font-bold flex justify-center items-center gap-2 border-b-2 transition-colors ${
                                activeTab === 'videos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Video size={16} /> Videos
                        </button>
                    </div>

                    {/* Posts Grid */}
                    {loading ? (
                        <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
                            Loading profile posts...
                        </div>
                    ) : filteredContent.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredContent.map(post => (
                                <div key={post.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center mb-2 text-xs text-slate-400">
                                            <span>{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'}</span>
                                            <span className="capitalize">{post.privacy || 'Public'}</span>
                                        </div>
                                        <p className="text-xs text-slate-800 mb-3 whitespace-pre-wrap leading-relaxed line-clamp-3">
                                            {post.content}
                                        </p>
                                        {post.media_url && (
                                            <div className="rounded-xl overflow-hidden aspect-[4/3] bg-slate-900 mb-3">
                                                {post.media_type === 'video' ? (
                                                    <video src={resolveMediaUrl(post.media_url)} controls className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={resolveMediaUrl(post.media_url)} className="w-full h-full object-cover" alt="" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1 font-semibold">
                                                <Heart size={14} className="text-red-500" /> {post.likes_count || 0}
                                            </span>
                                            <span className="flex items-center gap-1 font-semibold">
                                                <MessageSquare size={14} className="text-blue-500" /> {post.comments_count || 0}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/social?post=${post.id}`)}
                                            className="text-xs font-bold text-blue-600 hover:underline"
                                        >
                                            View &rarr;
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                            <Compass className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                            <h3 className="text-sm font-bold text-slate-700">No posts published yet</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                {isOwnProfile ? "Share updates, thoughts, or photos to see them here on your profile." : "This user hasn't published any posts yet."}
                            </p>
                            {isOwnProfile && (
                                <button
                                    onClick={() => navigate('/social')}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Create a Post
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
