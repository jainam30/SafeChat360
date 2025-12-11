import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import FloatingModeration from './FloatingModeration'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex bg-cyber-black text-cyber-text overflow-hidden relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyber-primary/5 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyber-secondary/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {children}
        </main>
        <FloatingModeration />
      </div>
    </div>
  )
}
