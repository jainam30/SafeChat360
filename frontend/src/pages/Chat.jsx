import React, { useState, useEffect, useRef } from 'react';
import { formatTimeForUser } from '../utils/dateFormatter';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import toast from 'react-hot-toast';
import {
    Send, User as UserIcon, Users, Hash, Plus, MessageSquare, Phone, Video,
    Sparkles, Trash2, Undo2, MoreHorizontal, ArrowLeft, Image as ImageIcon,
    Smile, Heart, Info
} from 'lucide-react';
import CreateGroupModal from '../components/CreateGroupModal';
import CosmicInput from '../components/UI/CosmicInput';

import { useCall } from '../context/CallContext';

export default function Chat() {
    const { user, token } = useAuth();
    const { socket, isConnected, startCall: startCallContext } = useCall();

    // State
    const { conversationId, groupId } = useParams();
    const navigate = useNavigate();
    const [activeChat, setActiveChat] = useState({ type: null, id: null, data: null });

    useEffect(() => {
        if (conversationId) {
            const id = parseInt(conversationId);
            const u = friends.find(f => f.id === id) || users.find(u => u.id === id);
            setActiveChat({ type: 'private', id, data: u || { username: '...', id } });
            setMobileView('chat');
        } else if (groupId) {
            const id = parseInt(groupId);
            const g = groups.find(g => g.id === id);
            setActiveChat({ type: 'group', id, data: g || { name: '...', id } });
            setMobileView('chat');
        } else {
            setActiveChat({ type: null, id: null, data: null });
            setMobileView('list');
        }
    }, [conversationId, groupId, friends, users, groups]);
    const [users, setUsers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [groups, setGroups] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [showGroupModal, setShowGroupModal] = useState(false);

    const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

    const [vibe, setVibe] = useState({ score: 100, status: 'safe', loading: false });
    const [isAiLoading, setIsAiLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const activeChatRef = useRef(activeChat);

    const [activeMessageMenu, setActiveMessageMenu] = useState(null);

    // Keep ref in sync
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    // Fetch Initial Data
    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                const headers = { 'Authorization': `Bearer ${token}` };
                const [uRes, fRes, gRes] = await Promise.all([
                    fetch(getApiUrl('/api/chat/users'), { headers }),
                    fetch(getApiUrl('/api/friends/'), { headers }),
                    fetch(getApiUrl('/api/groups/'), { headers })
                ]);

                if (uRes.ok) setUsers(await uRes.json());
                if (fRes.ok) setFriends(await fRes.json());
                if (gRes.ok) setGroups(await gRes.json());

            } catch (err) {
                console.error("Failed to fetch chat data", err);
            }
        };
        fetchData();
    }, [token]);

    // Fetch History
    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) return;
            setMessages([]);

            try {
                let url = '/api/chat/history';
                if (activeChat.type === 'private') {
                    url += `?other_user_id=${activeChat.id}`;
                } else if (activeChat.type === 'group') {
                    url += `?group_id=${activeChat.id}`;
                }

                const res = await fetch(getApiUrl(url), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const history = await res.json();
                    setMessages(history);
                    // Mark fetched messages as read (powers unread badges server-side)
                    const unreadIds = history
                        .filter(m => m && m.id && m.sender_id !== user?.id && !m.is_unsent)
                        .map(m => m.id);
                    if (unreadIds.length) {
                        fetch(getApiUrl('/api/chat/read'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ message_ids: unreadIds })
                        }).catch(() => { });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };
        fetchHistory();
    }, [activeChat, token]);

    // WebSocket Listeners (using global socket)
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Ignore call signaling (handled by context)
                if (['call-request', 'call-response', 'offer', 'answer', 'ice-candidate'].includes(data.type)) return;

                if (data.type === 'message' || !data.type) {
                    const currentActive = activeChatRef.current;
                    const isRelevant =
                        (currentActive.type === 'global' && !data.receiver_id && !data.group_id) ||
                        (currentActive.type === 'private' && (data.sender_id === currentActive.id || data.receiver_id === currentActive.id)) ||
                        (currentActive.type === 'group' && data.group_id === currentActive.id);

                    if (isRelevant) {
                        setMessages(prev => {
                            if (prev.find(m => m.id === data.id)) return prev;
                            return [...prev, data];
                        });
                    } else {
                        // Background Notification Logic
                        if (data.sender_id && !data.group_id) {
                            setFriends(prev => prev.map(f => {
                                if (f.id === data.sender_id) {
                                    return { ...f, unread_count: (f.unread_count || 0) + 1, last_message: data.content };
                                }
                                return f;
                            }));
                        }
                    }
                } else if (data.type === 'message_update') {
                    setMessages(prev => prev.map(msg =>
                        msg.id === data.id
                            ? { ...msg, ...data, content: "Message unsent" }
                            : msg
                    ));
                }
            } catch (e) {
                console.error("WS Parse error", e);
            }
        };

        socket.addEventListener('message', handleMessage);
        return () => socket.removeEventListener('message', handleMessage);
    }, [socket]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Real Vibe Check: analyze the active conversation (debounced on new messages)
    useEffect(() => {
        if (!token) return;
        const t = setTimeout(async () => {
            setVibe(v => ({ ...v, loading: true }));
            try {
                let url = '/api/chat/vibe';
                if (activeChat.type === 'private') url += `?other_user_id=${activeChat.id}`;
                else if (activeChat.type === 'group') url += `?group_id=${activeChat.id}`;
                const res = await fetch(getApiUrl(url), { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    setVibe({ score: data.score, status: data.status, loading: false });
                } else {
                    setVibe(v => ({ ...v, loading: false }));
                }
            } catch {
                setVibe(v => ({ ...v, loading: false }));
            }
        }, 800);
        return () => clearTimeout(t);
    }, [activeChat, messages.length, token]);


    // Polling (Fallback when WS is disconnected)
    useEffect(() => {
        if (!token || isConnected) return;

        const pollMessages = async () => {
            if (!activeChat.id && activeChat.type !== 'global') return;

            try {
                let url = '/api/chat/history';
                if (activeChat.type === 'private') {
                    url += `?other_user_id=${activeChat.id}`;
                } else if (activeChat.type === 'group') {
                    url += `?group_id=${activeChat.id}`;
                }

                const res = await fetch(getApiUrl(url), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const freshMsgs = await res.json();
                    if (Array.isArray(freshMsgs)) {
                        setMessages(prev => {
                            const lastPrev = prev[prev.length - 1];
                            const lastNew = freshMsgs[freshMsgs.length - 1];
                            if (!lastPrev || !lastNew || lastPrev.id !== lastNew.id || prev.length !== freshMsgs.length) {
                                return freshMsgs;
                            }
                            return prev;
                        });
                    }
                }
            } catch (e) { console.error("Poll err", e); }
        };

        const intervalId = setInterval(pollMessages, 5000);
        return () => clearInterval(intervalId);
    }, [activeChat, token, isConnected]);

    const startCall = (isVideo) => {
        if (!isConnected) {
            alert("Chat service disconnected. Please wait for reconnection.");
            return;
        }
        if (activeChat.type !== 'private') return;
        startCallContext(activeChat.data, isVideo);
    };

    const sendMessage = async () => {
        if (!inputValue.trim()) return;

        try {
            const body = {
                content: inputValue,
                receiver_id: activeChat.type === 'private' ? activeChat.id : null,
                group_id: activeChat.type === 'group' ? activeChat.id : null
            };

            const res = await fetch(getApiUrl('/api/chat/send'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                if (res.status === 401) {
                    alert("Session expired. Please log in again.");
                    // Force logout or redirect
                    // Since we have logout from useAuth(), let's use it? 
                    // But logout() is not destructured in the first line of Chat component yet.
                    // Let's reload to be safe and force auth check
                    window.location.href = '/login';
                    return;
                }

                let errorMsg = "Failed to send message";
                try {
                    const err = await res.json();
                    errorMsg = err.detail || errorMsg;
                } catch (jsonErr) {
                    const text = await res.text();
                    console.error("Non-JSON error response:", text);
                    errorMsg = `Server Error: ${res.status}`;
                }
                alert(errorMsg);
                return;
            }

            const sentMsg = await res.json();
            setMessages(prev => {
                if (prev.find(m => m.id === sentMsg.id)) return prev;
                return [...prev, sentMsg];
            });
            setInputValue('');

        } catch (err) {
            console.error("HTTP Send failed", err);
            alert("Connection error: " + err.message);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

    const handleAiAssist = async () => {
        if (!inputValue.trim()) return;
        setIsAiLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/chat/assist'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: inputValue })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.improved_text) {
                    setInputValue(data.improved_text);
                }
            } else {
                toast.error('AI assist unavailable right now');
            }
        } catch (err) {
            console.error("AI Assist failed", err);
            toast.error('AI assist unavailable right now');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleGroupCreated = (newGroup) => {
        setGroups(prev => [...prev, newGroup]);
        setActiveChat({ type: 'group', id: newGroup.id, data: newGroup });
    };

    const handleDeleteMessage = async (msgId, mode) => {
        try {
            await fetch(getApiUrl(`/api/chat/messages/${msgId}?mode=${mode}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (mode === 'me') {
                setMessages(prev => prev.filter(m => m.id !== msgId));
            }
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    if (!user) return <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>;

    return (
        <div className="flex h-full w-full mx-auto bg-white rounded-none md:rounded-xl overflow-hidden shadow-sm border border-slate-200">
            {/* LEFT SIDEBAR (Chat List) */}
            <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[360px] flex-col border-r border-slate-200 bg-slate-50 md:rounded-l-xl`}>

                {/* Header */}
                <div className="h-16 border-b border-slate-200 flex items-center justify-between px-5 bg-white">
                    <div className="font-bold text-xl flex items-center gap-2 text-slate-900">
                        {user.username} <span className="text-xs text-slate-500 font-normal">▼</span>
                    </div>
                    <button onClick={() => setShowGroupModal(true)} className="text-slate-500 hover:text-cyber-primary transition-colors">
                        <Plus size={24} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Chat List Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Messages</div>

                    {/* Groups */}
                    {groups.map(g => (
                        <div
                            key={g.id}
                            onClick={() => { navigate(`/chats/group/${g.id}`); }}
                            className={`px-5 py-3 cursor-pointer flex items-center gap-3 hover:bg-slate-100 transition-colors ${activeChat.type === 'group' && activeChat.id === g.id ? 'bg-blue-50/50 border-l-2 border-cyber-primary' : ''}`}
                        >
                            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <Users size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-slate-900">{g.name}</div>
                                <div className="text-xs text-slate-500 truncate">{g.member_count} members</div>
                            </div>
                        </div>
                    ))}

                    {friends.map(u => (
                        <div
                            key={u.id}
                            onClick={() => {
                                setActiveChat({ type: 'private', id: u.id, data: u });
                                setMobileView('chat');
                                setFriends(prev => prev.map(f => f.id === u.id ? { ...f, unread_count: 0 } : f));
                            }}
                            className={`px-5 py-3 cursor-pointer flex items-center gap-3 hover:bg-slate-100 transition-colors ${activeChat.type === 'private' && activeChat.id === u.id ? 'bg-blue-50/50 border-l-2 border-cyber-primary' : ''}`}
                        >
                            <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-100 relative">
                                <img src={u.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <div className="text-sm font-medium text-slate-900 truncate">{u.username}</div>
                                    <span className="text-[10px] text-slate-500 opacity-60">
                                        {/* Timestamp could go here if available */}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className={`text-xs truncate ${u.unread_count > 0 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                                        {u.unread_count > 0 ? (
                                            u.last_message || "New message"
                                        ) : (
                                            u.last_message || <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Active now</span>
                                        )}
                                    </div>
                                    {u.unread_count > 0 && (
                                        <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-slate-900 text-[10px] font-bold rounded-full px-1">
                                            {u.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Suggestions */}
                    <div className="px-5 py-2 text-xs font-bold text-slate-500 mt-4">Suggestions</div>
                    {users.filter(u => !friends.find(f => f.id === u.id)).map(u => (
                        <div
                            key={u.id}
                            onClick={() => { navigate(`/chats/${u.id}`); }}
                            className={`px-5 py-3 cursor-pointer flex items-center gap-3 hover:bg-slate-100 transition-colors ${activeChat.type === 'private' && activeChat.id === u.id ? 'bg-blue-50/50 border-l-2 border-cyber-primary' : ''}`}
                        >
                            <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-100 opacity-60">
                                <img src={u.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-slate-900">{u.username}</div>
                                <div className="text-xs text-slate-500">Suggested for you</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT SIDE (Chat Window) */}
            {activeChat.type === null ? (
                <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col items-center justify-center bg-white`}>
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        <MessageSquare size={40} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Your conversations</h2>
                    <p className="text-slate-500 mb-6">Select a conversation to start messaging.</p>
                    <div className="flex gap-4">
                        <button className="px-4 py-2 bg-cyber-primary text-white font-medium rounded-lg shadow-sm hover:bg-cyber-primary/90">Start a Chat</button>
                        <button onClick={() => setShowGroupModal(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50">Create a Group</button>
                    </div>
                </div>
            ) : (
                <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col bg-white md:rounded-l-none md:rounded-r-xl`}>
                {/* Chat Header */}
                <div className="h-16 border-b border-slate-200 flex items-center justify-between px-5 bg-white sticky top-0 bg-white/5 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3 min-w-0">
                        {activeChat.type === 'private' && (
                            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100 shadow-sm">
                                <Shield size={14} /> End-to-end encrypted
                            </div>
                        )}
                        <button onClick={() => setMobileView('list')} className="md:hidden text-slate-900 mr-2 flex-shrink-0"><ArrowLeft size={24} /></button>

                        {activeChat.type === 'private' ? (
                            <Link to={`/profile/${activeChat.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                                    <img src={activeChat.data.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.data.username}`} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-slate-900 truncate hover:underline">{activeChat.data.username}</div>
                                    <div className="text-xs text-slate-500 truncate">Active now</div>
                                </div>
                            </Link>
                        ) : activeChat.type === 'group' ? (
                            <>
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"><Users size={16} /></div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-slate-900 truncate">{activeChat.data.name}</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0"><Hash size={16} /></div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-slate-900 truncate">Global Chat</div>
                                    <div className="text-xs text-slate-500 truncate">Public</div>
                                </div>
                            </>
                        )}

                        {/* Vibe Check Badge (live score from /api/chat/vibe) */}
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-800 ml-4 transition-all hover:bg-[#23293b] cursor-default group" title="Live Vibe Check AI">
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${vibe.score >= 80 ? 'bg-green-400' : vibe.score >= 40 ? 'bg-yellow-400' : 'bg-red-400'} opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${vibe.score >= 80 ? 'bg-green-500' : vibe.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                            </span>
                            <span className={`text-xs font-bold ${vibe.loading ? 'text-gray-400' : vibe.score >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent' : vibe.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {vibe.loading ? 'Checking…' : (vibe.score >= 80 ? 'Safe Vibe' : vibe.score >= 40 ? `Tense (${vibe.score})` : `Unsafe (${vibe.score})`)}
                            </span>
                            {/* Tooltip */}
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-black/90 p-2 rounded-lg text-xs w-48 text-center text-slate-300 z-50 border border-white/10">
                                AI analyzing the last 10 messages.<br />Score: {vibe.score}/100 — {vibe.status}.
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 text-slate-900 flex-shrink-0">
                        <Phone size={20} strokeWidth={1.5} className="cursor-pointer hover:opacity-70 md:w-6 md:h-6" onClick={() => startCall(false)} />
                        <Video size={20} strokeWidth={1.5} className="cursor-pointer hover:opacity-70 md:w-6 md:h-6" onClick={() => startCall(true)} />
                        <Info size={20} strokeWidth={1.5} className="cursor-pointer hover:opacity-70 md:w-6 md:h-6" />
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1" onClick={() => setActiveMessageMenu(null)}>
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                            <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center">
                                {activeChat.type === 'global' ? <Hash size={40} /> : <UserIcon size={40} />}
                            </div>
                            <p>Say hello!</p>
                        </div>
                    )}

                    {messages.map((msg, index) => {
                        const isMe = msg.sender_id === user?.id;
                        const senderUser = !isMe ? (users.find(u => u.id === msg.sender_id) || friends.find(f => f.id === msg.sender_id)) : null;

                        return (
                            <MessageBubble
                                key={msg.id || index}
                                message={msg}
                                isOwn={isMe}
                                formatTime={formatTimeForUser}
                                senderUser={senderUser}
                                activeChatType={activeChat.type}
                                messages={messages}
                                index={index}
                                user={user}
                                setActiveMessageMenu={setActiveMessageMenu}
                                activeMessageMenu={activeMessageMenu}
                                handleDeleteMessage={handleDeleteMessage}
                            />
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-10 p-4">
                    <div className="flex items-end gap-2">
                        <button
                            type="button"
                            onClick={handleAiAssist}
                            disabled={isAiLoading || !inputValue.trim()}
                            title="AI Assist: improve grammar & tone"
                            className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                isAiLoading
                                    ? 'bg-cyber-primary/30 animate-pulse text-slate-900'
                                    : inputValue.trim()
                                    ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-slate-900 hover:scale-105'
                                    : 'bg-white/5 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            <Sparkles size={18} />
                        </button>
                        <div className="flex-1">
                            <CosmicInput
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onSend={(e) => {
                                    if (e) e.preventDefault();
                                    sendMessage();
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            )}
            {showGroupModal && (
                <CreateGroupModal
                    token={token}
                    onClose={() => setShowGroupModal(false)}
                    onCreated={handleGroupCreated}
                />
            )}
        </div>
    );
}

// Helper for rendering individual messages
const MessageBubble = ({ message, isOwn, formatTime, senderUser, activeChatType, messages, index, user, setActiveMessageMenu, activeMessageMenu, handleDeleteMessage }) => {
    // System/Call Log Message
    if (message.msg_type === 'call') {
        return (
            <div className="flex justify-center my-4">
                <div className="bg-slate-100 px-4 py-1.5 rounded-full flex items-center gap-2 text-xs text-slate-600 border border-slate-200">
                    <Phone size={12} className={message.content.includes("Ended") ? "text-red-400" : "text-green-400"} />
                    <span className="font-medium">
                        {message.sender_id === user.id ? "You" : message.sender_username} - {message.content}
                    </span>
                    <span className="text-gray-500">• {formatTime(message.created_at)}</span>
                </div>
            </div>
        );
    }

    // Standard Text Message
    const showAvatar = !isOwn && (index === messages.length - 1 || messages[index + 1]?.sender_id !== message.sender_id);

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-1 relative`}>
            {!isOwn && (
                <div className="w-7 h-7 flex-shrink-0 mr-2 flex items-end">
                    {showAvatar ? (
                        <img
                            src={senderUser?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_username}`}
                            className="w-7 h-7 rounded-full object-cover"
                            alt="avatar"
                        />
                    ) : <div className="w-7" />}
                </div>
            )}
            <div
                
                className={`max-w-[70%] px-4 py-2 rounded-2xl text-[15px] leading-snug relative break-words ${isOwn
                    ? 'font-medium rounded-br-md shadow-md shadow-cyber-accent/20'
                    : 'bg-white/10 text-slate-900 border border-white/10 rounded-bl-md'}`}
            >
                {/* Sender Name in Group/Global */}
                {!isOwn && activeChatType !== 'private' && (index === 0 || messages[index - 1]?.sender_id !== message.sender_id) && (
                    <div className="text-xs text-cyber-secondary mb-1 ml-1">{message.sender_username}</div>
                )}

                {message.is_unsent ? (
                    <span className="italic opacity-60 text-sm flex items-center gap-1">
                        <span className="inline-block w-3 h-3 border border-current rounded-full relative">
                            <span className="absolute inset-0 m-auto w-3/4 h-[1px] bg-current rotate-45"></span>
                        </span>
                        Message unsent
                    </span>
                ) : (
                    message.content
                )}

                <div className={`text-[10px] mt-1 opacity-70 flex items-center justify-end gap-1 font-medium ${isOwn ? 'text-cyber-background/70' : 'text-slate-500'}`}>
                    {formatTime(message.created_at)}
                </div>

                {/* Hover Options */}
                <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-10' : '-right-10'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-2`}>
                    <button onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === message.id ? null : message.id); }} className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal size={16} />
                    </button>
                </div>

                {/* Context Menu */}
                {activeMessageMenu === message.id && (
                    <div className="absolute top-full mt-2 z-50 bg-gray-800 shadow-lg rounded-lg border border-white/10 p-1 min-w-[120px]">
                        {isOwn && <button onClick={() => handleDeleteMessage(message.id, 'everyone')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 text-red-500 rounded">Unsend</button>}
                        <button onClick={() => handleDeleteMessage(message.id, 'me')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 text-gray-200 rounded">Delete for me</button>
                    </div>
                )}
            </div>
        </div>
    );
};
