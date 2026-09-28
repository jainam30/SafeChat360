import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Image, Video, FileText, Link as LinkIcon, Mic, UploadCloud, Search, Trash2, Download, ExternalLink, HardDrive, ShieldAlert, FolderOpen } from 'lucide-react';

export default function Media() {
    const { token } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'all';

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [previewItem, setPreviewItem] = useState(null);

    useEffect(() => {
        if (token) {
            fetchPosts();
        }
    }, [token]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/social/posts'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPosts(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setSearchParams({ tab });
    };

    // Extract all media from social posts
    const allMedia = React.useMemo(() => {
        const mediaList = [];
        posts.forEach(post => {
            if (post.media_url) {
                mediaList.push({
                    id: post.id,
                    url: post.media_url.startsWith('http') ? post.media_url : getApiUrl(post.media_url),
                    type: post.media_type,
                    createdAt: post.created_at,
                    source: 'Social Post',
                    sourceId: post.id,
                    author: post.username
                });
            }
        });
        return mediaList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [posts]);

    const filteredMedia = React.useMemo(() => {
        switch (activeTab) {
            case 'photos': return allMedia.filter(m => m.type === 'image');
            case 'videos': return allMedia.filter(m => m.type === 'video');
            case 'documents':
            case 'links':
            case 'voice':
                return []; // Currently unsupported natively
            case 'all':
            default:
                return allMedia;
        }
    }, [allMedia, activeTab]);

    const renderUnsupportedState = (icon, title) => (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-white border border-slate-200 border-dashed rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 max-w-sm mb-6">This media category is currently unsupported by the backend.</p>
        </div>
    );

    const renderEmptyState = (icon, title, message) => (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-white border border-slate-200 border-dashed rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 max-w-sm">{message}</p>
        </div>
    );

    const handleDownload = (url, type) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `safechat360-media-${new Date().getTime()}${type === 'image' ? '.jpg' : '.mp4'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="max-w-7xl mx-auto pb-12 px-4 md:px-0">
            {/* PREVIEW MODAL */}
            {previewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="absolute top-4 right-4 flex gap-3">
                        <button onClick={() => handleDownload(previewItem.url, previewItem.type)} className="p-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors" title="Download">
                            <Download size={24} />
                        </button>
                        <button onClick={() => setPreviewItem(null)} className="p-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors" title="Close">
                            <span className="text-xl font-bold px-1">✕</span>
                        </button>
                    </div>
                    <div className="max-w-4xl max-h-[80vh] w-full flex flex-col items-center">
                        {previewItem.type === 'image' ? (
                            <img src={previewItem.url} alt="Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl" />
                        ) : (
                            <video src={previewItem.url} controls autoPlay className="max-w-full max-h-[70vh] rounded-lg shadow-2xl" />
                        )}
                        <div className="mt-4 text-white text-center">
                            <p className="font-bold">From: {previewItem.author}</p>
                            <p className="text-slate-400 text-sm mt-1">{new Date(previewItem.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                        <FolderOpen className="text-cyber-primary" />
                        Media Center
                    </h1>
                    <p className="text-slate-500">Access photos, videos, and shared content from your network.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Filter media..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm focus:outline-none focus:border-cyber-primary w-full md:w-64" disabled title="Client-side filtering coming soon" />
                    </div>
                    <Link to="/social" className="px-4 py-2 bg-cyber-primary text-white font-medium rounded-lg shadow-sm hover:bg-blue-600 transition-colors flex items-center gap-2">
                        <UploadCloud size={18} /> Upload via Social
                    </Link>
                </div>
            </div>

            {/* STORAGE OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                        <Image size={24} />
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-sm font-medium">Photos</h3>
                        <p className="text-2xl font-bold text-slate-900">{allMedia.filter(m => m.type === 'image').length}</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                        <Video size={24} />
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-sm font-medium">Videos</h3>
                        <p className="text-2xl font-bold text-slate-900">{allMedia.filter(m => m.type === 'video').length}</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center shrink-0">
                        <HardDrive size={24} />
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-sm font-medium">Storage Limits</h3>
                        <p className="text-sm font-bold text-slate-900 mt-1">Unmetered Cloud</p>
                    </div>
                </div>
            </div>

            {/* TABS & MAIN CONTENT */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Navigation Tabs */}
                <div className="lg:w-64 shrink-0">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden sticky top-20">
                        <nav className="p-2 space-y-1">
                            {[
                                { id: 'all', label: 'All Media', icon: <FolderOpen size={18} /> },
                                { id: 'photos', label: 'Photos', icon: <Image size={18} /> },
                                { id: 'videos', label: 'Videos', icon: <Video size={18} /> },
                                { id: 'documents', label: 'Documents', icon: <FileText size={18} /> },
                                { id: 'links', label: 'Links', icon: <LinkIcon size={18} /> },
                                { id: 'voice', label: 'Voice Messages', icon: <Mic size={18} /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-cyber-primary' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                    <span className={activeTab === tab.id ? 'text-cyber-primary' : 'text-slate-400'}>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Grid Content Area */}
                <div className="flex-1 min-w-0">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                <div key={n} className="aspect-square bg-slate-100 rounded-xl"></div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {(activeTab === 'documents' || activeTab === 'links' || activeTab === 'voice') ? (
                                renderUnsupportedState(<ShieldAlert size={32} />, `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Unavailable`)
                            ) : filteredMedia.length === 0 ? (
                                renderEmptyState(<FolderOpen size={32} />, "No media found.", "Your network hasn't shared any media of this type yet.")
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredMedia.map(media => (
                                        <div key={media.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm cursor-pointer" onClick={() => setPreviewItem(media)}>
                                            {media.type === 'image' ? (
                                                <img src={media.url} alt="Media thumbnail" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full relative">
                                                    <video src={media.url} className="w-full h-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-105" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-10 h-10 bg-slate-900/50 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                                            <Video size={20} className="ml-1" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                                                <p className="text-white text-xs font-bold truncate">@{media.author}</p>
                                                <p className="text-slate-300 text-[10px] truncate">{new Date(media.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
