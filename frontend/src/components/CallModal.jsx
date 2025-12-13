import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, X } from 'lucide-react';

const CallModal = ({ isIncoming, caller, targetUser, socket, onClose, user, isVideo = true, offerData }) => {
    const [status, setStatus] = useState(isIncoming ? 'incoming' : 'calling'); // calling, incoming, connecting, connected, ended
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [micEnabled, setMicEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(isVideo);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);

    const servers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, // Public Google STUN
            // In production, add TURN servers here
        ]
    };

    useEffect(() => {
        // Initialize Media
        const startMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: isVideo,
                    audio: true
                });
                setLocalStream(stream);
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Failed to get media", err);
                endCall();
            }
        };

        if (status !== 'incoming') {
            startMedia();
        }

        // Cleanup
        return () => {
            // Stop tracks
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnection.current) {
                peerConnection.current.close();
            }
        };
    }, []);

    useEffect(() => {
        if (localStream && status === 'calling') {
            createOffer();
        }
    }, [localStream, status]);

    useEffect(() => {
        // Handle Socket Events for Signaling
        if (!socket) return;

        const handleMessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'call-response') {
                if (data.response === 'accept') {
                    setStatus('connecting');
                } else {
                    setStatus('ended');
                    setTimeout(onClose, 2000);
                }
            } else if (data.type === 'offer') {
                // Should not happen here if we are caller, but if we are receiver...
                if (status === 'incoming') {
                    // We handle offer in 'acceptCall'
                }
            } else if (data.type === 'answer') {
                if (peerConnection.current) {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
                }
            } else if (data.type === 'ice-candidate') {
                if (peerConnection.current) {
                    try {
                        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } catch (e) { console.error("Error adding received ice candidate", e); }
                }
            }
        };

        // We need to attach this listener. 
        // Problem: Chat.jsx might already have a listener. 
        // We should pass a way to hook into socket or Chat.jsx should pass messages down.
        // For simplicity, let's assume Chat.jsx delegates signaling messages to us or we add a second listener (WebSocket allows multiple onmessage? No, only one).
        // Best approach: Chat.jsx handles 'onmessage' and passes relevant data to CallModal via props or Ref.
        // Or we use `addEventListener` if using native WS object (it supports multiple).
        socket.addEventListener('message', handleMessage);

        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket, status, localStream]);


    const createPeerConnection = () => {
        const pc = new RTCPeerConnection(servers);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    receiver_id: isIncoming ? caller.id : targetUser.id
                }));
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        peerConnection.current = pc;
        return pc;
    };

    const createOffer = async () => {
        const pc = createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.send(JSON.stringify({
            type: 'offer',
            sdp: offer,
            sender_id: user.id,
            receiver_id: targetUser.id,
            isVideo
        }));
    };

    const acceptCall = async () => {
        // Start media first
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideo,
                audio: true
            });
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            setStatus('connecting');

            // Initialize PC
            const pc = createPeerConnection();

            // Set Remote Description (The Offer)
            if (offerData && offerData.sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription(offerData.sdp));

                // Create Answer
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                // Send Answer
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

    // FIX: logic for accepting is tricky if we don't have the offer stored.
    // Let's refine: Chat.jsx receives 'offer'. It opens Modal(isIncoming=true, offerData=offer).
    // Modal 'acceptCall':
    // 1. Get user media.
    // 2. Create PC.
    // 3. pc.setRemoteDescription(offerData.sdp)
    // 4. pc.createAnswer() -> setLocal -> send Answer.

    // We will update the logic below in `acceptCall` assuming `offerData` prop.

    const rejectCall = () => {
        socket.send(JSON.stringify({
            type: 'call-response',
            response: 'reject',
            receiver_id: caller.id
        }));
        onClose();
    };

    const endCall = () => {
        if (peerConnection.current) peerConnection.current.close();
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

    // Render based on status
    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center">
            {/* Status Header */}
            <div className="absolute top-10 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyber-primary to-purple-600 flex items-center justify-center text-4xl font-bold text-white mb-4 mx-auto border-4 border-white/10 shadow-lg shadow-cyber-primary/50">
                    {isIncoming ? caller.username.charAt(0).toUpperCase() : targetUser.username.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold text-white">
                    {isIncoming ? caller.username : targetUser.username}
                </h2>
                <p className="text-cyber-primary animate-pulse uppercase tracking-widest text-sm mt-2">
                    {status === 'incoming' ? 'Incoming Call...' : status === 'calling' ? 'Calling...' : status === 'connecting' ? 'Connecting...' : 'Connected'}
                </p>
            </div>

            {/* Video Area */}
            <div className="relative w-full max-w-4xl h-[60vh] flex items-center justify-center p-4">
                {/* Remote Video */}
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain rounded-2xl bg-black"
                    />
                ) : (
                    <div className="text-white/20 text-4xl">Waiting for video...</div>
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
