import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Switch from '../components/BB8Switch';
import textAnalysisIcon from '../assets/icon_text_analysis.png';
import computerVisionIcon from '../assets/icon_computer_vision.png';
import audioTranscriptionIcon from '../assets/icon_audio_transcription.png';

export default function ModerationTools() {
    const tools = [
        { label: 'Text Moderation', icon: textAnalysisIcon, path: '/text', color: 'from-blue-500 to-cyan-500', desc: 'Scan text for hate speech, violence, and abuse.' },
        { label: 'Image Moderation', icon: computerVisionIcon, path: '/image', color: 'from-purple-500 to-pink-500', desc: 'Analyze images for explicit content and gore.' },
        { label: 'Audio Analysis', icon: audioTranscriptionIcon, path: '/audio', color: 'from-green-500 to-emerald-500', desc: 'Transcribe and flag audio content.' },
        { label: 'Video Analysis', icon: <Switch toggleSize="7px" />, path: '/video', color: 'from-orange-500 to-red-500', desc: 'Process video frames for safety violations.', isCustom: true },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Shield className="text-cyber-primary" />
                    Moderation Tools
                </h1>
                <p className="text-cyber-muted">Select a tool to test moderation capabilities manually.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map((tool) => (
                    <Link
                        key={tool.path}
                        to={tool.path}
                        className="glass-card p-6 flex items-start gap-4 group hover:bg-white/5 transition-all hover:scale-[1.02] border border-white/10"
                    >
                        {tool.isCustom ? (
                            <div className="w-14 h-14 flex items-center justify-center shrink-0">
                                <div className="scale-125 pointer-events-none origin-center">
                                    {tool.icon}
                                </div>
                            </div>
                        ) : (
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-lg shrink-0 group-hover:rotate-6 transition-transform`}>
                                <img src={tool.icon} alt={tool.label} className="w-8 h-8 object-contain drop-shadow-sm" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyber-primary transition-colors">{tool.label}</h3>
                            <p className="text-cyber-muted text-sm leading-relaxed">{tool.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
