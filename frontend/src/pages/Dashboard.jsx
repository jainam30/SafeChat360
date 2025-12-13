// Dashboard: Social Feed & Stories
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import {
  Shield, Activity, Zap, Image as ImageIcon, Video, Mic,
  Send, Globe, Users, Plus, X, Heart, MessageCircle, MoreHorizontal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StoryViewer from '../components/StoryViewer';
import StoryEditor from '../components/StoryEditor';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [stories, setStories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Post Creation State
  const [newPostContent, setNewPostContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState(''); // Allow URL or Base64
  const [mediaType, setMediaType] = useState('text'); // text, image, video, audio
  const [privacy, setPrivacy] = useState('public');
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef(null);

  // Story Creation State
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyMedia, setStoryMedia] = useState('');
  const [storyType, setStoryType] = useState('image');
  const [viewingStory, setViewingStory] = useState(null);

  // Initial Fetch
  useEffect(() => {
    if (!token) return;
    fetchContent();
  }, [token]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [postsRes, storiesRes] = await Promise.all([
        fetch(getApiUrl('/api/social/posts?limit=50'), { headers }),
        fetch(getApiUrl('/api/social/stories'), { headers })
      ]);

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(Array.isArray(postsData) ? postsData : []);
      }

      if (storiesRes.ok) {
        const storiesData = await storiesRes.json();
        setStories(Array.isArray(storiesData) ? storiesData : []);
      }
    } catch (e) {
      console.warn("Fetch failed (silenced)");
      setPosts([]);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e, isStory = false) => {
    const file = e.target.files[0];
    if (!file) return;

    // Size check (max 5MB for base64 safety)
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large (Max 5MB for this demo)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target.result;
      const type = file.type.startsWith('image/') ? 'image' :
        file.type.startsWith('video/') ? 'video' :
          file.type.startsWith('audio/') ? 'audio' : 'file';

      if (isStory) {
        setStoryMedia(result);
        setStoryType(type);
      } else {
        setMediaUrl(result);
        setMediaType(type);
      }
    };
    reader.readAsDataURL(file);
  };

  const createPost = async () => {
    if (!newPostContent.trim() && !mediaUrl) return;
    setIsPosting(true);

    try {
      const payload = {
        content: newPostContent,
        media_url: mediaUrl || null,
        media_type: mediaUrl ? mediaType : null,
        privacy: privacy
      };

      const res = await fetch(getApiUrl('/api/social/posts'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts([newPost, ...posts]);
        // Reset
        setNewPostContent('');
        setMediaUrl('');
        setMediaType('text');
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to post");
      }
    } catch (e) {
      console.error(e);
      alert("Error creating post");
    } finally {
      setIsPosting(false);
    }
  };

  const createStory = async (extraData = {}) => {
    if (!storyMedia) return;

    try {
      const payload = {
        media_url: storyMedia,
        media_type: storyType,
        privacy: 'public', // Default public for stories for now
        ...extraData // music_url, overlays
      };

      const res = await fetch(getApiUrl('/api/social/stories'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowStoryModal(false);
        setStoryMedia('');
        fetchContent(); // Refresh to see new story
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex gap-6">
      {/* LEFT SIDE: Feed */}
      <div className="flex-1 w-full max-w-3xl">

        {/* STORIES SECTION */}
        <div className="glass-card p-4 mb-6 overflow-x-auto scrollbar-hide whitespace-nowrap flex gap-4 items-center">
          {/* Add Story Button */}
          <button
            onClick={() => setShowStoryModal(true)}
            className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-cyber-primary flex items-center justify-center bg-slate-50 group-hover:bg-cyber-primary/10 transition-colors">
              <Plus className="text-cyber-primary" />
            </div>
            <div className="text-xs font-medium text-cyber-text">Add Story</div>
          </button>

          {/* Story List */}
          {stories.map(story => (
            <div
              key={story.id}
              onClick={() => setViewingStory(story)}
              className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer relative group"
            >
              {/* Simplified Viewer: Just shows image in small circle for now, real implementation needs overlay */}
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                  <img src={story.author_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.username}`} className="w-full h-full object-cover" alt="" />
                </div>
              </div>
              <div className="text-xs font-medium text-cyber-text truncate w-16 text-center">{story.username}</div>

              {/* Hover Preview (Mini) */}
              <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 bg-black/50 z-10 rounded-full flex items-center justify-center text-white text-[10px]">
                View
              </div>
            </div>
          ))}

          {stories.length === 0 && (
            <div className="text-xs text-cyber-muted italic ml-2">No stories yet</div>
          )}
        </div>

        {/* CREATE POST WIDGET */}
        <div className="glass-card p-4 mb-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
              <img src={user?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-1">
              <textarea
                className="w-full bg-transparent border-none focus:ring-0 text-cyber-text placeholder:text-cyber-muted resize-none text-lg min-h-[80px]"
                placeholder={`What's on your mind, ${user?.full_name || user?.username}?`}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />

              {/* Media Preview */}
              {mediaUrl && (
                <div className="relative mt-2 mb-2 rounded-xl overflow-hidden bg-black/5 border border-cyber-border max-h-60">
                  <button onClick={() => { setMediaUrl(''); setMediaType('text'); }} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70">
                    <X size={16} />
                  </button>
                  {mediaType === 'image' && <img src={mediaUrl} className="w-full h-full object-cover" alt="" />}
                  {mediaType === 'video' && <video src={mediaUrl} controls className="w-full h-full" />}
                  {mediaType === 'audio' && <audio src={mediaUrl} controls className="w-full p-4" />}
                </div>
              )}

              <div className="border-t border-cyber-border pt-3 flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileUpload}
                  />
                  <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 text-cyber-muted hover:text-green-600 transition-colors text-sm font-medium">
                    <ImageIcon size={18} /> Photo/Video
                  </button>

                  {/* Privacy Toggle */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 text-cyber-muted hover:text-blue-600 transition-colors text-sm font-medium">
                      {privacy === 'public' ? <Globe size={18} /> : <Users size={18} />}
                      {privacy === 'public' ? 'Public' : 'Friends'}
                    </button>
                    {/* Dropdown */}
                    <div className="absolute bottom-full mb-2 left-0 w-32 bg-white shadow-xl rounded-lg overflow-hidden hidden group-hover:block z-20 border border-gray-100">
                      <button onClick={() => setPrivacy('public')} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm flex items-center gap-2"><Globe size={14} /> Public</button>
                      <button onClick={() => setPrivacy('friends')} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm flex items-center gap-2"><Users size={14} /> Friends</button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={createPost}
                  disabled={isPosting || (!newPostContent && !mediaUrl)}
                  className="bg-cyber-primary hover:bg-cyber-secondary text-white px-6 py-2 rounded-full font-medium transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isPosting ? 'Posting...' : <><Send size={16} /> Post</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FEED STREAM */}
        <div className="space-y-6">
          {posts.map(post => (
            <div key={post.id} className="glass-card p-0 overflow-hidden bg-white/70 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Post Header */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200">
                  <img src={post.author_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyber-text">{post.username}</span>
                    {post.privacy === 'public' ? <Globe size={12} className="text-cyber-muted" /> : <Users size={12} className="text-cyber-muted" />}
                  </div>
                  <div className="text-xs text-cyber-muted">{new Date(post.created_at).toLocaleString()}</div>
                </div>
                <button className="text-cyber-muted hover:text-cyber-text"><MoreHorizontal size={20} /></button>
              </div>

              {/* Post Content */}
              {post.content && (
                <div className="px-4 pb-3 text-cyber-text whitespace-pre-wrap">{post.content}</div>
              )}

              {/* Post Media */}
              {post.media_url && (
                <div className="w-full bg-black/5">
                  {post.media_type === 'image' && <img src={post.media_url} className="w-full max-h-[500px] object-contain" alt="Post content" />}
                  {post.media_type === 'video' && <video src={post.media_url} controls className="w-full max-h-[500px]" />}
                  {post.media_type === 'audio' && (
                    <div className="p-6 flex items-center justify-center bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                      <audio src={post.media_url} controls className="w-full" />
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="p-3 border-t border-cyber-border flex items-center justify-between text-cyber-muted">
                <div className="flex gap-4">
                  <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                    <Heart size={20} /> <span className="text-sm font-medium">Like</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                    <MessageCircle size={20} /> <span className="text-sm font-medium">Comment</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {posts.length === 0 && !loading && (
            <div className="text-center py-10 text-cyber-muted">No posts yet. Be the first!</div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Trends & Suggested */}
      <div className="hidden lg:block w-80 space-y-6">
        <div className="glass-card p-4">
          <h3 className="font-bold text-cyber-text mb-4 flex items-center gap-2"><Activity size={18} className="text-cyber-primary" /> Trending</h3>
          <div className="space-y-3">
            {['#SafeChat360', '#TechEvents', '#Programming', '#AI_Revolution'].map(tag => (
              <div key={tag} className="text-sm text-cyber-muted hover:text-cyber-primary cursor-pointer font-medium">{tag}</div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-bold text-cyber-text mb-4 text-sm uppercase text-cyber-muted tracking-wider">System Status</h3>
          <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> All Systems Operational
          </div>
        </div>
      </div>

      {/* Story Upload Modal (Select File) */}
      {showStoryModal && !storyMedia && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-card bg-white w-full max-w-md p-6 rounded-2xl relative">
            <button onClick={() => setShowStoryModal(false)} className="absolute top-4 right-4 text-cyber-muted hover:text-cyber-text"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4">Create Story</h2>

            <div className="border-2 border-dashed border-cyber-border rounded-xl h-64 flex flex-col items-center justify-center bg-slate-50 mb-4 overflow-hidden relative">
              <ImageIcon size={48} className="text-cyber-muted opacity-50 mb-2" />
              <button onClick={() => document.getElementById('story-file').click()} className="text-cyber-primary font-medium hover:underline">
                Upload Photo or Video
              </button>
              <div className="text-xs text-cyber-muted mt-2">Max 5MB</div>
              <input id="story-file" type="file" className="hidden" onChange={(e) => handleFileUpload(e, true)} accept="image/*,video/*" />
            </div>
          </div>
        </div>
      )}

      {/* Story Editor Overlay (Editing) */}
      {showStoryModal && storyMedia && (
        <div className="fixed inset-0 z-[60]">
          <StoryEditor
            mediaFile={storyMedia}
            mediaType={storyType}
            onClose={() => { setStoryMedia(''); setStoryType(''); setShowStoryModal(false); }}
            onPost={async (data) => {
              await createStory(data);
            }}
          />
        </div>
      )}

      {/* Story Viewer Overlay (Viewing) */}
      {viewingStory && (
        <StoryViewer
          story={viewingStory}
          onClose={() => setViewingStory(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
```
