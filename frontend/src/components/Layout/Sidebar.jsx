import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, MessageSquare, Users, User, Clock, Image as ImageIcon, Bookmark, Search, Bell, Settings, Shield, HelpCircle, Cloud, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const getNavItems = (userRole) => {
  const isMod = userRole === 'admin' || userRole === 'moderator';
  
  const baseItems = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/chats', label: 'Chats', icon: MessageSquare, id: 'chats' },
    { to: '/groups', label: 'Groups', icon: Users, id: 'groups' },
    { to: '/contacts', label: 'Contacts', icon: User, id: 'contacts' }, // Using contacts for both Friends/Contacts
    { to: '/media', label: 'Media', icon: ImageIcon, id: 'media' },
    { to: '/saved', label: 'Saved Items', icon: Bookmark, id: 'saved' },
    { to: '/social', label: 'Stories', icon: Clock },
    
    
    { to: '/explore', label: 'Explore', icon: Search },
    { to: '/notifications', label: 'Notifications', icon: Bell, id: 'notifications' },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/security', label: 'Security & Privacy', icon: Shield },
    { to: '/help', label: 'Help & Support', icon: HelpCircle },
  ];

  if (isMod) {
    baseItems.push(
      { to: '/moderation', label: 'Mod Tools', icon: Shield },
      { to: '/moderation/review', label: 'Review Queue', icon: AlertTriangle }
    );
  }

  return baseItems;
};

export default function Sidebar({ mobileOpen = false, setMobileOpen }) {
  const { friendRequests, notifications } = useNotifications() || { friendRequests: 0, notifications: [] };
  const { user } = useAuth();
  const navigate = useNavigate();
  const items = getNavItems(user?.role);

  return (
    <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative
    `}>
      {/* Brand */}
      <div className="h-16 flex items-center px-6 cursor-pointer mt-2 mb-2" onClick={() => navigate('/')}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
        </div>
        <span className="text-xl font-bold text-slate-900 tracking-tight">SafeChat<span className="text-blue-600">360</span></span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hide">
        {items.map(it => {
          const Icon = it.icon;
          let badgeCount = 0;
          if (it.id === 'contacts') badgeCount = friendRequests;
          if (it.id === 'notifications') badgeCount = notifications?.filter(n => !n.read)?.length || 0;
          if (it.id === 'chats') badgeCount = 3; // Mocking 3 unread for design fidelity

          return (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors relative
                ${isActive
                  ? 'bg-blue-50 text-blue-600 border-l-[3px] border-blue-600 -ml-[1px]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
              <span className="flex-1">{it.label}</span>
              
              {badgeCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Storage Widget */}
      <div className="p-4 mx-4 mb-4 mt-2 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-3">
          <Cloud className="w-5 h-5 text-blue-500" />
          Secure Storage
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-blue-500 w-[32%] rounded-full"></div>
        </div>
        <p className="text-xs text-slate-500 mb-4 font-medium">3.2 GB of 10 GB used</p>
        <button className="w-full py-2 bg-white border border-blue-200 text-blue-600 font-bold text-sm rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
          Upgrade
        </button>
      </div>
    </aside>
  );
}
