import { getApiUrl } from '../config';

const StoryViewer = ({ story, onClose }) => {
    if (!story) return null;

    const getFullUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return getApiUrl(url);
    };

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
                <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/80 to-transparent p-4 z-20 flex items-center gap-3">
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
                <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
                    {story.media_type === 'image' ? (
                        <img
                            src={getFullUrl(story.media_url)}
                            className="w-full h-full object-contain"
                            alt="Story"
                        />
                    ) : story.media_type === 'video' ? (
                        <video
                            src={getFullUrl(story.media_url)}
                            className="w-full h-full object-contain"
                            controls
                            autoPlay
                        />
                    ) : (
                        <div className="text-white/50">Unsupported media type</div>
                    )}

                    {/* Overlays */}
                    {story.overlays && JSON.parse(story.overlays).map(overlay => (
                        <div
                            key={overlay.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none"
                            style={{ left: `${overlay.x}%`, top: `${overlay.y}%` }}
                        >
                            <div className={`
                   ${overlay.type === 'text' ? 'text-xl font-bold text-white drop-shadow-md bg-black/30 px-2 rounded' : 'text-5xl drop-shadow-lg'}
                `}>
                                {overlay.content}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Music Player (Hidden/Minimal) */}
                {story.music_url && (
                    <div className="absolute top-16 right-4 z-20 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 text-white/80 animate-pulse border border-white/10">
                        <span className="text-xs">Now Playing</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                        <audio src={story.music_url} autoPlay loop className="hidden" />
                    </div>
                )}

                {/* Caption Overlay (if any) */}
                {story.content && (
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-6 pt-12 z-20 text-center">
                        <p className="text-white font-medium text-lg drop-shadow-md">{story.content}</p>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default StoryViewer;
