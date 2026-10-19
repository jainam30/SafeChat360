import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock } from 'lucide-react';
import { resolveMediaUrl } from '../config';

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

    const parsedOverlays = (() => {
        if (!story.overlays) return [];
        try {
            const parsed = typeof story.overlays === 'string' ? JSON.parse(story.overlays) : story.overlays;
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    })();

    const mediaSrc = resolveMediaUrl(story.media_url);

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-[60] p-2 bg-black/40 rounded-full"
            >
                <X size={28} />
            </button>

            {/* Main Content Container */}
            <div className="relative w-full max-w-sm h-[80vh] max-h-[720px] bg-black rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10">

                {/* Header Overlay */}
                <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/80 to-transparent p-4 z-20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-slate-800 flex items-center justify-center text-white font-bold">
                        {story.author_photo ? (
                            <img
                                src={resolveMediaUrl(story.author_photo)}
                                className="w-full h-full object-cover"
                                alt=""
                            />
                        ) : (
                            <span>{(story.username || 'U').charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm shadow-black drop-shadow-md">{story.username}</div>
                        <div className="text-white/70 text-xs flex items-center gap-1">
                            <Clock size={10} /> {new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                {/* Media */}
                <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
                    {story.media_type === 'video' ? (
                        <video
                            src={mediaSrc}
                            className="w-full h-full object-cover"
                            controls
                            autoPlay
                            playsInline
                        />
                    ) : (
                        <img
                            src={mediaSrc}
                            className="w-full h-full object-cover"
                            alt="Story"
                        />
                    )}

                    {/* Overlays */}
                    {parsedOverlays.map(overlay => (
                        <div
                            key={overlay.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none"
                            style={{ left: `${overlay.x}%`, top: `${overlay.y}%`, color: overlay.color }}
                        >
                            <div className={overlay.type === 'text' ? 'text-xl font-bold text-white drop-shadow-md bg-black/40 px-2.5 py-1 rounded-lg' : 'text-5xl drop-shadow-lg'}>
                                {overlay.content}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Music Player */}
                {story.music_url && (
                    <div className="absolute top-16 right-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 text-white/90 animate-pulse border border-white/10">
                        <span className="text-[11px] font-semibold">Soundtrack</span>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <audio src={story.music_url} autoPlay loop className="hidden" />
                    </div>
                )}

                {/* Caption Overlay */}
                {story.content && (
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-5 pt-10 z-20 text-center">
                        <p className="text-white font-medium text-sm drop-shadow-md">{story.content}</p>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default StoryViewer;
