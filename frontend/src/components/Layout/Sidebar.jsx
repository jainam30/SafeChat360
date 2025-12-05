import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, MessageSquare, Image, Mic, Clock, Settings, Info, Users, Film } from 'lucide-react'

const items = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/social', label: 'Social Feed', icon: Users },
  { to: '/video', label: 'Video', icon: Film },
  { to: '/text', label: 'Text', icon: MessageSquare },
  { to: '/image', label: 'Image', icon: Image },
  { to: '/audio', label: 'Audio', icon: Mic },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/about', label: 'About', icon: Info },
]

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-white/5 bg-cyber-card/30 backdrop-blur-xl flex flex-col relative z-20">
      <div className="p-6 mb-2">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary to-cyber-secondary header-glow">
          SafeChat360
        </h2>
        <p className="text-xs text-cyber-muted mt-1 tracking-wider uppercase">Multimodal Shield</p>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {items.map(it => {
          const Icon = it.icon
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                ${isActive
                  ? 'bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 shadow-[0_0_15px_rgba(18,196,148,0.1)]'
                  : 'text-cyber-muted hover:bg-white/5 hover:text-cyber-text'
                }
              `}
            >
              <Icon size={20} className={({ isActive }) => isActive ? 'animate-pulse' : 'group-hover:text-cyber-primary transition-colors'} />
              <span className="font-medium">{it.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="text-xs text-cyber-muted/50 text-center">
          v1.0 • Secure Environment
        </div>
      </div>
    </aside>
  )
}
