import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, Image as ImageIcon, Plus, 
  Shield, Check, Search, Bell, Video, Smartphone, Key,
  Lock, AlertTriangle, FileText, Globe
} from 'lucide-react';
import StoryViewer from '../components/StoryViewer';

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stories, setStories] = useState([]);
  const [recentMedia, setRecentMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [viewingStory, setViewingStory] = useState(null);

  useEffect(() => {
    if (!token) return;
    
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [friendsRes, groupsRes, storiesRes, postsRes] = await Promise.allSettled([
          fetch(getApiUrl('/api/friends/'), { headers }),
          fetch(getApiUrl('/api/groups/'), { headers }),
          fetch(getApiUrl('/api/social/stories'), { headers }),
          fetch(getApiUrl('/api/social/posts'), { headers })
        ]);

        if (friendsRes.status === 'fulfilled' && friendsRes.value.ok) {
          setFriends(await friendsRes.value.json());
        }
        if (groupsRes.status === 'fulfilled' && groupsRes.value.ok) {
          setGroups(await groupsRes.value.json());
        }
        if (storiesRes.status === 'fulfilled' && storiesRes.value.ok) {
          setStories(await storiesRes.value.json());
        }
        if (postsRes.status === 'fulfilled' && postsRes.value.ok) {
          const posts = await postsRes.value.json();
          // Filter out text-only posts for the Recent Media section
          const mediaPosts = posts.filter(p => p.media_url).slice(0, 4);
          setRecentMedia(mediaPosts);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  // Combine friends and groups for recent conversations (stub logic for ordering)
  const recentConversations = [
    ...friends.map(f => ({ ...f, isGroup: false })), 
    ...groups.map(g => ({ ...g, isGroup: true }))
  ].slice(0, 5);

  const onlineContacts = friends.filter(f => f.is_online || true).slice(0, 5); // Fallback to all if is_online undefined

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-4 lg:p-8 overflow-y-auto">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Good afternoon, {user?.username || 'User'}</h1>
          <p className="text-slate-500 mt-1">Here's what's happening across your SafeChat360 account.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyber-primary/50 text-sm"
            />
          </div>
          <button className="p-2 relative bg-white rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors" onClick={() => navigate('/notifications')}>
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-200 cursor-pointer" onClick={() => navigate('/profile')}>
            <img 
              src={user?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT/MAIN COLUMN (Takes up 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* QUICK ACTIONS */}
          <section>
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link to="/chats" className="flex flex-col items-center justify-center gap-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-cyber-primary/30 transition-all text-cyber-primary">
                <MessageSquare size={24} />
                <span className="text-sm font-medium text-slate-700">Start Chat</span>
              </Link>
              <Link to="/chats" className="flex flex-col items-center justify-center gap-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-cyber-primary/30 transition-all text-cyber-primary">
                <Users size={24} />
                <span className="text-sm font-medium text-slate-700">Group</span>
              </Link>
              <Link to="/social" className="flex flex-col items-center justify-center gap-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-cyber-primary/30 transition-all text-cyber-primary">
                <Globe size={24} />
                <span className="text-sm font-medium text-slate-700">Post</span>
              </Link>
              <Link to="/media" className="flex flex-col items-center justify-center gap-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-cyber-primary/30 transition-all text-cyber-primary">
                <ImageIcon size={24} />
                <span className="text-sm font-medium text-slate-700">Upload</span>
              </Link>
            </div>
          </section>

          {/* RECENT CONVERSATIONS */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Recent Conversations</h2>
              <Link to="/chats" className="text-sm font-medium text-cyber-primary hover:underline">View all chats</Link>
            </div>
            
            {loading ? (
              <div className="p-5 text-center text-slate-500">Loading...</div>
            ) : recentConversations.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {recentConversations.map((chat, idx) => (
                  <Link 
                    key={idx} 
                    to={chat.isGroup ? `/chats/group/${chat.id}` : `/chats/${chat.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100">
                        <img 
                          src={chat.profile_photo || chat.group_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.username || chat.name}`} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      {!chat.isGroup && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{chat.username || chat.name}</h3>
                      <p className="text-sm text-slate-500 truncate">{chat.last_message || 'No messages yet'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-slate-400">2h ago</span>
                      {chat.unread_count > 0 && (
                        <span className="bg-cyber-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <p>No recent conversations.</p>
                <Link to="/contacts" className="text-cyber-primary font-medium mt-2 inline-block">Find people to chat with</Link>
              </div>
            )}
          </section>

          {/* STORIES */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Stories</h2>
              <Link to="/social" className="text-sm font-medium text-cyber-primary hover:underline">View all stories</Link>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {/* Add Story */}
              <Link to="/social" className="flex flex-col items-center gap-2 min-w-[72px]">
                <div className="w-16 h-16 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-cyber-primary transition-colors cursor-pointer relative">
                  <img src={user?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="w-full h-full rounded-full object-cover opacity-50" />
                  <Plus className="absolute z-10" />
                </div>
                <span className="text-xs font-medium text-slate-600">Add Story</span>
              </Link>
              
              {/* Friends Stories */}
              {loading ? (
                <div className="text-sm text-slate-400 flex items-center">Loading...</div>
              ) : stories.length > 0 ? (
                stories.map(story => (
                  <div key={story.id} className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group" onClick={() => setViewingStory(story)}>
                    <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-cyber-primary to-blue-400 group-hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-100">
                        <img src={story.author_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.username}`} className="w-full h-full object-cover" alt="story" />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-700 truncate w-16 text-center">{story.username}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400 flex items-center px-4">No recent stories</div>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN (Takes up 1 col) */}
        <div className="space-y-6">
          
          {/* SECURITY STATUS */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-0 opacity-50"></div>
            
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shield className="text-green-500" size={20} />
                Security Status
              </h2>
              <Link to="/security" className="text-sm font-medium text-cyber-primary hover:underline">Review</Link>
            </div>
            
            <div className="space-y-3 relative z-10">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 bg-green-100 p-1 rounded-full text-green-600"><Check size={12} strokeWidth={3} /></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">End-to-End Encryption</p>
                  <p className="text-xs text-slate-500">Active for all private chats</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 bg-green-100 p-1 rounded-full text-green-600"><Check size={12} strokeWidth={3} /></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Account Verified</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 bg-yellow-100 p-1 rounded-full text-yellow-600"><AlertTriangle size={12} strokeWidth={3} /></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Two-Factor Auth</p>
                  <p className="text-xs text-slate-500">Not enabled. Recommended.</p>
                </div>
              </div>
            </div>
          </section>

          {/* RECENT MEDIA */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Media</h2>
              <Link to="/media" className="text-sm font-medium text-cyber-primary hover:underline">View all</Link>
            </div>
            
            {loading ? (
              <div className="text-sm text-slate-500">Loading...</div>
            ) : recentMedia.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {recentMedia.map((post, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    {post.media_type === 'image' ? (
                      <img src={post.media_url.startsWith('http') ? post.media_url : getApiUrl(post.media_url)} className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" alt="media" />
                    ) : post.media_type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 relative cursor-pointer group">
                        <Video className="text-white z-10" />
                        <video src={post.media_url.startsWith('http') ? post.media_url : getApiUrl(post.media_url)} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <FileText />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 text-center py-4">No recent media.</div>
            )}
          </section>

          {/* ONLINE CONTACTS */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Online Contacts</h2>
              <Link to="/contacts" className="text-sm font-medium text-cyber-primary hover:underline">All contacts</Link>
            </div>
            
            {loading ? (
              <div className="text-sm text-slate-500">Loading...</div>
            ) : onlineContacts.length > 0 ? (
              <div className="space-y-4">
                {onlineContacts.map(contact => (
                  <div key={contact.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
                          <img src={contact.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.username}`} className="w-full h-full object-cover" alt="Avatar" />
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>
                      <span className="text-sm font-bold text-slate-800">{contact.username}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/chats/${contact.id}`} className="p-2 text-slate-400 hover:text-cyber-primary hover:bg-slate-50 rounded-full transition-colors">
                        <MessageSquare size={16} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 text-center py-4">No contacts online right now.</div>
            )}
          </section>

        </div>
      </div>
      
      {/* Story Viewer Modal */}
      {viewingStory && (
        <StoryViewer
          story={viewingStory}
          onClose={() => setViewingStory(null)}
        />
      )}
      
    </div>
  );
}
