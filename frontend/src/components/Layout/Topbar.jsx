import React from 'react'
import { Bell, Search, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Topbar() {
  const { user, logout } = useAuth()
  return (
    <header className="h-16 border-b border-white/5 bg-cyber-card/30 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-cyber-text">Dashboard</h1>
        <div className="h-4 w-px bg-white/10"></div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted w-4 h-4 group-focus-within:text-cyber-primary transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-black/20 border border-white/5 rounded-full pl-10 pr-4 py-1.5 text-sm text-cyber-text focus:outline-none focus:border-cyber-primary/30 focus:bg-black/40 transition-all w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-white/5 text-cyber-muted hover:text-cyber-primary transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyber-accent rounded-full animate-pulse"></span>
        </button>

        <div className="h-8 w-px bg-white/10"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-cyber-text">{user?.email?.split('@')[0]}</div>
            <div className="text-xs text-cyber-muted">Admin</div>
          </div>
          <Link to="/account" className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyber-primary to-cyber-secondary p-[2px] cursor-pointer hover:scale-105 transition-transform">
            <div className="h-full w-full rounded-full bg-cyber-card flex items-center justify-center overflow-hidden">
              <User size={20} className="text-cyber-primary" />
            </div>
          </Link>
          <button
            onClick={logout}
            className="ml-2 px-4 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 hover:border-red-500/50 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
