import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, User } from 'lucide-react';

const StoryViewer = ({ story, onClose }) => {
    if (!story) return null;

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-[60]"
            >
                <X size={32} />
            </button>

            {/* Main Content Container */}
            <div className="relative w-full max-w-lg h-[80vh] bg-black rounded-xl overflow-hidden flex flex-col shadow-2xl border border-white/10">

                {/* Header Overlay */}
                <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/80 to-transparent p-4 z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                        <img
                            src={story.author_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.username}`}
                            className="w-full h-full object-cover"
                            alt=""
                        />
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm shadow-black drop-shadow-md">{story.username}</div>
                        <div className="text-white/70 text-xs flex items-center gap-1">
                            <Clock size={10} /> {new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                {/* Media */}
                <div className="flex-1 flex items-center justify-center bg-black relative">
                    {story.media_type === 'image' ? (
                        <img
                            src={story.media_url}
                            className="w-full h-full object-contain"
                            alt="Story"
                        />
                    ) : story.media_type === 'video' ? (
                        <video
                            src={story.media_url}
                            className="w-full h-full object-contain"
                            controls
                            autoPlay
                        />
                    ) : (
                        <div className="text-white/50">Unsupported media type</div>
                    )}
                </div>

                {/* Caption Overlay (if any) */}
                {story.content && (
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-6 pt-12 z-10 text-center">
                        <p className="text-white font-medium text-lg drop-shadow-md">{story.content}</p>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default StoryViewer;
