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

      {/* Mobile Menu Button - Visible only on mobile when sidebar closed */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden absolute top-4 left-4 z-40 p-2 glass-button text-white border border-white/20 hover:bg-white/10 transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        <div className="pl-14 md:pl-0"> {/* Offset topbar for menu button on mobile */}
          <Topbar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          {children}
        </main>
        <FloatingModeration />
      </div>
    </div>
  )
}
