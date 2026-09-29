import React from 'react';
import { Menu, Search, Phone, Video, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-40 sticky top-0">
      
      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuClick} 
        className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg mr-2"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-2xl mx-auto md:ml-4">
        <div className="relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search people, messages, groups, or settings..." 
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          />
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="hidden md:flex items-center gap-2 ml-6">
        <button className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
          <Phone className="w-5 h-5" />
        </button>
        <button className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
          <Video className="w-5 h-5" />
        </button>
        <button className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <button className="flex items-center gap-3 pl-2 pr-1 py-1 hover:bg-slate-50 rounded-lg transition-colors">
          <div className="relative">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm">
                {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-sm font-bold text-slate-900 leading-none">{user?.full_name || user?.username || 'User'}</p>
            <p className="text-[11px] font-medium text-green-600 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 ml-1 hidden lg:block" />
        </button>
      </div>

    </header>
  );
}
