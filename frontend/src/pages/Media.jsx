import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { 
    Image as ImageIcon, Video, FileText, Link as LinkIcon, Music, 
    MoreHorizontal, Upload, Grid, List, Search, Folder, Cloud, 
    ChevronRight, Clock
} from 'lucide-react';

export default function Media() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('all');

    const recentMedia = [
        { id: 1, type: 'image', img: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=300&h=200&fit=crop' },
        { id: 2, type: 'image', img: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=300&h=200&fit=crop' },
        { id: 3, type: 'video', img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&h=200&fit=crop', duration: '0:45' },
        { id: 4, type: 'image', img: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&h=200&fit=crop' },
        { id: 5, type: 'pdf', title: 'Project_Report.pdf', size: '2.4 MB' },
        { id: 6, type: 'video', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300&h=200&fit=crop', duration: '1:12' },
        { id: 7, type: 'image', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&h=200&fit=crop' },
        { id: 8, type: 'doc', title: 'Notes.docx', size: '1.2 MB' },
    ];

    const albums = [
        { id: 1, name: 'All Media', count: '1,248 items', grid: [recentMedia[0].img, recentMedia[1].img, recentMedia[3].img, recentMedia[6].img] },
        { id: 2, name: 'Photos', count: '864 items', grid: [recentMedia[6].img] },
        { id: 3, name: 'Videos', count: '156 items', icon: <Video className="w-12 h-12 text-white" /> },
        { id: 4, name: 'Documents', count: '92 items', icon: <FileText className="w-12 h-12 text-white" /> },
        { id: 5, name: 'Shared Media', count: '48 items', grid: [recentMedia[3].img, recentMedia[0].img] },
        { id: 6, name: 'Screenshots', count: '36 items', grid: [recentMedia[1].img] },
        { id: 7, name: 'Profile Photos', count: '32 items', grid: ['https://i.pravatar.cc/150?u=me'] },
    ];

    const sharedChats = [
        { id: 1, name: 'Project Team', count: '124 items', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&h=200&fit=crop' },
        { id: 2, name: 'MCA 2026 Batch', count: '86 items', img: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&h=200&fit=crop' },
        { id: 3, name: 'Travel Buddies', count: '152 items', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300&h=200&fit=crop' },
        { id: 4, name: 'Tech Discussions', count: '64 items', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&h=200&fit=crop' },
        { id: 5, name: 'Family Group', count: '92 items', img: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=300&h=200&fit=crop' },
        { id: 6, name: 'College Friends', count: '48 items', img: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=300&h=200&fit=crop' },
    ];

    const filters = [
        { label: 'All Media', icon: <ImageIcon size={18}/>, count: '1,248', color: 'text-blue-500' },
        { label: 'Photos', icon: <ImageIcon size={18}/>, count: '864', color: 'text-green-500' },
        { label: 'Videos', icon: <Video size={18}/>, count: '156', color: 'text-red-500' },
        { label: 'Documents', icon: <FileText size={18}/>, count: '92', color: 'text-indigo-500' },
        { label: 'Links', icon: <LinkIcon size={18}/>, count: '48', color: 'text-amber-500' },
        { label: 'Audio', icon: <Music size={18}/>, count: '36', color: 'text-purple-500' },
        { label: 'Others', icon: <Folder size={18}/>, count: '52', color: 'text-slate-500' },
    ];

    const quickActions = [
        { label: 'Upload Photos', icon: <ImageIcon size={16}/> },
        { label: 'Upload Videos', icon: <Video size={16}/> },
        { label: 'Upload Documents', icon: <FileText size={16}/> },
        { label: 'Create Album', icon: <Folder size={16}/> },
        { label: 'View Shared Links', icon: <LinkIcon size={16}/> },
        { label: 'View in Timeline', icon: <Clock size={16}/> },
    ];

    return (
        <div className="flex h-full w-full bg-white text-slate-900 overflow-hidden">
            
            {/* MAIN PANE */}
            <div className="flex-1 overflow-y-auto min-w-0 p-6 xl:p-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Media</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">All your photos, videos, files and shared media in one place</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                            <Upload size={16} /> Upload
                        </button>
                        <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                            <button className="p-1.5 bg-white shadow-sm rounded-md text-blue-600"><Grid size={16}/></button>
                            <button className="p-1.5 text-slate-400 hover:text-slate-600"><List size={16}/></button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 mb-8 overflow-x-auto scrollbar-hide">
                    {['All', 'Photos', 'Videos', 'Documents', 'Links', 'Audio', 'Others'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
                                activeTab === tab.toLowerCase() 
                                ? 'border-blue-600 text-blue-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Recent Media */}
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Recent Media</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                        {recentMedia.map(item => (
                            <div key={item.id} className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group cursor-pointer">
                                {item.type === 'image' && (
                                    <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="media" />
                                )}
                                {item.type === 'video' && (
                                    <>
                                        <img src={item.img} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform" alt="video" />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <div className="w-8 h-8 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center"><Video className="w-4 h-4 text-white fill-white"/></div>
                                        </div>
                                        <span className="absolute bottom-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5 bg-black/60 rounded">{item.duration}</span>
                                    </>
                                )}
                                {item.type === 'pdf' && (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 p-3 text-center">
                                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs mb-2">PDF</div>
                                        <p className="text-xs font-bold text-slate-900 truncate w-full">{item.title}</p>
                                        <p className="text-[10px] font-medium text-slate-500 mt-1">{item.size}</p>
                                    </div>
                                )}
                                {item.type === 'doc' && (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 p-3 text-center">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs mb-2">W</div>
                                        <p className="text-xs font-bold text-slate-900 truncate w-full">{item.title}</p>
                                        <p className="text-[10px] font-medium text-slate-500 mt-1">{item.size}</p>
                                    </div>
                                )}
                                {item.type === 'image' && <div className="absolute bottom-2 left-2 text-white bg-black/40 p-1 rounded backdrop-blur-sm"><ImageIcon className="w-3 h-3"/></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Albums */}
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Albums</h2>
                        <button className="text-sm font-bold text-blue-600 hover:underline">See All</button>
                    </div>
                    <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                        {albums.map(album => (
                            <div key={album.id} className="w-[140px] shrink-0 cursor-pointer group">
                                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 mb-3 relative">
                                    {album.grid ? (
                                        <div className={`w-full h-full ${album.grid.length > 1 ? 'grid grid-cols-2 gap-0.5' : ''}`}>
                                            {album.grid.map((img, i) => <img key={i} src={img} className="w-full h-full object-cover" alt="grid" />)}
                                        </div>
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${album.name === 'Videos' ? 'bg-orange-400' : 'bg-blue-400'}`}>
                                            {album.icon}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                </div>
                                <h4 className="text-sm font-bold text-slate-900">{album.name}</h4>
                                <p className="text-[11px] font-medium text-slate-500">{album.count}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shared in Chats */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Shared in Chats</h2>
                        <button className="text-sm font-bold text-blue-600 hover:underline">See All</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                        {sharedChats.map(chat => (
                            <div key={chat.id} className="cursor-pointer group">
                                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-2 relative">
                                    <img src={chat.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="chat" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                </div>
                                <h4 className="text-xs font-bold text-slate-900 truncate">{chat.name}</h4>
                                <p className="text-[10px] font-medium text-slate-500">{chat.count}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* RIGHT SIDEBAR (Filters & Storage) */}
            <div className="hidden lg:flex w-[280px] xl:w-[320px] flex-col bg-slate-50 border-l border-slate-200 overflow-y-auto shrink-0 p-6 space-y-8">
                
                {/* Filter Media */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Filter Media</h3>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search in media..." 
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        {filters.map((f, i) => (
                            <button key={i} className="flex items-center justify-between w-full p-2.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-sm font-bold text-xs transition-all border border-transparent hover:border-slate-200">
                                <span className={`flex items-center gap-3 ${i===0 ? 'text-blue-600' : ''}`}><span className={f.color}>{f.icon}</span> {f.label}</span>
                                <span className="text-[10px] text-slate-400">{f.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Storage Usage */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Storage Usage</h3>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-3">
                            <Cloud className="w-5 h-5 text-blue-500" />
                            Secure Storage
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2 flex">
                            <div className="h-full bg-blue-500" style={{width: '35%'}}></div>
                            <div className="h-full bg-green-500" style={{width: '25%'}}></div>
                            <div className="h-full bg-red-500" style={{width: '15%'}}></div>
                            <div className="h-full bg-purple-500" style={{width: '5%'}}></div>
                        </div>
                        <p className="text-xs text-slate-500 mb-5 font-medium">3.2 GB of 10 GB used</p>
                        
                        <div className="space-y-3 mb-5">
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2 font-medium text-slate-700"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Photos</div>
                                <div className="font-bold text-slate-900">1.4 GB</div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2 font-medium text-slate-700"><div className="w-2 h-2 rounded-full bg-green-500"></div> Videos</div>
                                <div className="font-bold text-slate-900">1.0 GB</div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2 font-medium text-slate-700"><div className="w-2 h-2 rounded-full bg-red-500"></div> Documents</div>
                                <div className="font-bold text-slate-900">542 MB</div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2 font-medium text-slate-700"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Others</div>
                                <div className="font-bold text-slate-900">258 MB</div>
                            </div>
                        </div>
                        
                        <button className="w-full py-2 bg-white border border-blue-200 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                            Manage Storage
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h3>
                    <div className="space-y-1 border-t border-slate-200 pt-3">
                        {quickActions.map((action, i) => (
                            <button key={i} className="flex items-center justify-between w-full p-2.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-sm font-bold text-xs transition-all group border border-transparent hover:border-slate-200">
                                <span className="flex items-center gap-3"><span className="text-slate-400 group-hover:text-blue-500">{action.icon}</span> {action.label}</span>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
