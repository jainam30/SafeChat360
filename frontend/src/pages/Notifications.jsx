import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getApiUrl } from '../config';
import { 
    Bell, Check, MessageSquare, Heart, Users, AtSign, 
    PhoneMissed, ShieldAlert, MoreHorizontal, CheckCircle2, UserPlus 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Notifications() {
    const { token } = useAuth();
    const { notifications, checkNotifications } = useNotifications();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'all';

    const handleTabChange = (tab) => {
        setSearchParams({ tab });
    };

    const handleMarkAsRead = async (id, isFriendRequest = false) => {
        if (isFriendRequest) {
            // Friend requests don't have a read state natively in this setup, they are dismissed by accepting/rejecting in Contacts
            return;
        }
        try {
            const res = await fetch(getApiUrl(`/api/notifications/${id}/read`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                checkNotifications();
            }
        } catch (e) {
            console.error("Failed to mark read", e);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const res = await fetch(getApiUrl('/api/notifications/read-all'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('All notifications marked as read');
                checkNotifications();
            }
        } catch (e) {
            toast.error('Failed to mark all as read');
            console.error("Failed to mark all read", e);
        }
    };

    // Filter notifications based on tab
    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            if (activeTab === 'all') return true;
            if (activeTab === 'messages' && n.type === 'message') return true;
            if (activeTab === 'social' && ['like', 'comment', 'post'].includes(n.type)) return true;
            if (activeTab === 'groups' && n.type && n.type.includes('group')) return true;
            if (activeTab === 'mentions' && n.type === 'mention') return true;
            if (activeTab === 'calls' && ['missed_call', 'call'].includes(n.type)) return true;
            if (activeTab === 'system' && ['system', 'security'].includes(n.type)) return true;
            if (activeTab === 'requests' && n.type === 'friend_request') return true;
            return false;
        });
    }, [notifications, activeTab]);

    // Grouping by Date
    const groupedNotifications = useMemo(() => {
        const groups = {
            today: [],
            yesterday: [],
            earlier: []
        };
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterday = today - 86400000;

        filteredNotifications.forEach(n => {
            const date = new Date(n.created_at).getTime();
            if (date >= today) {
                groups.today.push(n);
            } else if (date >= yesterday) {
                groups.yesterday.push(n);
            } else {
                groups.earlier.push(n);
            }
        });
        
        return groups;
    }, [filteredNotifications]);

    const getNotificationDetails = (n) => {
        switch (n.type) {
            case 'friend_request':
                return {
                    icon: <UserPlus className="text-blue-500" size={20} />,
                    text: `${n.requester_name} sent you a contact request.`,
                    link: '/contacts?tab=requests'
                };
            case 'message':
                return {
                    icon: <MessageSquare className="text-emerald-500" size={20} />,
                    text: `${n.requester_name} sent you a new message.`,
                    link: `/chats/${n.requester_id}`
                };
            case 'like':
                return {
                    icon: <Heart className="text-pink-500" size={20} />,
                    text: `${n.requester_name} liked your post.`,
                    link: '/social'
                };
            case 'comment':
                return {
                    icon: <MessageSquare className="text-indigo-500" size={20} />,
                    text: `${n.requester_name} commented on your post.`,
                    link: '/social'
                };
            case 'mention':
                return {
                    icon: <AtSign className="text-amber-500" size={20} />,
                    text: `${n.requester_name} mentioned you.`,
                    link: '/social'
                };
            case 'group_invite':
            case 'group_activity':
                return {
                    icon: <Users className="text-blue-600" size={20} />,
                    text: `New activity in a group by ${n.requester_name}.`,
                    link: `/chats/group/${n.reference_id || ''}`
                };
            case 'missed_call':
                return {
                    icon: <PhoneMissed className="text-red-500" size={20} />,
                    text: `Missed call from ${n.requester_name}.`,
                    link: `/chats/${n.requester_id}`
                };
            case 'security':
                return {
                    icon: <ShieldAlert className="text-red-600" size={20} />,
                    text: `Security alert from system.`,
                    link: '/security'
                };
            default:
                return {
                    icon: <Bell className="text-slate-400" size={20} />,
                    text: `${n.requester_name || 'System'} sent a ${n.type || 'notification'}.`,
                    link: '#'
                };
        }
    };

    const renderEmptyState = (message) => (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-white border border-slate-200 border-dashed rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">You're all caught up.</h3>
            <p className="text-slate-500 max-w-sm">{message}</p>
        </div>
    );

    const NotificationItem = ({ notif }) => {
        const details = getNotificationDetails(notif);
        const isUnread = notif.type === 'friend_request' ? true : !notif.is_read; // Friend req always prominent until accepted

        return (
            <div 
                className={`group relative p-4 flex gap-4 items-start transition-colors border-b border-slate-100 last:border-0 hover:bg-slate-50 ${isUnread ? 'bg-blue-50/50' : 'bg-white'}`}
                onClick={() => !notif.is_read && handleMarkAsRead(notif.id, notif.type === 'friend_request')}
            >
                {isUnread && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-full bg-cyber-primary rounded-r"></span>
                )}
                
                <Link to={details.link} className="shrink-0 mt-1">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
                        {details.icon}
                    </div>
                </Link>

                <div className="flex-1 min-w-0">
                    <Link to={details.link} className="block group">
                        <p className={`text-sm ${isUnread ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                            {details.text}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </Link>
                </div>

                <div className="shrink-0 flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {isUnread && notif.type !== 'friend_request' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                            className="p-1.5 text-cyber-primary hover:bg-blue-100 rounded-full transition-colors"
                            title="Mark as read"
                        >
                            <Check size={16} />
                        </button>
                    )}
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" title="More options">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto pb-12 px-4 md:px-0">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                        <Bell className="text-cyber-primary" />
                        Notifications
                    </h1>
                    <p className="text-slate-500">Stay up to date with activity across SafeChat360.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleMarkAllAsRead} className="px-4 py-2 bg-white text-slate-700 border border-slate-200 font-medium rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-2">
                        <CheckCircle2 size={18} /> Mark all as read
                    </button>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Tabs / Nav */}
                <div className="lg:w-64 shrink-0">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden sticky top-20">
                        <nav className="p-2 space-y-1">
                            {[
                                { id: 'all', label: 'All Notifications', icon: <Bell size={18} /> },
                                { id: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
                                { id: 'social', label: 'Social', icon: <Heart size={18} /> },
                                { id: 'groups', label: 'Groups', icon: <Users size={18} /> },
                                { id: 'mentions', label: 'Mentions', icon: <AtSign size={18} /> },
                                { id: 'calls', label: 'Calls', icon: <PhoneMissed size={18} /> },
                                { id: 'requests', label: 'Requests', icon: <UserPlus size={18} /> },
                                { id: 'system', label: 'System', icon: <ShieldAlert size={18} /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-cyber-primary' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                    <span className={activeTab === tab.id ? 'text-cyber-primary' : 'text-slate-400'}>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        {filteredNotifications.length === 0 ? (
                            renderEmptyState("No notifications match this category.")
                        ) : (
                            <div className="flex flex-col">
                                {groupedNotifications.today.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Today</div>
                                        {groupedNotifications.today.map(n => <NotificationItem key={n.id} notif={n} />)}
                                    </>
                                )}
                                {groupedNotifications.yesterday.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Yesterday</div>
                                        {groupedNotifications.yesterday.map(n => <NotificationItem key={n.id} notif={n} />)}
                                    </>
                                )}
                                {groupedNotifications.earlier.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Earlier</div>
                                        {groupedNotifications.earlier.map(n => <NotificationItem key={n.id} notif={n} />)}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
