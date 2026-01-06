import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Video, MessageSquare, Mic, ArrowRight, Activity, CheckCircle, TrendingUp, Lock, Zap, Server, Globe } from 'lucide-react';
import Switch from '../components/BB8Switch';
import { motion, useScroll, useTransform } from 'framer-motion';
import logoImg from '../assets/safechat_logo.png';
import accuracyIcon from '../assets/icon_accuracy.png';
import latencyIcon from '../assets/icon_latency.png';
import protectionIcon from '../assets/icon_protection.png';
import communitiesIcon from '../assets/icon_communities.png';
import textAnalysisIcon from '../assets/icon_text_analysis.png';
import audioTranscriptionIcon from '../assets/icon_audio_transcription.png';
import realTimeApiIcon from '../assets/icon_real_time_api.png';
import multiLanguageIcon from '../assets/icon_multi_language.png';
import computerVisionIcon from '../assets/icon_computer_vision.png';
import connectApiIcon from '../assets/icon_connect_api.png';
import realTimeScanIcon from '../assets/icon_real_time_scan.png';
import dashboardStatsIcon from '../assets/icon_dashboard_stats.png';

export default function LandingPage() {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    return (
        <div className="min-h-screen bg-cyber-background text-cyber-text relative overflow-hidden font-sans selection:bg-cyber-primary/30">
            {/* Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <motion.div
                    style={{ y: y1, x: -50 }}
                    className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-300/30 rounded-full blur-[120px] mix-blend-multiply"
                />
                <motion.div
                    style={{ y: y2, x: 50 }}
                    className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-300/30 rounded-full blur-[120px] mix-blend-multiply"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            </div>

            {/* Navigation */}
            <nav className="fixed w-full z-50 top-0 transition-all duration-300 px-2 py-2 md:px-4 md:py-4">
                <div className="container mx-auto max-w-6xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl px-3 py-2 md:px-6 md:py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src={logoImg} alt="SafeChat360 Logo" className="w-10 h-10 md:w-16 md:h-16 drop-shadow-md rounded-full object-cover" />
                        <span className="text-lg md:text-2xl font-bold tracking-tight text-slate-800">SafeChat360</span>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-slate-600 hover:text-cyber-primary transition-colors">Features</button>
                        <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-slate-600 hover:text-cyber-primary transition-colors">How it works</button>

                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <Link to="/login" className="text-xs md:text-sm font-bold text-slate-600 hover:text-cyber-primary transition-colors px-2 py-1 md:px-3 md:py-2">Log In</Link>
                        <Link to="/register" className="px-3 py-1.5 md:px-5 md:py-2.5 bg-cyber-primary text-white text-xs md:text-sm font-bold rounded-xl hover:bg-cyber-primary_hover transition-all shadow-lg shadow-cyber-primary/25 hover:shadow-cyber-primary/40 transform hover:-translate-y-0.5">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative z-10 container mx-auto px-6 pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col items-center text-center">
                {/* ... existing hero content ... */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-cyber-primary/20 mb-8 shadow-sm backdrop-blur-sm"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-primary"></span>
                    </span>
                    <span className="text-xs font-bold text-cyber-primary tracking-wide uppercase">Live Moderate 2.0 is here</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-extrabold mb-6 max-w-5xl leading-[1.1] text-white tracking-tight drop-shadow-md"
                >
                    Making the Internet <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5ee7df] via-white to-[#b490ca] animate-gradient-x">Safe & Civil</span> Again
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-xl text-white/90 max-w-2xl mb-10 leading-relaxed font-medium drop-shadow-sm"
                >
                    Real-time AI moderation for communities of any size.
                    Detect toxicity, hate speech, and NSFW content instantly across text, images, and video.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                >
                    <Link to="/register" className="group px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1">
                        Start for Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/about" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                        <Video size={18} className="text-slate-400" /> Watch Demo
                    </Link>
                </motion.div>

                {/* Dashboard Prevention */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
                    className="mt-20 relative w-full max-w-6xl mx-auto perspective-1000"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyber-primary via-purple-500 to-blue-500 rounded-2xl blur-xl opacity-30 animate-pulse-slow"></div>
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden ring-1 ring-black/5">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 min-h-[400px] md:h-[600px]">
                            {/* Sidebar Mockup */}
                            <div className="hidden md:flex col-span-2 bg-slate-50/50 border-r border-slate-200/60 p-4 flex-col gap-4">
                                <div className="h-8 w-8 bg-cyber-primary/20 rounded-lg mb-4"></div>
                                <div className="h-2 w-16 bg-slate-200 rounded-full mb-6"></div>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/50 border border-transparent hover:border-slate-200">
                                        <div className="w-5 h-5 rounded bg-slate-200"></div>
                                        <div className="h-2 w-12 bg-slate-200 rounded-full"></div>
                                    </div>
                                ))}
                            </div>

                            {/* Main Content Mockup */}
                            <div className="col-span-1 md:col-span-10 bg-white/50 p-6 md:p-8 flex flex-col relative text-left">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-8">
                                    <div className="h-8 w-48 bg-slate-100 rounded-lg"></div>
                                    <div className="flex gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-100"></div>
                                        <div className="h-8 w-8 rounded-full bg-slate-100"></div>
                                    </div>
                                </div>

                                {/* Chat Area */}
                                <div className="flex-1 space-y-6">
                                    <ChatMessage
                                        avatar="bg-blue-200"
                                        name="User A"
                                        text="Hey everyone, just joined! This platform looks amazing."
                                        time="2:01 PM"
                                    />
                                    <ChatMessage
                                        avatar="bg-green-200"
                                        name="User B"
                                        text="Welcome! Glad to have you here."
                                        time="2:02 PM"
                                    />
                                    {/* Flagged Message Animation */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                                        whileInView={{ opacity: 1, x: 0, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 1 }}
                                        className="flex gap-4 group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex-shrink-0 flex items-center justify-center text-red-500 font-bold text-xs ring-2 ring-white">!</div>
                                        <div className="flex-col flex max-w-[80%]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-700 text-sm">Suspicious User</span>
                                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-200">BLOCKED</span>
                                            </div>
                                            <div className="p-4 rounded-2xl rounded-tl-none bg-red-50 border border-red-100 text-red-800/60 line-through text-sm">
                                                [This message was automatically hidden by AI due to offensive content]
                                            </div>
                                        </div>
                                    </motion.div>

                                    <ChatMessage
                                        avatar="bg-purple-200"
                                        name="ModBot 3000"
                                        text="Content flagged and removed. Please review our community guidelines."
                                        time="2:05 PM"
                                        isBot
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* Stats Section */}
            <section className="py-12 border-y border-slate-200 bg-white/50 backdrop-blur-sm relative z-10">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-200/50">
                        <StatItem icon={accuracyIcon} label="Accuracy" />
                        <StatItem icon={latencyIcon} label="Latency" />
                        <StatItem icon={protectionIcon} label="Protection" />
                        <StatItem icon={communitiesIcon} label="Communities" />
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="relative z-10 container mx-auto px-6 py-24 md:py-32">
                <div className="text-center mb-20">
                    <span className="text-cyber-primary font-bold tracking-wider uppercase text-sm mb-2 block">Features</span>
                    <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Complete Safety Suite</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto text-lg">Protect your community across all media types with our multi-modal AI models.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={textAnalysisIcon}
                        title="Text Analysis"
                        desc="Advanced NLP detecting hate speech, toxicity, and spam instantly."
                        color="from-blue-500 to-cyan-500"
                    />
                    <FeatureCard
                        icon={computerVisionIcon}
                        title="Computer Vision"
                        desc="Scanning images for NSFW, gore, and violence with pixel-perfect accuracy."
                        color="from-purple-500 to-pink-500"
                    />
                    <FeatureCard
                        icon={<Switch toggleSize="7px" />}
                        title="Video Moderation"
                        desc="Frame-by-frame analysis to catch inappropriate content in live streams."
                        color="from-orange-500 to-red-500"
                        isCustomIcon
                    />
                    <FeatureCard
                        icon={audioTranscriptionIcon}
                        title="Audio Transcription"
                        desc="Transcribes and analyzes voice chat for toxicity and harassment."
                        color="from-green-500 to-emerald-500"
                    />
                    <FeatureCard
                        icon={realTimeApiIcon}
                        title="Real-time API"
                        desc="Sub-100ms latency for seamless integration into chat apps."
                        color="from-yellow-500 to-orange-500"
                    />
                    <FeatureCard
                        icon={multiLanguageIcon}
                        title="Multi-language"
                        desc="Native support for 30+ languages including slang and nuance."
                        color="from-indigo-500 to-blue-500"
                    />
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="relative z-10 container mx-auto px-6 py-24 bg-slate-50/50">
                <div className="text-center mb-20">
                    <span className="text-cyber-primary font-bold tracking-wider uppercase text-sm mb-2 block">Workflow</span>
                    <h2 className="text-4xl font-extrabold text-slate-900 mb-6">How It Works</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto text-lg">Seamless integration into your existing platform in minutes.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {[
                        { title: "Connect API", desc: "Use our SDK to connect your chat stream.", step: "1", icon: connectApiIcon },
                        { title: "Real-time Scan", desc: "Our AI processes every message instantly.", step: "2", icon: realTimeScanIcon },
                        { title: "Dashboard Stats", desc: "View detailed analytics and logs in real-time.", step: "3", icon: dashboardStatsIcon }
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg relative overflow-hidden group"
                        >
                            <div className="absolute -right-4 -top-4 text-9xl font-bold text-slate-100 select-none z-0 group-hover:text-cyber-primary/5 transition-colors duration-500">{item.step}</div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-primary to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                                    {typeof item.icon === 'string' ? (
                                        <img src={item.icon} alt={item.title} className="w-10 h-10 object-contain" />
                                    ) : (
                                        React.cloneElement(item.icon, { size: 24 })
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
                                <p className="text-slate-500">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Pricing Section Removed as per user request */}

            {/* CTA Section */}
            <section className="relative z-10 container mx-auto px-6 py-24">
                <div className="bg-slate-900 rounded-3xl p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] bg-cyber-primary/30 rounded-full blur-[100px]"></div>
                        <div className="absolute bottom-[-50%] right-[-20%] w-[80%] h-[80%] bg-purple-500/30 rounded-full blur-[100px]"></div>
                    </div>

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to secure your platform?</h2>
                        <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                            Join thousands of communities using SafeChat360 to build healthier, safer digital spaces.
                            Start your chatting with end to end encryption today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register" className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg transform hover:-translate-y-1">
                                Get Started Now
                            </Link>
                            <Link to="/contact" className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
                                Contact Sales
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white relative z-10">
                <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <img src={logoImg} alt="SafeChat360 Logo" className="w-12 h-12 object-cover rounded-full" />
                        <span className="font-bold text-slate-700 text-lg">SafeChat360</span>
                    </div>
                    <div className="text-slate-500 text-sm font-medium">
                        © 2025 SafeChat360. All rights reserved.
                    </div>
                    <div className="flex gap-6 text-sm font-medium text-slate-500">
                        <a href="#" className="hover:text-cyber-primary transition-colors">Privacy</a>
                        <a href="#" className="hover:text-cyber-primary transition-colors">Terms</a>
                        <a href="#" className="hover:text-cyber-primary transition-colors">Twitter</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc, color, isCustomIcon }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group p-8 rounded-3xl bg-white/95 backdrop-blur-md border border-white/50 hover:border-white shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-bl-full group-hover:opacity-20 transition-opacity`}></div>

            {isCustomIcon ? (
                <div className="relative z-10 mb-6 group-hover:scale-105 transition-transform duration-300">
                    {icon}
                </div>
            ) : (
                <div className={`relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 ring-4 ring-white`}>
                    {typeof icon === 'string' ? (
                        <img src={icon} alt={title} className="w-8 h-8 object-contain" />
                    ) : (
                        React.cloneElement(icon, { size: 24, className: "text-white" })
                    )}
                </div>
            )}

            <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
            <p className="text-slate-600 leading-relaxed font-medium text-sm">{desc}</p>
        </motion.div>
    );
}

function StatItem({ icon, label }) {
    return (
        <div className="flex flex-col items-center p-4 hover:scale-105 transition-transform duration-300">
            <img src={icon} alt={label} className="w-24 h-24 mb-4 object-contain drop-shadow-md invert brightness-0 filter" />
            <div className="text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">{label}</div>
        </div>
    );
}



function ChatMessage({ avatar, name, text, time, isBot }) {
    return (
        <div className="flex gap-4">
            <div className={`w-10 h-10 rounded-full ${avatar} border-2 border-white shadow-sm flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-600`}>
                {name[0]}
            </div>
            <div className="flex-col flex max-w-[80%]">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-700 text-sm">{name}</span>
                    <span className="text-[10px] text-slate-400">{time}</span>
                    {isBot && <span className="bg-cyber-primary/10 text-cyber-primary text-[9px] px-1 rounded font-bold border border-cyber-primary/20">BOT</span>}
                </div>
                <div className="p-3 bg-slate-100 rounded-2xl rounded-tl-none text-slate-600 text-sm shadow-sm ring-1 ring-slate-200/50">
                    {text}
                </div>
            </div>
        </div>
    );
}


