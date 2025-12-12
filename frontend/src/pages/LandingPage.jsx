import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Video, MessageSquare, Mic, ArrowRight, Activity, CheckCircle, TrendingUp, Lock } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-cyber-background text-cyber-text relative overflow-x-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyber-primary/10 rounded-full blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-50 container mx-auto px-6 py-6 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-cyber-border/30 sticky top-0">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyber-primary to-blue-500 p-[1px] shadow-sm">
                        <div className="w-full h-full rounded-xl bg-white flex items-center justify-center">
                            <Shield size={20} className="text-cyber-primary" />
                        </div>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-cyber-text">SafeChat360</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-cyber-muted hover:text-cyber-primary transition-colors">Log In</Link>
                    <Link to="/register" className="px-5 py-2.5 bg-cyber-primary text-white text-sm font-bold rounded-lg hover:bg-cyber-primary/90 transition-all shadow-md shadow-cyber-primary/20">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative z-10 container mx-auto px-6 py-20 lg:py-32 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-cyber-primary/20 mb-8 shadow-sm">
                    <Activity size={14} className="text-cyber-primary" />
                    <span className="text-xs font-bold text-cyber-primary tracking-wide uppercase">AI-Powered Protection</span>
                </div>

                <h1 className="text-5xl lg:text-7xl font-bold mb-6 max-w-5xl leading-tight text-cyber-text">
                    Secure Your Platform with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary to-blue-600">Intelligent Moderation</span>
                </h1>

                <p className="text-lg text-cyber-muted max-w-2xl mb-10 leading-relaxed font-medium">
                    SafeChat360 uses advanced AI to detect toxicity, hate speech, and inappropriate content across text, images, video, and audio in real-time.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/register" className="group px-8 py-4 bg-cyber-primary text-white font-bold rounded-xl hover:bg-cyber-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-cyber-primary/25">
                        Start Free Trial <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/about" className="px-8 py-4 bg-white border border-cyber-border text-cyber-text font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        Learn More
                    </Link>
                </div>

                {/* Dashboard Preview / Mockup */}
                <div className="mt-20 relative w-full max-w-5xl mx-auto">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyber-primary to-blue-500 rounded-2xl blur opacity-20"></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl border border-cyber-border overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                            {/* Mock Sidebar */}
                            <div className="hidden md:block bg-slate-50 border-r border-gray-100 p-6 space-y-4">
                                <div className="h-2 w-20 bg-gray-200 rounded mb-8"></div>
                                <div className="space-y-3">
                                    <div className="h-8 w-full bg-white rounded-lg border border-gray-200 shadow-sm"></div>
                                    <div className="h-8 w-full bg-transparent rounded-lg"></div>
                                    <div className="h-8 w-full bg-transparent rounded-lg"></div>
                                </div>
                            </div>
                            {/* Mock Content */}
                            <div className="col-span-2 p-8 bg-white">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="h-6 w-32 bg-gray-100 rounded"></div>
                                    <div className="h-8 w-24 bg-cyber-primary/10 rounded"></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl border border-gray-100 flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100"></div>
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 w-24 bg-gray-100 rounded"></div>
                                            <div className="h-3 w-full bg-gray-50 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-red-100 bg-red-50 flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-red-100"></div>
                                        <div className="space-y-2 flex-1">
                                            <div className="flex justify-between">
                                                <div className="h-4 w-24 bg-red-100 rounded"></div>
                                                <div className="h-4 w-16 bg-red-200 rounded text-[10px] flex items-center justify-center text-red-600 font-bold">FLAGGED</div>
                                            </div>
                                            <div className="h-3 w-3/4 bg-red-100/50 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-gray-100 flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100"></div>
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 w-24 bg-gray-100 rounded"></div>
                                            <div className="h-3 w-full bg-gray-50 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-cyber-text mb-4">Comprehensive Coverage</h2>
                    <p className="text-cyber-muted max-w-2xl mx-auto">Protect your community across all media types with our multi-modal AI models.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FeatureCard
                        icon={<MessageSquare className="text-blue-500" />}
                        title="Text Analysis"
                        desc="Detects hate speech, toxicity, and spam in real-time chat streams."
                        color="bg-blue-50 text-blue-600 border-blue-100"
                    />
                    <FeatureCard
                        icon={<Eye className="text-purple-500" />}
                        title="Image Scanning"
                        desc="Identifying NSFW content, gore, and violence with computer vision."
                        color="bg-purple-50 text-purple-600 border-purple-100"
                    />
                    <FeatureCard
                        icon={<Video className="text-pink-500" />}
                        title="Video Moderation"
                        desc="Frame-by-frame analysis to catch inappropriate content in videos."
                        color="bg-pink-50 text-pink-600 border-pink-100"
                    />
                    <FeatureCard
                        icon={<Mic className="text-yellow-500" />}
                        title="Audio Transcription"
                        desc="Transcribes and analyzes voice chat for toxicity and harassment."
                        color="bg-yellow-50 text-yellow-600 border-yellow-100"
                    />
                </div>
            </section>

            {/* Trust Section */}
            <section className="relative z-10 container mx-auto px-6 py-20 border-t border-gray-100 bg-white/50">
                <div className="flex flex-col items-center">
                    <h3 className="text-sm font-bold text-cyber-muted uppercase tracking-widest mb-10">Powered By Advanced AI</h3>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 hover:opacity-100 transition-all duration-500">
                        {/* Placeholders for logos - simply text for now matching design */}
                        <div className="flex items-center gap-2 text-xl font-bold text-cyber-text grayscale hover:grayscale-0 transition-all">
                            <TrendingUp className="text-orange-500" /> TensorFlow
                        </div>
                        <div className="flex items-center gap-2 text-xl font-bold text-cyber-text grayscale hover:grayscale-0 transition-all">
                            <Activity className="text-red-500" /> PyTorch
                        </div>
                        <div className="flex items-center gap-2 text-xl font-bold text-cyber-text grayscale hover:grayscale-0 transition-all">
                            <Lock className="text-green-500" /> OpenAI
                        </div>
                        <div className="flex items-center gap-2 text-xl font-bold text-cyber-text grayscale hover:grayscale-0 transition-all">
                            <CheckCircle className="text-teal-500" /> FastAPI
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 bg-white">
                <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-cyber-muted text-sm font-medium">
                        © 2024 SafeChat360. All rights reserved.
                    </div>
                    <div className="flex gap-6 text-sm font-medium text-cyber-muted">
                        <a href="#" className="hover:text-cyber-primary transition-colors">Privacy</a>
                        <a href="#" className="hover:text-cyber-primary transition-colors">Terms</a>
                        <a href="#" className="hover:text-cyber-primary transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc, color }) {
    return (
        <div className="p-6 rounded-2xl bg-white border border-gray-100 hover:border-cyber-primary/30 hover:shadow-lg transition-all group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${color}`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-cyber-text">{title}</h3>
            <p className="text-sm text-cyber-muted leading-relaxed font-medium">{desc}</p>
        </div>
    );
}
