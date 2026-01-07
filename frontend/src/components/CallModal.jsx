import React, { useRef, useEffect } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, X } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';

const CallModal = ({ isIncoming, caller, targetUser, socket, onClose, user, isVideo = true, offerData }) => {

    // Call Hook
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
        toggleVideo
    } = useWebRTC({ user, socket, isIncoming, isVideo, caller, targetUser, offerData, onClose });

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const ringtoneRef = useRef(null);

    // Audio Effects
    useEffect(() => {
        if (status === 'incoming' || status === 'calling' || status === 'ringing') {
            // Play simple ringtone loop if possible (browser policy might block autoplay)
            // ringtoneRef.current = new Audio('/sounds/ringtone.mp3'); // Example (needs file)
        }
    }, [status]);


    // Attach Streams to Video Elements
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);


    // Helper for Status Text
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

    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center animate-in fade-in duration-300">

            {/* Background Gradient Animation */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyber-primary/20 via-purple-900/20 to-black pointer-events-none"></div>

            {/* Error Message */}
            {error && (
                <div className="absolute top-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                    {error}
                </div>
            )}

            {/* Status Header */}
            <div className="absolute top-10 text-center z-10">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyber-primary to-purple-600 flex items-center justify-center text-4xl font-bold text-white mb-4 mx-auto border-4 border-white/10 shadow-lg shadow-cyber-primary/50 overflow-hidden relative group">
                    {/* Avatar Image if available */}
                    {(isIncoming ? caller?.profile_photo : targetUser?.profile_photo) ? (
                        <img
                            src={isIncoming ? caller.profile_photo : targetUser.profile_photo}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span>{isIncoming ? caller?.username.charAt(0).toUpperCase() : targetUser?.username.charAt(0).toUpperCase()}</span>
                    )}

                    {/* Pulse Effect for Incoming/Calling */}
                    {(status === 'incoming' || status === 'calling') && (
                        <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-20"></div>
                    )}
                </div>

                <h2 className="text-3xl font-bold text-white drop-shadow-md">
                    {isIncoming ? caller?.username : targetUser?.username}
                </h2>
                <p className={`text-cyber-primary font-medium tracking-widest text-sm mt-2 uppercase ${['incoming', 'calling', 'connecting'].includes(status) ? 'animate-pulse' : ''}`}>
                    {getStatusText()}
                </p>
            </div>

            {/* Main Video Area */}
            <div className="relative w-full max-w-5xl h-[60vh] flex items-center justify-center p-4">

                {/* Remote Video */}
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain rounded-3xl bg-black/50 shadow-2xl border border-white/5"
                    />
                ) : (
                    <div className="text-white/20 text-4xl animate-pulse font-light">
                        {status === 'connected' ? 'Waiting for video...' : ''}
                    </div>
                )}

                {/* Local Video (PiP) - Only show if video enabled or active */}
                {localStream && (
                    <div className="absolute bottom-6 right-6 w-48 h-36 md:w-64 md:h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-900/50 backdrop-blur-sm transition-all hover:scale-105 cursor-pointer">
                        <video
                            ref={localVideoRef}
                            muted // Always mute local to prevent echo
                            autoPlay
                            playsInline
                            className={`w-full h-full object-cover ${!videoEnabled ? 'hidden' : ''}`}
                        />
                        {!videoEnabled && (
                            <div className="w-full h-full flex items-center justify-center text-white/50 bg-black/80">
                                <VideoOff size={32} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-10 flex items-center gap-6 z-20">
                {status === 'incoming' ? (
                    <>
                        <button onClick={rejectCall} className="group relative w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-xl transition-all hover:scale-110">
                            <PhoneOff size={32} fill="currentColor" />
                            <span className="absolute -bottom-8 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Decline</span>
                        </button>
                        <button onClick={acceptCall} className="group relative w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 animate-bounce-slow">
                            <Phone size={32} fill="currentColor" />
                            <span className="absolute -bottom-8 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Accept</span>
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={toggleMic} className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-lg backdrop-blur-md ${micEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}>
                            {micEnabled ? <Mic size={28} /> : <MicOff size={28} />}
                        </button>

                        <button onClick={endCall} className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-xl transition-all hover:scale-110">
                            <PhoneOff size={36} fill="currentColor" />
                        </button>

                        <button onClick={toggleVideo} className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-lg backdrop-blur-md ${videoEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}>
                            {videoEnabled ? <Video size={28} /> : <VideoOff size={28} />}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default CallModal;

