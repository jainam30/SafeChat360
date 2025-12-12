import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import FloatingModeration from './FloatingModeration'
import { Menu } from 'lucide-react'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-transparent text-cyber-text overflow-hidden relative">
      {/* Background ambient glow - simplified for light mode */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-300/20 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Mobile Menu Button - Visible only on mobile when sidebar closed */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden absolute top-4 left-4 z-40 p-2 bg-white/80 backdrop-blur rounded-full shadow-md text-cyber-primary border border-cyber-border hover:bg-white transition-colors"
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
