import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import toast from 'react-hot-toast';
import { 
    User as UserIcon, Shield, Calendar, MessageSquare, UserPlus, 
    CheckCircle, Camera, Check, X, Image as ImageIcon, Video, 
    Bookmark, Grid, Flag, Activity, LogOut, Settings as SettingsIcon, ShieldCheck
} from 'lucide-react';
import ImageViewer from '../components/ImageViewer';

export default function UserProfile() {
    const { username } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { token, user: currentUser } = useAuth();
    
    // Core Profile State
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    
    // Edit Form State
    const [editForm, setEditForm] = useState({ full_name: '', username: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    // Social State
    const [friendStatus, setFriendStatus] = useState('none'); // pending, accepted, none
    const [posts, setPosts] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [loadingContent, setLoadingContent] = useState(false);
    
    // View State
    const activeTab = searchParams.get('tab') || 'posts';
    const [viewImage, setViewImage] = useState(null);

    // Determine if self by matching param with current user, or if no param provided
    const isSelf = !username || (currentUser && username === currentUser.username);

    useEffect(() => {
        if (token) {
            resolveAndFetchProfile();
        }
    }, [username, token, currentUser]);

    const resolveAndFetchProfile = async () => {
        setLoading(true);
        setError('');
        try {
            let targetUserId = null;

            if (isSelf) {
                targetUserId = currentUser.id;
            } else {
                // We must resolve username to ID via friend search API since users API requires ID
                const searchRes = await fetch(getApiUrl(`/api/friends/search?q=${username}`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (searchRes.ok) {
                    const data = await searchRes.json();
                    const found = data.find(u => u.username === username);
                    if (found) {
                        targetUserId = found.id;
                    } else {
                        throw new Error('User not found');
                    }
                } else {
                    throw new Error('Failed to resolve user');
                }
            }

            if (targetUserId) {
                const res = await fetch(getApiUrl(`/api/users/${targetUserId}`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                    setEditForm({ full_name: data.full_name || '', username: data.username });
                    
                    fetchUserContent(targetUserId, data.is_self);
                    
                    if (!data.is_self) {
                        checkFriendship(targetUserId);
                    }
                } else {
                    throw new Error('Profile access denied or not found');
                }
            }
        } catch (e) {
            setError(e.message || 'Unable to load profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserContent = async (targetId, isSelfProfile) => {
        setLoadingContent(true);
        try {
            // Fetch all authorized posts, then filter by target user
            const res = await fetch(getApiUrl('/api/social/posts'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const allPosts = await res.json();
                setPosts(allPosts.filter(p => p.user_id === targetId));
            }

            // Only fetch saved posts if it's our own profile
            if (isSelfProfile) {
                const savedRes = await fetch(getApiUrl('/api/social/saved'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (savedRes.ok) {
                    setSavedPosts(await savedRes.json());
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingContent(false);
        }
    };

    const checkFriendship = async (targetId) => {
        try {
            const res = await fetch(getApiUrl('/api/friends/'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const friends = await res.json();
                if (friends.some(f => f.id === targetId)) {
                    setFriendStatus('accepted');
                    return;
                }
            }

            const reqRes = await fetch(getApiUrl('/api/friends/requests'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (reqRes.ok) {
                const reqs = await reqRes.json();
                if (reqs.some(r => r.requester_id === targetId)) {
                    setFriendStatus('pending'); // they requested us
                } else if (reqs.some(r => r.target_id === targetId)) {
                    setFriendStatus('outgoing_request'); // we requested them
                } else {
                    setFriendStatus('none');
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddFriend = async () => {
        try {
            const res = await fetch(getApiUrl(`/api/friends/request/${profile.id}`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Friend request sent');
                setFriendStatus('outgoing_request');
            } else {
                toast.error('Could not send request');
            }
        } catch (e) {
            toast.error('An error occurred');
        }
    };

    const handleProfileUpdate = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(getApiUrl('/api/users/me'), {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    full_name: editForm.full_name,
                    username: editForm.username
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                setProfile(prev => ({ ...prev, full_name: data.data.full_name, username: data.data.username }));
                setIsEditing(false);
                toast.success('Profile updated successfully');
                
                // If username changed, redirect to new URL
                if (data.data.username !== username && !isSelf) {
                    navigate(`/profile/${data.data.username}`, { replace: true });
                }
            } else {
                const errorData = await res.json();
                toast.error(errorData.detail || 'Failed to update profile');
            }
        } catch (e) {
            toast.error('An error occurred while saving');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingPhoto(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Step 1: Upload to raw storage
            const uploadRes = await fetch(getApiUrl('/api/upload'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                // Step 2: Update Profile
                const updateRes = await fetch(getApiUrl('/api/users/me'), {
                    method: 'PUT',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ profile_photo: uploadData.url })
                });

                if (updateRes.ok) {
                    const updateData = await updateRes.json();
                    setProfile(prev => ({ ...prev, profile_photo: updateData.data.profile_photo }));
                    toast.success('Profile photo updated');
                } else {
                    throw new Error('Failed to update profile record');
                }
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            toast.error(err.message || 'Error updating photo');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const getTrustColor = (score) => {
        if (score >= 90) return 'text-cyber-primary border-cyber-primary bg-blue-50';
        if (score >= 70) return 'text-green-500 border-green-500 bg-green-50';
        return 'text-amber-500 border-amber-500 bg-amber-50';
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-cyber-primary rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Loading profile...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                    <UserIcon size={40} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Profile not found</h1>
                <p className="text-slate-500 text-center max-w-md">{error}</p>
                <button onClick={() => navigate(-1)} className="mt-8 px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50">
                    Go Back
                </button>
            </div>
        );
    }

    const filteredMedia = {
        photos: posts.filter(p => p.media_url && p.media_type === 'image'),
        videos: posts.filter(p => p.media_url && p.media_type === 'video')
    };

    const renderEmptyState = (icon, message) => (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-white border border-slate-200 border-dashed rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                {icon}
            </div>
            <p className="text-slate-500">{message}</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto pb-12 px-4 md:px-0">
            {/* PROFILE HEADER CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                {/* Cover Area - Solid Color (Cover image upload not supported natively) */}
                <div className="h-48 bg-gradient-to-r from-slate-800 to-slate-900 relative">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>

                {/* Profile Details Area */}
                <div className="px-6 sm:px-10 pb-8 relative">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 sm:-mt-20 mb-6">
                        {/* Avatar */}
                        <div className="relative group shrink-0">
                            <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-lg ${isUploadingPhoto ? 'animate-pulse' : ''}`}>
                                {profile.profile_photo ? (
                                    <img 
                                        src={profile.profile_photo.startsWith('http') ? profile.profile_photo : getApiUrl(profile.profile_photo)} 
                                        alt={profile.username} 
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => setViewImage(profile.profile_photo.startsWith('http') ? profile.profile_photo : getApiUrl(profile.profile_photo))}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                        <UserIcon size={64} />
                                    </div>
                                )}
                            </div>
                            {profile.is_self && (
                                <label className="absolute bottom-2 right-2 w-10 h-10 bg-cyber-primary text-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-blue-600 transition-transform hover:scale-105" title="Change Photo">
                                    <Camera size={18} />
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                                </label>
                            )}
                        </div>

                        {/* Name & Title */}
                        <div className="flex-1 pt-16 sm:pt-0">
                            {isEditing ? (
                                <div className="space-y-3 max-w-sm">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                                        <input type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-cyber-primary" placeholder="Full Name" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Username</label>
                                        <input type="text" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-cyber-primary" placeholder="Username" />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={handleProfileUpdate} disabled={isSaving} className="px-4 py-2 bg-cyber-primary text-white font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm">
                                            <Check size={16} /> Save
                                        </button>
                                        <button onClick={() => setIsEditing(false)} disabled={isSaving} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors text-sm">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                                            {profile.full_name || profile.username}
                                        </h1>
                                        {profile.trust_score >= 90 && (
                                            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-cyber-primary border border-blue-100 text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm" title="Elite Status">
                                                <CheckCircle size={14} /> Elite
                                            </span>
                                        )}
                                        {profile.role === 'admin' && (
                                            <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm" title="Administrator">
                                                <ShieldCheck size={14} /> Admin
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-500 font-medium text-lg mt-1">@{profile.username}</p>
                                    
                                    <div className="flex flex-wrap items-center gap-6 mt-4 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5">Trust Score</span>
                                            <span className={`font-mono font-bold text-lg px-2 py-0.5 rounded-md border ${getTrustColor(profile.trust_score)}`}>
                                                {profile.trust_score}%
                                            </span>
                                        </div>
                                        <div className="w-px h-10 bg-slate-200"></div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5">Joined</span>
                                            <span className="font-medium text-slate-700 text-base flex items-center gap-1">
                                                <Calendar size={16} className="text-slate-400" />
                                                {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions Matrix */}
                        <div className="sm:ml-auto flex flex-wrap gap-3 shrink-0 self-start sm:self-end pt-4 sm:pt-0">
                            {profile.is_self ? (
                                <>
                                    {!isEditing && (
                                        <button onClick={() => setIsEditing(true)} className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                                            <UserIcon size={18} /> Edit Profile
                                        </button>
                                    )}
                                    <button onClick={() => navigate('/settings')} className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm" title="Settings">
                                        <SettingsIcon size={18} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    {friendStatus === 'accepted' ? (
                                        <button onClick={() => navigate(`/chats/${profile.id}`)} className="px-5 py-2.5 bg-cyber-primary text-white font-bold rounded-xl hover:bg-blue-600 shadow-sm transition-all flex items-center gap-2">
                                            <MessageSquare size={18} /> Message
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleAddFriend}
                                            disabled={friendStatus !== 'none'}
                                            className={`px-5 py-2.5 font-bold rounded-xl transition-all flex items-center gap-2 border shadow-sm ${
                                                friendStatus !== 'none'
                                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <UserPlus size={18} />
                                            {friendStatus === 'none' ? 'Add Contact' : friendStatus === 'outgoing_request' ? 'Request Sent' : 'Pending'}
                                        </button>
                                    )}
                                    
                                    <button onClick={() => navigate('/help')} className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center gap-2 shadow-sm" title="Report User">
                                        <Flag size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT TABS */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide border-b border-slate-200">
                {[
                    { id: 'posts', label: 'Posts', icon: <Grid size={16} /> },
                    { id: 'photos', label: 'Photos', icon: <ImageIcon size={16} /> },
                    { id: 'videos', label: 'Videos', icon: <Video size={16} /> },
                    ...(profile.is_self ? [{ id: 'saved', label: 'Saved', icon: <Bookmark size={16} /> }] : []),
                    { id: 'about', label: 'About', icon: <UserIcon size={16} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSearchParams({ tab: tab.id })}
                        className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-colors border ${
                            activeTab === tab.id 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB PANES */}
            <div className="min-h-[400px]">
                {loadingContent ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-cyber-primary rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* POSTS */}
                        {activeTab === 'posts' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {posts.length === 0 ? (
                                    <div className="md:col-span-2">{renderEmptyState(<MessageSquare size={32} />, "No posts found.")}</div>
                                ) : (
                                    posts.map(post => (
                                        <div key={post.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden">
                                                    {post.author_photo || profile.profile_photo ? (
                                                        <img src={(post.author_photo || profile.profile_photo).startsWith('http') ? (post.author_photo || profile.profile_photo) : getApiUrl(post.author_photo || profile.profile_photo)} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400"><UserIcon size={20} /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{post.username}</p>
                                                    <p className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <p className="text-slate-700 mb-4 whitespace-pre-wrap">{post.content}</p>
                                            {post.media_url && (
                                                <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                                                    {post.media_type === 'video' ? (
                                                        <video src={post.media_url.startsWith('http') ? post.media_url : getApiUrl(post.media_url)} controls className="w-full max-h-64 object-contain" />
                                                    ) : (
                                                        <img src={post.media_url.startsWith('http') ? post.media_url : getApiUrl(post.media_url)} alt="Post attachment" className="w-full max-h-64 object-contain cursor-pointer hover:opacity-95" onClick={() => setViewImage(post.media_url.startsWith('http') ? post.media_url : getApiUrl(post.media_url))} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* PHOTOS */}
                        {activeTab === 'photos' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {filteredMedia.photos.length === 0 ? (
                                    <div className="col-span-full">{renderEmptyState(<ImageIcon size={32} />, "No photos shared yet.")}</div>
                                ) : (
                                    filteredMedia.photos.map(post => (
                                        <div key={post.id} className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group relative" onClick={() => setViewImage(post.media_url.startsWith('http') ? post.media_url : getApiUrl(post.media_url))}>
                                            <img src={post.media_url.startsWith('http') ? post.media_url : getApiUrl(post.media_url)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Shared photo" />
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* VIDEOS */}
                        {activeTab === 'videos' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {filteredMedia.videos.length === 0 ? (
                                    <div className="col-span-full">{renderEmptyState(<Video size={32} />, "No videos shared yet.")}</div>
                                ) : (
                                    filteredMedia.videos.map(post => (
                                        <div key={post.id} className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group">
                                            <video src={post.media_url.startsWith('http') ? post.media_url : getApiUrl(post.media_url)} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-10 h-10 bg-slate-900/50 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                                    <Video size={20} className="ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* SAVED */}
                        {activeTab === 'saved' && profile.is_self && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {savedPosts.length === 0 ? (
                                    <div className="md:col-span-2">{renderEmptyState(<Bookmark size={32} />, "You haven't saved any posts yet.")}</div>
                                ) : (
                                    savedPosts.map(post => (
                                        <div key={post.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                            <p className="font-bold text-slate-900 mb-2">@{post.username}</p>
                                            <p className="text-slate-700 mb-3">{post.content}</p>
                                            <span className="text-xs text-slate-500">Saved content is private</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* ABOUT */}
                        {activeTab === 'about' && (
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-2xl">
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><UserIcon size={20} className="text-slate-400" /> Profile Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                                        <p className="text-slate-900 font-medium">{profile.full_name || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Username</label>
                                        <p className="text-slate-900 font-medium">@{profile.username}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Trust Score</label>
                                        <div className="flex items-center gap-2">
                                            <Shield size={16} className={profile.trust_score >= 70 ? 'text-green-500' : 'text-amber-500'} />
                                            <p className="text-slate-900 font-medium">{profile.trust_score}%</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Joined</label>
                                        <p className="text-slate-900 font-medium">{new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* FULLSCREEN IMAGE VIEWER */}
            {viewImage && (
                <ImageViewer
                    src={viewImage}
                    alt="Preview"
                    onClose={() => setViewImage(null)}
                />
            )}
        </div>
    );
}
