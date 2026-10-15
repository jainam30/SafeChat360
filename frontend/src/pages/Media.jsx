import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { 
    Image as ImageIcon, Video, Upload, Grid, Search, 
    Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Media() {
    const { token, user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef(null);

    const fetchUserMedia = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [postsRes, storiesRes] = await Promise.allSettled([
                axios.get(getApiUrl('/api/social/posts?limit=50'), { headers }),
                axios.get(getApiUrl('/api/social/stories'), { headers })
            ]);

            const extracted = [];

            if (postsRes.status === 'fulfilled' && Array.isArray(postsRes.value.data)) {
                postsRes.value.data.forEach(p => {
                    if (p.media_url) {
                        extracted.push({
                            id: `post-${p.id}`,
                            url: p.media_url,
                            type: p.media_type || (p.media_url.endsWith('.mp4') ? 'video' : 'image'),
                            title: p.content ? (p.content.slice(0, 30) + (p.content.length > 30 ? '...' : '')) : 'Community Post',
                            created_at: p.created_at,
                            source: 'Post'
                        });
                    }
                });
            }

            if (storiesRes.status === 'fulfilled' && Array.isArray(storiesRes.value.data)) {
                storiesRes.value.data.forEach(s => {
                    if (s.media_url) {
                        extracted.push({
                            id: `story-${s.id}`,
                            url: s.media_url,
                            type: 'image',
                            title: s.caption || '24h Story',
                            created_at: s.created_at,
                            source: 'Story'
                        });
                    }
                });
            }

            // Sort newest first
            extracted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            setMediaItems(extracted);
        } catch (err) {
            console.error("Failed to fetch media:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserMedia();
    }, [token]);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size exceeds 10MB limit");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(getApiUrl('/api/upload'), formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data?.url) {
                toast.success("Media uploaded successfully!");
                const newItem = {
                    id: `upload-${Date.now()}`,
                    url: getApiUrl(res.data.url),
                    type: res.data.type || (file.type.startsWith('video') ? 'video' : 'image'),
                    title: file.name,
                    created_at: new Date().toISOString(),
                    source: 'Direct Upload'
                };
                setMediaItems(prev => [newItem, ...prev]);
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || "Upload failed");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const filteredMedia = mediaItems.filter(item => {
        if (activeTab === 'photos' && item.type !== 'image') return false;
        if (activeTab === 'videos' && item.type !== 'video') return false;
        if (searchQuery) {
            return (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
    });

    return (
        <div className="flex h-full w-full bg-white text-slate-900 overflow-hidden">
            
            {/* MAIN PANE */}
            <div className="flex-1 overflow-y-auto min-w-0 p-6 xl:p-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Media Library</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">Photos, videos, and media attached to your posts and stories</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            <Upload size={14} /> 
                            <span>{uploading ? "Uploading..." : "Upload Media"}</span>
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            accept="image/*,video/*" 
                            className="hidden" 
                        />
                    </div>
                </div>

                {/* Tabs & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3 border-b border-slate-200">
                        {[
                            { id: 'all', label: `All Items (${mediaItems.length})` },
                            { id: 'photos', label: `Photos (${mediaItems.filter(m => m.type === 'image').length})` },
                            { id: 'videos', label: `Videos (${mediaItems.filter(m => m.type === 'video').length})` }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter by caption..." 
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="p-16 text-center text-slate-400 text-xs font-medium animate-pulse">
                        Loading media library...
                    </div>
                ) : filteredMedia.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredMedia.map((item) => (
                            <div 
                                key={item.id} 
                                className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-sm hover:shadow-md transition-all"
                            >
                                {item.type === 'video' ? (
                                    <video src={item.url} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white">
                                    <p className="text-xs font-bold truncate leading-tight">{item.title}</p>
                                    <span className="text-[10px] text-slate-300 capitalize">{item.source}</span>
                                </div>
                                {item.type === 'video' && (
                                    <div className="absolute top-2 right-2 p-1 bg-black/60 rounded-md text-white">
                                        <Video size={12} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                        <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                        <h3 className="text-sm font-bold text-slate-700">No media found</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            {searchQuery ? "No media matches your search." : "Photos and videos from your shared posts or uploads will appear here."}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                Upload your first photo
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
