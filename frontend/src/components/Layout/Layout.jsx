import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import FloatingModeration from './FloatingModeration'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex bg-white font-sans text-slate-900 overflow-hidden">
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 bg-slate-900/20 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Navigation Sidebar */}
      <Sidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white scroll-smooth relative">
          {children}
        </main>
      </div>

      <FloatingModeration />
    </div>
  )
}
