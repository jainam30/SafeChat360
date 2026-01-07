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
                // Replace http -> ws, https -> wss
                wsUrl = apiUrl.replace(/^http/, 'ws');
            } else {
                // Relative API path or localhost fallback
                wsUrl = `${protocol}//${window.location.host}${apiUrl}`;
            }
            // Ensure no double slashes if apiUrl was just '/'
            if (wsUrl.endsWith('/')) wsUrl = wsUrl.slice(0, -1);

            wsUrl = `${wsUrl}/api/chat/ws/${user.id}?token=${token}`;

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
            // ...
            // ...
            const startCall = (isVideo) => {
                if (!isConnected) {
                    alert("Chat service disconnected. Please wait for reconnection.");
                    return;
                }
                if (activeChat.type !== 'private') return;
                setCallData({
                    isIncoming: false,
                    isVideo: isVideo
                });
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (['call-request', 'call-response', 'offer', 'answer', 'ice-candidate'].includes(data.type)) {
                        if (data.type === 'offer') {
                            setCallData(prev => {
                                if (prev) return prev; // Allow hook to handle renegotiation or ignore if busy
                                return {
                                    isIncoming: true,
                                    caller: { id: data.sender_id, username: data.sender_username || "Unknown" },
                                    isVideo: data.isVideo,
                                    offerData: data
                                };
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
            isVideo: isVideo,
            targetUser: activeChat.data,
            caller: user
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
        <div className="flex h-full w-full mx-auto bg-white border border-gray-200 rounded-none md:rounded-lg overflow-hidden shadow-sm lg:border-x-0 lg:border-t-0">
            {/* LEFT SIDEBAR (Chat List) */}
            <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[360px] flex-col border-r border-white/10 glass-panel md:rounded-l-lg`}>

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
                    <div className="flex items-center gap-3 min-w-0">
                        <button onClick={() => setMobileView('list')} className="md:hidden text-gray-900 mr-2 flex-shrink-0"><ArrowLeft size={24} /></button>

                        {activeChat.type === 'private' ? (
                            <>
                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                    <img src={activeChat.data.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.data.username}`} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-gray-900 truncate">{activeChat.data.username}</div>
                                    <div className="text-xs text-gray-500 truncate">Active now</div>
                                </div>
                            </>
                        ) : activeChat.type === 'group' ? (
                            <>
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"><Users size={16} /></div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-gray-900 truncate">{activeChat.data.name}</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0"><Hash size={16} /></div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-gray-900 truncate">Global Chat</div>
                                    <div className="text-xs text-gray-500 truncate">Public</div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 text-gray-900 flex-shrink-0">
                        <Phone size={20} strokeWidth={1.5} className="cursor-pointer hover:opacity-70 md:w-6 md:h-6" onClick={() => startCall(false)} />
                        <Video size={20} strokeWidth={1.5} className="cursor-pointer hover:opacity-70 md:w-6 md:h-6" onClick={() => startCall(true)} />
                        <Info size={20} strokeWidth={1.5} className="cursor-pointer hover:opacity-70 md:w-6 md:h-6" />
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
                <div className="p-4 bg-gray-900/50 backdrop-blur-md border-t border-white/10 sticky bottom-0 z-10">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            sendMessage();
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="p-3 rounded-full bg-gradient-to-r from-cyber-primary to-purple-600 text-white shadow-lg shadow-cyber-primary/20 hover:shadow-cyber-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Call Modal */}
            {callData && (
                <CallModal
                    {...callData}
                    user={user}
                    socket={ws.current}
                    onClose={() => setCallData(null)}
                />
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
                <div className="bg-gray-800/60 backdrop-blur-sm px-4 py-1.5 rounded-full flex items-center gap-2 text-xs text-gray-300 border border-white/5">
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
                    ? 'bg-cyber-primary text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-900 rounded-bl-md'}`}
            >
                {/* Sender Name in Group/Global */}
                {!isOwn && activeChatType !== 'private' && (index === 0 || messages[index - 1]?.sender_id !== message.sender_id) && (
                    <div className="text-xs text-cyber-secondary mb-1 ml-1">{message.sender_username}</div>
                )}

                {message.content}

                <div className={`text-[10px] mt-1 opacity-70 flex items-center justify-end gap-1 font-medium ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
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
                    <div className="absolute top-full mt-2 z-50 bg-white shadow-lg rounded-lg border border-gray-100 p-1 min-w-[120px]">
                        {isOwn && <button onClick={() => handleDeleteMessage(message.id, 'everyone')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 text-red-500 rounded">Unsend</button>}
                        <button onClick={() => handleDeleteMessage(message.id, 'me')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700 rounded">Delete for me</button>
                    </div>
                )}
            </div>
        </div>
    );
};
