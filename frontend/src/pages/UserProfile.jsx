import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { User, Shield, Calendar, MessageSquare, UserPlus, ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import ImageViewer from '../components/ImageViewer';

export default function UserProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { token, user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [friendStatus, setFriendStatus] = useState('none'); // pending, accepted, none
    const [viewImage, setViewImage] = useState(null);

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

    const [requestSent, setRequestSent] = useState(false);

    const handleAddFriend = async () => {
        if (!profile) return;
        try {
            const res = await fetch(getApiUrl(`/api/friends/request/${profile.id}`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setFriendStatus('outgoing_request');
                setRequestSent(true);
            } else {
                const d = await res.json();
                if (d.detail === "Friend request already sent" || d.detail?.includes("already")) {
                    setFriendStatus('outgoing_request');
                } else {
                    alert(d.detail || "Failed to send request");
                }
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

            <div className="glass-card p-0 rounded-2xl relative overflow-hidden bg-black/30 border border-white/10 shadow-2xl">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-cyber-primary/20 via-purple-900/40 to-black/80"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start pt-12 px-8 pb-8">
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative group">
                        <div
                            className="w-32 h-32 rounded-full border-4 border-black/50 overflow-hidden shadow-2xl bg-black/40 relative z-20 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                            onClick={() => setViewImage(profile.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`)}
                            title="View Full Size"
                        >
                            <img
                                src={profile.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                                alt={profile.username}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Elite Halo if high score */}
                        {profile.trust_score >= 90 && (
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyber-primary to-blue-500 opacity-75 blur-md z-10 animate-pulse pointer-events-none"></div>
                        )}

                        {/* Trust Score Badge (Gamified) */}
                        <div className={`absolute -bottom-2 -right-2 z-30 w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#0F172A] shadow-lg ${profile.trust_score >= 90 ? 'bg-cyber-primary text-white' :
                            profile.trust_score >= 70 ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                            }`} title={`Trust Score: ${profile.trust_score}`}>
                            <Shield size={20} fill="currentColor" />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4 pt-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                    {profile.full_name || profile.username}
                                </h1>
                                {profile.trust_score >= 90 && (
                                    <span className="px-2 py-0.5 rounded-full bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle size={12} /> Elite
                                    </span>
                                )}
                            </div>
                            <p className="text-cyber-muted font-medium mt-1">@{profile.username}</p>

                            <div className="flex flex-wrap items-center gap-6 mt-4 text-sm text-gray-300">
                                <div className="flex flex-col">
                                    <span className="text-xs text-cyber-muted uppercase tracking-wider">Trust Score</span>
                                    <span className={`font-mono font-bold text-lg ${profile.trust_score >= 90 ? 'text-cyber-primary' :
                                        profile.trust_score >= 70 ? 'text-green-400' : 'text-yellow-400'
                                        }`}>{profile.trust_score}%</span>
                                </div>
                                <div className="w-px h-8 bg-white/10"></div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-cyber-muted uppercase tracking-wider">Member Since</span>
                                    <span className="font-medium">{new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        {!profile.is_self && (
                            <div className="flex gap-4 pt-4">
                                {friendStatus === 'accepted' ? (
                                    <button onClick={() => navigate(`/chat?user=${profile.id}`)} className="px-6 py-2.5 bg-cyber-primary text-white font-bold rounded-xl hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2">
                                        <MessageSquare size={18} /> Message
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleAddFriend}
                                        disabled={friendStatus !== 'none'}
                                        className={`px-6 py-2.5 font-bold rounded-xl transition-all flex items-center gap-2 border ${friendStatus !== 'none'
                                            ? 'bg-white/5 border-white/10 text-gray-400 cursor-not-allowed'
                                            : 'bg-white/10 hover:bg-white/20 border-white/20 text-white hover:border-cyber-primary/50'
                                            }`}
                                    >
                                        <UserPlus size={18} />
                                        {friendStatus === 'none' ? 'Add Friend' : friendStatus === 'outgoing_request' ? 'Request Sent' : 'Pending'}
                                    </button>
                                )}
                            </div>
                        )}

                        {profile.is_self && (
                            <button onClick={() => navigate('/account')} className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-all flex items-center gap-2 font-bold">
                                <User size={18} /> Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats or Recent Activity (Placeholder) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="glass-card p-6 bg-black/20 border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyber-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <h3 className="text-cyber-muted text-xs font-bold uppercase mb-4 flex items-center gap-2 relative z-10">
                        <Shield size={14} className="text-cyber-primary" /> Badges & Achievements
                    </h3>
                    <div className="flex gap-3 relative z-10">
                        {profile.trust_score >= 90 && (
                            <div className="w-10 h-10 rounded-lg bg-cyber-primary/10 text-cyber-primary flex items-center justify-center text-xs font-bold border border-cyber-primary/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:scale-110 transition-transform cursor-help" title="Elite Status: Trust Score > 90">
                                <Shield size={18} />
                            </div>
                        )}
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:scale-110 transition-transform cursor-help delay-75" title="Verified Account">
                            <CheckCircle size={18} />
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:scale-110 transition-transform cursor-help delay-150" title="Early Adopter">
                            <Clock size={18} />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 md:col-span-2 bg-black/20 border-white/5">
                    <h3 className="text-cyber-muted text-xs font-bold uppercase mb-4 flex items-center gap-2">
                        <Calendar size={14} className="text-cyber-secondary" /> Recent Activity
                    </h3>
                    {/* Empty State designed for Dark Mode */}
                    <div className="p-8 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center opacity-50">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <Clock size={20} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-400">No recent public activity to show.</p>
                    </div>
                </div>
            </div>

            {/* Image Viewer */}
            {viewImage && (
                <ImageViewer
                    src={viewImage}
                    alt={profile.username}
                    onClose={() => setViewImage(null)}
                />
            )}
        </div>
    );
}
