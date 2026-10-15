import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, CheckCheck, User, Settings, Shield, LogOut, UserPlus, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { notifications, totalUnread, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-40 sticky top-0">
      
      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuClick} 
        className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg mr-2"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-2xl mx-auto md:ml-4">
        <div className="relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search people, messages, groups, or settings..." 
            className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                navigate(`/contacts?search=${encodeURIComponent(e.target.value.trim())}`);
              }
            }}
          />
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-3 ml-4">
        
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {totalUnread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                  {totalUnread > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                      {totalUnread} new
                    </span>
                  )}
                </div>
                {totalUnread > 0 && (
                  <button 
                    onClick={() => markAllAsRead()}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 8).map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        if (!notif.is_read) markAsRead(notif.id);
                        if (notif.type === 'friend_request') {
                          navigate('/contacts');
                          setShowNotifications(false);
                        } else if (notif.type === 'mention' || notif.type === 'chat') {
                          navigate('/chats');
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !notif.is_read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        {notif.type === 'friend_request' ? (
                          <UserPlus className="w-4 h-4" />
                        ) : (
                          <MessageSquare className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-900 font-medium leading-snug">
                          <span className="font-bold text-slate-900">{notif.requester_name || 'Someone'}</span>
                          {notif.type === 'friend_request' ? ' sent you a friend request.' : ' sent a notification.'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Just now'}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-medium">No notifications yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">We'll alert you when there's an update</p>
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-slate-100 text-center bg-slate-50/50">
                <button
                  onClick={() => {
                    navigate('/notifications');
                    setShowNotifications(false);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 py-1 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View full notifications center
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="h-6 w-px bg-slate-200"></div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors"
            aria-label="User menu"
          >
            <div className="relative">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                  {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-sm font-bold text-slate-900 leading-none truncate max-w-[120px]">
                {user?.full_name || user?.username || 'User'}
              </p>
              <p className="text-[11px] font-medium text-green-600 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name || user?.username || 'SafeChat User'}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email || `@${user?.username || 'user'}`}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" /> Your Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" /> Account Settings
                </button>
                <button
                  onClick={() => {
                    navigate('/settings?tab=security');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Shield className="w-4 h-4 text-slate-400" /> Security & Devices
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-500" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}

