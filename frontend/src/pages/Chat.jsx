import React, { useState, useEffect, useRef } from 'react';
import { formatTimeForUser } from '../utils/dateFormatter';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Send, User as UserIcon, Users, Hash, Plus, MessageSquare, Phone, Video, Sparkles, Trash2, Undo2, MoreHorizontal, ArrowLeft } from 'lucide-react';
import CreateGroupModal from '../components/CreateGroupModal';
import CallModal from '../components/CallModal';

export default function Chat() {
    const { user, token } = useAuth();

    // State
    const [activeChat, setActiveChat] = useState({ type: 'global', id: null, data: null }); // type: 'global' | 'private' | 'group'
    const [users, setUsers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [groups, setGroups] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);

    const [callData, setCallData] = useState(null);
    const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const activeChatRef = useRef(activeChat); // Ref for WS callback access

    const [activeMessageMenu, setActiveMessageMenu] = useState(null); // ID of message with open menu

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

                // Users & Friends
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

    // Fetch History when Active Chat changes
    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) return;
            setMessages([]); // Clear previous

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
                    setMessages(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };
        fetchHistory();
    }, [activeChat, token]);

    // WebSocket Connection
    useEffect(() => {
        if (!user?.id || !token) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/chat/ws/${user.id}?token=${token}`;

        console.log("Connecting to WebSocket:", wsUrl);

        if (ws.current) ws.current.close();

        console.log("Connecting to WebSocket:", wsUrl);
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => {
            console.log("WebSocket Connected!");
            setIsConnected(true);
        };
        socket.onclose = (event) => {
            console.log("WebSocket Closed:", event.code, event.reason);
            setIsConnected(false);
        };
        socket.onerror = (error) => {
            console.error("WebSocket Error:", error);
        };
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            // Handle Errors (Blocking)
            if (message.type === 'error') {
                // Should use a toast here
                console.error("Blocked:", message.message);
                // Simple alert fallback if toaster not imported in this scope (but it is in App)
                // We'll dispatch a custom event or just alert for now, 
                // but better to import toast.
                window.dispatchEvent(new CustomEvent('toast-error', { detail: message.message }));
                // Or simplified:
                alert(message.message);
                return;
            }

            const current = activeChatRef.current;

            // Determine if message belongs to current view
            let isRelevant = false;

            if (current.type === 'global') {
                if (!message.receiver_id && !message.group_id) isRelevant = true;
            } else if (current.type === 'group') {
                if (message.group_id === current.id) isRelevant = true;
            } else if (current.type === 'private') {
                // Private logic: matches if I am sender OR I am receiver AND other party is the active user
                if (!message.group_id) { // Ensure not group
                    const otherId = current.id;
                    if ((message.sender_id === user.id && message.receiver_id === otherId) ||
                        (message.sender_id === otherId && message.receiver_id === user.id)) {
                        isRelevant = true;
                    }
                }
            }

            if (message.type === 'message_update') {
                // Update local message state
                setMessages(prev => prev.map(m => m.id === message.id ? { ...m, ...message } : m));
                return; // Don't add as new message
            }

            if (isRelevant) {
                setMessages(prev => [...prev, message]);
            } else {
                // TODO: Update unread counts or show notification toast
            }
        };

        return () => socket.close();
    }, [user.id, token]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    // Polling for robust message sync (Vercel Serverless Support)
    useEffect(() => {
        if (!token) return;

        const pollMessages = async () => {
            if (!activeChat.id && activeChat.type !== 'global') return;

            try {
                let url = '/api/chat/history';
                if (activeChat.type === 'private') {
                    url += `?other_user_id=${activeChat.id}`;
                } else if (activeChat.type === 'group') {
                    url += `?group_id=${activeChat.id}`;
                }

                // We want to fetch LATEST messages. 
                // Ideally we'd use 'after_id' param but history endpoint just returns last 50.
                // Re-fetching history is inefficient but robust for this demo.
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

        const intervalId = setInterval(pollMessages, 3000); // Poll every 3s
        return () => clearInterval(intervalId);
    }, [activeChat, token]);

    const startCall = (isVideo) => {
        if (activeChat.type !== 'private') return;
        setCallData({
            isIncoming: false,
            isVideo: isVideo
        });
    };

    const sendMessage = async () => {
        if (!inputValue.trim()) return;

        // 1. HTTP BEST EFFORT SUBMISSION (Works on Serverless)
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
                const err = await res.json();
                alert(err.detail || "Failed to send message");
                return;
            }

            // Msg sent success
            const sentMsg = await res.json();
            // Optimistically add to UI if WS didn't already
            setMessages(prev => {
                if (prev.find(m => m.id === sentMsg.id)) return prev;
                return [...prev, sentMsg];
            });
            setInputValue('');

        } catch (err) {
            console.error("HTTP Send failed", err);
            // Fallback? No, HTTP is the fallback.
            alert("Connection error. Please try again.");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

    const [isAiLoading, setIsAiLoading] = useState(false);

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
            }
        } catch (err) {
            console.error("AI Assist failed", err);
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

    // WS Listener update for message_update is handled in existing useEffect? 
    // Need to verify standard WS message handler handles 'message_update' type?
    // Let's modify the useEffect above or rely on standard handling if added.
    // The previous useEffect handles incoming data. Let's check it.

    if (!user) return <div className="flex items-center justify-center h-full text-cyber-muted">Loading...</div>;

    return (
        <div className="flex h-[calc(100vh-140px)] max-w-6xl mx-auto gap-4">
            {/* Sidebar */}
            <div className={`${mobileView === 'chat' ? 'hidden' : 'flex'} w-full md:w-1/3 md:flex glass-card rounded-xl flex-col overflow-hidden bg-white/70 backdrop-blur-xl shadow-lg border border-white/50`}>
                <div className="p-4 border-b border-cyber-border bg-slate-50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-cyber-text flex items-center gap-2">
                        <MessageSquare size={20} className="text-cyber-primary" />
                        Chats
                    </h2>
                    <button
                        onClick={() => setShowGroupModal(true)}
                        className="p-1 hover:bg-white rounded-full text-cyber-primary transition-colors shadow-sm"
                        title="Create Group"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {/* Global Chat */}
                    <button
                        onClick={() => { setActiveChat({ type: 'global', id: null, data: null }); setMobileView('chat'); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${activeChat.type === 'global'
                            ? 'bg-white border border-cyber-primary/30 shadow-md ring-1 ring-cyber-primary/20'
                            : 'text-cyber-muted hover:bg-white/60 hover:text-cyber-text'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeChat.type === 'global' ? 'bg-cyber-primary text-white' : 'bg-slate-100 text-cyber-muted'}`}>
                            <Hash size={20} />
                        </div>
                        <div>
                            <div className={`font-bold ${activeChat.type === 'global' ? 'text-cyber-primary' : 'text-cyber-text'}`}>Global Chat</div>
                            <div className="text-xs opacity-60">Public Channel</div>
                        </div>
                    </button>

                    {/* Groups */}
                    {groups.length > 0 && (
                        <div className="mt-4">
                            <div className="px-2 mb-2 text-xs font-bold text-cyber-muted uppercase tracking-wider">Groups</div>
                            <div className="space-y-1">
                                {groups.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => { setActiveChat({ type: 'group', id: g.id, data: g }); setMobileView('chat'); }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${activeChat.type === 'group' && activeChat.id === g.id
                                            ? 'bg-white border border-cyber-primary/30 shadow-md ring-1 ring-cyber-primary/20'
                                            : 'text-cyber-muted hover:bg-white/60 hover:text-cyber-text'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeChat.type === 'group' && activeChat.id === g.id ? 'bg-cyber-primary text-white' : 'bg-slate-100 text-cyber-muted'}`}>
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <div className={`font-bold ${activeChat.type === 'group' && activeChat.id === g.id ? 'text-cyber-primary' : 'text-cyber-text'}`}>{g.name}</div>
                                            <div className="text-xs opacity-60">{g.member_count} members</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Friends */}
                    {friends.length > 0 && (
                        <div className="mt-4">
                            <div className="px-2 mb-2 text-xs font-bold text-cyber-muted uppercase tracking-wider">Friends</div>
                            <div className="space-y-1">
                                {friends.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => { setActiveChat({ type: 'private', id: u.id, data: u }); setMobileView('chat'); }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${activeChat.type === 'private' && activeChat.id === u.id
                                            ? 'bg-white border border-cyber-primary/30 shadow-md ring-1 ring-cyber-primary/20'
                                            : 'text-cyber-muted hover:bg-white/60 hover:text-cyber-text'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full border border-cyber-border flex items-center justify-center overflow-hidden ${activeChat.type === 'private' && activeChat.id === u.id ? 'ring-2 ring-cyber-primary ring-offset-2' : 'bg-slate-100'}`}>
                                            {u.profile_photo ? (
                                                <img src={u.profile_photo} alt={u.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-cyber-primary font-bold">{(u.username || "U").charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className={`font-bold ${activeChat.type === 'private' && activeChat.id === u.id ? 'text-cyber-primary' : 'text-cyber-text'}`}>{u.username}</div>
                                            <div className="text-xs opacity-60 text-green-600 flex items-center gap-1 font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Suggestions (Other Users) */}
                    <div className="mt-4">
                        <div className="px-2 mb-2 text-xs font-bold text-cyber-muted uppercase tracking-wider">Suggestions</div>
                        <div className="space-y-1">
                            {users.filter(u => !friends.find(f => f.id === u.id)).map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => { setActiveChat({ type: 'private', id: u.id, data: u }); setMobileView('chat'); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${activeChat.type === 'private' && activeChat.id === u.id
                                        ? 'bg-white border border-cyber-primary/30 shadow-md ring-1 ring-cyber-primary/20'
                                        : 'text-cyber-muted hover:bg-white/60 hover:text-cyber-text'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-cyber-border flex items-center justify-center overflow-hidden opacity-70">
                                        {u.profile_photo ? (
                                            <img src={u.profile_photo} alt={u.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon size={20} className="text-cyber-muted" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-cyber-text">{u.username}</div>
                                        <div className="text-xs opacity-40">User</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${mobileView === 'list' ? 'hidden' : 'flex'} w-full md:flex-1 md:flex flex-col glass-card rounded-xl overflow-hidden bg-white/70 backdrop-blur-xl shadow-lg border border-white/50`}>
                <div className="p-4 border-b border-cyber-border bg-slate-50 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-cyber-text flex items-center gap-2">
                        {/* Mobile Back Button */}
                        <button
                            onClick={() => setMobileView('list')}
                            className="md:hidden p-1 mr-1 hover:bg-slate-200 rounded-full text-cyber-muted transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        {activeChat.type === 'private' ? (
                            <Link to={`/profile/${activeChat.data.id}`} className="hover:text-cyber-primary transition-colors flex items-center gap-2 group">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                @{activeChat.data.username}
                            </Link>
                        ) : activeChat.type === 'group' ? (
                            <span className="flex items-center gap-2">
                                <Users size={20} className="text-cyber-primary" />
                                {activeChat.data.name}
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Hash size={20} className="text-cyber-primary" />
                                Global Chat <span className={`text-xs px-2 py-0.5 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isConnected ? 'Connected' : 'Offline'}</span>
                            </span>
                        )}
                    </h2>
                    <div className="flex items-center gap-4">
                        {activeChat.type === 'private' && (
                            <div className="flex gap-2">
                                <button onClick={() => startCall(false)} className="p-2 hover:bg-white rounded-full text-cyber-muted hover:text-cyber-primary transition-colors shadow-sm" title="Voice Call">
                                    <Phone size={20} />
                                </button>
                                <button onClick={() => startCall(true)} className="p-2 hover:bg-white rounded-full text-cyber-muted hover:text-cyber-primary transition-colors shadow-sm" title="Video Call">
                                    <Video size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
                    onClick={() => setActiveMessageMenu(null)}
                >
                    {messages.length === 0 && (
                        <div className="text-center text-cyber-muted opacity-50 mt-10">
                            {activeChat.type === 'global' ? 'Welcome to Global Chat!' : 'No messages yet. Say hello!'}
                        </div>
                    )}
                    {messages.map((msg, index) => {
                        const isMe = msg.sender_id === user?.id;
                        // Find sender photo from Users list (if available) or Friends list
                        const senderUser = !isMe ? (users.find(u => u.id === msg.sender_id) || friends.find(f => f.id === msg.sender_id)) : null;
                        const senderPhoto = senderUser?.profile_photo;

                        // Filter out signaling
                        if (msg.type && msg.type !== 'message') return null;

                        // Handle Unsent
                        if (msg.is_unsent) {
                            return (
                                <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start items-end gap-2'}`}>
                                    <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm border border-cyber-border italic text-cyber-muted opacity-70 bg-gray-50`}>
                                        Message unsent
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start items-end gap-2'}`}>
                                {!isMe && (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 border border-cyber-border flex-shrink-0 overflow-hidden mb-1">
                                        {senderPhoto ? <img src={senderPhoto} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-cyber-muted">{(msg.sender_username || "U")[0].toUpperCase()}</div>}
                                    </div>
                                )}
                                <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm relative group/msg ${isMe
                                    ? 'bg-cyber-primary text-white rounded-br-none shadow-cyber-primary/20'
                                    : 'bg-white text-cyber-text rounded-bl-none border border-cyber-border shadow-sm'
                                    }`}>

                                    {/* Message Options Trigger (3 Dots) - MOVED INSIDE */}
                                    <div className={`absolute top-2 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover/msg:opacity-100 transition-opacity flex flex-col gap-1 ${activeMessageMenu === msg.id ? '!opacity-100' : ''}`}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id); }}
                                            className="p-1.5 rounded-full text-slate-400 hover:text-cyber-primary hover:bg-slate-100/80 transition-all bg-white/50 backdrop-blur-sm shadow-sm border border-white/20"
                                        >
                                            <MoreHorizontal size={14} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {activeMessageMenu === msg.id && (
                                            <div className={`absolute top-8 ${isMe ? 'right-0' : 'left-0'} bg-white rounded-lg shadow-xl border border-gray-100 p-1 w-32 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200`}>
                                                {isMe && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id, 'everyone'); setActiveMessageMenu(null); }}
                                                        className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:bg-red-50 hover:text-red-500 rounded-md w-full text-left transition-colors font-medium"
                                                    >
                                                        <Undo2 size={12} /> Unsend
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id, 'me'); setActiveMessageMenu(null); }}
                                                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:bg-red-50 hover:text-red-500 rounded-md w-full text-left transition-colors font-medium"
                                                >
                                                    <Trash2 size={12} /> Delete for me
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {!isMe && (
                                        <Link to={msg.sender_id ? `/profile/${msg.sender_id}` : '#'} className="text-xs font-bold text-cyber-primary mb-1 flex items-center gap-1 hover:underline">
                                            {msg.sender_username}
                                        </Link>
                                    )}
                                    <div className="break-words leading-relaxed">{msg.content}</div>
                                    <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-cyber-muted'}`}>
                                        {formatTimeForUser(msg.created_at, user?.phone_number)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-cyber-border flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Message ${activeChat.type === 'global' ? 'Global' : activeChat.type === 'private' ? activeChat.data.username : activeChat.data.name}...`}
                        className="glass-input flex-1 bg-slate-50 border-cyber-border focus:bg-white transition-all shadow-inner"
                    />
                    <button
                        onClick={handleAiAssist}
                        disabled={!inputValue.trim() || isAiLoading}
                        className={`p-3 rounded-xl transition-all shadow-sm flex items-center justify-center border ${inputValue.trim() && !isAiLoading
                            ? 'bg-purple-600 text-white border-transparent hover:bg-purple-700 shadow-md hover:scale-105 active:scale-95'
                            : 'bg-white text-purple-400 border-purple-200 opacity-60 cursor-not-allowed'
                            }`}
                        title="AI Smart Assist (Rewrite)"
                    >
                        <Sparkles size={20} className={isAiLoading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={sendMessage}
                        disabled={!isConnected}
                        className="glass-button-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed w-12 h-12 p-0 shadow-md"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>

            {showGroupModal && (
                <CreateGroupModal
                    token={token}
                    onClose={() => setShowGroupModal(false)}
                    onCreated={handleGroupCreated}
                />
            )}

            {callData && (
                <CallModal
                    isIncoming={callData.isIncoming}
                    caller={callData.caller}
                    targetUser={activeChat.data} // only valid if outgoing
                    socket={ws.current}
                    onClose={() => setCallData(null)}
                    user={user}
                    isVideo={callData.isVideo}
                    offerData={callData.offerData}
                />
            )}
        </div>
    );
}
