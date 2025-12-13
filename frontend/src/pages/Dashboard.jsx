import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  Smile, Image as ImageIcon, X, Globe, Users
} from 'lucide-react';
import StoryViewer from '../components/StoryViewer';
import StoryEditor from '../components/StoryEditor';

const Dashboard = () => {
  const { token, user } = useAuth();
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
    }
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
    <div className="flex justify-center bg-gray-50 min-h-screen">
      <div className="w-full max-w-[1000px] flex justify-between gap-10 pt-8 pb-20 px-4">

        {/* LEFT/MAIN COLUMN */}
        <div className="w-full max-w-[630px] flex flex-col mx-auto lg:mx-0">

          {/* STORIES TRAY */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 overflow-x-auto scrollbar-hide flex gap-4 shadow-sm">
            {/* Add Story Button */}
            <div className="flex flex-col items-center gap-1 min-w-[66px] cursor-pointer" onClick={() => document.getElementById('story-file').click()}>
              <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-gray-100 border border-gray-300 relative">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img src={user?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="w-full h-full object-cover opacity-80" alt="Your profile" />
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                </div>
              </div>
              <span className="text-xs text-gray-500 truncate w-full text-center">Your Story</span>
              <input id="story-file" type="file" className="hidden" onChange={(e) => handleFileUpload(e, true)} accept="image/*,video/*" />
            </div>

            {/* Story Items */}
            {stories.map(story => (
              <div key={story.id} className="flex flex-col items-center gap-1 min-w-[66px] cursor-pointer" onClick={() => setViewingStory(story)}>
                <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                  <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-50">
                    <img src={story.author_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.username}`} className="w-full h-full object-cover" alt={`${story.username}'s story`} />
                  </div>
                </div>
                <span className="text-xs text-gray-700 truncate w-16 text-center font-medium">{story.username}</span>
              </div>
            ))}
          </div>

          {/* CREATE POST (Minimalist) */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                <img src={user?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="w-full h-full object-cover" alt="Your profile" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Start a post..."
                  className="w-full h-10 bg-gray-100 rounded-full px-4 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />

                {mediaUrl && (
                  <div className="relative mt-3 rounded-lg overflow-hidden max-h-80 bg-black">
                    <button onClick={() => { setMediaUrl(''); setMediaType('text'); }} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full"><X size={16} /></button>
                    {mediaType === 'image' && <img src={mediaUrl} className="w-full h-full object-contain" alt="Post media preview" />}
                    {mediaType === 'video' && <video src={mediaUrl} controls className="w-full h-full" />}
                  </div>
                )}

                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-2">
                    <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                      <ImageIcon size={18} /> Photo/Video
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,audio/*" onChange={handleFileUpload} />
                  </div>
                  {(newPostContent || mediaUrl) && (
                    <button onClick={createPost} disabled={isPosting} className="text-sm font-bold text-blue-500 hover:text-blue-700 disabled:opacity-50">
                      {isPosting ? 'Posting...' : 'Post'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FEED STREAM */}
          <div className="flex flex-col gap-4">
            {posts.map(post => (
              <article key={post.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {/* Post Header */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 cursor-pointer">
                      <img src={post.author_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} className="w-full h-full object-cover" alt={`${post.username}'s profile`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-none cursor-pointer hover:underline">{post.username}</p>
                      {post.location && <p className="text-xs text-gray-500">{post.location}</p>}
                    </div>
                  </div>
                  <button className="text-gray-600 hover:text-gray-900"><MoreHorizontal size={20} /></button>
                </div>

                {/* Media */}
                {post.media_url && (
                  <div className="w-full bg-black/5 aspect-square relative flex items-center justify-center overflow-hidden">
                    {post.media_type === 'image' && <img src={post.media_url} className="w-full h-full object-cover" loading="lazy" alt="Post content" />}
                    {post.media_type === 'video' && <video src={post.media_url} controls className="w-full h-full object-contain" />}
                    {post.media_type === 'audio' && <div className="w-full p-10 flex justify-center"><audio src={post.media_url} controls /></div>}
                  </div>
                )}

                {/* Content If No Media */}
                {!post.media_url && post.content && (
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-pink-50 min-h-[200px] flex items-center justify-center text-center">
                    <p className="text-xl font-medium text-gray-800">{post.content}</p>
                  </div>
                )}

                {/* Action Bar */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <button className="text-gray-800 hover:text-red-500 transition-colors"><Heart size={24} /></button>
                      <button className="text-gray-800 hover:text-gray-600 transition-colors"><MessageCircle size={24} /></button>
                      <button className="text-gray-800 hover:text-gray-600 transition-colors"><Send size={24} /></button>
                    </div>
                    <button className="text-gray-800 hover:text-gray-600"><Bookmark size={24} /></button>
                  </div>

                  {/* Likes Count (Mock) */}
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {Math.floor(Math.random() * 100) + 1} likes
                  </div>

                  {/* Caption */}
                  {post.content && post.media_url && (
                    <div className="text-sm text-gray-900 mb-1">
                      <span className="font-semibold mr-2">{post.username}</span>
                      {post.content}
                    </div>
                  )}

                  {/* Time */}
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">
                    {new Date(post.created_at).toDateString()}
                  </div>
                </div>

                {/* Add Comment */}
                <div className="border-t border-gray-100 p-3 flex items-center gap-3">
                  <button className="text-gray-400"><Smile size={24} /></button>
                  <input type="text" placeholder="Add a comment..." className="flex-1 border-none focus:ring-0 text-sm placeholder-gray-500" />
                  <button className="text-blue-500 font-semibold text-sm opacity-50 hover:opacity-100">Post</button>
                </div>
              </article>
            ))}
          </div>

          {posts.length === 0 && !loading && (
            <div className="text-center py-10 text-gray-500">No posts yet. Be the first!</div>
          )}
        </div>

        {/* RIGHT COLUMN (DESKTOP) */}
        <div className="hidden lg:block w-[320px] pt-4 sticky top-8 h-fit">
          {/* User Profile Mini */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200">
                <img src={user?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="w-full h-full object-cover" alt="Current user" />
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900">{user?.username}</div>
                <div className="text-sm text-gray-500">{user?.full_name}</div>
              </div>
            </div>
            <button className="text-xs font-bold text-blue-500 hover:text-blue-700">Switch</button>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-bold text-gray-500">Suggested for you</div>
            <button className="text-xs font-bold text-gray-900 hover:text-gray-600">See All</button>
          </div>

          {/* Suggestions List */}
          <div className="space-y-3">
            {users.sort(() => 0.5 - Math.random()).slice(0, 5).map(u => (
              <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img src={u.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" alt={u.username} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900 hover:underline cursor-pointer">{u.username}</div>
                    <div className="text-xs text-gray-500 truncate w-32">New to SafeChat360</div>
                  </div>
                </div>
                <button className="text-xs font-bold text-blue-500 hover:text-blue-700">Follow</button>
              </div>
            ))}
          </div>

          {/* Footer Links */}
          <div className="mt-8 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-300">
            <span>About</span><span>•</span><span>Help</span><span>•</span><span>API</span><span>•</span><span>Privacy</span><span>•</span><span>Terms</span>
          </div>
          <div className="mt-4 text-xs text-gray-300 uppercase">
            © 2025 SafeChat360
          </div>
        </div>

      </div>

      {/* Story Modals */}
      {showStoryModal && storyMedia && (
        <div className="fixed inset-0 z-[60]">
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
