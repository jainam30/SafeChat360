import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { 
    Users, Plus, Phone, Video, Search, MoreHorizontal, 
    Paperclip, Smile, Mic, Send, Lock, ArrowLeft,
    CheckCircle2, Edit2, FileText, Link as LinkIcon, 
    Image as ImageIcon, Star, Settings, LogOut, ChartBar,
    Pin
} from 'lucide-react';
import { formatTimeForUser } from '../utils/dateFormatter';

export default function Groups() {
    const { user, token } = useAuth();
    const { groupId } = useParams();
    const [groups, setGroups] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [activeTab, setActiveTab] = useState('chat');
    
    // Mock Data for Figma Fidelity
    const mockGroups = [
        { id: 1, name: 'Project Team', members: 8, time: '11:24 AM', snippet: 'You: Updated the deployment plan...', unread: 3, icon: <Users/>, bg: 'bg-indigo-500' },
        { id: 2, name: 'MCA Friends', members: 12, time: '10:52 AM', snippet: 'Priya: Exam schedule shared', unread: 5, icon: <div className="text-white text-xl font-bold">🎓</div>, bg: 'bg-blue-600' },
        { id: 3, name: 'Family', members: 6, time: '09:15 AM', snippet: 'Mom: Dinner at 8 PM', unread: 1, icon: <div className="text-white text-xl font-bold">🏠</div>, bg: 'bg-yellow-500' },
        { id: 4, name: 'Design Community', members: 45, time: 'Yesterday', snippet: 'Rohan: New UI reference', icon: <div className="text-white text-xl font-bold">🎨</div>, bg: 'bg-teal-500' },
        { id: 5, name: 'College Group', members: 120, time: 'Yesterday', snippet: 'Neha: Notes for OS subject', icon: <div className="text-white text-xl font-bold">🏫</div>, bg: 'bg-sky-500' },
        { id: 6, name: 'Travel Buddies', members: 8, time: 'Mon', snippet: 'Aarav: Photos from Manali', icon: <div className="text-white text-xl font-bold">✈️</div>, bg: 'bg-blue-400' },
        { id: 7, name: 'Tech Discussions', members: 34, time: 'Mon', snippet: 'Rohan: Interesting article!', icon: <div className="text-white text-xl font-bold">💻</div>, bg: 'bg-indigo-600' },
        { id: 8, name: 'Gaming Squad', members: 15, time: 'Sun', snippet: 'Let\'s play this weekend!', icon: <div className="text-white text-xl font-bold">🎮</div>, bg: 'bg-purple-500' },
    ];

    const activeGroup = mockGroups.find(g => g.id === (groupId ? parseInt(groupId) : 1)) || mockGroups[0];

    const mockMessages = [
        { id: 1, sender: 'Aarav Sharma', avatar: 'https://i.pravatar.cc/150?u=aarav', time: '10:15 AM', content: 'Hey team! 👋\nHere is the updated project plan for the next sprint.', type: 'text' },
        { id: 2, sender: 'Aarav Sharma', avatar: 'https://i.pravatar.cc/150?u=aarav', time: '10:16 AM', content: 'Project_Plan_v2.pdf', type: 'file', size: '2.4 MB' },
        { id: 3, sender: 'Priya Mehta', avatar: 'https://i.pravatar.cc/150?u=priya', time: '10:28 AM', content: 'This looks great! I\'ve added some comments. Let\'s discuss in the call later today.', type: 'text', reactions: ['👍 3'] },
        { id: 4, sender: 'You', isMe: true, time: '10:18 AM', content: 'Thanks everyone! 🚀\nLet\'s discuss the UI changes in the meeting today.', type: 'text' },
        { id: 5, sender: 'Rohan Kumar', avatar: 'https://i.pravatar.cc/150?u=rohan', time: '10:45 AM', type: 'poll', question: 'Which tech stack should we use for the backend?', 
            options: [
                { text: 'Spring Boot (Java)', votes: '62% (5)', percent: 62 },
                { text: 'FastAPI (Python)', votes: '25% (2)', percent: 25 },
                { text: 'Other (Comment)', votes: '12% (1)', percent: 12 }
            ], 
            meta: '8 votes • Poll ends in 1 day' 
        }
    ];

    const members = [
        { name: 'Jainam Jain (You)', role: 'Admin', status: 'Online', online: true, img: 'https://i.pravatar.cc/150?u=me' },
        { name: 'Aarav Sharma', role: 'Member', status: 'Online', online: true, img: 'https://i.pravatar.cc/150?u=aarav' },
        { name: 'Priya Mehta', role: 'Member', status: 'Online', online: true, img: 'https://i.pravatar.cc/150?u=priya' },
        { name: 'Rohan Kumar', role: 'Member', status: 'Online', online: true, img: 'https://i.pravatar.cc/150?u=rohan' },
        { name: 'Neha Jain', role: 'Member', status: 'Away', online: false, away: true, img: 'https://i.pravatar.cc/150?u=neha' },
        { name: 'Ankit Verma', role: 'Member', status: 'Offline', online: false, img: 'https://i.pravatar.cc/150?u=ankit' },
    ];

    return (
        <div className="flex h-full w-full bg-white overflow-hidden text-slate-900 font-sans">
            
            {/* MIDDLE PANE (Groups List) */}
            <div className="hidden md:flex w-full md:w-[320px] lg:w-[340px] flex-col border-r border-slate-200 bg-slate-50 shrink-0">
                <div className="p-4 bg-white border-b border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-900">Groups</h2>
                        <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="flex gap-1">
                        <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">All</button>
                        <button className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 border border-transparent">My Groups</button>
                        <button className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 border border-transparent">Invites</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {mockGroups.map(g => {
                        const isActive = activeGroup.id === g.id;
                        return (
                            <Link key={g.id} to={`/groups/${g.id}`} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 border-l-[3px] border-blue-600' : 'hover:bg-slate-100 border-l-[3px] border-transparent'}`}>
                                <div className={`w-12 h-12 rounded-full ${g.bg} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                                    {g.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-sm text-slate-900 truncate">{g.name}</h4>
                                        <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>{g.time}</span>
                                    </div>
                                    <p className={`text-xs truncate font-medium ${isActive && g.unread ? 'text-slate-700 font-bold' : 'text-slate-500'}`}>{g.snippet}</p>
                                </div>
                                {g.unread && <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">{g.unread}</div>}
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* MAIN PANE (Chat Area) */}
            <div className="flex-1 flex flex-col relative bg-white border-r border-slate-200 min-w-0">
                {/* Header */}
                <div className="px-4 md:px-6 pt-4 border-b border-slate-200 bg-white z-20">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${activeGroup.bg} flex items-center justify-center text-white`}>
                                {activeGroup.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg leading-none">{activeGroup.name}</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                                    {activeGroup.members} members <span className="mx-1">•</span> <Lock size={10} className="text-green-600"/> <span className="text-green-600">End-to-end encrypted</span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1 md:gap-2">
                            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Search size={18} /></button>
                            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Phone size={18} /></button>
                            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Video size={18} /></button>
                            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal size={18} /></button>
                        </div>
                    </div>
                    
                    {/* Inner Tabs */}
                    <div className="flex gap-6 mt-2">
                        {['Chat', 'Files', 'Tasks', 'Polls', 'Links'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.toLowerCase() ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                                {tab}
                            </button>
                        ))}
                        <button className="pb-3 text-sm font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700"><Plus size={14}/> Add</button>
                    </div>
                </div>

                {/* Message Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white scroll-smooth relative">
                    
                    {/* Pinned Message */}
                    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-blue-100 mb-6 flex items-start justify-between shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5"><Pin size={16} className="text-blue-600 fill-blue-100 rotate-45"/></div>
                            <div>
                                <p className="text-xs font-bold text-slate-900">Pinned by you</p>
                                <p className="text-xs text-slate-600 font-medium">Project deadline: 30th June 2026. Please keep all files and updates in this group.</p>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600"><Plus className="w-4 h-4 rotate-45" /></button>
                    </div>

                    <div className="flex justify-center mb-6">
                        <span className="bg-slate-100 text-slate-500 text-xs font-bold px-4 py-1 rounded-full">Today</span>
                    </div>

                    {/* Messages */}
                    {mockMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} mb-6 relative`}>
                            {!msg.isMe && (
                                <img src={msg.avatar} className="w-8 h-8 rounded-full object-cover mr-3 mt-1 border border-slate-200" alt={msg.sender} />
                            )}
                            <div className={`max-w-[75%] relative flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                {!msg.isMe && (
                                    <span className="text-[11px] font-bold text-blue-600 mb-1 ml-1">{msg.sender}</span>
                                )}
                                
                                {msg.type === 'text' && (
                                    <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${msg.isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 border border-slate-200/60 rounded-bl-sm whitespace-pre-wrap'}`}>
                                        {msg.content}
                                    </div>
                                )}

                                {msg.type === 'file' && (
                                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex items-center gap-4 min-w-[250px]">
                                        <div className="w-10 h-10 bg-red-100 text-red-500 rounded-lg flex items-center justify-center font-bold text-xs">PDF</div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">{msg.content}</p>
                                            <p className="text-xs text-slate-500 font-medium">{msg.size} • PDF</p>
                                        </div>
                                        <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Download size={18}/></button>
                                    </div>
                                )}

                                {msg.type === 'poll' && (
                                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm min-w-[300px]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <ChartBar className="text-blue-600 w-5 h-5"/>
                                            <h4 className="font-bold text-slate-900 text-sm">{msg.question}</h4>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            {msg.options.map((opt, i) => (
                                                <div key={i} className="relative h-8 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex items-center px-3 cursor-pointer hover:border-blue-300">
                                                    <div className="absolute left-0 top-0 bottom-0 bg-blue-100" style={{width: `${opt.percent}%`}}></div>
                                                    <div className="relative z-10 flex w-full justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-3.5 h-3.5 rounded-full border ${i === 0 ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'} flex items-center justify-center`}>
                                                                {i === 0 && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-700">{opt.text}</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-500">{opt.votes}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium">{msg.meta}</p>
                                    </div>
                                )}

                                {msg.reactions && (
                                    <div className="absolute -bottom-3 left-2 flex gap-1">
                                        {msg.reactions.map((r, i) => <div key={i} className="bg-white border border-slate-200 text-[10px] px-1.5 py-0.5 rounded-full shadow-sm font-bold">{r}</div>)}
                                    </div>
                                )}
                                
                                <div className={`text-[10px] mt-1.5 font-bold ${msg.isMe ? 'mr-1 text-blue-500 flex items-center gap-1' : 'ml-1 text-slate-400'}`}>
                                    {msg.time} 
                                    {msg.isMe && <CheckCircle2 size={10} className="text-blue-500" strokeWidth={3}/>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-3 md:p-4 bg-white border-t border-slate-200">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2">
                        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1"><Paperclip size={20} /></button>
                        
                        <input
                            type="text"
                            placeholder="Type a message to Project Team..."
                            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm text-slate-800 placeholder-slate-400"
                        />

                        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 hidden sm:block"><Smile size={20} /></button>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors px-1 font-bold text-xs hidden sm:block border border-slate-300 rounded mx-1">GIF</button>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 hidden sm:block"><ChartBar size={18} /></button>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 hidden sm:block"><Mic size={20} /></button>
                        
                        <button className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm ml-1">
                            <Send size={14} className="-ml-0.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR (Group Info) */}
            <div className="hidden lg:flex w-[280px] xl:w-[320px] flex-col bg-slate-50 overflow-y-auto shrink-0 p-6">
                
                {/* Header */}
                <div className="flex justify-between w-full mb-4">
                    <button className="text-slate-400 hover:text-slate-900"><ArrowLeft size={20}/></button>
                    <button className="text-slate-400 hover:text-slate-900"><Edit2 size={18}/></button>
                </div>
                
                {/* Profile Info */}
                <div className="flex flex-col items-center border-b border-slate-200 pb-6 mb-6">
                    <div className={`w-24 h-24 rounded-full ${activeGroup.bg} flex items-center justify-center text-white mb-3 shadow-sm text-4xl`}>
                        {activeGroup.icon}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight text-center">{activeGroup.name}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1 mb-4">{activeGroup.members} members</p>
                    
                    <p className="text-sm text-slate-600 font-medium text-center leading-snug mb-4">
                        Collaborating on innovative solutions and building great products together.
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        <span className="px-3 py-1 bg-white border border-slate-200 text-blue-600 text-[10px] font-bold rounded-full">Development</span>
                        <span className="px-3 py-1 bg-white border border-slate-200 text-blue-600 text-[10px] font-bold rounded-full">Product</span>
                        <span className="px-3 py-1 bg-white border border-slate-200 text-blue-600 text-[10px] font-bold rounded-full">Team</span>
                        <span className="px-3 py-1 bg-white border border-slate-200 text-slate-500 text-[10px] font-bold rounded-full">+</span>
                    </div>

                    <div className="flex justify-center gap-4 w-full">
                        <button className="flex flex-col items-center gap-1.5 flex-1 group">
                            <div className="w-full h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors"><Phone size={16}/></div>
                            <span className="text-[10px] font-bold text-blue-600">Audio Call</span>
                        </button>
                        <button className="flex flex-col items-center gap-1.5 flex-1 group">
                            <div className="w-full h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors"><Video size={16}/></div>
                            <span className="text-[10px] font-bold text-blue-600">Video Call</span>
                        </button>
                        <button className="flex flex-col items-center gap-1.5 flex-1 group">
                            <div className="w-full h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center group-hover:bg-blue-700 transition-colors"><Plus size={16}/></div>
                            <span className="text-[10px] font-bold text-blue-600">Add Members</span>
                        </button>
                        <button className="flex flex-col items-center gap-1.5 flex-1 group">
                            <div className="w-full h-9 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center group-hover:bg-slate-300 transition-colors"><MoreHorizontal size={16}/></div>
                            <span className="text-[10px] font-bold text-slate-600">More</span>
                        </button>
                    </div>
                </div>

                {/* Group Members */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-slate-900">Group Members</h4>
                        <span className="text-xs font-bold text-slate-500">{activeGroup.members} &gt;</span>
                    </div>
                    <div className="space-y-3 mb-3">
                        {members.map((m, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img src={m.img} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt={m.name} />
                                        {m.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>}
                                        {m.away && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                            {m.name}
                                            {m.role === 'Admin' && <span className="text-[10px] bg-amber-100 text-amber-600 px-1 rounded">👑</span>}
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-500">{m.status}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">{m.role}</span>
                            </div>
                        ))}
                    </div>
                    <button className="w-full text-left text-xs font-bold text-blue-600 hover:underline">View all members &gt;</button>
                </div>

                {/* Shared Items */}
                <div className="space-y-3 border-t border-slate-200 pt-6 mb-6">
                    <div className="flex justify-between items-center cursor-pointer group">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-700 group-hover:text-slate-900"><FileText size={16} className="text-slate-400"/> Shared Files</div>
                        <span className="text-xs font-medium text-slate-400">24 files</span>
                    </div>
                    <div className="flex justify-between items-center cursor-pointer group">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-700 group-hover:text-slate-900"><LinkIcon size={16} className="text-slate-400"/> Shared Links</div>
                        <span className="text-xs font-medium text-slate-400">18 links</span>
                    </div>
                    <div className="flex justify-between items-center cursor-pointer group">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-700 group-hover:text-slate-900"><ImageIcon size={16} className="text-slate-400"/> Media</div>
                        <span className="text-xs font-medium text-slate-400">56</span>
                    </div>
                    <div className="flex justify-between items-center cursor-pointer group">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-700 group-hover:text-slate-900"><Star size={16} className="text-slate-400"/> Starred Messages</div>
                        <span className="text-xs font-medium text-slate-400">12</span>
                    </div>
                </div>

                <div className="space-y-4 border-t border-slate-200 pt-6">
                    <button className="flex justify-between items-center w-full group">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-700 group-hover:text-slate-900"><Settings size={16} className="text-slate-400"/> Group Settings</div>
                    </button>
                    <button className="flex items-center gap-3 text-xs font-bold text-red-500 hover:text-red-600 w-full">
                        <LogOut size={16} /> Leave Group
                    </button>
                </div>

            </div>

        </div>
    );
}
