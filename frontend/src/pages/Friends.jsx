import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Users, UserPlus, Search, UserCheck, Clock, Check, X, MessageSquare, UserX } from 'lucide-react';

export default function Friends() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('friends'); // friends, find, requests
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'friends') fetchFriends();
        if (activeTab === 'requests') fetchRequests();
    }, [activeTab, token]);

    const fetchFriends = async () => {
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/friends/'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFriends(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error(e);
            setFriends([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/friends/requests'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error(e);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(getApiUrl(`/api/friends/search?q=${encodeURIComponent(searchQuery.trim())}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setSearchResults(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const sendRequest = async (userId) => {
        try {
            const res = await fetch(getApiUrl(`/api/friends/request/${userId}`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSearchResults(prev => prev.map(u =>
                    u.id === userId ? { ...u, friendship_status: 'outgoing_request' } : u
                ));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const acceptRequest = async (friendshipId) => {
        try {
            const res = await fetch(getApiUrl(`/api/friends/accept/${friendshipId}`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchRequests();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-cyber-text mb-2 flex items-center gap-3">
                    <Users className="text-cyber-primary" />
                    Friends & Connections
                </h1>
                <p className="text-cyber-muted">Find friends and manage your network.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-cyber-border mb-8 overflow-x-auto pb-1">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'friends' ? 'text-cyber-primary border-b-2 border-cyber-primary' : 'text-cyber-muted hover:text-cyber-text'}`}
                >
                    My Friends
                </button>
                <button
                    onClick={() => setActiveTab('find')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'find' ? 'text-cyber-primary border-b-2 border-cyber-primary' : 'text-cyber-muted hover:text-cyber-text'}`}
                >
                    Find People
                </button>
                <div className="relative">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`pb-3 px-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'requests' ? 'text-cyber-primary border-b-2 border-cyber-primary' : 'text-cyber-muted hover:text-cyber-text'}`}
                    >
                        Requests
                    </button>
                    {requests.length > 0 && (
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {loading && <div className="text-center text-cyber-muted py-8">Loading...</div>}

                {/* MY FRIENDS TAB */}
                {activeTab === 'friends' && !loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {friends.length === 0 ? (
                            <div className="col-span-2 text-center py-10 text-cyber-muted">
                                <UserPlus size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No friends yet. Go to "Find People" to connect!</p>
                            </div>
                        ) : (
                            friends.map(friend => (
                                <div key={friend.id} className="glass-card p-4 flex items-center gap-4 bg-white/60">
                                    <Link to={`/profile/${friend.id}`} className="flex items-center gap-4 flex-1 group">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-primary to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                            {friend.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-cyber-text font-bold group-hover:text-cyber-primary transition-colors">{friend.full_name || friend.username}</h3>
                                            <p className="text-xs text-cyber-muted">@{friend.username}</p>
                                        </div>
                                    </Link>
                                    <div className="ml-auto">
                                        <Link to={`/chat`} className="p-2 hover:bg-slate-100 rounded-full text-cyber-primary transition-colors block" title="Message">
                                            <MessageSquare size={20} />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* FIND PEOPLE TAB */}
                {activeTab === 'find' && (
                    <div>
                        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by username or email..."
                                className="glass-input flex-1"
                            />
                            <button type="submit" className="glass-button-primary">
                                <Search size={20} />
                            </button>
                        </form>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {searchResults.map(user => (
                                <div key={user.id} className="glass-card p-4 flex items-center gap-4 bg-white/60">
                                    <Link to={`/profile/${user.id}`} className="flex-1 flex items-center gap-4 group">
                                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-cyber-text font-bold text-lg">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-cyber-text font-bold group-hover:text-cyber-primary transition-colors">{user.full_name || user.username}</h3>
                                            <p className="text-xs text-cyber-muted">@{user.username}</p>
                                        </div>
                                    </Link>
                                    <div>
                                        {user.friendship_status === 'none' && (
                                            <button
                                                onClick={() => sendRequest(user.id)}
                                                className="glass-button-primary text-xs py-1.5 flex items-center gap-1"
                                            >
                                                <UserPlus size={14} /> Add
                                            </button>
                                        )}
                                        {user.friendship_status === 'outgoing_request' && (
                                            <span className="text-xs text-cyber-muted flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                                <Clock size={14} /> Pending
                                            </span>
                                        )}
                                        {user.friendship_status === 'incoming_request' && (
                                            <span className="text-xs text-amber-500 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                                <UserPlus size={14} /> Invited You
                                            </span>
                                        )}
                                        {user.friendship_status === 'accepted' && (
                                            <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-200">
                                                <UserCheck size={14} /> Friend
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* REQUESTS TAB */}
                {activeTab === 'requests' && !loading && (
                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <div className="text-center py-10 text-cyber-muted">
                                <p>No pending friend requests.</p>
                            </div>
                        ) : (
                            requests.map(req => (
                                <div key={req.id} className="glass-card p-4 flex items-center justify-between bg-white/60">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-200">
                                            {req.requester_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-cyber-text font-bold">{req.requester_name}</h3>
                                            <p className="text-xs text-cyber-muted">wants to be your friend</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => acceptRequest(req.id)}
                                            className="px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm flex items-center gap-1 text-sm font-medium"
                                        >
                                            <Check size={16} /> Accept
                                        </button>
                                        <button
                                            // Reject not implemented yet
                                            className="px-2 py-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
