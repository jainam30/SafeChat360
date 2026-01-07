import { useState, useEffect, useRef, useCallback } from 'react';

const SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

export const useWebRTC = ({ user, socket, isIncoming, isVideo, caller, targetUser, offerData, onClose }) => {
    const [status, setStatus] = useState(isIncoming ? 'incoming' : 'calling'); // calling, ringing, connecting, connected, ended
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [micEnabled, setMicEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(isVideo);
    const [error, setError] = useState(null);

    const peerConnection = useRef(null);
    const localStreamRef = useRef(null);
    const candidatesQueue = useRef([]);

    // Initialize PeerConnection
    const createPeerConnection = useCallback(() => {
        if (peerConnection.current) return peerConnection.current;

        console.log("Creating RTCPeerConnection");
        const pc = new RTCPeerConnection(SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    receiver_id: isIncoming ? caller.id : targetUser.id
                }));
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE State:", pc.iceConnectionState);
            if (pc.iceConnectionState === 'disconnected') {
                // Potential network blip, handle or warn
            } else if (pc.iceConnectionState === 'failed') {
                setError("Connection failed");
                endCall();
            }
        };

        pc.connectionstatechange = () => {
            console.log("Connection State:", pc.connectionState);
            if (pc.connectionState === 'connected') {
                setStatus('connected');
            }
        };

        pc.ontrack = (event) => {
            console.log("Remote track received", event.streams[0]);
            setRemoteStream(event.streams[0]);
        };

        peerConnection.current = pc;
        return pc;
    }, [isIncoming, caller, targetUser, socket]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            endCall();
        };
    }, []);

    // Get Local Media
    useEffect(() => {
        let mounted = true;

        const startMedia = async () => {
            if (status === 'incoming') return; // Wait until accept

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: isVideo,
                    audio: true
                });

                if (!mounted) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                console.log("Got local media", stream.id);
                setLocalStream(stream);
                localStreamRef.current = stream;

                if (status === 'calling') {
                    // Start the offer process
                    createOffer(stream);
                }

            } catch (err) {
                console.error("Media Error:", err);
                setError("Could not access camera/microphone.");
                // setTimeout(onClose, 2000);
            }
        };

        startMedia();

        return () => {
            mounted = false;
        };
    }, [status, isVideo]); // Run when status changes to 'calling' (initial) or accepted

    // Socket Signal Handler
    useEffect(() => {
        if (!socket) return;

        const handleMessage = async (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'call-response') {
                    if (data.response === 'accept') {
                        setStatus('connecting');
                    } else if (data.response === 'reject') {
                        setStatus('rejected');
                        setTimeout(onClose, 2000);
                    } else if (data.response === 'busy') {
                        setStatus('busy');
                        setTimeout(onClose, 2000);
                    }
                }

                else if (data.type === 'offer') {
                    // Renegotiation support
                    console.log("Received renegotiation offer");
                    if (peerConnection.current) {
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        const answer = await peerConnection.current.createAnswer();
                        await peerConnection.current.setLocalDescription(answer);

                        socket.send(JSON.stringify({
                            type: 'answer',
                            sdp: answer,
                            sender_id: user.id,
                            receiver_id: data.sender_id
                        }));
                    }
                }

                else if (data.type === 'answer') {
                    if (peerConnection.current) {
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        // Flush candidates
                        while (candidatesQueue.current.length) {
                            const cand = candidatesQueue.current.shift();
                            await peerConnection.current.addIceCandidate(cand);
                        }
                    }
                }

                else if (data.type === 'ice-candidate') {
                    if (peerConnection.current && peerConnection.current.remoteDescription) {
                        try {
                            await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                        } catch (e) { console.error("Error adding ice", e); }
                    } else {
                        // Queue it
                        candidatesQueue.current.push(new RTCIceCandidate(data.candidate));
                    }
                }

            } catch (e) {
                console.error("Signal Error:", e);
            }
        };

        socket.addEventListener('message', handleMessage);
        return () => socket.removeEventListener('message', handleMessage);
    }, [socket, onClose]);


    const createOffer = async (stream) => {
        const pc = createPeerConnection();

        // Add tracks
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'offer',
                    sdp: offer,
                    sender_id: user.id,
                    receiver_id: targetUser.id,
                    isVideo
                }));
            } else {
                console.error("Socket not connected, cannot send offer");
                setError("Connection lost. Cannot start call.");
            }
        } catch (e) {
            console.error("Create Offer Failed", e);
            setError("Failed to start call");
        }
    };

    const acceptCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideo,
                audio: true
            });

            setLocalStream(stream);
            localStreamRef.current = stream;
            setStatus('connecting');

            const pc = createPeerConnection();

            // Add tracks
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            if (offerData && offerData.sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription(offerData.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: 'answer',
                        sdp: answer,
                        sender_id: user.id,
                        receiver_id: caller.id
                    }));
                } else {
                    console.error("Socket not connected, cannot send answer");
                    setError("Connection lost.");
                }

                // Flush candidates
                while (candidatesQueue.current.length) {
                    const cand = candidatesQueue.current.shift();
                    await pc.addIceCandidate(cand);
                }
            }

        } catch (e) {
            console.error("Accept Call Failed", e);
            setError("Failed to accept call");
        }
    };

    const rejectCall = () => {
        if (socket && caller && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'call-response',
                response: 'reject',
                receiver_id: caller.id
            }));
        }
        onClose();
    };

    const endCall = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        onClose();
    };

    const toggleMic = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !micEnabled);
            setMicEnabled(!micEnabled);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !videoEnabled);
            setVideoEnabled(!videoEnabled);
        }
    };

    return {
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
    };
};
