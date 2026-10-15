import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { 
  Plus, Image as ImageIcon, Video, Smile, MoreHorizontal, 
  ThumbsUp, MessageSquare, Share2, Bookmark, CheckCircle2,
  Users, UserPlus, Compass
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import StoryEditor from '../components/StoryEditor';

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [stories, setStories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [suggestedPeople, setSuggestedPeople] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStoryEditor, setShowStoryEditor] = useState(false);
  const [addingFriendId, setAddingFriendId] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [storiesRes, postsRes, friendsRes, usersRes] = await Promise.allSettled([
          axios.get(getApiUrl('/api/social/stories'), { headers }),
          axios.get(getApiUrl('/api/social/posts?limit=15'), { headers }),
          axios.get(getApiUrl('/api/friends/'), { headers }),
          axios.get(getApiUrl('/api/chat/users'), { headers })
        ]);

        if (storiesRes.status === 'fulfilled' && Array.isArray(storiesRes.value.data)) {
          setStories(storiesRes.value.data);
        }
        if (postsRes.status === 'fulfilled' && Array.isArray(postsRes.value.data)) {
          setPosts(postsRes.value.data);
        }
        if (friendsRes.status === 'fulfilled' && Array.isArray(friendsRes.value.data)) {
          setOnlineFriends(friendsRes.value.data);
        }
        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data)) {
          // Exclude self and existing friends from suggestions
          const friendIds = friendsRes.status === 'fulfilled' && Array.isArray(friendsRes.value.data)
            ? friendsRes.value.data.map(f => f.id)
            : [];
          const filtered = usersRes.value.data.filter(u => u.id !== user?.id && !friendIds.includes(u.id));
          setSuggestedPeople(filtered.slice(0, 5));
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, user?.id]);

  const handleLikePost = async (postId) => {
    if (!token) return;
    try {
      await axios.post(getApiUrl(`/api/social/posts/${postId}/like`), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const isLiked = p.is_liked_by_me;
          return {
            ...p,
            is_liked_by_me: !isLiked,
            likes_count: isLiked ? Math.max(0, (p.likes_count || 1) - 1) : (p.likes_count || 0) + 1
          };
        }
        return p;
      }));
    } catch (err) {
      toast.error("Failed to like post");
    }
  };

  const handleSavePost = async (postId) => {
    if (!token) return;
    try {
      await axios.post(getApiUrl(`/api/social/posts/${postId}/save`), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Post saved to bookmarks!");
    } catch (err) {
      toast.error("Failed to save post");
    }
  };

  const handleSendFriendRequest = async (targetUserId) => {
    if (!token) return;
    setAddingFriendId(targetUserId);
    try {
      await axios.post(getApiUrl('/api/friends/request'), { friend_id: targetUserId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Friend request sent!");
      setSuggestedPeople(prev => prev.filter(p => p.id !== targetUserId));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send request");
    } finally {
      setAddingFriendId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col xl:flex-row gap-6 pb-20">
      
      {/* Left Column (Stories + Posts) */}
      <div className="flex-1 min-w-0 space-y-6">
        
        {/* Stories Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Stories</h2>
            <Link to="/social" className="text-sm font-semibold text-blue-600 hover:underline">View Social Feed</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            
            {/* Add Story Button */}
            <div 
              onClick={() => setShowStoryEditor(true)}
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
            >
              <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-blue-400 p-0.5 relative group-hover:border-blue-600 transition-colors bg-blue-50/50 flex items-center justify-center">
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} className="w-full h-full object-cover" alt="Me" />
                  ) : (
                    <div className="text-blue-600 font-bold text-lg">
                      {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700">Add Story</span>
            </div>

            {/* Real Stories */}
            {stories.length > 0 ? (
              stories.map(story => (
                <div 
                  key={story.id} 
                  onClick={() => navigate('/social')}
                  className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
                >
                  <div className="w-[72px] h-[72px] rounded-full p-[3px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 group-hover:scale-105 transition-transform shadow-sm">
                    <div className="w-full h-full rounded-full border-[2.5px] border-white overflow-hidden bg-slate-100 flex items-center justify-center">
                      <img 
                        src={story.user_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.username || 'user'}`} 
                        className="w-full h-full object-cover" 
                        alt={story.username || 'Story'} 
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 truncate w-16 text-center">{story.username || 'User'}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center text-xs text-slate-400 py-4 px-2 italic">
                No active 24h stories. Click 'Add Story' to publish yours!
              </div>
            )}
          </div>
        </div>

        {/* Real Posts Feed */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <p className="text-sm font-medium animate-pulse">Loading feed updates...</p>
          </div>
        ) : posts.length > 0 ? (
          posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                {/* Post Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={post.author_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_username || 'user'}`} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-100" 
                      alt="" 
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{post.author_name || post.author_username || 'Community Member'}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'} 
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span> 
                        <span className="capitalize">{post.privacy || 'public'}</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Post Content */}
                <p className="text-sm text-slate-800 mb-4 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>
                
                {/* Media Attachment */}
                {post.media_url && (
                  <div className="rounded-xl overflow-hidden max-h-[400px] mb-4 bg-slate-900">
                    {post.media_type === 'video' ? (
                      <video src={post.media_url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={post.media_url} className="w-full max-h-[400px] object-cover mx-auto" alt="Post media" />
                    )}
                  </div>
                )}

                {/* Reactions Stats */}
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      <ThumbsUp className="w-2.5 h-2.5 fill-white" />
                    </div>
                    <span className="font-semibold">{post.likes_count || 0} likes</span>
                  </div>
                  <div>
                    <span>{post.comments_count || 0} comments</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-2">
                  <button 
                    onClick={() => handleLikePost(post.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-colors ${
                      post.is_liked_by_me ? 'text-blue-600 bg-blue-50/60' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${post.is_liked_by_me ? 'fill-blue-600' : ''}`}/> 
                    {post.is_liked_by_me ? 'Liked' : 'Like'}
                  </button>
                  <button 
                    onClick={() => navigate(`/social?post=${post.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4"/> Comment
                  </button>
                  <button 
                    onClick={() => handleSavePost(post.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Bookmark className="w-4 h-4"/> Save
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <Compass className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No community posts yet</h3>
            <p className="text-xs text-slate-400 mb-5 max-w-sm mx-auto">Be the first to share an update, thought, or photo with your network.</p>
            <Link 
              to="/social" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              Go to Social Feed
            </Link>
          </div>
        )}

      </div>

      {/* Right Column (Widgets) */}
      <div className="w-full xl:w-[320px] shrink-0 space-y-6 hidden xl:block">
        
        {/* Create Post Quick Action */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Create Post</h2>
          </div>
          <div 
            onClick={() => navigate('/social')}
            className="flex items-center gap-3 mb-4 cursor-pointer"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="Me" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-500 font-medium truncate">
              What's on your mind, {user?.full_name?.split(' ')[0] || user?.username || 'there'}?
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button 
              onClick={() => navigate('/social')}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-green-500" /> Photo
            </button>
            <button 
              onClick={() => navigate('/social')}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-colors"
            >
              <Video className="w-4 h-4 text-red-500" /> Video
            </button>
            <button 
              onClick={() => setShowStoryEditor(true)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 text-blue-500" /> Story
            </button>
          </div>
        </div>

        {/* Suggested People */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900">Suggested People</h2>
            <Link to="/contacts" className="text-xs font-semibold text-blue-600 hover:underline">See All</Link>
          </div>
          <div className="space-y-3">
            {suggestedPeople.length > 0 ? (
              suggestedPeople.map(person => (
                <div key={person.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={person.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`} 
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" 
                      alt="" 
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{person.username}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{person.full_name || `@${person.username}`}</p>
                    </div>
                  </div>
                  <button 
                    disabled={addingFriendId === person.id}
                    onClick={() => handleSendFriendRequest(person.id)}
                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors border border-blue-200 disabled:opacity-50 shrink-0"
                  >
                    {addingFriendId === person.id ? "Adding..." : "Add"}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No suggestions right now</p>
            )}
          </div>
        </div>

        {/* Online Friends */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900">Friends Online</h2>
            <Link to="/contacts" className="text-xs font-semibold text-blue-600 hover:underline">Manage</Link>
          </div>
          <div className="space-y-2.5">
            {onlineFriends.length > 0 ? (
              onlineFriends.slice(0, 6).map(friend => (
                <div 
                  key={friend.id} 
                  onClick={() => navigate(`/chats/${friend.id}`)}
                  className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={friend.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} 
                        className="w-8 h-8 rounded-full object-cover border border-slate-200" 
                        alt="" 
                      />
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full"></div>
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">{friend.username}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Chat</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-slate-400">
                <Users className="w-6 h-6 mx-auto mb-1 text-slate-300 stroke-[1.5]" />
                <p className="text-xs">No contacts yet</p>
                <Link to="/contacts" className="text-xs font-bold text-blue-600 hover:underline mt-1 inline-block">Find people</Link>
              </div>
            )}
          </div>
        </div>

      </div>

      {showStoryEditor && (
        <StoryEditor
          token={token}
          onClose={() => setShowStoryEditor(false)}
          onPublished={() => {
            setShowStoryEditor(false);
            // Refresh stories
            axios.get(getApiUrl('/api/social/stories'), { headers: { Authorization: `Bearer ${token}` } })
              .then(res => { if (Array.isArray(res.data)) setStories(res.data); })
              .catch(() => {});
          }}
        />
      )}

    </div>
  );
}

