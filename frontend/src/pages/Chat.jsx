import React, { useState, useEffect, useRef } from 'react';
import { formatTimeForUser } from '../utils/dateFormatter';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, resolveMediaUrl } from '../config';
import toast from 'react-hot-toast';
import {
    Send, User as UserIcon, Users, Hash, Plus, MessageSquare, Phone, Video,
    Sparkles, Trash2, Undo2, MoreHorizontal, ArrowLeft, Image as ImageIcon,
    Smile, Heart, Info, Bell, CheckCircle2
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
    const [users, setUsers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [groups, setGroups] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
    const [vibe, setVibe] = useState({ score: 100, status: 'safe', loading: false });
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [groupMembers, setGroupMembers] = useState([]);

    // Chat Header & Menu States
    const [showChatMenu, setShowChatMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const chatMenuRef = useRef(null);

    const getMutedChats = () => {
        try {
            return JSON.parse(localStorage.getItem(`muted_chats_${user?.id}`) || '[]');
        } catch {
            return [];
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) {
                setShowChatMenu(false);
            }
        };
        if (showChatMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showChatMenu]);

    useEffect(() => {
        setShowChatMenu(false);
        setIsSearchOpen(false);
        setSearchQuery('');
        if (conversationId) {
            const id = parseInt(conversationId);
            const u = friends.find(f => f.id === id) || users.find(u => u.id === id);
            setActiveChat({ type: 'private', id, data: u || { username: '...', id } });
            setMobileView('chat');
            setIsMuted(getMutedChats().includes(id));
        } else if (groupId) {
            const id = parseInt(groupId);
            const g = groups.find(g => g.id === id);
            setActiveChat({ type: 'group', id, data: g || { name: '...', id } });
            setMobileView('chat');
            setIsMuted(getMutedChats().includes(id));
        } else {
            setActiveChat({ type: null, id: null, data: null });
            setMobileView('list');
            setIsMuted(false);
        }
    }, [conversationId, groupId, friends, users, groups]);

    const messagesEndRef = useRef(null);
    const activeChatRef = useRef(activeChat);
    const chatFileInputRef = useRef(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const [activeMessageMenu, setActiveMessageMenu] = useState(null);

    // Keep ref in sync
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    // Fetch Group Members when active group changes
    useEffect(() => {
        if (!token || activeChat.type !== 'group' || !activeChat.id) {
            setGroupMembers([]);
            return;
        }
        let isCancelled = false;
        const fetchMembers = async () => {
            try {
                const res = await fetch(getApiUrl(`/api/groups/${activeChat.id}/members`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok && !isCancelled) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setGroupMembers(data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch group members", err);
            }
        };
        fetchMembers();
        return () => { isCancelled = true; };
    }, [activeChat.type, activeChat.id, token]);

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

    // Fetch History with AbortController to prevent race condition
    useEffect(() => {
        if (!token || !activeChat.type) return;
        const controller = new AbortController();
        let isCancelled = false;

        const fetchHistory = async () => {
            setMessages([]);

            try {
                let url = '/api/chat/history';
                if (activeChat.type === 'private') {
                    url += `?other_user_id=${activeChat.id}`;
                } else if (activeChat.type === 'group') {
                    url += `?group_id=${activeChat.id}`;
                }

                const res = await fetch(getApiUrl(url), {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: controller.signal
                });

                if (res.ok && !isCancelled) {
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
                if (err.name !== 'AbortError') {
                    console.error("Failed to fetch history", err);
                }
            }
        };
        fetchHistory();

        return () => {
            isCancelled = true;
            controller.abort();
        };
    }, [activeChat.type, activeChat.id, token]);

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
                        (currentActive.type === 'private' && (String(data.sender_id) === String(currentActive.id) || String(data.receiver_id) === String(currentActive.id))) ||
                        (currentActive.type === 'group' && String(data.group_id) === String(currentActive.id));

                    if (isRelevant) {
                        setMessages(prev => {
                            if (prev.find(m => m.id === data.id)) return prev;
                            return [...prev, data];
                        });
                    } else {
                        // Background Notification Logic
                        if (data.sender_id && !data.group_id) {
                            setFriends(prev => prev.map(f => {
                                if (String(f.id) === String(data.sender_id)) {
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

        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket, activeChat, token]);

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

    const sendMessage = async (overrideContent = null, overrideType = 'text') => {
        const contentToSend = overrideContent !== null ? overrideContent : inputValue;
        if (!contentToSend.trim()) return;

        try {
            const body = {
                content: contentToSend,
                receiver_id: activeChat.type === 'private' ? activeChat.id : null,
                group_id: activeChat.type === 'group' ? activeChat.id : null,
                type: overrideType
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
                    window.location.href = '/login';
                    return;
                }

                let errorMsg = "Failed to send message";
                try {
                    const err = await res.json();
                    errorMsg = (typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)) || errorMsg;
                } catch (jsonErr) {
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
            if (overrideContent === null) {
                setInputValue('');
            }

        } catch (err) {
            console.error("HTTP Send failed", err);
            alert("Connection error: " + err.message);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image exceeds 10MB limit.");
            return;
        }

        setIsUploadingImage(true);
        const toastId = toast.loading("Uploading image attachment...");
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(getApiUrl('/api/upload'), {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Upload failed");
            }

            const data = await res.json();
            await sendMessage(data.url, 'image');
            toast.success("Image sent!", { id: toastId });
        } catch (err) {
            console.error("Image upload failed", err);
            toast.error(err.message || "Failed to upload image", { id: toastId });
        } finally {
            setIsUploadingImage(false);
            if (chatFileInputRef.current) chatFileInputRef.current.value = '';
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
        <div className="flex h-full w-full bg-white overflow-hidden text-slate-900 font-sans">
            
            {/* MIDDLE PANE (Chat List) */}
            <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[340px] flex-col border-r border-slate-200 bg-slate-50 shrink-0`}>
                <div className="p-4 bg-white border-b border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-900">Chats</h2>
                        <div className="flex gap-2">
                            <button onClick={() => setShowGroupModal(true)} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                <Plus size={18} />
                            </button>
                            <button className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                        <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">All</button>
                        <button className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100">Unread</button>
                        <button className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100">Groups</button>
                        <button className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100">Favorites</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
                    {/* Groups */}
                    {groups.map(g => {
                        const isActive = activeChat.type === 'group' && String(activeChat.id) === String(g.id);
                        return (
                            <Link key={`g-${g.id}`} to={`/chats/group/${g.id}`}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${isActive ? 'bg-blue-50 border-l-[3px] border-blue-600' : 'hover:bg-slate-100 border-l-[3px] border-transparent'}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-lg">
                                    <Users size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-sm text-slate-900 truncate">{g.name}</h4>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate font-medium">{g.description || 'Group conversation'}</p>
                                </div>
                            </Link>
                        )
                    })}
                    {/* Friends */}
                    {friends.map(f => {
                        const isActive = activeChat.type === 'private' && String(activeChat.id) === String(f.id);
                        return (
                            <Link key={`f-${f.id}`} to={`/chats/${f.id}`}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${isActive ? 'bg-blue-50 border-l-[3px] border-blue-600' : 'hover:bg-slate-100 border-l-[3px] border-transparent'}`}
                            >
                                <div className="relative flex-shrink-0">
                                    <img src={f.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-sm text-slate-900 truncate">{f.username}</h4>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate font-medium">{f.last_message || 'Tap to chat'}</p>
                                </div>
                                {f.unread_count > 0 && <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">{f.unread_count}</div>}
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* MAIN PANE */}
            <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative bg-white border-r border-slate-200 min-w-0`}>
                
                {activeChat.type ? (
                    <>
                        {/* Header */}
                        <div className="h-16 px-4 md:px-6 flex justify-between items-center border-b border-slate-200 bg-white sticky top-0 z-20">
                            <div className="flex items-center gap-3">
                                <button className="md:hidden p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-lg" onClick={() => { setMobileView('list'); navigate('/chats'); }}>
                                    <ArrowLeft size={20} />
                                </button>
                                
                                {activeChat.type === 'private' ? (
                                    <>
                                        <div className="relative hidden sm:block">
                                            <img src={activeChat.data?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.data?.username}`} className="w-10 h-10 rounded-full object-cover" />
                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 leading-none">{activeChat.data?.username}</h3>
                                            <p className="text-[11px] font-medium text-green-600 flex items-center gap-1 mt-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold hidden sm:flex">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 leading-none">{activeChat.data?.name}</h3>
                                            <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                                                <Users size={12}/> {groupMembers.length > 0 ? `${groupMembers.length} members` : 'Group chat'}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                                {activeChat.type === 'private' && (
                                    <>
                                        <button 
                                            onClick={() => startCall(false)} 
                                            title="Start Voice Call" 
                                            aria-label="Start voice call"
                                            className="p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center"
                                        >
                                            <Phone size={18} />
                                        </button>
                                        <button 
                                            onClick={() => startCall(true)} 
                                            title="Start Video Call" 
                                            aria-label="Start video call"
                                            className="p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center"
                                        >
                                            <Video size={18} />
                                        </button>
                                    </>
                                )}
                                <button 
                                    onClick={() => setIsSearchOpen(prev => !prev)} 
                                    title="Search Conversation" 
                                    aria-label="Search conversation"
                                    className={`p-2 rounded-lg transition-colors flex items-center justify-center ${isSearchOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                </button>
                                
                                <div className="relative" ref={chatMenuRef}>
                                    <button 
                                        onClick={() => setShowChatMenu(prev => !prev)} 
                                        aria-label="Chat options"
                                        aria-expanded={showChatMenu}
                                        className={`p-2 rounded-lg transition-colors flex items-center justify-center ${showChatMenu ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        <MoreHorizontal size={18} />
                                    </button>
                                    
                                    {showChatMenu && (
                                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
                                            {activeChat.type === 'private' && (
                                                <button
                                                    onClick={() => {
                                                        setShowChatMenu(false);
                                                        navigate(`/profile/${activeChat.data?.id}`);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                                                >
                                                    <UserIcon size={16} className="text-slate-500" />
                                                    <span>View Profile</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setShowChatMenu(false);
                                                    setIsSearchOpen(true);
                                                }}
                                                className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                                            >
                                                <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                                <span>Search Messages</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowChatMenu(false);
                                                    const muted = getMutedChats();
                                                    const chatId = activeChat.id;
                                                    let nextMuted;
                                                    if (muted.includes(chatId)) {
                                                        nextMuted = muted.filter(id => id !== chatId);
                                                        setIsMuted(false);
                                                        toast.success("Notifications unmuted for this chat");
                                                    } else {
                                                        nextMuted = [...muted, chatId];
                                                        setIsMuted(true);
                                                        toast.success("Notifications muted for this chat");
                                                    }
                                                    localStorage.setItem(`muted_chats_${user?.id}`, JSON.stringify(nextMuted));
                                                }}
                                                className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                                            >
                                                <Bell size={16} className={isMuted ? "text-amber-500" : "text-slate-500"} />
                                                <span>{isMuted ? "Unmute Notifications" : "Mute Notifications"}</span>
                                            </button>
                                            <div className="h-px bg-slate-100 my-1" />
                                            <button
                                                onClick={() => {
                                                    setShowChatMenu(false);
                                                    setShowClearConfirm(true);
                                                }}
                                                className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-medium"
                                            >
                                                <Trash2 size={16} />
                                                <span>Clear Chat History</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Search Bar when toggled */}
                        {isSearchOpen && (
                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 animate-in fade-in duration-150">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search messages in this conversation..."
                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    autoFocus
                                />
                                {searchQuery && (
                                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                        {messages.filter(m => m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase())).length} found
                                    </span>
                                )}
                                <button
                                    onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1"
                                >
                                    Close
                                </button>
                            </div>
                        )}

                        {/* Message Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white space-y-4 relative scroll-smooth">
                            
                            {activeChat.type === 'group' && activeChat.data?.description && (
                                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-blue-100 mb-6 flex items-start justify-between shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 text-blue-600">📌</div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">Group Topic</p>
                                            <p className="text-xs text-slate-600 font-medium">{activeChat.data.description}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center mb-6">
                                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-4 py-1 rounded-full">Today</span>
                            </div>

                            {messages
                                .filter(msg => !searchQuery.trim() || (msg.content && msg.content.toLowerCase().includes(searchQuery.toLowerCase())))
                                .map((msg, index) => {
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
                        <div className="p-3 md:p-4 bg-white border-t border-slate-200">
                            <form 
                                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2"
                            >
                                <input
                                    ref={chatFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => chatFileInputRef.current?.click()}
                                    disabled={isUploadingImage}
                                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                    title="Send image"
                                >
                                    <ImageIcon size={20} className={isUploadingImage ? 'animate-pulse text-blue-500' : ''} />
                                </button>
                                
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={`Type a message to ${activeChat.data?.username || activeChat.data?.name || '...'}`}
                                    className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm text-slate-800 placeholder-slate-400"
                                />

                                <button type="button" onClick={handleAiAssist} disabled={isAiLoading || !inputValue.trim()} className={`text-slate-400 hover:text-blue-600 transition-colors p-1 ${isAiLoading ? 'animate-pulse text-blue-400' : ''}`} title="AI Polish">
                                    <Sparkles size={18} />
                                </button>
                                <button type="button" className="text-slate-400 hover:text-blue-600 transition-colors p-1 hidden sm:block"><Smile size={20} /></button>
                                
                                <button 
                                    type="submit" 
                                    disabled={!inputValue.trim()}
                                    className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-slate-300 ml-1"
                                >
                                    <Send size={14} className="-ml-0.5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6 bg-slate-50/50">
                        <MessageSquare size={48} className="text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Your Messages</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-sm text-center">Select a chat or start a new conversation to securely connect with your friends.</p>
                        <button onClick={() => setShowGroupModal(true)} className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 shadow-sm transition-all">Start a Conversation</button>
                    </div>
                )}
            </div>

            {/* RIGHT SIDEBAR (Contact/Group Info) */}
            <div className="hidden lg:flex w-[280px] xl:w-[320px] flex-col bg-slate-50 overflow-y-auto shrink-0 border-l border-slate-200">
                {activeChat.type === 'private' && (
                    <div className="p-6 text-center">
                        <div className="w-24 h-24 rounded-full mx-auto mb-3 overflow-hidden border-2 border-white shadow-sm relative">
                            <img src={activeChat.data?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.data?.username}`} className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 leading-tight">{activeChat.data?.username}</h2>
                        <p className="text-xs font-bold text-green-600 flex items-center justify-center gap-1 mt-1 mb-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online</p>
                        <p className="text-xs text-slate-500 font-medium mb-6">SafeChat360 Verified User</p>
                        
                        <div className="flex justify-center gap-6 mb-8 border-b border-slate-200 pb-8">
                            <button onClick={() => startCall(false)} className="flex flex-col items-center gap-2 group">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors"><Phone size={18}/></div>
                                <span className="text-[10px] font-bold text-blue-600">Audio Call</span>
                            </button>
                            <button onClick={() => startCall(true)} className="flex flex-col items-center gap-2 group">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors"><Video size={18}/></div>
                                <span className="text-[10px] font-bold text-blue-600">Video Call</span>
                            </button>
                        </div>
                        
                        <div className="text-left space-y-5">
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-2"><UserIcon size={14}/> About</h4>
                                <p className="text-sm text-slate-500 ml-5 leading-snug">Private conversation protected by end-to-end encryption.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeChat.type === 'group' && (
                    <div className="p-6 text-center">
                        <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                            <Users size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 leading-tight">{activeChat.data?.name}</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1 mb-4">{groupMembers.length} active members</p>
                        
                        {activeChat.data?.description && (
                            <div className="text-left bg-white p-3 rounded-xl border border-slate-200 mb-5 shadow-sm">
                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">About Group</h4>
                                <p className="text-xs text-slate-700 leading-relaxed">{activeChat.data.description}</p>
                            </div>
                        )}

                        <div className="text-left">
                            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <Users size={14}/> Group Members ({groupMembers.length})
                            </h4>
                            <div className="space-y-2 max-h-72 overflow-y-auto">
                                {groupMembers.map((member, mIdx) => (
                                    <div key={member.id || mIdx} className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-100 hover:bg-slate-100/50 transition-colors">
                                        <img 
                                            src={member.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} 
                                            className="w-8 h-8 rounded-full object-cover border border-slate-200" 
                                            alt=""
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                {member.username} {member.id === user?.id ? '(You)' : ''}
                                            </p>
                                            <p className="text-[10px] text-slate-400 capitalize">{member.role || 'Member'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {showGroupModal && (
                <CreateGroupModal
                    token={token}
                    onClose={() => setShowGroupModal(false)}
                    onCreated={handleGroupCreated}
                />
            )}

            {showClearConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Clear Chat History?</h3>
                        <p className="text-sm text-slate-500 mb-6">Are you sure you want to clear your local view of this conversation?</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setMessages([]);
                                    setShowClearConfirm(false);
                                    toast.success("Chat history cleared from view");
                                }}
                                className="px-4 py-2 rounded-xl text-white bg-red-600 hover:bg-red-700 font-semibold text-sm transition-colors shadow-sm"
                            >
                                Clear History
                            </button>
                        </div>
                    </div>
                </div>
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
                <div className="bg-slate-100 px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-slate-600 border border-slate-200">
                    <Phone size={12} className={message.content.includes("Ended") ? "text-red-400" : "text-green-500"} />
                    <span>{message.sender_id === user.id ? "You" : message.sender_username} - {message.content}</span>
                    <span className="text-slate-400 ml-1">{formatTime(message.created_at)}</span>
                </div>
            </div>
        );
    }

    const showAvatar = !isOwn && (index === messages.length - 1 || messages[index + 1]?.sender_id !== message.sender_id);

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-2 relative`}>
            {!isOwn && (
                <div className="w-8 h-8 flex-shrink-0 mr-3 flex items-end">
                    {showAvatar ? (
                        <img
                            src={senderUser?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_username}`}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            alt="avatar"
                        />
                    ) : <div className="w-8" />}
                </div>
            )}
            <div className={`max-w-[70%] relative flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && activeChatType !== 'private' && showAvatar && (
                    <span className="text-[11px] font-bold text-slate-500 mb-1 ml-1">{message.sender_username}</span>
                )}
                
                <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 border border-slate-200/60 rounded-bl-sm whitespace-pre-wrap'}`}>
                    {message.is_unsent ? (
                        <span className="italic opacity-60 text-sm flex items-center gap-1">Message unsent</span>
                    ) : (message.type === 'image' || message.msg_type === 'image' || (typeof message.content === 'string' && (message.content.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || message.content.startsWith('/uploads/')))) ? (
                        <div className="rounded-xl overflow-hidden max-w-xs my-1 bg-black/5">
                            <img
                                src={resolveMediaUrl(message.content)}
                                alt="Attachment"
                                className="w-full max-h-72 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => window.open(resolveMediaUrl(message.content), '_blank')}
                            />
                        </div>
                    ) : (
                        message.content
                    )}
                </div>
                
                <div className={`text-[10px] mt-1 font-bold ${isOwn ? 'mr-1 text-blue-500 flex items-center gap-1' : 'ml-1 text-slate-400'}`}>
                    {formatTime(message.created_at)} 
                    {isOwn && <CheckCircle2 size={10} className="text-blue-500" strokeWidth={3}/>}
                </div>
            </div>
        </div>
    );
}
