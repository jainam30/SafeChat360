import React, { useRef, useEffect, useState } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, Minimize2, Video as VideoIcon } from 'lucide-react';
import { useCall } from '../context/CallContext';

const CallModal = ({ onClose, onMinimize }) => {
    const {
        status,
        localStream,
        remoteStream,
        micEnabled,
        videoEnabled,
        error,
        acceptCall,
        rejectCall,
        endCall,
        toggleMic,
        toggleVideo,
        callData
    } = useCall();

    const { isIncoming, caller, targetUser } = callData || {};

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const dragRef = useRef(null);

    // Draggable State
    const [position, setPosition] = useState({ x: 0, y: 0 });
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
        if (localStream && localVideoRef.current) localVideoRef.current.srcObject = localStream;
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    }, [remoteStream]);

    const getStatusText = () => {
        switch (status) {
            case 'incoming': return 'Incoming Call...';
            case 'calling': return 'Calling...';
            case 'ringing': return 'Ringing...';
            case 'connecting': return 'Connecting...';
            case 'connected': return 'Connected';
            case 'ended': return 'Call Ended';
            case 'rejected': return 'Call Rejected';
            case 'busy': return 'User Busy';
            default: return status;
        }
    };

    const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().length > 0;
    const showOverlay = !hasRemoteVideo || status !== 'connected';

    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center animate-in fade-in duration-300">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyber-primary/20 via-purple-900/20 to-black pointer-events-none"></div>

            {/* Controls Overlay */}
            <div className="absolute top-4 right-4 z-50 flex gap-4">
                <button onClick={onMinimize} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                    <Minimize2 size={24} />
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="absolute top-4 left-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                    {error}
                </div>
            )}

            {/* Overlay: Avatar & Name (Visible if NO remote video or NOT connected) */}
            {showOverlay && (
                <div className="absolute top-20 text-center z-10 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyber-primary to-purple-600 flex items-center justify-center text-4xl font-bold text-white mb-4 border-4 border-white/10 shadow-lg relative">
                        {(isIncoming ? caller?.profile_photo : targetUser?.profile_photo) ? (
                            <img src={isIncoming ? caller.profile_photo : targetUser.profile_photo} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <span>{isIncoming ? caller?.username[0] : targetUser?.username[0]}</span>
                        )}
                        {['incoming', 'calling'].includes(status) && <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-20"></div>}
                    </div>
                    <h2 className="text-3xl font-bold text-white">{isIncoming ? caller?.username : targetUser?.username}</h2>
                    {/* Hide status text if connected (per user request) */}
                    {status !== 'connected' && (
                        <p className="text-cyber-primary font-medium tracking-widest text-sm mt-2 uppercase animate-pulse">{getStatusText()}</p>
                    )}
                </div>
            )}

            {/* Main Video Area */}
            <div className="relative w-full text-white h-full flex items-center justify-center">
                {remoteStream && (
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                )}
            </div>

            {/* Draggable Local Video (PiP) */}
            {localStream && (
                <div
                    ref={dragRef}
                    onMouseDown={handleMouseDown}
                    className="absolute w-32 h-44 md:w-48 md:h-64 bg-black rounded-lg overflow-hidden border border-white/20 shadow-2xl cursor-move z-40 hover:scale-105 transition-transform"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        bottom: '100px',
                        right: '20px' // Initial Position
                    }}
                >
                    <video ref={localVideoRef} muted autoPlay playsInline className={`w-full h-full object-cover ${!videoEnabled ? 'hidden' : ''}`} />
                    {!videoEnabled && <div className="w-full h-full flex items-center justify-center bg-gray-900"><VideoOff /></div>}
                </div>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-10 flex items-center gap-6 z-50">
                {status === 'incoming' ? (
                    <>
                        <button onClick={rejectCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg"><PhoneOff size={28} /></button>
                        <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg animate-bounce"><Phone size={28} /></button>
                    </>
                ) : (
                    <>
                        <button onClick={toggleMic} className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${micEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500'}`}>
                            {micEnabled ? <Mic /> : <MicOff />}
                        </button>
                        <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg"><PhoneOff size={32} /></button>
                        <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${videoEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500'}`}>
                            {videoEnabled ? <VideoIcon /> : <VideoOff />}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default CallModal;

