import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, resolveMediaUrl } from '../config';
import { 
    Bookmark, Search, ThumbsUp, MessageSquare, 
    Share2, Compass, Trash2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function SavedItems() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [savedPosts, setSavedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const fetchSavedPosts = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(getApiUrl('/api/social/saved'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(res.data)) {
                setSavedPosts(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch saved posts", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedPosts();
    }, [token]);

    const handleRemoveSaved = async (postId) => {
        if (!token) return;
        try {
            await axios.post(getApiUrl(`/api/social/posts/${postId}/save`), {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Item removed from bookmarks");
            setSavedPosts(prev => prev.filter(p => p.id !== postId));
        } catch (err) {
            toast.error("Failed to update bookmark");
        }
    };

    const filteredPosts = savedPosts.filter(post => {
        if (activeTab === 'media' && !post.media_url) return false;
        if (searchQuery) {
            const content = (post.content || '').toLowerCase();
            const author = (post.author_username || post.author_name || '').toLowerCase();
            return content.includes(searchQuery.toLowerCase()) || author.includes(searchQuery.toLowerCase());
        }
        return true;
    });

    return (
        <div className="flex h-full w-full bg-white text-slate-900 overflow-hidden">
            
            {/* MAIN PANE */}
            <div className="flex-1 overflow-y-auto min-w-0 p-6 xl:p-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                            <Bookmark size={24} fill="currentColor"/>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Saved Bookmarks</h1>
                            <p className="text-sm font-medium text-slate-500 mt-1">Articles, posts, and media you have saved to review later</p>
                        </div>
                    </div>
                </div>

                {/* Search & Tabs */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
                        {[
                            { id: 'all', label: `All Items (${savedPosts.length})` },
                            { id: 'media', label: `Media Only (${savedPosts.filter(p => p.media_url).length})` }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === tab.id 
                                    ? 'border-blue-600 text-blue-600' 
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search in saved..." 
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="p-16 text-center text-slate-400 text-xs font-medium animate-pulse">
                        Loading saved items...
                    </div>
                ) : filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredPosts.map((post) => (
                            <div key={post.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <img 
                                                src={post.author_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_username || 'user'}`} 
                                                className="w-9 h-9 rounded-full object-cover border border-slate-200" 
                                                alt="" 
                                            />
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900">{post.author_name || post.author_username}</h4>
                                                <p className="text-[10px] text-slate-400">{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveSaved(post.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove bookmark"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>

                                    <p className="text-xs text-slate-800 mb-3 whitespace-pre-wrap leading-relaxed line-clamp-3">
                                        {post.content}
                                    </p>

                                    {post.media_url && (
                                        <div className="rounded-xl overflow-hidden max-h-48 mb-3 bg-slate-900">
                                            <img src={resolveMediaUrl(post.media_url)} className="w-full h-44 object-cover" alt="" />
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <span className="text-[11px] font-semibold">{post.likes_count || 0} likes</span>
                                    <button 
                                        onClick={() => navigate(`/social?post=${post.id}`)}
                                        className="text-xs font-bold text-blue-600 hover:underline"
                                    >
                                        View in Feed &rarr;
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                        <Bookmark className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                        <h3 className="text-sm font-bold text-slate-700">No saved items found</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            {searchQuery ? "No bookmarks match your search query." : "Save interesting posts from the dashboard or social feed to view them here."}
                        </p>
                        {!searchQuery && (
                            <Link
                                to="/social"
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                <Compass size={14} /> Explore Social Feed
                            </Link>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
