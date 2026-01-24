import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Image, Mic, Film, Shield } from 'lucide-react';

export default function ModerationTools() {
    const tools = [
        { label: 'Text Moderation', icon: MessageSquare, path: '/text', color: 'black', desc: 'Scan text for hate speech, violence, and abuse.' },
        { label: 'Image Moderation', icon: Image, path: '/image', color: 'black', desc: 'Analyze images for explicit content and gore.' },
        { label: 'Audio Analysis', icon: Mic, path: '/audio', color: 'black', desc: 'Transcribe and flag audio content.' },
        { label: 'Video Analysis', icon: Film, path: '/video', color: 'black', desc: 'Process video frames for safety violations.' },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Shield className="text-cyber-primary" />
                    Moderation Tools
                </h1>
                <p className="text-gray-400">Select a tool to test moderation capabilities manually.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map((tool) => (
                    <Link
                        key={tool.path}
                        to={tool.path}
                        className="glass-card p-6 flex items-start gap-4 group hover:bg-white/5 transition-all hover:scale-[1.02] border border-white/10"
                    >
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-lg shrink-0 group-hover:rotate-6 transition-transform`}>
                            <tool.icon size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyber-primary transition-colors">{tool.label}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{tool.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
