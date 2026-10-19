import React, { useState, useEffect, useRef } from 'react';
import { X, Type, Smile, Music, Trash2, Send, Upload, Video, Image as ImageIcon, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl, resolveMediaUrl } from '../config';

const MOCK_MUSIC_TRACKS = [
    { id: '1', title: 'Cyber Pulse', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: '2', title: 'Neon Dreams', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: '3', title: 'Night Drive', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const STORY_COLORS = ['#ffffff', '#000000', '#ff0055', '#00ccff', '#ffcc00', '#33ff00'];
const STORY_STICKERS = ['🔥', '😂', '😍', '🎉', '📍', '🙌', '👀', '💯', '🤔', '😎', '🍕', '✈️'];

const StoryEditor = ({ initialFile, initialType, token, onClose, onPublished, onPost }) => {
    const [file, setFile] = useState(initialFile || null);
    const [mediaType, setMediaType] = useState(initialType || 'image');
    const [previewUrl, setPreviewUrl] = useState('');
    const [overlays, setOverlays] = useState([]);
    const [selectedMusic, setSelectedMusic] = useState(null);
    const [caption, setCaption] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);

    // Pickers
    const [showMusicPicker, setShowMusicPicker] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [textColor, setTextColor] = useState('#ffffff');
    const [activeOverlayId, setActiveOverlayId] = useState(null);

    const fileInputRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!file) return;

        if (typeof file === 'string') {
            setPreviewUrl(file);
        } else if (file instanceof File || file instanceof Blob) {
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [file]);

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        // Size check (10MB)
        if (selected.size > 10 * 1024 * 1024) {
            toast.error("File exceeds 10MB limit. Please choose a smaller file.");
            return;
        }

        const isVid = selected.type.startsWith('video/');
        const isImg = selected.type.startsWith('image/');

        if (!isVid && !isImg) {
            toast.error("Unsupported file type. Please select an image or video.");
            return;
        }

        if (isVid) {
            // Check video duration on client before loading
            const videoElem = document.createElement('video');
            videoElem.preload = 'metadata';
            videoElem.onloadedmetadata = () => {
                window.URL.revokeObjectURL(videoElem.src);
                if (videoElem.duration > 60) {
                    toast.error(`Video is ${Math.round(videoElem.duration)}s long. Video stories must be 60 seconds or shorter.`);
                    return;
                }
                setFile(selected);
                setMediaType('video');
            };
            videoElem.onerror = () => {
                toast.error("Could not load video metadata.");
            };
            videoElem.src = URL.createObjectURL(selected);
        } else {
            setFile(selected);
            setMediaType('image');
        }
    };

    const addText = () => {
        if (!textInput.trim()) return;
        setOverlays(prev => [
            ...prev,
            {
                id: Date.now(),
                type: 'text',
                content: textInput,
                x: 50,
                y: 50,
                color: textColor
            }
        ]);
        setTextInput('');
        setShowTextInput(false);
        setTextColor('#ffffff');
    };

    const addSticker = (emoji) => {
        setOverlays(prev => [
            ...prev,
            {
                id: Date.now(),
                type: 'sticker',
                content: emoji,
                x: 50,
                y: 50
            }
        ]);
        setShowStickerPicker(false);
    };

    const removeOverlay = (id) => {
        setOverlays(prev => prev.filter(o => o.id !== id));
    };

    const handleDragStart = (e, id) => {
        setActiveOverlayId(id);
    };

    const handleDrag = (e) => {
        if (!activeOverlayId || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        let x = ((clientX - rect.left) / rect.width) * 100;
        let y = ((clientY - rect.top) / rect.height) * 100;

        x = Math.max(5, Math.min(95, x));
        y = Math.max(5, Math.min(95, y));

        setOverlays(prev => prev.map(o => o.id === activeOverlayId ? { ...o, x, y } : o));
    };

    const handleDragEnd = () => {
        setActiveOverlayId(null);
    };

    const handlePublish = async () => {
        if (!file && !previewUrl) {
            toast.error("Please select a photo or video for your story.");
            return;
        }

        setIsPublishing(true);
        const toastId = toast.loading("Publishing story...");

        try {
            let uploadedMediaUrl = typeof file === 'string' ? file : previewUrl;

            // 1. Upload file if it's a File object
            if (file instanceof File) {
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await axios.post(
                    getApiUrl('/api/upload?is_story=true&max_duration=60'),
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                uploadedMediaUrl = uploadRes.data.url;
            }

            // 2. Post Story
            const payload = {
                media_url: uploadedMediaUrl,
                media_type: mediaType,
                content: caption.trim() || undefined,
                music_url: selectedMusic?.url || undefined,
                overlays: overlays.length > 0 ? JSON.stringify(overlays) : undefined
            };

            await axios.post(getApiUrl('/api/social/stories'), payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            toast.success("Story posted successfully!", { id: toastId });
            if (onPublished) onPublished();
            if (onPost) onPost(payload);
            onClose();
        } catch (err) {
            console.error("Story publish failed:", err);
            const msg = err.response?.data?.detail || err.message || "Failed to publish story.";
            toast.error(msg, { id: toastId });
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-200">
            {/* Top Bar */}
            <div className="absolute top-0 w-full p-4 flex justify-between items-center z-30 bg-gradient-to-b from-black/80 to-transparent">
                <button
                    onClick={onClose}
                    disabled={isPublishing}
                    className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 backdrop-blur-md transition-colors"
                >
                    <X size={20} />
                </button>

                {previewUrl && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTextInput(true)}
                            className="p-2.5 text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold"
                        >
                            <Type size={16} /> Text
                        </button>
                        <button
                            onClick={() => setShowStickerPicker(!showStickerPicker)}
                            className="p-2.5 text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold"
                        >
                            <Smile size={16} /> Sticker
                        </button>
                        <button
                            onClick={() => setShowMusicPicker(!showMusicPicker)}
                            className={`p-2.5 text-white rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md ${selectedMusic ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`}
                        >
                            <Music size={16} /> {selectedMusic ? 'Music Added' : 'Music'}
                        </button>
                    </div>
                )}
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Main Stage */}
            <div
                ref={containerRef}
                onMouseMove={handleDrag}
                onTouchMove={handleDrag}
                onMouseUp={handleDragEnd}
                onTouchEnd={handleDragEnd}
                className="relative w-full max-w-sm h-[75vh] max-h-[680px] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/10 select-none"
            >
                {previewUrl ? (
                    mediaType === 'video' ? (
                        <video
                            src={previewUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    ) : (
                        <img
                            src={previewUrl}
                            className="w-full h-full object-cover"
                            alt="Story Preview"
                        />
                    )
                ) : (
                    /* Empty State: Prompt File Upload */
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                            <Upload size={32} />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">Select Media for Story</h3>
                        <p className="text-xs text-slate-400 max-w-[240px] mb-6">
                            Choose a photo or video from your device (videos up to 60s).
                        </p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm shadow-lg transition-transform hover:scale-105"
                        >
                            Browse Files
                        </button>
                    </div>
                )}

                {/* Overlays */}
                {overlays.map(overlay => (
                    <div
                        key={overlay.id}
                        onMouseDown={(e) => handleDragStart(e, overlay.id)}
                        onTouchStart={(e) => handleDragStart(e, overlay.id)}
                        className="absolute cursor-move select-none transform -translate-x-1/2 -translate-y-1/2 group touch-none"
                        style={{ left: `${overlay.x}%`, top: `${overlay.y}%`, color: overlay.color }}
                    >
                        <div className={overlay.type === 'text' ? 'text-2xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-5xl drop-shadow-lg'}>
                            {overlay.content}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); removeOverlay(overlay.id); }}
                            className="absolute -top-3 -right-3 text-white bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Sticker Picker */}
            {showStickerPicker && (
                <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-full max-w-xs bg-slate-900/95 backdrop-blur-md border border-white/20 p-4 rounded-2xl z-30 animate-in slide-in-from-bottom-5">
                    <div className="grid grid-cols-6 gap-3">
                        {STORY_STICKERS.map(emoji => (
                            <button key={emoji} onClick={() => addSticker(emoji)} className="text-2xl hover:scale-125 transition-transform p-1">
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Music Picker */}
            {showMusicPicker && (
                <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-full max-w-xs bg-slate-900/95 backdrop-blur-md border border-white/20 p-4 rounded-2xl z-30 animate-in slide-in-from-bottom-5">
                    <h3 className="text-white font-bold mb-3 text-xs flex items-center gap-2"><Music size={14} /> Select Music Track</h3>
                    <div className="space-y-1.5">
                        {MOCK_MUSIC_TRACKS.map(track => (
                            <div
                                key={track.id}
                                onClick={() => { setSelectedMusic(track); setShowMusicPicker(false); }}
                                className={`p-2.5 rounded-xl cursor-pointer flex justify-between items-center transition-colors text-xs ${selectedMusic?.id === track.id ? 'bg-blue-600 text-white font-bold' : 'hover:bg-white/10 text-slate-300'}`}
                            >
                                <span>{track.title}</span>
                                {selectedMusic?.id === track.id && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                            </div>
                        ))}
                        {selectedMusic && (
                            <button
                                onClick={() => { setSelectedMusic(null); setShowMusicPicker(false); }}
                                className="w-full text-center text-xs text-red-400 hover:text-red-300 pt-2 border-t border-white/10"
                            >
                                Remove Soundtrack
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Text Overlay Modal */}
            {showTextInput && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6">
                    <input
                        autoFocus
                        className="bg-transparent text-white text-3xl font-bold text-center border-none focus:ring-0 placeholder:text-white/30 w-full mb-6"
                        placeholder="Type text overlay..."
                        value={textInput}
                        style={{ color: textColor }}
                        onChange={e => setTextInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addText(); }}
                    />
                    <div className="flex gap-3 mb-6">
                        {STORY_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setTextColor(color)}
                                className={`w-7 h-7 rounded-full border-2 transition-transform ${textColor === color ? 'border-white scale-125' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowTextInput(false)} className="px-5 py-2 text-white/70 hover:text-white text-xs font-semibold">Cancel</button>
                        <button onClick={addText} className="px-6 py-2 bg-white text-black rounded-full font-bold text-xs hover:scale-105 transition-transform">Done</button>
                    </div>
                </div>
            )}

            {/* Bottom Bar: Caption & Share */}
            {previewUrl && (
                <div className="w-full max-w-sm mt-3 px-4 flex flex-col gap-2">
                    <input
                        type="text"
                        placeholder="Add a caption... (optional)"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/10 border border-white/15 rounded-full text-white placeholder:text-white/40 text-xs focus:bg-white/20 focus:outline-none"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isPublishing}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold text-xs transition-colors flex items-center gap-1.5"
                        >
                            <ImageIcon size={14} /> Change
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                            {isPublishing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" /> Sharing...
                                </>
                            ) : (
                                <>
                                    <Send size={16} /> Share to Story
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoryEditor;
