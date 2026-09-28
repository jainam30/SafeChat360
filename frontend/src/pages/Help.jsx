import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    HelpCircle, Search, MessageSquare, Users, Shield, 
    Settings, Image as ImageIcon, User, AlertTriangle, 
    Activity, Mail, ChevronDown, ChevronUp, Info, BookOpen
} from 'lucide-react';

const STATIC_FAQS = [
    {
        question: "How do I start a conversation?",
        answer: "To start a private conversation, navigate to the Contacts page, ensure you are friends with the user, and click the 'Message' button next to their name. You can also message users directly from their public profile."
    },
    {
        question: "How do I manage my friends and contacts?",
        answer: "Go to the Contacts page to view your current friends, accept incoming requests, and see outgoing requests. You can find new people by clicking on their usernames in the Social Feed."
    },
    {
        question: "Is my messaging data secure?",
        answer: "Yes. SafeChat360 automatically secures all private 1-on-1 conversations using Double Ratchet End-to-End Encryption (E2EE). Only you and the recipient can read the messages."
    },
    {
        question: "How do I change my password?",
        answer: "Navigate to Security & Privacy from the sidebar or settings menu. Under Account Security, you can update your password by providing your current and new password."
    },
    {
        question: "Where can I view my active sessions?",
        answer: "In the Security & Privacy center, you can view all devices currently logged into your account. You can revoke access to any unrecognized device instantly."
    },
    {
        question: "How do I update my profile picture?",
        answer: "Go to your Profile and click the camera icon on your avatar. You can upload a new image which will be securely stored and updated across the network."
    },
    {
        question: "How does content moderation work?",
        answer: "SafeChat360 employs automated Machine Learning moderation that analyzes text, images, and audio for harmful content. Flagged content is sent to our moderation queue for review."
    }
];

const HELP_CATEGORIES = [
    { title: 'Chats & Messages', desc: 'E2EE messaging and groups', icon: <MessageSquare size={20} />, link: '/chats' },
    { title: 'Contacts', desc: 'Manage friends and requests', icon: <Users size={20} />, link: '/contacts' },
    { title: 'Security', desc: 'Sessions and passwords', icon: <Shield size={20} />, link: '/security' },
    { title: 'Settings', desc: 'Application preferences', icon: <Settings size={20} />, link: '/settings' },
    { title: 'Media Library', desc: 'View shared files and photos', icon: <ImageIcon size={20} />, link: '/media' },
    { title: 'My Profile', desc: 'Update your avatar and details', icon: <User size={20} />, link: '/profile' }
];

export default function Help() {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState(null);

    const filteredFaqs = STATIC_FAQS.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleFaq = (index) => {
        if (expandedFaq === index) {
            setExpandedFaq(null);
        } else {
            setExpandedFaq(index);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0">
            {/* HEADER */}
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl font-bold text-slate-900 mb-3 flex items-center justify-center md:justify-start gap-3">
                    <HelpCircle className="text-cyber-primary" size={32} />
                    Help & Support
                </h1>
                <p className="text-slate-500 text-lg max-w-2xl">
                    Find answers, understand application features, and learn how to get the most out of SafeChat360.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* LEFT COLUMN: Search, Categories, FAQs */}
                <div className="flex-1 min-w-0 space-y-8">
                    
                    {/* Search Bar */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="text-slate-400" size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search help articles and FAQs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-700 font-medium focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all"
                        />
                    </div>

                    {/* Topic Categories */}
                    {!searchQuery && (
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <BookOpen size={20} className="text-slate-400" />
                                Browse Topics
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {HELP_CATEGORIES.map((cat, idx) => (
                                    <Link key={idx} to={cat.link} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-cyber-primary/50 hover:shadow-md transition-all group">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-cyber-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            {cat.icon}
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-1">{cat.title}</h3>
                                        <p className="text-xs text-slate-500">{cat.desc}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FAQs */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Info size={20} className="text-slate-400" />
                            {searchQuery ? 'Search Results' : 'Frequently Asked Questions'}
                        </h2>
                        
                        {filteredFaqs.length === 0 ? (
                            <div className="bg-white border border-slate-200 border-dashed rounded-xl p-8 text-center">
                                <Search size={32} className="mx-auto text-slate-300 mb-3" />
                                <h3 className="font-bold text-slate-700 mb-1">No help articles found</h3>
                                <p className="text-sm text-slate-500">Try adjusting your search term to find what you're looking for.</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
                                {filteredFaqs.map((faq, idx) => (
                                    <div key={idx} className="w-full">
                                        <button 
                                            onClick={() => toggleFaq(idx)}
                                            className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
                                            aria-expanded={expandedFaq === idx}
                                        >
                                            <span className="font-semibold text-slate-800 pr-4">{faq.question}</span>
                                            {expandedFaq === idx ? (
                                                <ChevronUp size={18} className="text-slate-400 shrink-0" />
                                            ) : (
                                                <ChevronDown size={18} className="text-slate-400 shrink-0" />
                                            )}
                                        </button>
                                        {expandedFaq === idx && (
                                            <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Support Status & Contact */}
                <div className="lg:w-80 shrink-0 space-y-4">
                    
                    {/* Reporting Status */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="font-bold text-slate-900">Report a Problem</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                            Manual user reporting and direct support ticketing are currently pending backend integration.
                        </p>
                        <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            SafeChat360 relies on automated Machine Learning to detect and flag harmful content proactively.
                        </p>
                    </div>

                    {/* System Status */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                                <Activity size={20} />
                            </div>
                            <h3 className="font-bold text-slate-900">System Status</h3>
                        </div>
                        <p className="text-sm text-slate-600">
                            Public service health dashboards and uptime monitors are not currently available for this deployment.
                        </p>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-cyber-primary flex items-center justify-center shrink-0">
                                <Mail size={20} />
                            </div>
                            <h3 className="font-bold text-slate-900">Contact Support</h3>
                        </div>
                        <p className="text-sm text-slate-600">
                            Direct support email addresses and live chat systems are not currently configured.
                        </p>
                    </div>

                    {/* Legal Links */}
                    <div className="pt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400 font-medium justify-center lg:justify-start px-2">
                        <span className="cursor-not-allowed hover:text-slate-500 transition-colors" title="Not currently published">Privacy Policy</span>
                        <span>&bull;</span>
                        <span className="cursor-not-allowed hover:text-slate-500 transition-colors" title="Not currently published">Terms of Service</span>
                    </div>

                </div>

            </div>
        </div>
    );
}
