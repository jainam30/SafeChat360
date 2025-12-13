import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { User, Shield, Calendar, MessageSquare, UserPlus, ArrowLeft, Clock, CheckCircle } from 'lucide-react';

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
        try {
            const res = await fetch(getApiUrl('/api/friends/'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const friends = await res.json();
                if (Array.isArray(friends) && friends.find(f => f.id === targetId)) {
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
                if (Array.isArray(requests) && requests.find(r => r.requester_id === targetId)) {
                    setFriendStatus('incoming_request');
                    return;
                }
            }
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
            <button onClick={handleBack} className="flex items-center gap-2 text-cyber-muted hover:text-cyber-text mb-6 transition-colors">
                <ArrowLeft size={18} /> Back
            </button>

            <div className="glass-card p-8 rounded-2xl relative overflow-hidden bg-white/80 shadow-lg">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-100 to-purple-100 blur-xl opacity-70"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start pt-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white">
                            <img
                                src={profile.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                                alt={profile.username}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;
                                }}
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <h1 className="text-3xl font-bold text-cyber-text flex items-center gap-3">
                                {profile.full_name || profile.username}
                                <span className="text-sm font-normal py-1 px-3 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    @{profile.username}
                                </span>
                            </h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-cyber-muted">
                                <span className="flex items-center gap-1">
                                    <Shield size={14} className={profile.trust_score >= 80 ? "text-green-500" : "text-yellow-500"} />
                                    Trust Score: <span className="text-cyber-text font-mono font-bold">{profile.trust_score}</span>
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
                                    <button onClick={() => navigate(`/chat?user=${profile.id}`)} className="glass-button-primary flex items-center gap-2 shadow-sm">
                                        <MessageSquare size={18} /> Message
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleAddFriend}
                                        disabled={friendStatus !== 'none'}
                                        className="glass-button-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        <UserPlus size={18} />
                                        {friendStatus === 'none' ? 'Add Friend' : friendStatus === 'outgoing_request' ? 'Request Sent' : 'Pending Request'}
                                    </button>
                                )}
                            </div>
                        )}

                        {profile.is_self && (
                            <button onClick={() => navigate('/account')} className="glass-button flex items-center gap-2 bg-white hover:bg-slate-50 border-cyber-border text-cyber-text shadow-sm">
                                <User size={18} /> Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats or Recent Activity (Placeholder) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="glass-card p-6 bg-white/80 shadow-md">
                    <h3 className="text-cyber-muted text-sm font-bold uppercase mb-4 flex items-center gap-2">
                        <Shield size={16} /> Badges
                    </h3>
                    <div className="flex gap-2">
                        <div className="w-8 h-8 rounded bg-yellow-50 text-yellow-600 flex items-center justify-center text-xs border border-yellow-200 shadow-sm" title="Early Adopter">EA</div>
                        <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-xs border border-blue-200 shadow-sm" title="Verified">V</div>
                    </div>
                </div>
                <div className="glass-card p-6 md:col-span-2 bg-white/80 shadow-md">
                    <h3 className="text-cyber-muted text-sm font-bold uppercase mb-4 flex items-center gap-2">
                        <Clock size={16} /> Recent Activity
                    </h3>
                    <p className="text-sm text-cyber-muted italic">No public activity to show.</p>
                </div>
            </div>
        </div>
    );
}
