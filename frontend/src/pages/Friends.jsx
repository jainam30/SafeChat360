import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { 
    Users, UserPlus, Search, Download, MessageSquare, Phone, 
    Video, MoreVertical, Check, X, Building, Code, Plane 
} from 'lucide-react';

export default function Contacts() {
    const { token, user } = useAuth();

    const [activeTab, setActiveTab] = useState('all');
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) {
            fetchFriends();
            fetchRequests();
            fetchGroups();
        }
    }, [token]);

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
        try {
            const res = await fetch(getApiUrl('/api/friends/requests'), { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setRequests((await res.json()) || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await fetch(getApiUrl('/api/groups/'), { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setGroups((await res.json()) || []);
        } catch (e) {
            console.error(e);
        }
    };

    const acceptRequest = async (friendshipId) => {
        try {
            const res = await fetch(getApiUrl(`/api/friends/accept/${friendshipId}`), { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                fetchRequests();
                fetchFriends();
            }
        } catch (e) { console.error(e); }
    };

    // Mock data for UI design fidelity
    const recentlyContacted = [
        { id: 1, name: 'Priya Mehta', image: 'https://i.pravatar.cc/150?u=priya', online: true },
        { id: 2, name: 'Rohan Kumar', image: 'https://i.pravatar.cc/150?u=rohan', online: true },
        { id: 3, name: 'Neha Jain', image: 'https://i.pravatar.cc/150?u=neha', online: true },
        { id: 4, name: 'Aarav Sharma', image: 'https://i.pravatar.cc/150?u=aarav', online: true },
        { id: 5, name: 'Sneha Patel', image: 'https://i.pravatar.cc/150?u=sneha', online: false },
        { id: 6, name: 'Karan Singh', image: 'https://i.pravatar.cc/150?u=karan', online: true },
    ];

    const suggestedPeople = [
        { id: 1, name: 'Divya Patel', mutual: '12 mutual friends', image: 'https://i.pravatar.cc/150?u=divya' },
        { id: 2, name: 'Arjun Mehta', mutual: '8 mutual friends', image: 'https://i.pravatar.cc/150?u=arjun' },
        { id: 3, name: 'Kavya Singh', mutual: '5 mutual friends', image: 'https://i.pravatar.cc/150?u=kavya' },
    ];

    const allContacts = friends.length > 0 ? friends : [
        { id: 1, name: 'Priya Mehta', status: 'Online', online: true, image: 'https://i.pravatar.cc/150?u=priya' },
        { id: 2, name: 'Rohan Kumar', status: 'Online', online: true, image: 'https://i.pravatar.cc/150?u=rohan' },
        { id: 3, name: 'Neha Jain', status: 'Online', online: true, image: 'https://i.pravatar.cc/150?u=neha' },
        { id: 4, name: 'Aarav Sharma', status: 'Last seen 10 minutes ago', online: false, image: 'https://i.pravatar.cc/150?u=aarav' },
        { id: 5, name: 'Sneha Patel', status: 'Last seen 1 hour ago', online: false, image: 'https://i.pravatar.cc/150?u=sneha' },
    ];

    const displayGroups = groups.length > 0 ? groups : [
        { id: 1, name: 'Project Team', members: '8 members', icon: <Building className="text-white w-5 h-5"/>, color: 'bg-indigo-500' },
        { id: 2, name: 'College Friends', members: '32 members', icon: <Users className="text-white w-5 h-5"/>, color: 'bg-blue-500' },
        { id: 3, name: 'Tech Discussions', members: '56 members', icon: <Code className="text-white w-5 h-5"/>, color: 'bg-teal-500' },
        { id: 4, name: 'Travel Buddies', members: '15 members', icon: <Plane className="text-white w-5 h-5"/>, color: 'bg-sky-500' },
    ];

    return (
        <div className="flex flex-col xl:flex-row h-full w-full bg-white md:bg-transparent">
            
            {/* MAIN PANE */}
            <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-slate-200 overflow-y-auto">
                <div className="p-6 pb-2">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Contacts</h1>
                            <p className="text-sm font-medium text-slate-500 mt-1">People you know, chat with, and stay connected</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 font-bold text-sm rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                                <Download size={16} /> Import Contacts
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                                <UserPlus size={16} /> Add Contact
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-6 border-b border-slate-200">
                        {['All Contacts', 'Online', 'Followers', 'Following', 'Blocked'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                                    activeTab === tab.toLowerCase() 
                                    ? 'border-blue-600 text-blue-600' 
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 pt-4 space-y-8">
                    
                    {/* Recently Contacted */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 mb-4">Recently Contacted</h2>
                        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                            {recentlyContacted.map(contact => (
                                <div key={contact.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer">
                                    <div className="relative">
                                        <img src={contact.image} className="w-[60px] h-[60px] rounded-full object-cover border border-slate-200" alt={contact.name} />
                                        {contact.online && (
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                        )}
                                    </div>
                                    <span className="text-xs font-bold text-slate-800 w-16 text-center truncate">{contact.name}</span>
                                </div>
                            ))}
                            <button className="w-[60px] h-[60px] rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors flex-shrink-0">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                            </button>
                        </div>
                    </div>

                    {/* All Contacts List */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-900">All Contacts ({allContacts.length})</h2>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search contacts..." 
                                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            {allContacts.map((contact, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                        <div className="relative">
                                            <img src={contact.profile_photo || contact.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.username || contact.name}`} className="w-12 h-12 rounded-full object-cover border border-slate-200" alt="avatar" />
                                            {contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                                            {contact.status === 'Last seen 10 minutes ago' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white rounded-full"></div>}
                                            {contact.status === 'Last seen 1 hour ago' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-slate-400 border-2 border-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{contact.username || contact.name}</h3>
                                            <p className={`text-xs font-medium mt-0.5 ${contact.online ? 'text-green-600' : 'text-slate-500'}`}>
                                                {contact.online ? (
                                                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online</span>
                                                ) : (
                                                    contact.status || 'Offline'
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><MessageSquare size={18}/></button>
                                        <button className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Phone size={18}/></button>
                                        <button className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"><Video size={18}/></button>
                                        <button className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"><MoreVertical size={18}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* RIGHT SIDEBAR (Requests & Suggestions) */}
            <div className="w-full xl:w-[320px] bg-slate-50 border-l border-slate-200 overflow-y-auto shrink-0 p-5 space-y-8 hidden lg:block">
                
                {/* Friend Requests */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-slate-900">Friend Requests (3)</h2>
                        <button className="text-xs font-bold text-blue-600 hover:underline">See All</button>
                    </div>
                    <div className="space-y-3">
                        {/* Mocking requests if none from backend for UI fidelity */}
                        {(requests.length > 0 ? requests : [
                            { id: 1, requester_username: 'Rahul Gupta', mutual: '5 mutual friends', image: 'https://i.pravatar.cc/150?u=rahul' },
                            { id: 2, requester_username: 'Ishita Sharma', mutual: '3 mutual friends', image: 'https://i.pravatar.cc/150?u=ishita' },
                            { id: 3, requester_username: 'Manav Soni', mutual: '7 mutual friends', image: 'https://i.pravatar.cc/150?u=manav' }
                        ]).map((req, idx) => (
                            <div key={idx} className="flex flex-col gap-2 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <img src={req.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.requester_username}`} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{req.requester_username}</h4>
                                        <p className="text-[11px] font-medium text-slate-500">{req.mutual || '2 mutual friends'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => acceptRequest(req.id)} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">Accept</button>
                                    <button className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors">Decline</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Suggested People */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-slate-900">Suggested People</h2>
                        <button className="text-xs font-bold text-blue-600 hover:underline">See All</button>
                    </div>
                    <div className="space-y-4">
                        {suggestedPeople.map(person => (
                            <div key={person.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={person.image} className="w-10 h-10 rounded-full object-cover" alt={person.name} />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{person.name}</h4>
                                        <p className="text-[11px] font-medium text-slate-500">{person.mutual}</p>
                                    </div>
                                </div>
                                <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
                                    Follow
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* My Groups */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-slate-900">My Groups</h2>
                        <button className="text-xs font-bold text-blue-600 hover:underline">See All</button>
                    </div>
                    <div className="space-y-3">
                        {displayGroups.map(group => (
                            <div key={group.id} className="flex items-center justify-between p-2 hover:bg-white rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200 hover:shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${group.color || 'bg-indigo-500'} flex items-center justify-center`}>
                                        {group.icon || <Users className="text-white w-5 h-5"/>}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{group.name}</h4>
                                        <p className="text-[11px] font-medium text-slate-500">{group.members || '0 members'}</p>
                                    </div>
                                </div>
                                <button className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">View</button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
