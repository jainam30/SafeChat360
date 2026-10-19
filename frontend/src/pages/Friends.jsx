import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { 
    Users, UserPlus, Search, MessageSquare, Check, X, 
    UserCheck, RefreshCw, Clock, Globe, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Contacts() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState('all');
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Search state
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('search') || '');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    // Sync URL search param
    useEffect(() => {
        const queryFromUrl = searchParams.get('search');
        if (queryFromUrl !== null && queryFromUrl !== searchQuery) {
            setSearchQuery(queryFromUrl);
        }
    }, [searchParams]);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            if (searchQuery.trim()) {
                setSearchParams({ search: searchQuery.trim() }, { replace: true });
            } else {
                setSearchParams({}, { replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, setSearchParams]);

    // Perform live user discovery search
    useEffect(() => {
        const query = debouncedQuery.trim();
        if (!query) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        if (!token) return;

        const controller = new AbortController();
        setIsSearching(true);

        fetch(getApiUrl(`/api/friends/search?q=${encodeURIComponent(query)}&limit=20`), {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal
        })
        .then(async (res) => {
            if (res.ok) {
                const data = await res.json();
                setSearchResults(Array.isArray(data) ? data : []);
            } else {
                setSearchResults([]);
            }
        })
        .catch((err) => {
            if (err.name !== 'AbortError') {
                console.error("Discovery search error:", err);
            }
        })
        .finally(() => {
            setIsSearching(false);
        });

        return () => controller.abort();
    }, [debouncedQuery, token]);

    const fetchAllData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [fRes, rRes, gRes, sRes] = await Promise.allSettled([
                fetch(getApiUrl('/api/friends/'), { headers }),
                fetch(getApiUrl('/api/friends/requests'), { headers }),
                fetch(getApiUrl('/api/groups/'), { headers }),
                fetch(getApiUrl('/api/friends/suggestions'), { headers })
            ]);

            if (fRes.status === 'fulfilled' && fRes.value.ok) {
                const data = await fRes.value.json();
                setFriends(Array.isArray(data) ? data : []);
            }
            if (rRes.status === 'fulfilled' && rRes.value.ok) {
                const data = await rRes.value.json();
                setRequests(Array.isArray(data) ? data : []);
            }
            if (gRes.status === 'fulfilled' && gRes.value.ok) {
                const data = await gRes.value.json();
                setGroups(Array.isArray(data) ? data : []);
            }
            if (sRes.status === 'fulfilled' && sRes.value.ok) {
                const data = await sRes.value.json();
                setSuggestions(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Failed to load contacts data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [token]);

    const acceptRequest = async (friendshipId) => {
        setProcessingId(friendshipId);
        try {
            const res = await fetch(getApiUrl(`/api/friends/accept/${friendshipId}`), { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.ok) {
                toast.success("Friend request accepted!");
                // Update local search results if present
                setSearchResults(prev => prev.map(u => 
                    u.friendship_id === friendshipId ? { ...u, friendship_status: 'accepted' } : u
                ));
                fetchAllData();
            } else {
                toast.error("Failed to accept request");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error accepting request");
        } finally {
            setProcessingId(null);
        }
    };

    const rejectRequest = async (friendshipId) => {
        setProcessingId(friendshipId);
        try {
            const res = await fetch(getApiUrl(`/api/friends/reject/${friendshipId}`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Friend request declined");
                setSearchResults(prev => prev.map(u => 
                    u.friendship_id === friendshipId ? { ...u, friendship_status: 'none', friendship_id: null } : u
                ));
                setRequests(prev => prev.filter(r => r.id !== friendshipId));
                fetchAllData();
            } else {
                toast.error("Failed to decline request");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error declining request");
        } finally {
            setProcessingId(null);
        }
    };

    const sendFriendRequest = async (targetUserId) => {
        setProcessingId(targetUserId);
        try {
            const res = await fetch(getApiUrl(`/api/friends/request/${targetUserId}`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const resData = await res.json().catch(() => ({}));
                toast.success("Friend request sent!");
                // Update search results state to reflect outgoing request immediately
                setSearchResults(prev => prev.map(u => 
                    u.id === targetUserId ? { ...u, friendship_status: 'outgoing_request', friendship_id: resData.friendship_id } : u
                ));
                setSuggestions(prev => prev.filter(s => s.id !== targetUserId));
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.detail || "Failed to send request");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error sending request");
        } finally {
            setProcessingId(null);
        }
    };

    // Filter contacts based on search and active tab
    const filteredFriends = friends.filter(friend => {
        const name = (friend.username || friend.full_name || '').toLowerCase();
        const matchesSearch = name.includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        if (activeTab === 'online') {
            return friend.is_online || friend.online;
        }
        return true;
    });

    const isSearchingMode = debouncedQuery.trim().length > 0;

    return (
        <div className="flex flex-col xl:flex-row h-full w-full bg-white md:bg-transparent">
            
            {/* MAIN PANE */}
            <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-slate-200 overflow-y-auto">
                <div className="p-6 pb-2">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Contacts & Friends</h1>
                            <p className="text-sm font-medium text-slate-500 mt-1">Manage your connections and discover registered SafeChat360 users</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={fetchAllData}
                                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                                title="Refresh contacts"
                            >
                                <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} /> Refresh
                            </button>
                            <button 
                                onClick={() => {
                                    setActiveTab('suggestions');
                                    setSearchQuery('');
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <UserPlus size={14} /> Find People
                            </button>
                        </div>
                    </div>

                    {/* Tabs (shown always) */}
                    <div className="flex items-center gap-6 border-b border-slate-200">
                        {[
                            { id: 'all', label: `All Contacts (${friends.length})` },
                            { id: 'online', label: 'Online Now' },
                            { id: 'requests', label: `Requests (${requests.length})` },
                            { id: 'suggestions', label: 'Suggested' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-3 text-xs font-bold border-b-2 transition-colors ${
                                    activeTab === tab.id 
                                    ? 'border-blue-600 text-blue-600' 
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 pt-4 space-y-6">
                    
                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search registered users by username or name..." 
                            className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* GLOBAL DISCOVERY SEARCH RESULTS (when user types in search) */}
                    {isSearchingMode && (
                        <div className="space-y-3 bg-gradient-to-b from-blue-50/50 to-transparent p-4 rounded-2xl border border-blue-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-blue-600" />
                                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                        Global User Discovery
                                    </h2>
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                                        {isSearching ? 'Searching...' : `${searchResults.length} found`}
                                    </span>
                                </div>
                                <span className="text-[11px] text-slate-500">Live directory search</span>
                            </div>

                            {isSearching ? (
                                <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                                    <RefreshCw size={14} className="animate-spin text-blue-600" /> Searching SafeChat360 members...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    {searchResults.map((person) => (
                                        <div 
                                            key={person.id} 
                                            className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm hover:border-blue-200 transition-all"
                                        >
                                            <div 
                                                onClick={() => navigate(`/profile/${person.username}`)}
                                                className="flex items-center gap-3 min-w-0 cursor-pointer group"
                                            >
                                                <img 
                                                    src={person.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`} 
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-blue-500 transition-all shrink-0" 
                                                    alt="" 
                                                />
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                        {person.full_name || person.username}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-400 truncate">@{person.username}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                {/* Action based on relationship */}
                                                {person.friendship_status === 'none' && (
                                                    <button 
                                                        disabled={processingId === person.id}
                                                        onClick={() => sendFriendRequest(person.id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                                                    >
                                                        <UserPlus size={13} />
                                                        <span>{processingId === person.id ? "Adding..." : "Add Friend"}</span>
                                                    </button>
                                                )}

                                                {person.friendship_status === 'outgoing_request' && (
                                                    <span className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200">
                                                        <Clock size={12} className="text-amber-500" />
                                                        <span>Pending</span>
                                                    </span>
                                                )}

                                                {person.friendship_status === 'incoming_request' && (
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            disabled={processingId === person.friendship_id}
                                                            onClick={() => acceptRequest(person.friendship_id)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                                                            title="Accept request"
                                                        >
                                                            <Check size={12} /> Accept
                                                        </button>
                                                        <button 
                                                            disabled={processingId === person.friendship_id}
                                                            onClick={() => rejectRequest(person.friendship_id)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 border border-slate-200"
                                                            title="Decline request"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                )}

                                                {person.friendship_status === 'accepted' && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-lg border border-green-200 flex items-center gap-1">
                                                            <UserCheck size={12} /> Friend
                                                        </span>
                                                        <button 
                                                            onClick={() => navigate(`/chats/${person.id}`)}
                                                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                                                            title="Send message"
                                                        >
                                                            <MessageSquare size={13} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-slate-400 text-xs">
                                    No registered SafeChat360 users found matching <strong className="text-slate-600">"{debouncedQuery}"</strong>.
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECTION: EXISTING CONTACTS */}
                    {(activeTab === 'all' || activeTab === 'online') && (
                        <div>
                            {isSearchingMode && (
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                    Your Saved Contacts ({filteredFriends.length})
                                </h3>
                            )}

                            {filteredFriends.length > 0 ? (
                                <div className="space-y-1.5">
                                    {filteredFriends.map((contact) => (
                                        <div 
                                            key={contact.id} 
                                            className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100 group"
                                        >
                                            <div 
                                                onClick={() => navigate(`/profile/${contact.username}`)}
                                                className="flex items-center gap-3.5 min-w-0 cursor-pointer"
                                            >
                                                <div className="relative shrink-0">
                                                    <img 
                                                        src={contact.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.username}`} 
                                                        className="w-11 h-11 rounded-full object-cover border border-slate-200" 
                                                        alt="" 
                                                    />
                                                    {(contact.is_online || contact.online) && (
                                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                        {contact.full_name || contact.username}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        @{contact.username}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => navigate(`/chats/${contact.id}`)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors"
                                                >
                                                    <MessageSquare size={14} />
                                                    <span>Chat</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : !isSearchingMode ? (
                                <div className="p-12 text-center text-slate-400">
                                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                                    <p className="text-sm font-bold text-slate-700">No contacts found</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        You haven't connected with any friends yet. Use the search bar above to discover users!
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('suggestions')}
                                        className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
                                    >
                                        Explore Suggested People
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* TAB: REQUESTS */}
                    {activeTab === 'requests' && (
                        <div>
                            {requests.length > 0 ? (
                                <div className="space-y-3 max-w-xl">
                                    {requests.map((req) => (
                                        <div key={req.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                            <div 
                                                onClick={() => req.requester_username && navigate(`/profile/${req.requester_username}`)}
                                                className="flex items-center gap-3 min-w-0 cursor-pointer"
                                            >
                                                <img 
                                                    src={req.requester_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.requester_username || 'user'}`} 
                                                    className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0" 
                                                    alt="" 
                                                />
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-bold text-slate-900 truncate">
                                                        {req.requester_name || req.requester_username || 'SafeChat User'}
                                                    </h4>
                                                    <p className="text-xs text-slate-400">@{req.requester_username || 'user'} &bull; Sent request</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    disabled={processingId === req.id}
                                                    onClick={() => acceptRequest(req.id)} 
                                                    className="flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                                                >
                                                    <Check size={14} /> Accept
                                                </button>
                                                <button 
                                                    disabled={processingId === req.id}
                                                    onClick={() => rejectRequest(req.id)} 
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 border border-slate-200"
                                                >
                                                    <X size={14} /> Decline
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center text-slate-400">
                                    <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                                    <p className="text-sm font-bold text-slate-700">No pending friend requests</p>
                                    <p className="text-xs text-slate-400 mt-1">When someone sends you a friend request, it will appear here.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: SUGGESTIONS */}
                    {activeTab === 'suggestions' && (
                        <div>
                            {suggestions.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                                    {suggestions.map((person) => (
                                        <div key={person.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                                            <div 
                                                onClick={() => navigate(`/profile/${person.username}`)}
                                                className="flex items-center gap-3 min-w-0 cursor-pointer"
                                            >
                                                <img 
                                                    src={person.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`} 
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" 
                                                    alt="" 
                                                />
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-bold text-slate-900 truncate">{person.username}</h4>
                                                    <p className="text-[10px] text-slate-400 truncate">{person.full_name || `@${person.username}`}</p>
                                                </div>
                                            </div>
                                            <button 
                                                disabled={processingId === person.id}
                                                onClick={() => sendFriendRequest(person.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors border border-blue-200 disabled:opacity-50 shrink-0"
                                            >
                                                <UserPlus size={13} />
                                                <span>{processingId === person.id ? "Adding..." : "Add"}</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center text-slate-400">
                                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                                    <p className="text-sm font-bold text-slate-700">No suggestions right now</p>
                                    <p className="text-xs text-slate-400 mt-1">Check back later or search by username above.</p>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* RIGHT SIDEBAR (Requests & Groups Overview) */}
            <div className="w-full xl:w-[320px] bg-slate-50 border-l border-slate-200 overflow-y-auto shrink-0 p-5 space-y-8 hidden lg:block">
                
                {/* Friend Requests Sidebar */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Requests ({requests.length})
                        </h2>
                    </div>
                    {requests.length > 0 ? (
                        <div className="space-y-2.5">
                            {requests.slice(0, 3).map((req) => (
                                <div key={req.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-2.5 mb-2.5">
                                        <img 
                                            src={req.requester_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.requester_username || 'user'}`} 
                                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" 
                                            alt="" 
                                        />
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-bold text-slate-900 truncate">{req.requester_name || req.requester_username || 'User'}</h4>
                                            <p className="text-[10px] text-slate-400 truncate">@{req.requester_username || 'user'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            disabled={processingId === req.id}
                                            onClick={() => acceptRequest(req.id)}
                                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            Accept
                                        </button>
                                        <button 
                                            disabled={processingId === req.id}
                                            onClick={() => rejectRequest(req.id)}
                                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic">No incoming requests</p>
                    )}
                </div>

                {/* My Groups Sidebar */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            My Groups ({groups.length})
                        </h2>
                        <Link to="/chats" className="text-xs font-semibold text-blue-600 hover:underline">View All</Link>
                    </div>
                    {groups.length > 0 ? (
                        <div className="space-y-2">
                            {groups.slice(0, 5).map(group => (
                                <div 
                                    key={group.id} 
                                    onClick={() => navigate(`/chats/group/${group.id}`)}
                                    className="flex items-center justify-between p-2.5 hover:bg-white rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200 hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 font-bold text-xs">
                                            <Users size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-bold text-slate-900 truncate">{group.name}</h4>
                                            <p className="text-[10px] text-slate-400 truncate">{group.description || 'Group'}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Open</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic">No groups joined</p>
                    )}
                </div>

            </div>
        </div>
    );
}
