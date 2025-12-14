import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, X } from 'lucide-react';

const CallModal = ({ isIncoming, caller, targetUser, socket, onClose, user, isVideo = true, offerData }) => {
    const [status, setStatus] = useState(isIncoming ? 'incoming' : 'calling');
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [micEnabled, setMicEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(isVideo);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const localStreamRef = useRef(null); // Ref to hold stream for cleanup

    const servers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
        ]
    };

    // Update Ref when state changes
    useEffect(() => {
        localStreamRef.current = localStream;
    }, [localStream]);

    useEffect(() => {
        // Initialize Media
        const startMedia = async () => {
            try {
                console.log("Requesting user media...");
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: isVideo,
                    audio: true
                });
                console.log("User media obtained", stream.id);
                setLocalStream(stream);
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Failed to get media", err);
                alert("Could not access camera/microphone. Please check permissions.");
                onClose(); // Close immediately if no media
            }
        };

        if (status !== 'incoming') {
            startMedia();
        }

        // Cleanup function
        return () => {
            console.log("CallModal unmounting, cleaning up...");
            // Stop tracks using Ref
            if (localStreamRef.current) {
                console.log("Stopping local tracks...");
                localStreamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log(`Stopped track: ${track.kind}`);
                });
            }
            if (peerConnection.current) {
                console.log("Closing PeerConnection");
                peerConnection.current.close();
            }
        };
    }, []);

    useEffect(() => {
        if (localStream && status === 'calling') {
            console.log("Local stream ready, creating offer...");
            createOffer();
        }
    }, [localStream, status]);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("CallModal received signal:", data.type);

                if (data.type === 'call-response') {
                    if (data.response === 'accept') {
                        console.log("Call Accepted by remote");
                        setStatus('connecting');
                    } else {
                        console.log("Call Rejected by remote");
                        setStatus('ended');
                        setTimeout(onClose, 2000);
                    }
                } else if (data.type === 'offer') {
                    // We handle this via props (isIncoming), but if we get a re-offer?
                    console.log("Received Offer during call (Renegotiation not implemented)");
                } else if (data.type === 'answer') {
                    console.log("Received Answer");
                    if (peerConnection.current) {
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        console.log("Remote Description Set (Answer)");
                    }
                } else if (data.type === 'ice-candidate') {
                    console.log("Received ICE Candidate");
                    if (peerConnection.current) {
                        try {
                            await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                            console.log("Added ICE Candidate");
                        } catch (e) {
                            console.error("Error adding received ice candidate", e);
                        }
                    }
                }
            } catch (e) {
                console.error("Signal handling error", e);
            }
        };

        socket.addEventListener('message', handleMessage);

        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket]); // Removed status/localStream dependencies to avoid re-attaching listener needlessly

    const createPeerConnection = () => {
        console.log("Creating RTCPeerConnection");
        const pc = new RTCPeerConnection(servers);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE Candidate");
                socket.send(JSON.stringify({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    receiver_id: isIncoming ? caller.id : targetUser.id
                }));
            }
        };

        pc.ontrack = (event) => {
            console.log("Remote track received");
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        peerConnection.current = pc;
        return pc;
    };

    const createOffer = async () => {
        try {
            const pc = createPeerConnection();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log("Offer created and sent");

            socket.send(JSON.stringify({
                type: 'offer',
                sdp: offer,
                sender_id: user.id,
                receiver_id: targetUser.id,
                isVideo
            }));
        } catch (e) {
            console.error("Create Offer Failed", e);
        }
    };

    const acceptCall = async () => {
        console.log("Accepting call...");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideo,
                audio: true
            });
            console.log("Receiver media obtained");
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            setStatus('connecting');

            const pc = createPeerConnection();

            if (offerData && offerData.sdp) {
                console.log("Setting Remote Description (Offer)");
                await pc.setRemoteDescription(new RTCSessionDescription(offerData.sdp));

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                console.log("Answer created and sent");

                socket.send(JSON.stringify({
                    type: 'answer',
                    sdp: answer,
                    sender_id: user.id,
                    receiver_id: caller.id
                }));
            } else {
                console.error("No offer data found");
            }
        } catch (e) {
            console.error("Accept call failed", e);
        }
    };

    const rejectCall = () => {
        console.log("Rejecting call");
        socket.send(JSON.stringify({
            type: 'call-response',
            response: 'reject',
            receiver_id: caller.id
        }));
        onClose();
    };

    const endCall = () => {
        console.log("Ending call manually");
        if (peerConnection.current) peerConnection.current.close();

        // Stop tracks immediately here too
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        onClose();
    };

    const toggleMic = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !micEnabled);
            setMicEnabled(!micEnabled);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !videoEnabled);
            setVideoEnabled(!videoEnabled);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center">
            {/* Status Header */}
            <div className="absolute top-10 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyber-primary to-purple-600 flex items-center justify-center text-4xl font-bold text-white mb-4 mx-auto border-4 border-white/10 shadow-lg shadow-cyber-primary/50">
                    {isIncoming ? caller?.username.charAt(0).toUpperCase() : targetUser?.username.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold text-white">
                    {isIncoming ? caller?.username : targetUser?.username}
                </h2>
                <p className="text-cyber-primary animate-pulse uppercase tracking-widest text-sm mt-2">
                    {status === 'incoming' ? 'Incoming Call...' : status === 'calling' ? 'Calling...' : status === 'connecting' ? 'Connecting...' : status === 'ended' ? 'Call Ended' : 'Connected'}
                </p>
                {/* Debug Info (Optional, hidden in prod but useful now) */}
                <div className="text-[10px] text-gray-500 mt-2 font-mono">
                    {peerConnection.current?.connectionState} | {peerConnection.current?.iceConnectionState}
                </div>
            </div>

            {/* Video Area */}
            <div className="relative w-full max-w-4xl h-[60vh] flex items-center justify-center p-4">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain rounded-2xl bg-black"
                    />
                ) : (
                    <div className="text-white/20 text-4xl animate-pulse">
                        {status === 'connected' ? 'Waiting for video...' : '...'}
                    </div>
                )}

                {/* Local Video (PiP) */}
                <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-900">
                    <video
                        ref={localVideoRef}
                        muted
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-10 flex items-center gap-6">
                {status === 'incoming' ? (
                    <>
                        <button onClick={rejectCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110">
                            <PhoneOff size={32} />
                        </button>
                        <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 animate-bounce">
                            <Phone size={32} />
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={toggleMic} className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all ${micEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/80'}`}>
                            {micEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                        </button>
                        <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all ${videoEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/80'}`}>
                            {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                        </button>
                        <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110">
                            <PhoneOff size={32} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default CallModal;
