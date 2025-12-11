import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, MessageSquare, Clock, Settings, Info, Users, AlertTriangle, UserPlus, Globe } from 'lucide-react'
import SidebarSwitch from './SidebarSwitch'
import { useNotifications } from '../../context/NotificationContext';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/chat', label: 'Global Chat', icon: MessageSquare },
  { to: '/social', label: 'Social Feed', icon: Globe },
  { to: '/friends', label: 'Friends', icon: UserPlus },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/review', label: 'Review Queue', icon: AlertTriangle },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/about', label: 'About', icon: Info },
]


export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { friendRequests } = useNotifications() || { friendRequests: 0 }; // Handle context missing if accessed outside provider (shouldn't happen)

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} border-r border-white/5 bg-cyber-card/30 backdrop-blur-xl flex flex-col relative z-20 transition-all duration-300 ease-in-out`}>
      <div className="h-16 flex items-center justify-center border-b border-white/5 mb-2">
        <SidebarSwitch checked={isCollapsed} onChange={() => setIsCollapsed(!isCollapsed)} />
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {items.map(it => {
          const Icon = it.icon
          const badgeCount = (it.to === '/friends') ? friendRequests : 0;

          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative
                ${isActive
                  ? 'bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 shadow-[0_0_15px_rgba(18,196,148,0.1)]'
                  : 'text-cyber-muted hover:bg-white/5 hover:text-cyber-text'
                }
                ${isCollapsed ? 'justify-center px-2' : ''}
              `}
              title={isCollapsed ? it.label : ''}
            >
              <div className="relative">
                <Icon size={20} className={({ isActive }) => isActive ? 'animate-pulse' : 'group-hover:text-cyber-primary transition-colors'} />
                {badgeCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-black/50">
                    {badgeCount}
                  </span>
                )}
              </div>

              <span className={`font-medium transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden ml-0' : 'w-auto opacity-100 flex-1 flex justify-between items-center'}`}>
                {it.label}
                {badgeCount > 0 && !isCollapsed && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow-lg shadow-red-500/50 animate-pulse">
                    {badgeCount}
                  </span>
                )}
              </span>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/5 flex flex-col items-center">
        {!isCollapsed && (
          <div className="text-xs text-cyber-muted/50 text-center whitespace-nowrap">
            v1.0 • Secure Environment
          </div>
        )}
      </div>
    </aside>
  )
}
