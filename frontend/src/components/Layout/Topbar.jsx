import React, { useState, useRef, useEffect } from 'react'
import { Bell, Search, User, X, Check, UserPlus, Menu } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import logoImg from '../../assets/safechat_logo.png'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import CyberSearchInput from '../UI/CyberSearchInput'

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { notifications } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const notificationRef = useRef(null)
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
  }

  return (
    <header className="h-16 border-b border-white/20 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 shadow-sm bg-[linear-gradient(to_top,#5ee7df_0%,#b490ca_100%)]">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
          <h1 className="hidden sm:block text-xl font-bold text-white header-glow drop-shadow-md">
            SafeChat360
          </h1>
        </div>
        <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
        <div className="text-sm font-medium text-slate-800 hidden sm:block">Dashboard</div>
      </div>

      <div className="flex items-center gap-4">
        {/* Mobile Search Toggle */}
        <button
          className="md:hidden text-slate-200 hover:text-white"
          onClick={() => setShowSearch(!showSearch)}
        >
          {showSearch ? <X size={20} /> : <Search size={20} />}
        </button>

        {/* Desktop Search */}
        <div className="hidden md:block transform scale-75 origin-left w-[350px] -my-2">
          <CyberSearchInput placeholder="Search..." />
        </div>

        {/* Mobile Search Overlay */}
        {showSearch && (
          <div className="absolute top-16 left-0 right-0 bg-cyber-background/95 backdrop-blur-md p-4 border-b border-white/10 md:hidden z-50 flex justify-center animate-in slide-in-from-top-2">
            <div className="w-full max-w-sm">
              <CyberSearchInput placeholder="Search..." />
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={handleNotificationClick}
            className="p-2 rounded-full hover:bg-white/20 text-slate-800 hover:text-slate-900 transition-colors relative"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyber-accent rounded-full animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass-card overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 z-50 border border-white/10">
              <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-semibold text-white text-sm">Notifications</h3>
                {notifications.length > 0 && (
                  <span className="text-xs bg-cyber-primary/10 text-cyber-primary px-2 py-0.5 rounded-full font-medium">
                    {notifications.length} New
                  </span>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-cyber-muted">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => {
                        if (notif.type === 'friend_request') {
                          navigate('/friends');
                          setShowNotifications(false);
                        }
                      }}>
                        <div className="flex gap-3">
                          <div className="mt-1">
                            {notif.type === 'friend_request' ? (
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <UserPlus size={16} />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-cyber-muted">
                                <Bell size={16} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white">
                              <span className="font-semibold">{notif.requester_name || 'Someone'}</span> sent you a friend request
                            </p>
                            <p className="text-xs text-cyber-muted mt-1">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {notif.type === 'friend_request' && (
                            <div className="self-center">
                              <button className="text-cyber-primary hover:text-cyber-secondary text-xs font-medium px-2 py-1 bg-cyber-primary/5 rounded hover:bg-cyber-primary/10 transition-colors">
                                View
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-cyber-border"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-cyber-text">{user?.email?.split('@')[0]}</div>
            {/* <div className="text-xs text-cyber-muted">Admin</div> */}
          </div>
          <Link to="/account" className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyber-primary to-cyber-secondary p-[2px] cursor-pointer hover:scale-105 transition-transform">
            <div className="h-full w-full rounded-full bg-black/20 flex items-center justify-center overflow-hidden border border-white/10">
              <img
                src={user?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'User'}`}
                alt={user?.username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'User'}`;
                }}
              />
            </div>
          </Link>
          <button
            onClick={logout}
            className="ml-2 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all font-medium flex items-center justify-center"
            title="Logout"
          >
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden transform rotate-90 scale-125">⏻</span>
          </button>
        </div>
      </div>
    </header >
  )
}
