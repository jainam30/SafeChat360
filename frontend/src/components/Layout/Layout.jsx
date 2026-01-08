import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import FloatingModeration from './FloatingModeration'
import { Menu } from 'lucide-react'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-transparent text-cyber-text overflow-hidden relative">
      {/* Background ambient glow - handled by AnimatedBackground */}{/* Replaced by AnimatedBackground component */}{/* Mobile Menu Button - Visible only on mobile when sidebar closed */}

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        <div className="md:pl-0">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          {children}
        </main>
        <FloatingModeration />
      </div>
    </div>
  )
}
