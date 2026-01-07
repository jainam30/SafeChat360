import { useState, useEffect, useRef, useCallback } from 'react';

const SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

export const useWebRTC = ({ user, socket, isIncoming, isVideo, caller, targetUser, offerData, onClose }) => {
    // State
    const [status, setStatus] = useState(isIncoming ? 'incoming' : 'calling'); // calling, ringing, connecting, connected, ended
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [micEnabled, setMicEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(isVideo);
    const [error, setError] = useState(null);

    const peerConnection = useRef(null);
    const localStreamRef = useRef(null);
    const candidatesQueue = useRef([]);
    const noAnswerTimeout = useRef(null);

    // Audio Context for Beeps/Ringing (No external files needed)
    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);
    const gainNodeRef = useRef(null);
    const toneIntervalRef = useRef(null);

    // --- Sound Generators ---
    const stopAudio = () => {
        if (toneIntervalRef.current) clearInterval(toneIntervalRef.current);
        if (oscillatorRef.current) { try { oscillatorRef.current.stop(); } catch (e) { } oscillatorRef.current = null; }
        if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) { } audioCtxRef.current = null; }
    };

    const playCallingBeep = () => {
        stopAudio();
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        audioCtxRef.current = new AudioContext();

        const playBeep = () => {
            if (status !== 'calling' && status !== 'ringing') return;
            const osc = audioCtxRef.current.createOscillator();
            const gain = audioCtxRef.current.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, audioCtxRef.current.currentTime); // A4
            gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);

            osc.connect(gain);
            gain.connect(audioCtxRef.current.destination);

            osc.start();
            osc.stop(audioCtxRef.current.currentTime + 0.8); // Beep duration
        };

        playBeep(); // First one
        toneIntervalRef.current = setInterval(playBeep, 2000); // Loop every 2s
    };

    const playIncomingRing = () => {
        stopAudio();
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        audioCtxRef.current = new AudioContext();

        const playRing = () => {
            // Trill effect
            const now = audioCtxRef.current.currentTime;
            const osc = audioCtxRef.current.createOscillator();
            const gain = audioCtxRef.current.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.1);
            osc.frequency.linearRampToValueAtTime(600, now + 0.2);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 2); // Fade out

            osc.connect(gain);
            gain.connect(audioCtxRef.current.destination);

            osc.start();
            osc.stop(now + 2.5);
        };

        playRing();
        toneIntervalRef.current = setInterval(playRing, 3000); // Loop
    };

    // --- Sound Effect Trigger ---
    useEffect(() => {
        if (status === 'calling') {
            playCallingBeep();
        } else if (status === 'incoming') {
            playIncomingRing();
        } else {
            stopAudio(); // Stop sounds on connect, end, etc.
        }
        return () => stopAudio();
    }, [status]);

    // --- 20s Timeout ---
    useEffect(() => {
        if (status === 'calling') {
            noAnswerTimeout.current = setTimeout(() => {
                console.log("Call timed out (20s)");
                setError("No answer.");
                endCall(true); // Send hangup
            }, 20000);
        } else {
            if (noAnswerTimeout.current) clearTimeout(noAnswerTimeout.current);
        }
        return () => { if (noAnswerTimeout.current) clearTimeout(noAnswerTimeout.current); };
    }, [status]);


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
            if (pc.iceConnectionState === 'failed') {
                setError("Connection failed");
                endCall();
            }
        };

        pc.connectionstatechange = () => {
            console.log("Connection State:", pc.connectionState);
            if (pc.connectionState === 'connected') {
                setStatus('connected');
                stopAudio();
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
            endCall(false); // Clean exit
        };
    }, []);

    // Get Local Media
    useEffect(() => {
        let mounted = true;

        const startMedia = async () => {
            if (status === 'incoming') return;

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
                    createOffer(stream);
                }

            } catch (err) {
                console.error("Media Error:", err);
                setError("Could not access camera/microphone.");
            }
        };

        startMedia();

        return () => {
            mounted = false;
        };
    }, [status, isVideo]);

    // Socket Signal Handler
    useEffect(() => {
        if (!socket) return;

        const handleMessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                const pc = peerConnection.current;

                if (data.type === 'hang-up') {
                    console.log("Peer hung up");
                    setError("Call Ended");
                    setTimeout(() => onClose(), 1000);
                    stopAudio();
                    // Don't recurse endCall, just close local
                    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
                    if (pc) pc.close();
                }

                else if (data.type === 'call-response') {
                    if (data.response === 'reject') {
                        setStatus('rejected');
                        setTimeout(onClose, 2000);
                    } else if (data.response === 'busy') {
                        setStatus('busy');
                        setTimeout(onClose, 2000);
                    }
                }

                else if (data.type === 'offer') {
                    console.log("Received renegotiation offer");
                    if (pc && pc.signalingState === "stable") { // Prevent glare
                        // Set remote, create answer... (omitted for brevity, assume initial offer handled by parent or hook init)
                        // Actually this hook assumes it's already 'in call' if active.
                        // But for renegotiation:
                        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socket.send(JSON.stringify({
                            type: 'answer',
                            sdp: answer,
                            sender_id: user.id,
                            receiver_id: data.sender_id
                        }));
                    }
                }

                else if (data.type === 'answer') {
                    stopAudio(); // Stop beeping immediately
                    if (status === 'calling') setStatus('connecting'); // Clear timeout

                    if (pc && pc.signalingState === "have-local-offer") { // FIX: Only set remote if we are waiting for it
                        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        // Flush candidates
                        while (candidatesQueue.current.length) {
                            await pc.addIceCandidate(candidatesQueue.current.shift());
                        }
                    } else {
                        console.warn("Ignored Answer in wrong state:", pc?.signalingState);
                    }
                }

                else if (data.type === 'ice-candidate') {
                    if (pc && pc.remoteDescription) {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                        } catch (e) { console.error("Error adding ice", e); }
                    } else {
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
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

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
                setError("Connection lost.");
            }
        } catch (e) {
            console.error("Create Offer Failed", e);
            setError("Failed to start call");
        }
    };

    const acceptCall = async () => {
        try {
            stopAudio(); // Stop ringing
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideo,
                audio: true
            });

            setLocalStream(stream);
            localStreamRef.current = stream;
            setStatus('connecting');

            const pc = createPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            if (offerData && offerData.sdp) {
                if (pc.signalingState === "stable") {
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
                    }

                    while (candidatesQueue.current.length) {
                        await pc.addIceCandidate(candidatesQueue.current.shift());
                    }
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
        onClose(); // Just close, no hangup signal needed (call hasn't started)
    };

    // End call and notify peer
    const endCall = (notifyPeer = true) => {
        stopAudio();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        // Notify Peer
        if (notifyPeer && socket && socket.readyState === WebSocket.OPEN) {
            // Differentiate between outgoing cancel vs active hangup? Same signal is fine.
            const peerId = isIncoming ? caller?.id : targetUser?.id;
            if (peerId) {
                socket.send(JSON.stringify({
                    type: 'hang-up',
                    receiver_id: peerId
                }));
            }
        }

        onClose();
        setLocalStream(null);
        setRemoteStream(null);
    };

    const toggleMic = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !micEnabled);
            setMicEnabled(!micEnabled);
        }
    };

    const toggleVideo = async () => {
        if (localStreamRef.current) {
            const videoTracks = localStreamRef.current.getVideoTracks();
            if (videoTracks.length > 0) {
                // Toggle existing track
                videoTracks.forEach(t => t.enabled = !videoEnabled);
                setVideoEnabled(!videoEnabled);
            } else {
                // Upgrade to Video
                try {
                    console.log("Upgrading to video...");
                    const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    const newVideoTrack = newStream.getVideoTracks()[0];

                    if (newVideoTrack) {
                        localStreamRef.current.addTrack(newVideoTrack);
                        setLocalStream(new MediaStream(localStreamRef.current.getTracks())); // Trigger re-render

                        if (peerConnection.current) {
                            const senders = peerConnection.current.getSenders();
                            const videoSender = senders.find(s => s.track && s.track.kind === 'video');

                            if (videoSender) {
                                videoSender.replaceTrack(newVideoTrack);
                            } else {
                                peerConnection.current.addTrack(newVideoTrack, localStreamRef.current);
                            }

                            // Trigger Renegotiation
                            if (status === 'connected') {
                                createOffer(localStreamRef.current);
                            }
                        }
                        setVideoEnabled(true);
                    }
                } catch (e) {
                    console.error("Failed to upgrade to video", e);
                    setError("Could not access camera.");
                }
            }
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
