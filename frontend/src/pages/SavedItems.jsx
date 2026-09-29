import React, { useState } from 'react';
import { 
    Bookmark, Search, ChevronDown, Cloud, LayoutGrid, MessageSquare, 
    Image as ImageIcon, Link as LinkIcon, FileText, Globe, Code, 
    GraduationCap, Coffee, Users, Briefcase, AlertCircle, Calendar, 
    MoreHorizontal 
} from 'lucide-react';

export default function SavedItems() {
    const [activeTab, setActiveTab] = useState('all');

    const savedPosts = [
        { id: 1, name: 'Priya Mehta', time: '3 days ago', img: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=500&h=400&fit=crop', text: 'Beautiful sunset from Manali!\nNature always heals ❤️', tags: ['Travel', 'Nature'], avatar: 'https://i.pravatar.cc/150?u=priya' },
        { id: 2, name: 'Rohan Kumar', time: '5 days ago', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=400&fit=crop', text: 'My latest development setup 💻\nAlways learning, always growing!', tags: ['Technology', 'Coding'], avatar: 'https://i.pravatar.cc/150?u=rohan' },
        { id: 3, name: 'Neha Jain', time: '1 week ago', img: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=500&h=400&fit=crop', text: 'College friends reunion! Some bonds are forever ❤️', tags: ['Friends', 'Memories'], avatar: 'https://i.pravatar.cc/150?u=neha' },
        { id: 4, name: 'Aarav Sharma', time: '1 week ago', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=400&fit=crop', text: 'Amazing food at this cafe!\nMust try if you visit Jaipur.', tags: ['Food', 'Jaipur'], avatar: 'https://i.pravatar.cc/150?u=aarav' },
    ];

    const savedMessages = [
        { id: 1, name: 'Rohan Kumar', file: 'Project_Plan.pdf', size: '2.4 MB', type: 'PDF', color: 'bg-red-500', text: 'Here is the project plan we discussed.', date: '12 Sep 2026', avatar: 'https://i.pravatar.cc/150?u=rohan' },
        { id: 2, name: 'Neha Jain', file: 'MCA_Notes.zip', size: '5.1 MB', type: 'ZIP', color: 'bg-blue-500', text: 'These are the notes for the upcoming exam. Hope this helps!', date: '10 Sep 2026', avatar: 'https://i.pravatar.cc/150?u=neha' },
        { id: 3, name: 'College Group', file: 'https://github.com/...', size: 'GitHub Link', type: 'LINK', color: 'bg-slate-800', text: 'Important information about the project submission.', date: '8 Sep 2026', avatar: 'https://i.pravatar.cc/150?u=college' },
        { id: 4, name: 'Priya Mehta', isVideo: true, file: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&h=100&fit=crop', duration: '2:18', text: 'Check out this amazing video I found!', date: '5 Sep 2026', avatar: 'https://i.pravatar.cc/150?u=priya' },
        { id: 5, name: 'Aarav Sharma', isImage: true, file: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&h=100&fit=crop', text: 'Let\'s plan for the trip next month. Here are the details.', date: '2 Sep 2026', avatar: 'https://i.pravatar.cc/150?u=aarav' },
        { id: 6, name: 'Sneha Patel', text: 'Don\'t forget about the meeting tomorrow at 10 AM.', date: '1 Sep 2026', avatar: 'https://i.pravatar.cc/150?u=sneha' },
    ];

    const contentTypes = [
        { label: 'All Items', count: 24, icon: <Bookmark size={16}/>, active: true },
        { label: 'Posts', count: 12, icon: <LayoutGrid size={16}/> },
        { label: 'Messages', count: 6, icon: <MessageSquare size={16}/> },
        { label: 'Media', count: 18, icon: <ImageIcon size={16}/> },
        { label: 'Links', count: 4, icon: <LinkIcon size={16}/> },
        { label: 'Files', count: 3, icon: <FileText size={16}/> },
    ];

    const categories = [
        { label: 'All Categories', count: 24, icon: <LayoutGrid size={16}/>, active: true },
        { label: 'Travel', count: 4, icon: <Globe size={16}/>, color: 'text-blue-500' },
        { label: 'Technology', count: 5, icon: <Code size={16}/>, color: 'text-indigo-500' },
        { label: 'Education', count: 3, icon: <GraduationCap size={16}/>, color: 'text-amber-500' },
        { label: 'Food', count: 2, icon: <Coffee size={16}/>, color: 'text-orange-500' },
        { label: 'Friends', count: 2, icon: <Users size={16}/>, color: 'text-pink-500' },
        { label: 'Work', count: 4, icon: <Briefcase size={16}/>, color: 'text-slate-600' },
        { label: 'Important', count: 4, icon: <AlertCircle size={16}/>, color: 'text-red-500' },
    ];

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
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Saved Items</h1>
                            <p className="text-sm font-medium text-slate-500 mt-1">All your saved posts, messages, media, links and important content in one place</p>
                        </div>
                    </div>
                </div>

                {/* Search & Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide w-full md:w-auto">
                        {['All (24)', 'Posts (12)', 'Messages (6)', 'Media (18)', 'Links (4)', 'Files (3)'].map((tab, i) => {
                            const val = tab.split(' ')[0].toLowerCase();
                            return (
                                <button
                                    key={i}
                                    onClick={() => setActiveTab(val)}
                                    className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                                        activeTab === val 
                                        ? 'border-blue-600 text-blue-600' 
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64 hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search in saved..." 
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:bg-white focus:border-blue-500"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 whitespace-nowrap">
                            Newest First <ChevronDown size={14}/>
                        </button>
                    </div>
                </div>

                {/* Saved Posts */}
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Saved Posts (12)</h2>
                        <button className="text-sm font-bold text-blue-600 hover:underline">See All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {savedPosts.map(post => (
                            <div key={post.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                                    <img src={post.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="post" />
                                    <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-blue-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ImageIcon size={14}/>
                                    </button>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <img src={post.avatar} className="w-6 h-6 rounded-full object-cover border border-slate-200" alt={post.name}/>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900 leading-none">{post.name}</h4>
                                                <p className="text-[9px] font-medium text-slate-500 mt-0.5">{post.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-700 whitespace-pre-wrap mb-3 leading-relaxed line-clamp-2">{post.text}</p>
                                    <div className="flex justify-between items-end mt-auto">
                                        <div className="flex flex-wrap gap-1">
                                            {post.tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded border border-blue-100">{tag}</span>
                                            ))}
                                        </div>
                                        <Bookmark size={16} className="text-blue-600 fill-blue-600"/>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Saved Messages */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Saved Messages (6)</h2>
                        <button className="text-sm font-bold text-blue-600 hover:underline">See All</button>
                    </div>
                    <div className="space-y-3">
                        {savedMessages.map((msg, i) => (
                            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors group">
                                <div className="flex items-center gap-4 flex-1 min-w-0 mb-3 sm:mb-0">
                                    <img src={msg.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" alt={msg.name}/>
                                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                        <div className="w-full sm:w-40 shrink-0">
                                            <h4 className="text-sm font-bold text-slate-900 truncate">{msg.name}</h4>
                                            <p className="text-[11px] font-medium text-slate-500 truncate">{msg.text}</p>
                                        </div>
                                        
                                        <div className="flex-1 flex items-center text-slate-600">
                                            {msg.file && !msg.isVideo && !msg.isImage && (
                                                <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-lg shadow-sm w-full max-w-[240px]">
                                                    <div className={`w-8 h-8 ${msg.color} text-white rounded flex items-center justify-center font-bold text-[10px]`}>{msg.type}</div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 truncate">{msg.file.split('/').pop()}</p>
                                                        <p className="text-[10px] font-medium text-slate-500">{msg.size}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {msg.isVideo && (
                                                <div className="flex items-center gap-3 w-full max-w-[240px]">
                                                    <div className="w-16 h-10 rounded border border-slate-200 overflow-hidden relative">
                                                        <img src={msg.file} className="w-full h-full object-cover" alt="vid"/>
                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Video className="w-4 h-4 fill-white text-white"/></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{msg.duration}</span>
                                                </div>
                                            )}
                                            {msg.isImage && (
                                                <div className="w-16 h-10 rounded border border-slate-200 overflow-hidden shrink-0">
                                                    <img src={msg.file} className="w-full h-full object-cover" alt="img"/>
                                                </div>
                                            )}
                                            {!msg.file && <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><FileText size={14}/> Text message</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0 pl-14 sm:pl-0">
                                    <span className="text-[11px] font-bold text-slate-400">{msg.date}</span>
                                    <div className="flex gap-2">
                                        <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><MoreHorizontal size={16}/></button>
                                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Bookmark size={16} fill="currentColor"/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="hidden lg:flex w-[280px] xl:w-[320px] flex-col bg-slate-50 border-l border-slate-200 overflow-y-auto shrink-0 p-6 space-y-8">
                
                {/* Storage Usage Widget */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Cloud className="text-blue-500 w-4 h-4"/> Storage Usage</h3>
                        <span className="text-[10px] font-bold text-slate-400">32%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2 flex">
                        <div className="h-full bg-blue-500" style={{width: '32%'}}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-4 font-medium">3.2 GB of 10 GB used</p>
                    <button className="w-full py-1.5 bg-white border border-blue-200 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                        Upgrade Storage
                    </button>
                </div>

                {/* Filter Saved Items */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Filter Saved Items</h3>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search in saved items..." 
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500 shadow-sm"
                        />
                    </div>
                </div>

                {/* Content Type */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Content Type</h3>
                    <div className="space-y-1 bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm">
                        {contentTypes.map((c, i) => (
                            <button key={i} className={`flex items-center justify-between w-full p-2 rounded-lg font-bold text-xs transition-colors ${c.active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                                <span className="flex items-center gap-3">{c.icon} {c.label}</span>
                                <span className={`text-[10px] ${c.active ? 'text-blue-500' : 'text-slate-400'}`}>{c.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Categories */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categories</h3>
                    <div className="space-y-1 bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm">
                        {categories.map((c, i) => (
                            <button key={i} className={`flex items-center justify-between w-full p-2 rounded-lg font-bold text-xs transition-colors ${c.active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                                <span className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded ${c.active ? 'bg-blue-600 text-white' : `bg-slate-100 ${c.color}`} flex items-center justify-center`}>
                                        {React.cloneElement(c.icon, { size: 12 })}
                                    </div>
                                    {c.label}
                                </span>
                                <span className={`text-[10px] ${c.active ? 'text-blue-500' : 'text-slate-400'}`}>{c.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Range */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date Range</h3>
                    <button className="flex items-center justify-between w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 shadow-sm hover:border-slate-300">
                        <span className="flex items-center gap-2"><Calendar size={14} className="text-slate-400"/> All Time</span>
                        <ChevronDown size={14} className="text-slate-400"/>
                    </button>
                </div>

            </div>
        </div>
    );
}
