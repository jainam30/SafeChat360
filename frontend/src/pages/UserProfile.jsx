import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { 
    Camera, MapPin, GraduationCap, Calendar, Edit3, MoreHorizontal,
    Image as ImageIcon, Video, Bookmark, Tag, Heart, MessageSquare, 
    Share2, User, Shield, Link as LinkIcon, Mail, Github, Linkedin, Plus
} from 'lucide-react';

export default function UserProfile() {
    const { username } = useParams();
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState('posts');

    // Mock data for Figma Fidelity
    const profile = {
        name: 'Jainam Jain',
        username: 'jainamjain',
        verified: true,
        tagline: 'Software Developer | Tech Enthusiast | Explorer 🚀',
        location: 'Rajasthan, India',
        education: 'MCA Student',
        joined: 'Jan 2024',
        stats: { posts: 128, followers: 456, following: 320, groups: 12, likes: '1.4K' },
        avatar: 'https://i.pravatar.cc/150?u=me',
        cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=400&fit=crop'
    };

    const mockPosts = [
        { id: 1, text: 'Beautiful sunset from today\'s trek! 🌄\nNature always finds a way to make everything better. 💙', img: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=500&h=400&fit=crop', likes: 180, comments: 12, time: '2 hours ago' },
        { id: 2, text: 'Working on an exciting project with an amazing team! 🚀', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=400&fit=crop', likes: 96, comments: 24, time: '5 days ago' },
        { id: 3, text: 'Weekend vibes with friends! Good people, great memories. ✨', img: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=500&h=400&fit=crop', likes: 242, comments: 36, time: '1 week ago' },
        { id: 4, text: 'Exploring new places 🌅', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&h=400&fit=crop', likes: 180, comments: 12, time: '2 weeks ago' },
        { id: 5, text: 'Late night coding sessions ☕\nProgress over perfection!', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&h=400&fit=crop', likes: 156, comments: 28, time: '3 weeks ago' },
        { id: 6, text: 'Some moments are just worth sharing ❤️', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=400&fit=crop', likes: 310, comments: 45, time: '1 month ago' },
    ];

    const highlights = [
        { id: 'new', title: 'New', isNew: true },
        { id: 'travel', title: 'Travel', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=100&h=100&fit=crop' },
        { id: 'coding', title: 'Coding', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&h=100&fit=crop' },
        { id: 'friends', title: 'Friends', img: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=100&h=100&fit=crop' },
        { id: 'college', title: 'College', img: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&h=100&fit=crop' },
    ];

    const followers = [
        { id: 1, name: 'Priya Mehta', img: 'https://i.pravatar.cc/150?u=priya', online: true },
        { id: 2, name: 'Rohan Kumar', img: 'https://i.pravatar.cc/150?u=rohan', online: true },
        { id: 3, name: 'Neha Jain', img: 'https://i.pravatar.cc/150?u=neha', online: true },
        { id: 4, name: 'Aarav Sharma', img: 'https://i.pravatar.cc/150?u=aarav', online: true },
        { id: 5, name: 'Sneha Patel', img: 'https://i.pravatar.cc/150?u=sneha', online: false },
    ];

    return (
        <div className="flex h-full w-full bg-slate-50 md:bg-white text-slate-900 overflow-hidden">
            
            {/* MAIN PANE (Profile Feed) */}
            <div className="flex-1 overflow-y-auto bg-slate-50 min-w-0">
                {/* Cover Photo Area */}
                <div className="relative w-full h-[240px] bg-slate-200">
                    <img src={profile.cover} className="w-full h-full object-cover" alt="Cover" />
                    <button className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                        <Camera size={16} /> Edit Cover
                    </button>
                </div>

                {/* Profile Header Card */}
                <div className="max-w-4xl mx-auto px-6 relative -mt-16 mb-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 pt-0">
                        
                        <div className="flex justify-between items-start">
                            {/* Avatar */}
                            <div className="relative -mt-10 mb-4 inline-block">
                                <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-slate-100 shadow-sm">
                                    <img src={profile.avatar} className="w-full h-full object-cover" alt={profile.name} />
                                </div>
                                <button className="absolute bottom-2 right-2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-sm transition-colors">
                                    <Camera size={16} />
                                </button>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="mt-6 flex gap-2">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                                    Edit Profile
                                </button>
                                <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                {profile.name} 
                                {profile.verified && <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"><Check size={12} strokeWidth={4} className="text-white" /></div>}
                            </h1>
                            <p className="text-slate-500 font-medium text-sm mb-3">@{profile.username}</p>
                            <p className="text-slate-800 text-sm font-medium mb-4">{profile.tagline}</p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                                <span className="flex items-center gap-1.5"><MapPin size={14}/> {profile.location}</span>
                                <span className="flex items-center gap-1.5"><GraduationCap size={14}/> {profile.education}</span>
                                <span className="flex items-center gap-1.5"><Calendar size={14}/> Joined {profile.joined}</span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 border-t border-slate-100 pt-6 pb-2">
                            <div className="text-center">
                                <div className="text-xl font-bold text-slate-900">{profile.stats.posts}</div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Posts</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-slate-900">{profile.stats.followers}</div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Followers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-slate-900">{profile.stats.following}</div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Following</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-slate-900">{profile.stats.groups}</div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Groups</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-slate-900">{profile.stats.likes}</div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Likes</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs & Grid */}
                <div className="max-w-4xl mx-auto px-6 pb-20">
                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 flex overflow-x-auto scrollbar-hide">
                        <button onClick={() => setActiveTab('posts')} className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'posts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            <Grid size={18} /> Posts
                        </button>
                        <button onClick={() => setActiveTab('photos')} className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'photos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            <ImageIcon size={18} /> Photos
                        </button>
                        <button onClick={() => setActiveTab('videos')} className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'videos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            <Video size={18} /> Videos
                        </button>
                        <button onClick={() => setActiveTab('reels')} className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'reels' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M4 6h16v12H4z" opacity=".3"/><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM8 15l8-4-8-4v8z"/></svg> Reels
                        </button>
                        <button onClick={() => setActiveTab('saved')} className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'saved' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            <Bookmark size={18} /> Saved
                        </button>
                        <button onClick={() => setActiveTab('tagged')} className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'tagged' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            <Tag size={18} /> Tagged
                        </button>
                    </div>

                    {/* Posts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockPosts.map(post => (
                            <div key={post.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 flex items-center justify-between border-b border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <img src={profile.avatar} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt={profile.name} />
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 leading-tight">{profile.name}</h4>
                                            <p className="text-[10px] font-medium text-slate-500">{post.time}</p>
                                        </div>
                                    </div>
                                    <button className="text-slate-400 hover:text-slate-700"><MoreHorizontal size={16}/></button>
                                </div>
                                
                                <div className="p-4 pb-3 flex-1">
                                    <p className="text-xs text-slate-700 whitespace-pre-wrap mb-3 leading-relaxed">{post.text}</p>
                                    <div className="rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 mb-3">
                                        <img src={post.img} className="w-full h-full object-cover" alt="Post content" />
                                    </div>
                                </div>

                                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button className="flex items-center gap-1.5 text-slate-500 hover:text-red-500 transition-colors group">
                                            <Heart size={16} className="group-hover:fill-red-500" />
                                            <span className="text-[10px] font-bold">{post.likes}</span>
                                        </button>
                                        <button className="flex items-center gap-1.5 text-slate-500 hover:text-blue-500 transition-colors group">
                                            <MessageSquare size={16} className="group-hover:fill-blue-500" />
                                            <span className="text-[10px] font-bold">{post.comments}</span>
                                        </button>
                                        <button className="text-slate-500 hover:text-green-500 transition-colors">
                                            <Share2 size={16} />
                                        </button>
                                    </div>
                                    <button className="text-slate-500 hover:text-slate-900 transition-colors">
                                        <Bookmark size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR (Profile Meta) */}
            <div className="hidden xl:block w-[320px] bg-white border-l border-slate-200 overflow-y-auto shrink-0 p-6 space-y-8">
                
                {/* Profile Actions */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Profile Actions</h3>
                    <div className="space-y-1">
                        <button className="flex items-center justify-between w-full p-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-bold text-xs transition-colors group">
                            <span className="flex items-center gap-3"><User size={16} className="text-slate-400 group-hover:text-blue-600"/> Edit Profile</span>
                            <span className="text-slate-300">&gt;</span>
                        </button>
                        <button className="flex items-center justify-between w-full p-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-bold text-xs transition-colors group">
                            <span className="flex items-center gap-3"><ImageIcon size={16} className="text-slate-400 group-hover:text-blue-600"/> Change Cover Photo</span>
                            <span className="text-slate-300">&gt;</span>
                        </button>
                        <button className="flex items-center justify-between w-full p-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-bold text-xs transition-colors group">
                            <span className="flex items-center gap-3"><Shield size={16} className="text-slate-400 group-hover:text-blue-600"/> Privacy Settings</span>
                            <span className="text-slate-300">&gt;</span>
                        </button>
                        <button className="flex items-center justify-between w-full p-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-bold text-xs transition-colors group">
                            <span className="flex items-center gap-3"><LinkIcon size={16} className="text-slate-400 group-hover:text-blue-600"/> Manage Social Links</span>
                            <span className="text-slate-300">&gt;</span>
                        </button>
                    </div>
                </div>

                {/* About */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-900">About</h3>
                        <button className="text-xs font-bold text-blue-600 hover:underline">Edit</button>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                            <User size={16} className="text-slate-400 shrink-0"/> Software Developer
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                            <GraduationCap size={16} className="text-slate-400 shrink-0"/> MCA Student
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                            <MapPin size={16} className="text-slate-400 shrink-0"/> Rajasthan, India
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                            <Mail size={16} className="text-slate-400 shrink-0"/> jainamjain@example.com
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-blue-600 cursor-pointer hover:underline">
                            <Linkedin size={16} className="text-slate-400 shrink-0"/> https://www.linkedin.com/in/jainam-jain
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-blue-600 cursor-pointer hover:underline">
                            <Github size={16} className="text-slate-400 shrink-0"/> https://github.com/jainam30
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                            <Calendar size={16} className="text-slate-400 shrink-0"/> Joined January 2024
                        </div>
                    </div>
                </div>

                {/* Story Highlights */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-900">Story Highlights</h3>
                        <button className="text-xs font-bold text-blue-600 hover:underline">Edit</button>
                    </div>
                    <div className="flex justify-between">
                        {highlights.map(hl => (
                            <div key={hl.id} className="flex flex-col items-center gap-2 cursor-pointer group">
                                {hl.isNew ? (
                                    <div className="w-[50px] h-[50px] rounded-full border border-slate-300 flex items-center justify-center text-slate-400 group-hover:border-blue-500 group-hover:text-blue-500 transition-colors border-dashed">
                                        <Plus size={20}/>
                                    </div>
                                ) : (
                                    <div className="w-[50px] h-[50px] rounded-full p-[2px] bg-slate-200 group-hover:bg-blue-500 transition-colors">
                                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                                            <img src={hl.img} className="w-full h-full object-cover" alt={hl.title}/>
                                        </div>
                                    </div>
                                )}
                                <span className="text-[10px] font-bold text-slate-700">{hl.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Followers */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-900">Followers (456)</h3>
                        <button className="text-xs font-bold text-blue-600 hover:underline">See All</button>
                    </div>
                    <div className="flex justify-between items-center">
                        {followers.map(f => (
                            <div key={f.id} className="flex flex-col items-center gap-1 cursor-pointer">
                                <div className="relative">
                                    <img src={f.img} className="w-[42px] h-[42px] rounded-full object-cover border border-slate-200" alt={f.name}/>
                                    {f.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>}
                                </div>
                                <span className="text-[9px] font-bold text-slate-600 w-12 text-center truncate">{f.name.split(' ')[0]}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
