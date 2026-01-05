import React, { useState, useEffect, useRef } from 'react';
import { formatTimeForUser } from '../utils/dateFormatter';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import {
    Send, User as UserIcon, Users, Hash, Plus, MessageSquare, Phone, Video,
    Sparkles, Trash2, Undo2, MoreHorizontal, ArrowLeft, Image as ImageIcon,
    Smile, Heart, Info
} from 'lucide-react';
import CreateGroupModal from '../components/CreateGroupModal';
import CallModal from '../components/CallModal';

export default function Chat() {
    const { user, token } = useAuth();

    // State
    const [activeChat, setActiveChat] = useState({ type: 'global', id: null, data: null });
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
    const reconnectTimeout = useRef(null);
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
                    setMessages(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };
        fetchHistory();
    }, [activeChat, token]);

    // WebSocket Connection
    // WebSocket Connection
    useEffect(() => {
        if (!user) return;

        const connect = () => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) return;

            // Determine WS Protocol
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            let wsUrl = '';
            const apiUrl = getApiUrl('');

            if (apiUrl.startsWith('http')) {
                wsUrl = apiUrl.replace(/^http/, 'ws');
                if (wsUrl.endsWith('/')) wsUrl = wsUrl.slice(0, -1);
            } else {
                wsUrl = `${protocol}//${window.location.host}`;
            }
            wsUrl = `${wsUrl}/api/chat/ws/${user.id}`;

            console.log("Connecting to WS:", wsUrl);
            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log("WS Connected");
                setIsConnected(true);
                ws.current = socket;
                if (reconnectTimeout.current) {
                    clearTimeout(reconnectTimeout.current);
                    reconnectTimeout.current = null;
                }
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (['call-request', 'call-response', 'offer', 'answer', 'ice-candidate'].includes(data.type)) {
                        if (data.type === 'offer') {
                            setCallData({
                                isIncoming: true,
                                caller: { id: data.sender_id, username: data.sender_username || "Unknown" },
                                isVideo: data.isVideo,
                                offerData: data
                            });
                        }
                        return;
                    }

                    if (data.type === 'message' || !data.type) {
                        setMessages(prev => {
                            if (prev.find(m => m.id === data.id)) return prev;
                            const currentActive = activeChatRef.current;
                            const isRelevant =
                                (currentActive.type === 'global' && !data.receiver_id && !data.group_id) ||
                                (currentActive.type === 'private' && (data.sender_id === currentActive.id || data.receiver_id === currentActive.id)) ||
                                (currentActive.type === 'group' && data.group_id === currentActive.id);

                            if (isRelevant) return [...prev, data];
                            return prev;
                        });
                    }
                } catch (e) {
                    console.error("WS Parse error", e);
                }
            };

            socket.onclose = () => {
                console.log("WS Disconnected. Attempting to reconnect...");
                setIsConnected(false);
                ws.current = null;
                // Auto reconnect after 3 seconds
                if (!reconnectTimeout.current) {
                    reconnectTimeout.current = setTimeout(connect, 3000);
                }
            };

            socket.onerror = (err) => {
                console.error("WS Error", err);
                socket.close();
            };
        };

        connect();

        return () => {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [user]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    // Polling
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

        const intervalId = setInterval(pollMessages, 3000);
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

    if (!user) return <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>;

    return (
        <div className="flex h-[calc(100vh-100px)] w-full mx-auto bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm my-4 lg:rounded-none lg:my-0 lg:border-x-0 lg:border-t-0">
            {/* LEFT SIDEBAR (Chat List) */}
            <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[350px] lg:w-[400px] flex-col border-r border-white/10 glass-panel md:rounded-l-lg`}>

                {/* Header */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-5">
                    <div className="font-bold text-xl flex items-center gap-2 text-slate-900">
                        {user.username} <span className="text-xs text-cyber-muted font-normal">▼</span>
                    </div>
                    <button onClick={() => setShowGroupModal(true)} className="text-slate-600 hover:text-cyber-primary transition-colors">
                        <Plus size={24} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Chat List Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    {/* Global Chat Item */}
                    <div
                        onClick={() => { setActiveChat({ type: 'global', id: null, data: null }); setMobileView('chat'); }}
                        className={`px-5 py-3 cursor-pointer flex items-center gap-3 hover:bg-gray-50 transition-colors ${activeChat.type === 'global' ? 'bg-gray-50' : ''}`}
                    >
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white">
                            <Hash size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Global Chat</div>
                            <div className="text-xs text-gray-500 truncate">Public community channel</div>
                        </div>
                    </div>

                    <div className="px-5 py-2 text-xs font-bold text-gray-400 mt-2">Messages</div>

                    {/* Groups */}
                    {groups.map(g => (
                        <div
                            key={g.id}
                            onClick={() => { setActiveChat({ type: 'group', id: g.id, data: g }); setMobileView('chat'); }}
                            className={`px-5 py-3 cursor-pointer flex items-center gap-3 hover:bg-gray-50 transition-colors ${activeChat.type === 'group' && activeChat.id === g.id ? 'bg-gray-50' : ''}`}
                        >
                            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <Users size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{g.name}</div>
                                <div className="text-xs text-gray-500 truncate">{g.member_count} members</div>
                            </div>
                        </div>
                    ))}

                    {/* Friends/DMs */}
                    {friends.map(u => (
                        <div
                            key={u.id}
                            onClick={() => { setActiveChat({ type: 'private', id: u.id, data: u }); setMobileView('chat'); }}
                            className={`px-5 py-3 cursor-pointer flex items-center gap-3 hover:bg-gray-50 transition-colors ${activeChat.type === 'private' && activeChat.id === u.id ? 'bg-gray-50' : ''}`}
                        >
                            <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-100">
                                <img src={u.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{u.username}</div>
                                <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Active now
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Suggestions */}
                    <div className="px-5 py-2 text-xs font-bold text-gray-400 mt-4">Suggestions</div>
                    {users.filter(u => !friends.find(f => f.id === u.id)).map(u => (
                        <div
                            key={u.id}
                            onClick={() => { setActiveChat({ type: 'private', id: u.id, data: u }); setMobileView('chat'); }}
                            className={`px-5 py-3 cursor-pointer flex items-center gap-3 hover:bg-gray-50 transition-colors ${activeChat.type === 'private' && activeChat.id === u.id ? 'bg-gray-50' : ''}`}
                        >
                            <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-100 opacity-60">
                                <img src={u.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{u.username}</div>
                                <div className="text-xs text-gray-400">Suggested for you</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT SIDE (Chat Window) */}
            <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col glass-card md:rounded-l-none md:rounded-r-lg`}>
                {/* Chat Header */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-5 sticky top-0 bg-white/5 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileView('list')} className="md:hidden text-gray-900 mr-2"><ArrowLeft size={24} /></button>

                        {activeChat.type === 'private' ? (
                            <>
                                <div className="w-8 h-8 rounded-full overflow-hidden">
                                    <img src={activeChat.data.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.data.username}`} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900">{activeChat.data.username}</div>
                                    <div className="text-xs text-gray-500">Active now</div>
                                </div>
                            </>
                        ) : activeChat.type === 'group' ? (
                            <>
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Users size={16} /></div>
                                <div className="text-sm font-bold text-gray-900">{activeChat.data.name}</div>
                            </>
                        ) : (
                            <>
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Hash size={16} /></div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900">Global Chat</div>
                                    <div className="text-xs text-gray-500">Public</div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-gray-900">
                        <Phone size={24} strokeWidth={1.5} className="cursor-pointer hover:opacity-70" onClick={() => startCall(false)} />
                        <Video size={24} strokeWidth={1.5} className="cursor-pointer hover:opacity-70" onClick={() => startCall(true)} />
                        <Info size={24} strokeWidth={1.5} className="cursor-pointer hover:opacity-70" />
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1" onClick={() => setActiveMessageMenu(null)}>
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                            <div className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center">
                                {activeChat.type === 'global' ? <Hash size={40} /> : <UserIcon size={40} />}
                            </div>
                            <p>Say hello!</p>
                        </div>
                    )}

                    {messages.map((msg, index) => {
                        const isMe = msg.sender_id === user?.id;
                        const showAvatar = !isMe && (index === messages.length - 1 || messages[index + 1]?.sender_id !== msg.sender_id);
                        const senderUser = !isMe ? (users.find(u => u.id === msg.sender_id) || friends.find(f => f.id === msg.sender_id)) : null;

                        // Message grouping logic for spacing/border-radius can be added here

                        if (msg.type && msg.type !== 'message') return null;

                        return (
                            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1 relative`}>
                                {!isMe && (
                                    <div className="w-7 h-7 flex-shrink-0 mr-2 flex items-end">
                                        {showAvatar ? (
                                            <img
                                                src={senderUser?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_username}`}
                                                className="w-7 h-7 rounded-full object-cover"
                                            />
                                        ) : <div className="w-7" />}
                                    </div>
                                )}

                                <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-[15px] leading-snug relative ${isMe
                                    ? 'bg-cyber-primary text-white rounded-br-md'
                                    : 'bg-slate-100 text-slate-900 rounded-bl-md'}`}>

                                    {/* Sender Name in Group/Global */}
                                    {!isMe && activeChat.type !== 'private' && (index === 0 || messages[index - 1]?.sender_id !== msg.sender_id) && (
                                        <div className="text-xs text-cyber-secondary mb-1 ml-1">{msg.sender_username}</div>
                                    )}

                                    {msg.content}

                                    {/* Hover Options */}
                                    <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? '-left-10' : '-right-10'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-2`}>
                                        <button onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id); }} className="text-gray-400 hover:text-gray-600">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>

                                    {/* Context Menu */}
                                    {activeMessageMenu === msg.id && (
                                        <div className="absolute top-full mt-2 z-50 bg-white shadow-lg rounded-lg border border-gray-100 p-1 min-w-[120px]">
                                            {isMe && <button onClick={() => handleDeleteMessage(msg.id, 'everyone')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 text-red-500 rounded">Unsend</button>}
                                            <button onClick={() => handleDeleteMessage(msg.id, 'me')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700 rounded">Delete for me</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 px-5">
                    <div className="flex items-center gap-2 bg-slate-100 rounded-full border border-gray-200 px-2 py-1.5 focus-within:border-cyber-primary/50 transition-colors">
                        <div className="flex items-center gap-1 ml-2">
                            <button className="p-2 text-slate-500 hover:text-slate-800 rounded-full"><Smile size={24} strokeWidth={1.5} /></button>
                        </div>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 text-sm placeholder-slate-500 h-10"
                        />
                        <div className="flex items-center gap-2 mr-2">
                            {inputValue.trim() ? (
                                <button onClick={sendMessage} className="text-cyber-primary font-bold text-sm hover:text-cyber-primary_hover">Send</button>
                            ) : (
                                <>
                                    <button className="p-2 text-slate-500 hover:text-slate-800 rounded-full"><ImageIcon size={24} strokeWidth={1.5} /></button>
                                    <button className="p-2 text-slate-500 hover:text-slate-800 rounded-full"><Heart size={24} strokeWidth={1.5} /></button>
                                </>
                            )}

                            {/* AI Assist Button (Hidden/Optional) */}
                            {inputValue.trim() && (
                                <button onClick={handleAiAssist} className="p-2 text-purple-500 hover:bg-purple-50 rounded-full" title="AI Assist">
                                    <Sparkles size={20} />
                                </button>
                            )}
                        </div>
                    </div>
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
                    targetUser={activeChat.data}
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
