import React, { useState } from 'react';
import { 
    Bell, MessageSquare, Heart, UserPlus, AtSign, CheckCheck,
    CheckCircle2, Compass
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Notifications() {
    const { notifications, totalUnread, markAsRead, markAllAsRead } = useNotifications();
    const [activeTab, setActiveTab] = useState('all');
    const navigate = useNavigate();

    const filteredNotifications = (notifications || []).filter(item => {
        if (activeTab === 'unread') return !item.is_read;
        if (activeTab === 'requests') return item.type === 'friend_request';
        if (activeTab === 'mentions') return item.type === 'mention' || item.type === 'chat';
        return true;
    });

    return (
        <div className="flex h-full w-full bg-slate-50 text-slate-900 overflow-hidden">
            
            {/* MAIN PANE */}
            <div className="flex-1 overflow-y-auto min-w-0 p-6 md:p-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Bell size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Notifications Center</h1>
                            <p className="text-sm font-medium text-slate-500 mt-1">Real-time alerts, mentions, and friend requests</p>
                        </div>
                    </div>
                    {totalUnread > 0 && (
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={markAllAsRead}
                                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors border border-blue-200"
                            >
                                <CheckCheck size={16} /> Mark all as read
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2 border-b border-slate-200">
                    {[
                        { id: 'all', label: `All (${notifications.length})` },
                        { id: 'unread', label: `Unread (${totalUnread})` },
                        { id: 'requests', label: 'Friend Requests' },
                        { id: 'mentions', label: 'Mentions & Messages' }
                    ].map(f => (
                        <button 
                            key={f.id}
                            onClick={() => setActiveTab(f.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                                activeTab === f.id 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {filteredNotifications.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredNotifications.map((notif) => (
                                <div 
                                    key={notif.id} 
                                    onClick={() => {
                                        if (!notif.is_read) markAsRead(notif.id);
                                        if (notif.type === 'friend_request') {
                                            navigate('/contacts');
                                        } else if (notif.type === 'mention' || notif.type === 'chat') {
                                            navigate('/chats');
                                        }
                                    }}
                                    className={`p-4 sm:p-5 flex gap-4 transition-colors cursor-pointer hover:bg-slate-50 ${
                                        !notif.is_read ? 'bg-blue-50/40' : ''
                                    }`}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base">
                                            {notif.type === 'friend_request' ? (
                                                <UserPlus size={20} />
                                            ) : (
                                                <MessageSquare size={20} />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-sm text-slate-700 leading-snug pr-4">
                                                <span className="font-bold text-slate-900">{notif.requester_name || 'Someone'}</span>
                                                {notif.type === 'friend_request' ? ' sent you a friend request.' : ' sent a notification.'}
                                            </p>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Recently'}
                                                </span>
                                                {!notif.is_read && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                                            </div>
                                        </div>
                                        {notif.type === 'friend_request' && (
                                            <div className="mt-2 flex gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate('/contacts'); }}
                                                    className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    View in Contacts
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-16 text-center text-slate-400">
                            <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                            <h3 className="text-sm font-bold text-slate-700">No notifications found</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                {activeTab === 'unread' ? "You're all caught up! No unread notifications." : "You'll be alerted when people message you, send friend requests, or interact with your posts."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
