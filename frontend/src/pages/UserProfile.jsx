import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { User, Shield, Calendar, MessageSquare, UserPlus, ArrowLeft, Clock } from 'lucide-react';

export default function UserProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { token, user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [friendStatus, setFriendStatus] = useState('none'); // pending, accepted, none

    useEffect(() => {
        fetchProfile();
    }, [userId, token]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch(getApiUrl(`/api/users/${userId}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                // Also fetch friendship status if not self
                if (!data.is_self) {
                    checkFriendship(data.id);
                }
            } else {
                setError('User not found');
            }
        } catch (e) {
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const checkFriendship = async (targetId) => {
        // We can reuse the friendship search logic or add specific endpoint.
        // For simplicity, let's just use the 'search' API with username to get status, 
        // OR add a specific status endpoint. 
        // Actually, let's implement a 'check status' or just fetch friends list and check.
        // Fetching entire friends list is okay for now.
        try {
            const res = await fetch(getApiUrl('/api/friends/'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const friends = await res.json();
                if (friends.find(f => f.id === targetId)) {
                    setFriendStatus('accepted');
                    return;
                }
            }
            // Check requests
            const reqRes = await fetch(getApiUrl('/api/friends/requests'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (reqRes.ok) {
                const requests = await reqRes.json();
                if (requests.find(r => r.requester_id === targetId)) {
                    setFriendStatus('incoming_request');
                    return;
                }
            }
            // If we sent a request? We don't have an endpoint for "outgoing requests" yet easily.
            // We'll skip outgoing check for MVP or assume 'none' if not friend/incoming.
        } catch (e) {
            console.error(e);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleAddFriend = async () => {
        if (!profile) return;
        try {
            const res = await fetch(getApiUrl(`/api/friends/request/${profile.id}`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert("Friend request sent!");
                setFriendStatus('outgoing_request'); // Optimistic
            } else {
                const d = await res.json();
                alert(d.detail || "Failed to send request");
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-10 text-center text-cyber-muted">Loading profile...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
    if (!profile) return null;

    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={handleBack} className="flex items-center gap-2 text-cyber-muted hover:text-white mb-6 transition-colors">
                <ArrowLeft size={18} /> Back
            </button>

            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-cyber-primary/20 to-purple-600/20 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-32 h-32 rounded-full border-4 border-black/50 overflow-hidden shadow-2xl">
                            {profile.profile_photo ? (
                                <img src={profile.profile_photo} alt={profile.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-cyber-primary to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                                    {profile.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                {profile.full_name || profile.username}
                                <span className="text-sm font-normal py-1 px-3 rounded-full bg-white/10 text-cyber-muted border border-white/5">
                                    @{profile.username}
                                </span>
                            </h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-cyber-muted">
                                <span className="flex items-center gap-1">
                                    <Shield size={14} className={profile.trust_score >= 80 ? "text-green-400" : "text-yellow-400"} />
                                    Trust Score: <span className="text-white font-mono">{profile.trust_score}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    Joined {new Date(profile.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        {!profile.is_self && (
                            <div className="flex gap-3 pt-2">
                                {friendStatus === 'accepted' ? (
                                    <button onClick={() => navigate(`/chat?user=${profile.id}`)} className="glass-button-primary flex items-center gap-2">
                                        <MessageSquare size={18} /> Message
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleAddFriend}
                                        disabled={friendStatus !== 'none'}
                                        className="glass-button-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <UserPlus size={18} />
                                        {friendStatus === 'none' ? 'Add Friend' : friendStatus === 'outgoing_request' ? 'Request Sent' : 'Pending Request'}
                                    </button>
                                )}
                            </div>
                        )}

                        {profile.is_self && (
                            <button onClick={() => navigate('/account')} className="glass-button flex items-center gap-2">
                                <User size={18} /> Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats or Recent Activity (Placeholder) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="glass-card p-6">
                    <h3 className="text-cyber-muted text-sm font-bold uppercase mb-4 flex items-center gap-2">
                        <Shield size={16} /> Badges
                    </h3>
                    <div className="flex gap-2">
                        <div className="w-8 h-8 rounded bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs border border-yellow-500/50" title="Early Adopter">EA</div>
                        <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs border border-blue-500/50" title="Verified">V</div>
                    </div>
                </div>
                <div className="glass-card p-6 md:col-span-2">
                    <h3 className="text-cyber-muted text-sm font-bold uppercase mb-4 flex items-center gap-2">
                        <Clock size={16} /> Recent Activity
                    </h3>
                    <p className="text-sm text-gray-400 italic">No public activity to show.</p>
                </div>
            </div>
        </div>
    );
}
