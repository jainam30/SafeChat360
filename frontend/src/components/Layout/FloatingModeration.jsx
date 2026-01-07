import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Image, Mic, Film, X } from 'lucide-react';

export default function FloatingModeration() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleNavigate = (path) => {
        navigate(path);
        setIsOpen(false);
    };

    const actions = [
        { label: 'Video', icon: Film, path: '/video', color: 'bg-red-500' },
        { label: 'Audio', icon: Mic, path: '/audio', color: 'bg-yellow-500' },
        { label: 'Image', icon: Image, path: '/image', color: 'bg-purple-500' },
        { label: 'Text', icon: MessageSquare, path: '/text', color: 'bg-blue-500' },
    ];

    return (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 flex flex-col items-end gap-3 pointer-events-none">

            {/* Action Buttons */}
            <div className={`flex flex-col gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                {actions.map((action, index) => (
                    <button
                        key={action.label}
                        onClick={() => handleNavigate(action.path)}
                        className="flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-white/40 p-2 pr-4 rounded-full shadow-lg hover:bg-white transition-all group"
                    >
                        <div className={`${action.color} w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                            <action.icon size={20} />
                        </div>
                        <span className="text-cyber-text font-bold text-sm">{action.label} Moderation</span>
                    </button>
                ))}
            </div>

            {/* Main Toggle Button */}
            <button
                onClick={toggleOpen}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(18,196,148,0.4)] transition-all duration-300 hover:scale-110 pointer-events-auto ${isOpen ? 'bg-red-500 rotate-45' : 'bg-cyber-primary text-cyber-black'}`}
            >
                <Plus size={32} className={`transition-transform duration-300 ${isOpen ? 'text-white' : ''}`} />
            </button>

        </div>
    );
}
