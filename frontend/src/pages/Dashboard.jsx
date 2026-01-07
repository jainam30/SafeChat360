import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  Smile, Image as ImageIcon, X, Globe, Users, Plus, Camera, Video, AlertTriangle, Share2, Shield, Check
} from 'lucide-react';
import StoryViewer from '../components/StoryViewer';
import StoryEditor from '../components/StoryEditor';

const Dashboard = () => {
  const { token, user } = useAuth();

  // Helper to resolve media URLs
  const getMediaSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('blob:') || url.startsWith('http')) return url;
    return getApiUrl(url);
  };

  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Post Creation State
  const [newPostContent, setNewPostContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('text');
  const [privacy, setPrivacy] = useState('public');
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Story State
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyMedia, setStoryMedia] = useState('');
  const [storyType, setStoryType] = useState('');
  const [viewingStory, setViewingStory] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchResults();
  }, [token]);

  /* Update fetch to be robust */
  const fetchResults = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        fetch(getApiUrl('/api/social/posts'), { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(getApiUrl('/api/social/stories'), { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(getApiUrl('/api/chat/users'), { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const [postsRes, storiesRes, usersRes] = results;

      if (postsRes.status === 'fulfilled' && postsRes.value.ok) {
        setPosts(await postsRes.value.json());
      }
      if (storiesRes.status === 'fulfilled' && storiesRes.value.ok) {
        setStories(await storiesRes.value.json());
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        setUsers(await usersRes.value.json());
      }
    } catch (e) {
      console.error("Dashboard fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, isStory = false) => {
    /* Import compressor dynamically */
    const { compressImage } = await import('../utils/imageCompressor');

    const file = e.target.files[0];
    if (!file) return;

    // Immediate local preview
    const localUrl = URL.createObjectURL(file);
    if (!isStory) {
      setMediaUrl(localUrl);
      setMediaType(file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'text');
    } else {
      setStoryMedia(localUrl);
      setStoryType(file.type.startsWith('image/') ? 'image' : 'video');
      setShowStoryModal(true);
    }

    if (file.size > 50 * 1024 * 1024) {
      alert("File too large (Max 50MB)");
      return;
    }

    /* Compress Image if needed */
    let finalFile = file;
    if (file.type.startsWith('image/')) {
      try {
        const compressedDataUrl = await compressImage(file);
        // Convert back to File if needed for FormData upload, OR just send base64 if api supports it.
        // The current /api/upload expects a file in FormData.
        // We need to convert DataURL -> Blob -> File.
        const res = await fetch(compressedDataUrl);
        const blob = await res.blob();
        finalFile = new File([blob], file.name, { type: 'image/jpeg' });
      } catch (err) {
        console.error("Compression failed, using original", err);
      }
    }

    const formData = new FormData();
    formData.append('file', finalFile);

    try {
      setIsUploading(true);
      const res = await fetch(getApiUrl('/api/upload'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (isStory) {
          setStoryMedia(data.url);
          setStoryType(data.type);
          setShowStoryModal(true);
        } else {
          setMediaUrl(data.url);
          setMediaType(data.type);
        }
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim() && !mediaUrl) return;
    if (isUploading) {
      alert("Please wait for the upload to complete.");
      return;
    }
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
        setNewPostContent('');
        setMediaUrl('');
        setMediaType('text');
      }
    } catch (e) {
      console.error(e);
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
        privacy: 'public',
        ...extraData
      };

      const res = await fetch(getApiUrl('/api/social/stories'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowStoryModal(false);
        setStoryMedia('');
        fetchResults(); // Refresh stories
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex justify-center min-h-full">
      <div className="w-full max-w-[1000px] flex flex-col lg:flex-row gap-4 lg:gap-10 pt-0 lg:pt-8 pb-10 lg:pb-20 px-0 lg:px-4">

        {/* LEFT/MAIN COLUMN */}
        <div className="w-full lg:max-w-[630px] flex flex-col mx-auto lg:mx-0">

          {/* STORIES TRAY */}
          <div className="glass-panel border-none bg-black/20 rounded-xl p-4 mb-6 overflow-x-auto scrollbar-hide flex gap-4 shadow-sm">
            {/* Add Story Button */}
            <div className="flex flex-col items-center gap-1 min-w-[66px] cursor-pointer" onClick={() => document.getElementById('story-file').click()}>
              <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-white/10 border border-white/20 relative group hover:border-cyber-primary transition-colors">
                <div className="w-full h-full rounded-full overflow-hidden bg-black/40 flex items-center justify-center">
                  <img src={user?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Your profile" />
                </div>
                <div className="absolute bottom-0 right-0 bg-cyber-primary text-white rounded-full p-0.5 border-2 border-black">
                  <Plus size={12} strokeWidth={3} />
                </div>
              </div>
              <span className="text-xs text-cyber-muted truncate w-full text-center group-hover:text-white">Your Story</span>
              <input id="story-file" type="file" className="hidden" onChange={(e) => handleFileUpload(e, true)} accept="image/*,video/*" />
            </div>

            {/* Story Items */}
            {stories.map(story => (
              <div key={story.id} className="flex flex-col items-center gap-1 min-w-[66px] cursor-pointer group" onClick={() => setViewingStory(story)}>
                <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-gradient-to-tr from-cyber-primary to-cyber-secondary group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-black/40">
                    <img src={story.author_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.username}`} className="w-full h-full object-cover" alt={`${story.username}'s story`} />
                  </div>
                </div>
                <span className="text-xs text-cyber-muted truncate w-16 text-center font-medium group-hover:text-white transition-colors">{story.username}</span>
              </div>
            ))}
          </div>

          {/* CREATE POST */}
          <div className="glass-card p-4 mb-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20 border border-white/10">
                <img src={user?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="w-full h-full object-cover" alt="Your profile" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Start a post..."
                  className="w-full h-10 bg-black/5 rounded-full px-4 text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyber-primary/50 transition-all border border-gray-200"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />

                {mediaUrl && (
                  <div className="relative mt-3 rounded-lg overflow-hidden aspect-square w-full max-w-[400px] bg-black/20 mx-auto border border-white/10 shadow-inner">
                    <button
                      onClick={() => {
                        setMediaUrl('');
                        setMediaType('text');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full z-10 hover:bg-black/80 transition-colors"
                    >
                      <X size={18} />
                    </button>
                    {mediaType === 'image' && <img src={getMediaSrc(mediaUrl)} className="w-full h-full object-cover" alt="Post media preview" />}
                    {mediaType === 'video' && <video src={getMediaSrc(mediaUrl)} controls className="w-full h-full object-cover" />}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/5 rounded-full text-cyber-muted hover:text-cyber-primary transition-colors tooltip" title="Add Photo/Video">
                      <ImageIcon size={20} />
                    </button>
                    <button onClick={() => setShowStoryModal(true)} className="p-2 hover:bg-white/5 rounded-full text-cyber-muted hover:text-pink-500 transition-colors tooltip" title="Create Story">
                      <ImageIcon size={20} className="rotate-90" /> {/* Placeholder for Video icon if missing */}
                    </button>
                    <button className="p-2 hover:bg-white/5 rounded-full text-cyber-muted hover:text-yellow-500 transition-colors tooltip" title="Feeling/Activity">
                      <Smile size={20} />
                    </button>
                    <div className="h-8 w-px bg-white/10 mx-2"></div>
                    <select
                      value={privacy}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="bg-transparent text-sm font-medium text-cyber-muted focus:outline-none cursor-pointer hover:text-white [&>option]:text-black"
                    >
                      <option value="public">Public</option>
                      <option value="friends">Friends</option>
                      <option value="private">Only Me</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden">
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,audio/*" onChange={handleFileUpload} />
                    </div>
                    {(newPostContent || mediaUrl) && (
                      <button onClick={createPost} disabled={isPosting || isUploading} className="text-sm font-bold text-cyber-primary hover:text-cyber-primary_hover disabled:opacity-50">
                        {isPosting ? 'Posting...' : isUploading ? 'Uploading...' : 'Post'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FEED STREAM */}
          <div className="flex flex-col gap-4">
            {posts.map(post => (
              <article key={post.id} className="glass-card overflow-hidden">
                {/* Post Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 cursor-pointer">
                      <img src={post.author_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} className="w-full h-full object-cover" alt={`${post.username}'s profile`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-none cursor-pointer hover:underline">{post.username}</p>
                      {post.location && <p className="text-xs text-slate-500 mt-1">{post.location}</p>}
                    </div>
                  </div>
                  <button className="text-cyber-muted hover:text-white"><MoreHorizontal size={20} /></button>
                </div>

                {/* Media */}
                {post.media_url && (
                  <div className="w-full bg-black/40 aspect-square relative flex items-center justify-center overflow-hidden border-y border-white/5">
                    {post.media_type === 'image' && <img src={getMediaSrc(post.media_url)} className="w-full h-full object-cover" loading="lazy" alt="Post content" />}
                    {post.media_type === 'video' && <video src={getMediaSrc(post.media_url)} controls className="w-full h-full object-contain" />}
                    {post.media_type === 'audio' && <div className="w-full p-10 flex justify-center"><audio src={getMediaSrc(post.media_url)} controls /></div>}
                  </div>
                )}

                {/* Content If No Media */}
                {!post.media_url && post.content && (
                  <div className="p-6 bg-gradient-to-br from-cyber-primary/10 to-purple-500/10 min-h-[150px] flex items-center justify-center text-center border-y border-white/5">
                    <p className="text-lg font-medium text-slate-800">{post.content}</p>
                  </div>
                )}

                {/* Action Bar */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-5">
                      <button
                        onClick={async () => {
                          try {
                            await fetch(getApiUrl(`/api/social/posts/${post.id}/like`), { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                            // Optimistic update
                            setPosts(posts.map(p => p.id === post.id ? { ...p, likes_count: (p.likes_count || 0) + (p.has_liked ? -1 : 1), has_liked: !p.has_liked } : p));
                          } catch (e) { console.error(e); }
                        }}
                        className={`${post.has_liked ? 'text-cyber-accent' : 'text-cyber-muted hover:text-cyber-accent'} transition-colors`}
                      >
                        <Heart size={24} fill={post.has_liked ? "currentColor" : "none"} />
                      </button>
                      <button className="text-cyber-muted hover:text-white transition-colors"><MessageCircle size={24} /></button>
                      <button className="text-cyber-muted hover:text-white transition-colors"><Send size={24} /></button>
                    </div>
                    <button className="text-cyber-muted hover:text-white"><Bookmark size={24} /></button>
                  </div>

                  {/* Likes Count */}
                  <div className="text-sm font-semibold text-slate-800 mb-2">
                    {post.likes_count || 0} likes
                  </div>

                  {/* Caption */}
                  {post.content && post.media_url && (
                    <div className="text-sm text-slate-800 mb-2">
                      <span className="font-semibold mr-2">{post.username}</span>
                      <span className="text-slate-600">{post.content}</span>
                    </div>
                  )}

                  {/* Time */}
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                    {new Date(post.created_at).toDateString()}
                  </div>
                </div>

                {/* Add Comment */}
                <div className="border-t border-white/10 p-3 flex items-center gap-3">
                  <button className="text-cyber-muted hover:text-white"><Smile size={24} /></button>
                  <input type="text" placeholder="Add a comment..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-slate-400 text-slate-800" />
                  <button className="text-cyber-primary font-semibold text-sm opacity-50 hover:opacity-100">Post</button>
                </div>
              </article>
            ))}
          </div>

          {posts.length === 0 && !loading && (
            <div className="text-center py-10 text-cyber-muted glass-card">No posts yet. Be the first!</div>
          )}
        </div>

        {/* RIGHT COLUMN (DESKTOP) */}
        <div className="hidden lg:block w-[320px] space-y-6 h-fit sticky top-8">
          {/* Profile Card */}
          <div className="glass-card p-6 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-cyber-primary to-cyber-secondary mx-auto">
                <div className="w-full h-full rounded-full border-4 border-black/20 overflow-hidden bg-black/50">
                  <img
                    src={user?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-800 tracking-tight">{user?.username}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>

            <div className="flex justify-center gap-6 mt-6 border-t border-gray-200 pt-4">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-800">24</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-800">1.2k</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-800">85</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Following</div>
              </div>
            </div>
          </div>

          {/* Suggested Friends */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-bold text-slate-800">Suggested for you</div>
              <button className="text-xs font-bold text-cyber-primary hover:text-cyber-primary_hover">See All</button>
            </div>

            <div className="space-y-3">
              {users.sort(() => 0.5 - Math.random()).slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                      <img src={u.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" alt={u.username} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800 hover:underline cursor-pointer">{u.username}</div>
                      <div className="text-xs text-slate-500 truncate w-32">New Member</div>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-cyber-primary hover:text-white">Follow</button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="glass-card p-4 text-xs text-cyber-muted text-center">
            © 2025 SafeChat360
          </div>
        </div>

      </div>

      {/* Story Modals */}
      {showStoryModal && storyMedia && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center">
          {/* Simple wrapper for now, assuming StoryEditor handles its own closing UI */}
          <StoryEditor
            mediaFile={storyMedia}
            mediaType={storyType}
            onClose={() => { setStoryMedia(''); setStoryType(''); setShowStoryModal(false); }}
            onPost={async (data) => { await createStory(data); }}
          />
        </div>
      )}

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
