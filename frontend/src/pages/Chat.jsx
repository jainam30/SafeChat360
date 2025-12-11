import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Send, User as UserIcon, Users, Hash, Plus, MessageSquare, Phone, Video } from 'lucide-react';
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

    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const activeChatRef = useRef(activeChat); // Ref for WS callback access

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
        if (!user || !token) return;

        let wsUrl = getApiUrl(`/api/chat/ws/${user.id}?token=${token}`);
        if (wsUrl.startsWith('/')) {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsUrl = `${protocol}//${window.location.host}${wsUrl}`;
        } else {
            wsUrl = wsUrl.replace("http://", "ws://").replace("https://", "wss://");
        }

        if (ws.current) ws.current.close();

        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => setIsConnected(true);
        socket.onclose = () => setIsConnected(false);
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const current = activeChatRef.current;

            // Determine if message belongs to current view
            let isRelevant = false;

            if (current.type === 'global') {
                if (!message.receiver_id && !message.group_id) isRelevant = true;
            } else if (current.type === 'group') {
                if (message.group_id === current.id) isRelevant = true;
            } else if (current.type === 'private') {
                // Private logic: matches if I am sender OR I am receiver AND other party is the active user
                if (!message.group_id && !message.group_id) { // Ensure not group
                    const otherId = current.id;
                    if ((message.sender_id === user.id && message.receiver_id === otherId) ||
                        (message.sender_id === otherId && message.receiver_id === user.id)) {
                        isRelevant = true;
                    }
                }
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

    const startCall = (isVideo) => {
        if (activeChat.type !== 'private') return;
        setCallData({
            isIncoming: false,
            isVideo: isVideo
        });
    };

    const sendMessage = () => {
        if (!inputValue.trim() || !ws.current) return;

        const messageData = {
            sender_id: user.id,
            sender_username: user.username,
            content: inputValue,
            receiver_id: activeChat.type === 'private' ? activeChat.id : null,
            group_id: activeChat.type === 'group' ? activeChat.id : null
        };

        ws.current.send(JSON.stringify(messageData));
        setInputValue('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

    const handleGroupCreated = (newGroup) => {
        setGroups(prev => [...prev, newGroup]);
        setActiveChat({ type: 'group', id: newGroup.id, data: newGroup });
    };

    if (!user) return <div className="flex items-center justify-center h-full text-white">Loading...</div>;

    return (
        <div className="flex h-[calc(100vh-140px)] max-w-6xl mx-auto gap-4">
            {/* Sidebar */}
            <div className="w-1/3 glass-card flex flex-col overflow-hidden rounded-xl border border-white/10">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageSquare size={20} className="text-cyber-primary" />
                        Chats
                    </h2>
                    <button
                        onClick={() => setShowGroupModal(true)}
                        className="p-1 hover:bg-white/10 rounded-full text-cyber-primary transition-colors"
                        title="Create Group"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
                    {/* Global Chat */}
                    <button
                        onClick={() => setActiveChat({ type: 'global', id: null, data: null })}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${activeChat.type === 'global'
                            ? 'bg-cyber-primary/20 border border-cyber-primary/30 text-white'
                            : 'text-cyber-muted hover:bg-white/5'
                            }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-cyber-primary/20 flex items-center justify-center">
                            <Hash size={20} className="text-cyber-primary" />
                        </div>
                        <div>
                            <div className="font-bold">Global Chat</div>
                            <div className="text-xs opacity-60">Public Channel</div>
                        </div>
                    </button>

                    {/* Groups */}
                    {groups.length > 0 && (
                        <div>
                            <div className="px-2 mb-2 text-xs font-bold text-cyber-muted uppercase tracking-wider">Groups</div>
                            <div className="space-y-1">
                                {groups.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => setActiveChat({ type: 'group', id: g.id, data: g })}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${activeChat.type === 'group' && activeChat.id === g.id
                                            ? 'bg-cyber-primary/20 border border-cyber-primary/30 text-white'
                                            : 'text-cyber-muted hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold">{g.name}</div>
                                            <div className="text-xs opacity-60">{g.member_count} members</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Friends */}
                    {friends.length > 0 && (
                        <div>
                            <div className="px-2 mb-2 text-xs font-bold text-cyber-muted uppercase tracking-wider">Friends</div>
                            <div className="space-y-1">
                                {friends.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => setActiveChat({ type: 'private', id: u.id, data: u })}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${activeChat.type === 'private' && activeChat.id === u.id
                                            ? 'bg-cyber-primary/20 border border-cyber-primary/30 text-white'
                                            : 'text-cyber-muted hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-primary to-purple-600 flex items-center justify-center text-white font-bold border border-white/10">
                                            {u.profile_photo ? (
                                                <img src={u.profile_photo} alt={u.username} className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                (u.username || "U").charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{u.username}</div>
                                            <div className="text-xs opacity-60 text-green-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Suggestions (Other Users) */}
                    <div>
                        <div className="px-2 mb-2 text-xs font-bold text-cyber-muted uppercase tracking-wider">Suggestions</div>
                        <div className="space-y-1">
                            {users.filter(u => !friends.find(f => f.id === u.id)).map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => setActiveChat({ type: 'private', id: u.id, data: u })}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${activeChat.type === 'private' && activeChat.id === u.id
                                        ? 'bg-cyber-primary/20 border border-cyber-primary/30 text-white'
                                        : 'text-cyber-muted hover:bg-white/5'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden opacity-70">
                                        {u.profile_photo ? (
                                            <img src={u.profile_photo} alt={u.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold">{u.username}</div>
                                        <div className="text-xs opacity-40">User</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col glass-card rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {activeChat.type === 'private' ? (
                            <Link to={`/profile/${activeChat.data.id}`} className="hover:text-cyber-primary transition-colors flex items-center gap-2">
                                @{activeChat.data.username}
                            </Link>
                        ) : activeChat.type === 'group' ? (
                            <span className="flex items-center gap-2">
                                <Users size={20} className="text-purple-400" />
                                {activeChat.data.name}
                            </span>
                        ) : (
                            <>Global Chat #{isConnected ? 'Connected' : 'Offline'}</>
                        )}
                    </h2>
                    <div className="flex items-center gap-4">
                        {activeChat.type === 'private' && (
                            <div className="flex gap-2">
                                <button onClick={() => startCall(false)} className="p-2 hover:bg-white/10 rounded-full text-cyber-muted hover:text-white transition-colors" title="Voice Call">
                                    <Phone size={20} />
                                </button>
                                <button onClick={() => startCall(true)} className="p-2 hover:bg-white/10 rounded-full text-cyber-muted hover:text-white transition-colors" title="Video Call">
                                    <Video size={20} />
                                </button>
                            </div>
                        )}
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
                    {messages.length === 0 && (
                        <div className="text-center text-cyber-muted opacity-50 mt-10">
                            {activeChat.type === 'global' ? 'Welcome to Global Chat!' : 'No messages yet. Say hello!'}
                        </div>
                    )}
                    {messages.map((msg, index) => {
                        const isMe = msg.sender_id === user?.id;
                        // Filter out signaling
                        if (msg.type && msg.type !== 'message') return null;

                        return (
                            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl p-4 ${isMe
                                    ? 'bg-cyber-primary text-cyber-black rounded-br-none'
                                    : 'bg-white/10 text-gray-200 rounded-bl-none'
                                    }`}>
                                    {!isMe && (
                                        <Link to={msg.sender_id ? `/profile/${msg.sender_id}` : '#'} className="text-xs font-bold opacity-70 mb-1 flex items-center gap-1 hover:underline">
                                            {msg.sender_username}
                                        </Link>
                                    )}
                                    <div className="break-words leading-relaxed">{msg.content}</div>
                                    <div className="text-[10px] opacity-40 mt-1 text-right">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Message ${activeChat.type === 'global' ? 'Global' : activeChat.type === 'private' ? activeChat.data.username : activeChat.data.name}...`}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all placeholder:text-gray-600"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!isConnected}
                        className="bg-cyber-primary hover:bg-cyber-primary/80 text-cyber-black font-bold rounded-xl px-6 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
