import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useCall } from '../context/CallContext';

const FloatingVideo = () => {
    const {
        callData,
        status,
        localStream,
        remoteStream,
        micEnabled,
        videoEnabled,
        toggleMic,
        toggleVideo,
        endCall,
        setIsMinimized
    } = useCall();

    const { isIncoming, caller, targetUser } = callData || {};
    const remoteVideoRef = useRef(null);
    const localVideoRef = useRef(null);

    // Draggable State
    const [position, setPosition] = useState({ x: window.innerWidth - 220, y: window.innerHeight - 320 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        isDragging.current = true;
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        setPosition({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Attach Streams
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    }, [remoteStream]);

    useEffect(() => {
        if (localStream && localVideoRef.current) localVideoRef.current.srcObject = localStream;
    }, [localStream]);

    if (!callData) return null;

    return (
        <div
            className="fixed z-[9999] w-48 h-[270px] bg-black rounded-xl overflow-hidden shadow-2xl border border-white/20 flex flex-col cursor-move hover:shadow-cyan-500/20 transition-shadow"
            style={{ left: position.x, top: position.y }}
            onMouseDown={handleMouseDown}
        >
            {/* Header / Controls */}
            <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center justify-end px-2 gap-2">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="p-1.5 rounded-full bg-black/40 hover:bg-white/20 text-white transition-colors"
                    title="Maximize"
                >
                    <Maximize2 size={14} />
                </button>
            </div>

            {/* Main Video (Remote) */}
            <div className="relative flex-1 bg-gray-900 flex items-center justify-center overflow-hidden">
                {remoteStream ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center justify-center text-white/50">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold mb-2">
                            {isIncoming ? caller?.username[0] : targetUser?.username[0]}
                        </div>
                        <span className="text-xs">{status}</span>
                    </div>
                )}
            </div>

            {/* Self Video (PiP) */}
            {localStream && (
                <div className="absolute bottom-16 right-2 w-16 h-24 bg-black rounded-lg border border-white/30 overflow-hidden shadow-lg z-10">
                    <video ref={localVideoRef} muted autoPlay playsInline className={`w-full h-full object-cover ${!videoEnabled ? 'hidden' : ''}`} />
                    {!videoEnabled && <div className="w-full h-full flex items-center justify-center bg-gray-800"><VideoOff size={12} className="text-white/50" /></div>}
                </div>
            )}

            {/* Bottom Controls */}
            <div className="h-14 bg-black/90 flex items-center justify-evenly border-t border-white/10 z-20">
                <button onClick={toggleMic} className={`p-2 rounded-full ${micEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                    {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
                <button onClick={() => endCall(true)} className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg">
                    <PhoneOff size={18} />
                </button>
                <button onClick={toggleVideo} className={`p-2 rounded-full ${videoEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                    {videoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                </button>
            </div>
        </div>
    );
};

export default FloatingVideo;
