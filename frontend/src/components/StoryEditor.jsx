import React, { useState, useRef, useEffect } from 'react';
import { X, Type, Smile, Music, Send, Trash2, Move } from 'lucide-react';

const MOCK_MUSIC_TRACKS = [
    { id: '1', title: 'Cyber Pulse', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: '2', title: 'Neon Dreams', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: '3', title: 'Night Drive', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const STORY_COLORS = ['#ffffff', '#000000', '#ff0055', '#00ccff', '#ffcc00', '#33ff00'];
const STORY_STICKERS = ['🔥', '😂', '😍', '🎉', '📍', '🙌', '👀', '💯', '🤔', '😎', '🍕', '✈️'];

const StoryEditor = ({ mediaFile, mediaType, onClose, onPost }) => {
    const [overlays, setOverlays] = useState([]);
    const [selectedMusic, setSelectedMusic] = useState(null);
    const [showMusicPicker, setShowMusicPicker] = useState(false);

    // Text State
    const [textInput, setTextInput] = useState('');
    const [showTextInput, setShowTextInput] = useState(false);
    const [textColor, setTextColor] = useState('#ffffff');

    // Sticker State
    const [showStickerPicker, setShowStickerPicker] = useState(false);

    const [activeOverlayId, setActiveOverlayId] = useState(null);
    const containerRef = useRef(null);

    // Initial preview URL
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (mediaFile) {
            setPreviewUrl(mediaFile);
        }
    }, [mediaFile]);

    const addText = () => {
        if (!textInput.trim()) return;
        const newOverlay = {
            id: Date.now(),
            type: 'text',
            content: textInput,
            x: 50, // Percent
            y: 50, // Percent
            color: textColor
        };
        setOverlays([...overlays, newOverlay]);
        setTextInput('');
        setShowTextInput(false);
        setTextColor('#ffffff'); // Reset
    };

    const addSticker = (emoji) => {
        const newOverlay = {
            id: Date.now(),
            type: 'sticker',
            content: emoji,
            x: 50,
            y: 50
        };
        setOverlays([...overlays, newOverlay]);
        setShowStickerPicker(false);
    };

    const removeOverlay = (id) => {
        setOverlays(overlays.filter(o => o.id !== id));
    };

    // Simple Drag Logic (Touch/Mouse)
    const handleDragStart = (e, id) => {
        setActiveOverlayId(id);
    };

    const handleDrag = (e) => {
        if (!activeOverlayId || !containerRef.current) return;
        // Calculate new position percentage relative to container
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        let x = ((clientX - rect.left) / rect.width) * 100;
        let y = ((clientY - rect.top) / rect.height) * 100;

        // Clamp
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        setOverlays(prev => prev.map(o => o.id === activeOverlayId ? { ...o, x, y } : o));
    };

    const handleDragEnd = () => {
        setActiveOverlayId(null);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in duration-200">

            {/* Top Bar */}
            <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent">
                <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"><X size={28} /></button>
                <div className="flex gap-6">
                    <button onClick={() => setShowTextInput(true)} className="text-white hover:text-cyber-primary hover:scale-110 transition-transform"><Type size={28} /></button>
                    <button onClick={() => { setShowStickerPicker(!showStickerPicker); setShowMusicPicker(false); }} className={`hover:scale-110 transition-transform ${showStickerPicker ? 'text-yellow-400' : 'text-white'}`}><Smile size={28} /></button>
                    <button onClick={() => { setShowMusicPicker(!showMusicPicker); setShowStickerPicker(false); }} className={`p-2 rounded-full hover:scale-110 transition-transform ${selectedMusic ? 'text-cyber-primary bg-white/10' : 'text-white'}`}><Music size={28} /></button>
                </div>
            </div>

            {/* Editor Canvas */}
            <div
                ref={containerRef}
                className="relative w-full max-w-md aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-white/5"
                onMouseMove={handleDrag}
                onMouseUp={handleDragEnd}
                onTouchMove={handleDrag}
                onTouchEnd={handleDragEnd}
            >
                {mediaType === 'video' ? (
                    <video src={previewUrl} className="w-full h-full object-cover" autoPlay loop muted />
                ) : (
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
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
                        <div className={`
                 ${overlay.type === 'text' ? 'text-2xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-6xl drop-shadow-lg'}
              `}>
                            {overlay.content}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); removeOverlay(overlay.id); }}
                            className="absolute -top-6 -right-6 text-white bg-red-500 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Sticker Picker Overlay */}
            {showStickerPicker && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm bg-black/90 backdrop-blur-md border border-white/20 p-4 rounded-xl z-30 animate-in slide-in-from-bottom-5">
                    <div className="grid grid-cols-6 gap-4">
                        {STORY_STICKERS.map(emoji => (
                            <button key={emoji} onClick={() => addSticker(emoji)} className="text-3xl hover:scale-125 transition-transform">
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Music Picker Overlay */}
            {showMusicPicker && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm bg-black/90 backdrop-blur-md border border-white/20 p-4 rounded-xl z-30 animate-in slide-in-from-bottom-5">
                    <h3 className="text-white font-bold mb-3 text-sm flex items-center gap-2"><Music size={14} /> Select Soundtrack</h3>
                    <div className="space-y-2">
                        {MOCK_MUSIC_TRACKS.map(track => (
                            <div key={track.id}
                                onClick={() => { setSelectedMusic(track); setShowMusicPicker(false); }}
                                className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${selectedMusic?.id === track.id ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : 'hover:bg-white/10 text-white/80'}`}
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{track.title}</span>
                                    <span className="text-[10px] opacity-70">Artist Name</span>
                                </div>
                                {selectedMusic?.id === track.id && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
                            </div>
                        ))}
                        {selectedMusic && (
                            <div
                                onClick={() => { setSelectedMusic(null); setShowMusicPicker(false); }}
                                className="p-2 text-red-400 hover:bg-white/10 rounded cursor-pointer text-xs text-center mt-2 border-t border-white/10 pt-3"
                            >
                                Remove Music
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Text Input Overlay */}
            {showTextInput && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center">
                    <input
                        autoFocus
                        className="bg-transparent text-white text-4xl font-bold text-center border-none focus:ring-0 placeholder:text-white/30 w-full mb-8 px-4"
                        placeholder="Type something..."
                        value={textInput}
                        style={{ color: textColor }}
                        onChange={e => setTextInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addText(); }}
                    />

                    {/* Color Picker */}
                    <div className="flex gap-4 mb-8">
                        {STORY_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setTextColor(color)}
                                className={`w-8 h-8 rounded-full border-2 ease-in-out duration-200 ${textColor === color ? 'border-white scale-125' : 'border-transparent hover:scale-110'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setShowTextInput(false)} className="px-6 py-2 text-white/70 hover:text-white font-medium">Cancel</button>
                        <button onClick={addText} className="px-8 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">Done</button>
                    </div>
                </div>
            )}

            {/* Bottom Bar */}
            <div className="absolute bottom-0 w-full p-4 z-20 bg-gradient-to-t from-black/80 to-transparent flex justify-center pb-8">
                <button
                    onClick={() => onPost({ music_url: selectedMusic?.url, overlays: JSON.stringify(overlays) })}
                    className="w-full max-w-xs bg-white text-black py-3.5 rounded-full font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:scale-105 transition-all text-sm"
                >
                    <Send size={18} /> Share to Story
                </button>
            </div>

        </div>
    );
};

export default StoryEditor;
