import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Image as ImageIcon, Video, Smile, MoreHorizontal, 
  ThumbsUp, MessageSquare, Share2, Bookmark, CheckCircle2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  
  // Dummy data strictly based on the design mockup
  const stories = [
    { id: 1, name: 'Priya Mehta', image: 'https://i.pravatar.cc/150?u=priya' },
    { id: 2, name: 'Rohan Kumar', image: 'https://i.pravatar.cc/150?u=rohan' },
    { id: 3, name: 'Neha Jain', image: 'https://i.pravatar.cc/150?u=neha' },
    { id: 4, name: 'Aarav Sharma', image: 'https://i.pravatar.cc/150?u=aarav' },
    { id: 5, name: 'Sneha Patel', image: 'https://i.pravatar.cc/150?u=sneha' },
    { id: 6, name: 'Karan Singh', image: 'https://i.pravatar.cc/150?u=karan' },
    { id: 7, name: 'Ananya', image: 'https://i.pravatar.cc/150?u=ananya' }
  ];

  const suggestedPeople = [
    { id: 1, name: 'Aarav Sharma', mutual: '12 mutual friends', image: 'https://i.pravatar.cc/150?u=aarav' },
    { id: 2, name: 'Sneha Patel', mutual: '8 mutual friends', image: 'https://i.pravatar.cc/150?u=sneha' },
    { id: 3, name: 'Karan Singh', mutual: '15 mutual friends', image: 'https://i.pravatar.cc/150?u=karan' }
  ];

  const trendingPosts = [
    { id: 1, image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300&h=200&fit=crop', views: '1.2K', time: '2 days ago', isVideo: true },
    { id: 2, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=200&fit=crop', views: '856', time: '1 day ago', isVideo: true },
    { id: 3, image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=300&h=200&fit=crop', views: '643', time: '3 days ago', isVideo: true },
    { id: 4, image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&h=200&fit=crop', views: '1.4K', time: '5 days ago', isVideo: true }
  ];

  const onlineFriends = [
    { id: 1, name: 'Neha', image: 'https://i.pravatar.cc/150?u=neha' },
    { id: 2, name: 'Aarav', image: 'https://i.pravatar.cc/150?u=aarav' },
    { id: 3, name: 'Priya', image: 'https://i.pravatar.cc/150?u=priya' },
    { id: 4, name: 'Rohan', image: 'https://i.pravatar.cc/150?u=rohan' },
    { id: 5, name: 'Karan', image: 'https://i.pravatar.cc/150?u=karan' }
  ];

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col xl:flex-row gap-6 pb-20">
      
      {/* Left Column (Stories + Posts) */}
      <div className="flex-1 min-w-0 space-y-6">
        
        {/* Stories Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Stories</h2>
            <button className="text-sm font-medium text-blue-600 hover:underline">View All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            
            {/* Add Story */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
              <div className="w-[72px] h-[72px] rounded-full border-2 border-slate-200 p-0.5 relative group-hover:border-blue-500 transition-colors">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
                  <img src={user?.avatar_url || 'https://i.pravatar.cc/150?u=me'} className="w-full h-full object-cover opacity-80" alt="Me" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <Plus className="w-4 h-4" strokeWidth={3} />
                </div>
              </div>
              <span className="text-xs font-medium text-slate-700">Add Story</span>
            </div>

            {/* Friend Stories */}
            {stories.map(story => (
              <div key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
                <div className="w-[72px] h-[72px] rounded-full p-[3px] bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-600 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full border-[3px] border-white overflow-hidden bg-white">
                    <img src={story.image} className="w-full h-full object-cover" alt={story.name} />
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-700 truncate w-16 text-center">{story.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Post: Priya Mehta */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5">
            {/* Post Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <img src="https://i.pravatar.cc/150?u=priya" className="w-10 h-10 rounded-full object-cover" alt="Priya" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Priya Mehta</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">2 hours ago <span className="w-1 h-1 rounded-full bg-slate-300"></span> 🌎</p>
                </div>
              </div>
              <button className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg"><MoreHorizontal className="w-5 h-5"/></button>
            </div>
            
            {/* Post Content */}
            <p className="text-sm text-slate-800 mb-4 whitespace-pre-wrap">
              Beautiful sunset from today's trek! 🌄{"\n"}Nature always finds a way to make everything better. 💙
            </p>
            
            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden h-[300px] mb-4">
              <div className="h-full">
                <img src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=500&h=600&fit=crop" className="w-full h-full object-cover" alt="Sunset" />
              </div>
              <div className="grid grid-rows-2 gap-1 h-full">
                <div className="grid grid-cols-2 gap-1 h-full">
                  <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&h=300&fit=crop" className="w-full h-full object-cover" alt="Mountains" />
                  <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&h=300&fit=crop" className="w-full h-full object-cover" alt="Dog" />
                </div>
                <div className="grid grid-cols-2 gap-1 h-full">
                  <div className="relative group cursor-pointer">
                    <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300&h=300&fit=crop" className="w-full h-full object-cover" alt="Lake" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white"><Video className="w-4 h-4 fill-white"/></div>
                    </div>
                    <span className="absolute bottom-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5 bg-black/60 rounded">0:24</span>
                  </div>
                  <div className="relative cursor-pointer">
                    <img src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=300&h=300&fit=crop" className="w-full h-full object-cover" alt="Forest" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">+3</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reactions Stats */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white z-20"><ThumbsUp className="w-2.5 h-2.5 text-white fill-white"/></div>
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-white z-10"><span className="text-[10px] text-white leading-none">❤️</span></div>
                </div>
                <span className="text-sm font-medium text-slate-500 ml-1">128</span>
              </div>
              <div className="text-sm font-medium text-slate-500 flex gap-3">
                <span>24 comments</span>
                <span>5 shares</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><ThumbsUp className="w-5 h-5"/> Like</button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><MessageSquare className="w-5 h-5"/> Comment</button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><Share2 className="w-5 h-5"/> Share</button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><Bookmark className="w-5 h-5"/> Save</button>
            </div>
          </div>
        </div>

        {/* Post: Rohan Kumar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <img src="https://i.pravatar.cc/150?u=rohan" className="w-10 h-10 rounded-full object-cover" alt="Rohan" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rohan Kumar</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">5 hours ago <span className="w-1 h-1 rounded-full bg-slate-300"></span> 👥</p>
                </div>
              </div>
              <button className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg"><MoreHorizontal className="w-5 h-5"/></button>
            </div>
            
            <p className="text-sm text-slate-800 mb-4 whitespace-pre-wrap">
              Working on something exciting with an amazing team! 🚀{"\n"}Stay tuned for more updates. <span className="text-blue-600 font-medium cursor-pointer hover:underline">#Build</span> <span className="text-blue-600 font-medium cursor-pointer hover:underline">#Code</span> <span className="text-blue-600 font-medium cursor-pointer hover:underline">#TeamWork</span>
            </p>
            
            <div className="rounded-xl overflow-hidden h-[250px] mb-4 bg-slate-100">
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop" className="w-full h-full object-cover" alt="Setup" />
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
               <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white z-20"><ThumbsUp className="w-2.5 h-2.5 text-white fill-white"/></div>
                </div>
                <span className="text-sm font-medium text-slate-500 ml-1">45</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><ThumbsUp className="w-5 h-5"/> Like</button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><MessageSquare className="w-5 h-5"/> Comment</button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><Share2 className="w-5 h-5"/> Share</button>
            </div>
          </div>
        </div>

      </div>

      {/* Right Column (Widgets) */}
      <div className="w-full xl:w-[320px] shrink-0 space-y-6 hidden xl:block">
        
        {/* Create Post Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Create Post</h2>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <img src={user?.avatar_url || 'https://i.pravatar.cc/150?u=me'} className="w-10 h-10 rounded-full object-cover" alt="Me" />
            <div className="flex-1 bg-slate-50 hover:bg-slate-100 transition-colors cursor-text border border-slate-200 rounded-full px-4 py-2.5 text-sm text-slate-500">
              What's on your mind, {user?.full_name?.split(' ')[0] || 'Jainam'}?
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-600 transition-colors">
              <ImageIcon className="w-4 h-4 text-green-500" /> Photo
            </button>
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-600 transition-colors">
              <Video className="w-4 h-4 text-red-500" /> Video
            </button>
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-600 transition-colors">
              <Smile className="w-4 h-4 text-yellow-500" /> Feeling
            </button>
            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggested People */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900">Suggested People</h2>
            <button className="text-sm font-medium text-blue-600 hover:underline">See All</button>
          </div>
          <div className="space-y-4">
            {suggestedPeople.map(person => (
              <div key={person.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={person.image} className="w-10 h-10 rounded-full object-cover" alt={person.name} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{person.name}</h4>
                    <p className="text-[11px] font-medium text-slate-500">{person.mutual}</p>
                  </div>
                </div>
                <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Posts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900">Trending Posts</h2>
            <button className="text-sm font-medium text-blue-600 hover:underline">See All</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {trendingPosts.map(post => (
              <div key={post.id} className="relative rounded-lg overflow-hidden group cursor-pointer aspect-[4/3]">
                <img src={post.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Trending" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white"><Video className="w-4 h-4 fill-white"/></div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                  <span className="text-white text-[10px] font-bold flex items-center gap-1"><Video className="w-3 h-3 fill-white" /> {post.views}</span>
                  <span className="text-white/80 text-[10px] font-medium">{post.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Online Friends */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900">Online Friends</h2>
            <button className="text-sm font-medium text-blue-600 hover:underline">See All</button>
          </div>
          <div className="flex justify-between items-center px-2">
            {onlineFriends.map(friend => (
              <div key={friend.id} className="flex flex-col items-center gap-1 cursor-pointer">
                <div className="relative">
                  <img src={friend.image} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt={friend.name} />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <span className="text-xs font-medium text-slate-700">{friend.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
