import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Users, UserPlus, Search, UserCheck, Clock, Check, X, MessageSquare, Phone, Video, ShieldAlert, CircleSlash, Users as UsersIcon } from 'lucide-react';

export default function Contacts() {
    const { token } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'all';

    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) {
            fetchFriends();
            if (activeTab === 'requests') fetchRequests();
            if (activeTab === 'groups') fetchGroups();
        }
    }, [activeTab, token]);

    const handleTabChange = (tab) => {
        setSearchParams({ tab });
    };

    const fetchFriends = async () => {
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/friends/'), { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setFriends((await res.json()) || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/friends/requests'), { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setRequests((await res.json()) || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/groups/'), { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setGroups((await res.json()) || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const acceptRequest = async (friendshipId) => {
        try {
            const res = await fetch(getApiUrl(`/api/friends/accept/${friendshipId}`), { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) fetchRequests();
        } catch (e) { console.error(e); }
    };

    const renderEmptyState = (icon, title, message, actionLabel, actionLink) => (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-slate-200 border-dashed rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 max-w-sm mb-6">{message}</p>
            {actionLabel && (
                <Link to={actionLink} className="px-5 py-2.5 bg-cyber-primary text-white font-medium rounded-lg shadow-sm hover:bg-blue-600 transition-colors">
                    {actionLabel}
                </Link>
            )}
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto pb-12 px-4 md:px-0">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                        <Users className="text-cyber-primary" />
                        Contacts
                    </h1>
                    <p className="text-slate-500">Manage your connections and find people you know.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/social?tab=explore" className="px-4 py-2 bg-white text-slate-700 border border-slate-200 font-medium rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-2">
                        <Search size={18} /> Find People
                    </Link>
                </div>
            </div>

            {/* Tabs & Content Grid */}
            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Left Sidebar Tabs */}
                <div className="lg:w-64 shrink-0">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden sticky top-20">
                        <nav className="p-2 space-y-1">
                            {[
                                { id: 'all', label: 'All Contacts', icon: <Users size={18} /> },
                                { id: 'online', label: 'Online', icon: <span className="w-2.5 h-2.5 bg-green-500 rounded-full ml-1 mr-1"></span> },
                                { id: 'groups', label: 'My Groups', icon: <UsersIcon size={18} /> },
                                { id: 'followers', label: 'Followers', icon: <UserCheck size={18} /> },
                                { id: 'following', label: 'Following', icon: <UserPlus size={18} /> },
                                { id: 'requests', label: 'Requests', icon: <Clock size={18} /> },
                                { id: 'blocked', label: 'Blocked', icon: <CircleSlash size={18} /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-cyber-primary' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                    <span className={activeTab === tab.id ? 'text-cyber-primary' : 'text-slate-400'}>{tab.icon}</span>
                                    {tab.label}
                                    {tab.id === 'requests' && requests.length > 0 && (
                                        <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{requests.length}</span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    
                    {loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                            {[1, 2, 3, 4].map(n => (
                                <div key={n} className="h-24 bg-slate-100 rounded-xl"></div>
                            ))}
                        </div>
                    )}

                    {!loading && (
                        <>
                            {/* ALL CONTACTS */}
                            {activeTab === 'all' && (
                                <>
                                    {friends.length === 0 ? renderEmptyState(<Users size={32} />, "You don't have any contacts yet.", "Connect with friends to start chatting.", "Find People", "/social?tab=explore") : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {friends.map(friend => (
                                                <div key={friend.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                                    <Link to={`/profile/${friend.username}`} className="flex-shrink-0 relative">
                                                        {friend.profile_photo ? (
                                                            <img src={friend.profile_photo} alt={friend.username} className="w-12 h-12 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                                                                {friend.username.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        {friend.is_online && (
                                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                                        )}
                                                    </Link>
                                                    <div className="flex-1 min-w-0">
                                                        <Link to={`/profile/${friend.username}`} className="block hover:underline">
                                                            <h3 className="text-slate-900 font-bold truncate">{friend.full_name || friend.username}</h3>
                                                            <p className="text-xs text-slate-500 truncate">@{friend.username}</p>
                                                        </Link>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Link to={`/chats/${friend.id}`} className="p-2 text-slate-400 hover:text-cyber-primary hover:bg-blue-50 rounded-full transition-colors" title="Message">
                                                            <MessageSquare size={18} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ONLINE */}
                            {activeTab === 'online' && (
                                <>
                                    {friends.filter(f => f.is_online).length === 0 ? renderEmptyState(<Users size={32} />, "No contacts online.", "Check back later to see who's available.", null, null) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {friends.filter(f => f.is_online).map(friend => (
                                                <div key={friend.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                                                            {friend.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-slate-900 font-bold truncate">{friend.full_name || friend.username}</h3>
                                                        <p className="text-xs text-slate-500 truncate">@{friend.username}</p>
                                                    </div>
                                                    <Link to={`/chats/${friend.id}`} className="px-3 py-1.5 bg-blue-50 text-cyber-primary font-medium text-sm rounded-lg hover:bg-blue-100 transition-colors">
                                                        Message
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* GROUPS */}
                            {activeTab === 'groups' && (
                                <>
                                    {groups.length === 0 ? renderEmptyState(<UsersIcon size={32} />, "You haven't joined any groups yet.", "Create or join a group to start collaborating.", "Create Group", "/chats") : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {groups.map(group => (
                                                <div key={group.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0">
                                                        {group.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-slate-900 font-bold truncate">{group.name}</h3>
                                                        <p className="text-xs text-slate-500 truncate">{group.members_count || 0} members</p>
                                                    </div>
                                                    <Link to={`/chats/group/${group.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                        <MessageSquare size={18} />
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* UNSUPPORTED TABS */}
                            {(activeTab === 'followers' || activeTab === 'following' || activeTab === 'blocked') && (
                                renderEmptyState(<ShieldAlert size={32} />, `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Not Available`, "This feature is either not supported by the current backend or you have no entries here.", null, null)
                            )}

                            {/* REQUESTS */}
                            {activeTab === 'requests' && (
                                <>
                                    {requests.length === 0 ? renderEmptyState(<Check size={32} />, "You're all caught up.", "No pending contact requests at this time.", null, null) : (
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-slate-900 mb-4">Incoming Requests ({requests.length})</h3>
                                            {requests.map(req => (
                                                <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg border border-slate-200">
                                                            {req.requester_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-slate-900 font-bold">{req.requester_name}</h3>
                                                            <p className="text-xs text-slate-500">wants to connect</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => acceptRequest(req.id)} className="px-4 py-2 bg-cyber-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm text-sm font-bold">
                                                            Accept
                                                        </button>
                                                        <button className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-bold">
                                                            Decline
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
