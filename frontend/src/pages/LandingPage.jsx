import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Video, MessageSquare, Mic, CheckCircle, ArrowRight, Activity } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-cyber-black text-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyber-primary/5 rounded-full blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyber-secondary/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyber-primary to-cyber-secondary p-[1px]">
                        <div className="w-full h-full rounded-xl bg-cyber-black flex items-center justify-center">
                            <Shield size={20} className="text-cyber-primary" />
                        </div>
                    </div>
                    <span className="text-xl font-bold tracking-tight">SafeChat360</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm text-cyber-muted hover:text-white transition-colors">Log In</Link>
                    <Link to="/register" className="px-5 py-2.5 bg-cyber-primary text-black text-sm font-bold rounded-lg hover:bg-cyber-primary/90 transition-all shadow-[0_0_15px_rgba(18,196,148,0.3)]">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative z-10 container mx-auto px-6 py-20 lg:py-32 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                    <Activity size={14} className="text-cyber-primary" />
                    <span className="text-xs font-medium text-cyber-primary tracking-wide uppercase">AI-Powered Protection</span>
                </div>

                <h1 className="text-5xl lg:text-7xl font-bold mb-6 max-w-4xl leading-tight">
                    Secure Your Platform with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary to-cyber-secondary">Intelligent Moderation</span>
                </h1>

                <p className="text-lg text-cyber-muted max-w-2xl mb-10 leading-relaxed">
                    SafeChat360 uses advanced AI to detect toxicity, hate speech, and inappropriate content across text, images, video, and audio in real-time.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/register" className="group px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2">
                        Start Free Trial <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/about" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
                        Learn More
                    </Link>
                </div>
            </header>

            {/* Features Grid */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FeatureCard
                        icon={<MessageSquare className="text-blue-400" />}
                        title="Text Analysis"
                        desc="Detects hate speech, toxicity, and spam in real-time chat streams."
                    />
                    <FeatureCard
                        icon={<Eye className="text-purple-400" />}
                        title="Image Scanning"
                        desc="Identifying NSFW content, gore, and violence with computer vision."
                    />
                    <FeatureCard
                        icon={<Video className="text-pink-400" />}
                        title="Video Moderation"
                        desc="Frame-by-frame analysis to catch inappropriate content in videos."
                    />
                    <FeatureCard
                        icon={<Mic className="text-yellow-400" />}
                        title="Audio Transcription"
                        desc="Transcribes and analyzes voice chat for toxicity and harassment."
                    />
                </div>
            </section>

            {/* Trust Section */}
            <section className="relative z-10 container mx-auto px-6 py-10 border-t border-white/5">
                <div className="flex flex-col items-center">
                    <h3 className="text-sm font-semibold text-cyber-muted uppercase tracking-widest mb-8">Trusted Technology</h3>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholders for logos - simply text for now matching design */}
                        <span className="text-xl font-bold">TensorFlow</span>
                        <span className="text-xl font-bold">PyTorch</span>
                        <span className="text-xl font-bold">OpenAI</span>
                        <span className="text-xl font-bold">FastAPI</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-black/50 backdrop-blur-md">
                <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-cyber-muted text-sm">
                        © 2024 SafeChat360. All rights reserved.
                    </div>
                    <div className="flex gap-6 text-sm text-cyber-muted">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-cyber-primary/30 hover:bg-white/10 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-black/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
        </div>
    );
}
