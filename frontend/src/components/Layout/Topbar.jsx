import React, { useState, useRef, useEffect } from 'react'
import { Bell, Search, User, X, Check, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import logoImg from '../../assets/safechat_logo.png'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'

export default function Topbar() {
  const { user, logout } = useAuth()
  const { notifications } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
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
    <header className="h-16 border-b border-cyber-border bg-white/70 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
          <h1 className="text-xl font-bold text-cyber-primary header-glow">
            SafeChat360
          </h1>
        </div>
        <div className="h-4 w-px bg-cyber-border hidden sm:block"></div>
        <div className="text-sm font-medium text-cyber-muted hidden sm:block">Dashboard</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted w-4 h-4 group-focus-within:text-cyber-primary transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-slate-100 border border-cyber-border rounded-full pl-10 pr-4 py-1.5 text-sm text-cyber-text focus:outline-none focus:border-cyber-primary/50 focus:bg-white focus:ring-1 focus:ring-cyber-primary/20 transition-all w-64"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={handleNotificationClick}
            className="p-2 rounded-full hover:bg-slate-100 text-cyber-muted hover:text-cyber-primary transition-colors relative"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyber-accent rounded-full animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 z-50">
              <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                {notifications.length > 0 && (
                  <span className="text-xs bg-cyber-primary/10 text-cyber-primary px-2 py-0.5 rounded-full font-medium">
                    {notifications.length} New
                  </span>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => {
                        if (notif.type === 'friend_request') {
                          navigate('/friends');
                          setShowNotifications(false);
                        }
                      }}>
                        <div className="flex gap-3">
                          <div className="mt-1">
                            {notif.type === 'friend_request' ? (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                                <UserPlus size={16} />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                <Bell size={16} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">
                              <span className="font-semibold">{notif.requester_name || 'Someone'}</span> sent you a friend request
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
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
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden border border-cyber-border">
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-cyber-primary" />
              )}
            </div>
          </Link>
          <button
            onClick={logout}
            className="ml-2 px-4 py-1.5 rounded-lg border border-red-500/30 text-red-500 text-sm hover:bg-red-50 hover:border-red-500/50 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </header >
  )
}
