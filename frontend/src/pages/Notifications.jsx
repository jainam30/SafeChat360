import React, { useState } from 'react';
import { 
    Bell, MessageSquare, Heart, UserPlus, AtSign, Settings,
    Check, X, MoreHorizontal, Filter
} from 'lucide-react';

export default function Notifications() {
    const [activeTab, setActiveTab] = useState('all');

    const notifications = [
        { id: 1, type: 'message', user: 'Priya Mehta', action: 'sent you a message', time: '2 mins ago', unread: true, img: 'https://i.pravatar.cc/150?u=priya', content: '"Hey, are we still on for the meeting tomorrow?"', icon: <MessageSquare size={12} className="text-white"/>, color: 'bg-blue-500' },
        { id: 2, type: 'like', user: 'Rohan Kumar', action: 'liked your post', time: '15 mins ago', unread: true, img: 'https://i.pravatar.cc/150?u=rohan', content: 'Beautiful sunset from today\'s trek! 🌄', icon: <Heart size={12} className="text-white"/>, color: 'bg-pink-500' },
        { id: 3, type: 'mention', user: 'Aarav Sharma', action: 'mentioned you in a comment', time: '1 hour ago', unread: false, img: 'https://i.pravatar.cc/150?u=aarav', content: '"@jainamjain Check this out!"', icon: <AtSign size={12} className="text-white"/>, color: 'bg-indigo-500' },
        { id: 4, type: 'follow', user: 'Neha Jain', action: 'started following you', time: '3 hours ago', unread: false, img: 'https://i.pravatar.cc/150?u=neha', icon: <UserPlus size={12} className="text-white"/>, color: 'bg-green-500' },
        { id: 5, type: 'like', user: 'Sneha Patel', action: 'liked your photo', time: 'Yesterday', unread: false, img: 'https://i.pravatar.cc/150?u=sneha', icon: <Heart size={12} className="text-white"/>, color: 'bg-pink-500' },
        { id: 6, type: 'message', user: 'Project Team', action: 'New message in group', time: 'Yesterday', unread: false, img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop', content: 'Aarav: Updated the deployment plan', icon: <MessageSquare size={12} className="text-white"/>, color: 'bg-blue-500' },
    ];

    const filters = [
        { id: 'all', label: 'All Notifications', count: 12 },
        { id: 'messages', label: 'Messages', count: 4 },
        { id: 'social', label: 'Social', count: 6 },
        { id: 'mentions', label: 'Mentions', count: 2 },
    ];

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
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Notifications</h1>
                            <p className="text-sm font-medium text-slate-500 mt-1">Stay updated with your messages and social activity.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                            Mark all as read
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <Settings size={18}/>
                        </button>
                    </div>
                </div>

                {/* Mobile Tabs */}
                <div className="flex md:hidden gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
                    {filters.map(f => (
                        <button 
                            key={f.id}
                            onClick={() => setActiveTab(f.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeTab === f.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {notifications.map((notif, i) => (
                            <div key={i} className={`p-4 sm:p-5 flex gap-4 transition-colors hover:bg-slate-50 ${notif.unread ? 'bg-blue-50/30' : ''}`}>
                                <div className="relative shrink-0">
                                    <img src={notif.img} className="w-12 h-12 rounded-full object-cover border border-slate-200" alt={notif.user}/>
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${notif.color} rounded-full border-2 border-white flex items-center justify-center shadow-sm`}>
                                        {notif.icon}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm text-slate-700 leading-snug pr-4">
                                            <span className="font-bold text-slate-900">{notif.user}</span> {notif.action}
                                        </p>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-[10px] font-bold text-slate-400">{notif.time}</span>
                                            {notif.unread && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                                            <button className="text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"><MoreHorizontal size={16}/></button>
                                        </div>
                                    </div>
                                    {notif.content && (
                                        <div className="mt-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 p-2.5 rounded-lg border-l-2 border-l-slate-300 line-clamp-2">
                                            {notif.content}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR (Filters) */}
            <div className="hidden md:flex w-[280px] flex-col border-l border-slate-200 bg-white shrink-0 p-6">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
                    <Filter size={16} className="text-slate-400"/> Filter Notifications
                </h3>
                
                <div className="space-y-1">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setActiveTab(f.id)}
                            className={`flex items-center justify-between w-full p-3 rounded-lg font-bold text-sm transition-colors ${
                                activeTab === f.id 
                                ? 'bg-blue-50 text-blue-600' 
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            {f.label}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === f.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                {f.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
