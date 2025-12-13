import React, { useState, useRef, useEffect } from 'react';
import { X, Type, Smile, Music, Send, Trash2, Move } from 'lucide-react';

const MOCK_MUSIC_TRACKS = [
    { id: '1', title: 'Cyber Pulse', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: '2', title: 'Neon Dreams', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: '3', title: 'Night Drive', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const StoryEditor = ({ mediaFile, mediaType, onClose, onPost }) => {
    const [overlays, setOverlays] = useState([]);
    const [selectedMusic, setSelectedMusic] = useState(null);
    const [showMusicPicker, setShowMusicPicker] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [showTextInput, setShowTextInput] = useState(false);
    const [activeOverlayId, setActiveOverlayId] = useState(null);
    const containerRef = useRef(null);

    // Initial preview URL
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (mediaFile) { // If it's a blob/file
            // If it's already a base64 string (from Dashboard), use it.
            // Current Dashboard logic reads it as base64 string.
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
            color: '#ffffff'
        };
        setOverlays([...overlays, newOverlay]);
        setTextInput('');
        setShowTextInput(false);
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
            <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/50 to-transparent">
                <button onClick={onClose} className="text-white hover:bg-white/10 p-2 rounded-full"><X /></button>
                <div className="flex gap-4">
                    <button onClick={() => setShowTextInput(true)} className="text-white hover:text-cyber-primary"><Type /></button>
                    <button onClick={() => addSticker('🔥')} className="text-white hover:text-yellow-400"><Smile /></button>
                    <button onClick={() => setShowMusicPicker(!showMusicPicker)} className={`p-2 rounded-full ${selectedMusic ? 'text-cyber-primary bg-white/10' : 'text-white'}`}><Music /></button>
                </div>
            </div>

            {/* Editor Canvas */}
            <div
                ref={containerRef}
                className="relative w-full max-w-md aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden"
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
                        className="absolute cursor-move select-none transform -translate-x-1/2 -translate-y-1/2 group"
                        style={{ left: `${overlay.x}%`, top: `${overlay.y}%` }}
                    >
                        <div className={`
                 ${overlay.type === 'text' ? 'text-xl font-bold text-white drop-shadow-md bg-black/30 px-2 rounded' : 'text-5xl drop-shadow-lg'}
              `}>
                            {overlay.content}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); removeOverlay(overlay.id); }}
                            className="absolute -top-4 -right-4 text-red-500 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Music Picker Overlay */}
            {showMusicPicker && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm bg-black/90 border border-white/20 p-4 rounded-xl z-30">
                    <h3 className="text-white font-bold mb-2 text-sm">Select Music</h3>
                    <div className="space-y-2">
                        {MOCK_MUSIC_TRACKS.map(track => (
                            <div key={track.id}
                                onClick={() => { setSelectedMusic(track); setShowMusicPicker(false); }}
                                className={`p-2 rounded cursor-pointer flex justify-between items-center ${selectedMusic?.id === track.id ? 'bg-cyber-primary text-white' : 'hover:bg-white/10 text-white/70'}`}
                            >
                                <span>{track.title}</span>
                                {selectedMusic?.id === track.id && <Music size={14} />}
                            </div>
                        ))}
                        <div
                            onClick={() => { setSelectedMusic(null); setShowMusicPicker(false); }}
                            className="p-2 text-red-400 hover:bg-white/10 rounded cursor-pointer text-sm"
                        >
                            Remove Music
                        </div>
                    </div>
                </div>
            )}

            {/* Text Input Overlay */}
            {showTextInput && (
                <div className="absolute inset-0 bg-black/80 z-40 flex items-center justify-center">
                    <input
                        autoFocus
                        className="bg-transparent text-white text-3xl font-bold text-center border-none focus:ring-0 placeholder:text-white/30"
                        placeholder="Type something..."
                        value={textInput}
                        onChange={e => setTextInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addText(); }}
                    />
                    <button onClick={addText} className="absolute right-4 top-1/2 text-white bg-cyber-primary px-4 py-2 rounded-full">Done</button>
                    <button onClick={() => setShowTextInput(false)} className="absolute top-4 right-4 text-white"><X /></button>
                </div>
            )}

            {/* Bottom Bar */}
            <div className="absolute bottom-0 w-full p-4 z-20 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
                <button
                    onClick={() => onPost({ music_url: selectedMusic?.url, overlays: JSON.stringify(overlays) })}
                    className="w-full max-w-sm bg-cyber-primary hover:bg-cyber-secondary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                    <Send size={18} /> Share Story
                </button>
            </div>

        </div>
    );
};

export default StoryEditor;
