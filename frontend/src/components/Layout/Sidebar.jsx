import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, MessageSquare, Clock, Settings, Info, Users, AlertTriangle, UserPlus, Globe, Shield } from 'lucide-react'
import SidebarSwitch from './SidebarSwitch'
import { useNotifications } from '../../context/NotificationContext';
// Added utility to hide text on mobile if needed
const hideOnMobile = 'hidden md:inline';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/chat', label: 'Global Chat', icon: MessageSquare },
  { to: '/social', label: 'Social Feed', icon: Globe },
  { to: '/friends', label: 'Friends', icon: UserPlus },
  { to: '/moderation', label: 'Mod Tools', icon: Shield },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/review', label: 'Review Queue', icon: AlertTriangle },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/about', label: 'About', icon: Info },
]


export default function Sidebar({ mobileOpen = false, setMobileOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { friendRequests } = useNotifications() || { friendRequests: 0 }; // Handle context missing if accessed outside provider (shouldn't happen)

  // Mobile: if mobileOpen is true, we force show (translate-x-0). 
  // Desktop: we obey isCollapsed.
  // We use `md:` prefix to apply desktop styles separately.
  return (
    <aside className={`
        fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out border-r border-white/10
        bg-cyber-background
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} 
        w-20 max-w-[50%]
        md:relative md:translate-x-0 ${isCollapsed ? 'md:w-20' : 'md:w-64'} md:block
    `}>
      <div className="h-16 hidden md:flex items-center justify-center border-b border-cyber-border mb-2">
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
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive
                  ? 'bg-white/10 text-cyber-secondary shadow-md font-bold border-l-4 border-cyber-secondary'
                  : 'text-cyber-muted hover:bg-white/5 hover:text-white'
                }
                ${isCollapsed ? 'justify-center px-2' : ''}
              `}
              title={isCollapsed ? it.label : ''}
              onClick={() => setMobileOpen(false)}
            >
              <div className="relative">
                <Icon size={20} className={({ isActive }) => isActive ? 'animate-pulse' : 'group-hover:text-slate-900 transition-colors'} />
                {badgeCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-cyber-accent text-cyber-background font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-cyber-background">
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

      <div className="p-4 border-t border-cyber-border flex flex-col items-center">
        {!isCollapsed && (
          <div className="text-xs text-cyber-muted/50 text-center whitespace-nowrap">
            v1.0 • Secure Environment
          </div>
        )}
      </div>
    </aside>
  )
}
