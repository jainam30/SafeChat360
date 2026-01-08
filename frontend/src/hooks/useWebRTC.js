import { useState, useEffect, useRef, useCallback } from 'react';

const SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

export const useWebRTC = ({ user, socket, isIncoming, isVideo, caller, targetUser, offerData, onClose }) => {
    // State
    const [status, setStatus] = useState('idle');
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [micEnabled, setMicEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(isVideo);
    const [error, setError] = useState(null);

    const peerConnection = useRef(null);
    const localStreamRef = useRef(null);
    const candidatesQueue = useRef([]);
    const noAnswerTimeout = useRef(null);

    // Audio Context
    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);
    const toneIntervalRef = useRef(null);

    // Watch for call start
    useEffect(() => {
        if (isIncoming === true) setStatus('incoming');
        else if (isIncoming === false) setStatus('calling');
        else { setStatus('idle'); stopAudio(); }
    }, [isIncoming]);

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
            if (status !== 'calling') return;
            const osc = audioCtxRef.current.createOscillator();
            const gain = audioCtxRef.current.createGain();
            osc.className = 'sine'; // type
            osc.frequency.setValueAtTime(440, audioCtxRef.current.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
            osc.connect(gain);
            gain.connect(audioCtxRef.current.destination);
            osc.start();
            osc.stop(audioCtxRef.current.currentTime + 0.8);
        };
        playBeep();
        toneIntervalRef.current = setInterval(playBeep, 2000);
    };

    const playIncomingRing = () => {
        stopAudio();
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioCtxRef.current = new AudioContext();

        const playRing = () => {
            if (status !== 'incoming') return;
            const now = audioCtxRef.current.currentTime;
            const osc = audioCtxRef.current.createOscillator();
            const gain = audioCtxRef.current.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.1);
            osc.frequency.linearRampToValueAtTime(600, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 2);
            osc.connect(gain);
            gain.connect(audioCtxRef.current.destination);
            osc.start();
            osc.stop(now + 2.5);
        };
        playRing();
        toneIntervalRef.current = setInterval(playRing, 3000);
    };

    useEffect(() => {
        if (status === 'calling') playCallingBeep();
        else if (status === 'incoming') playIncomingRing();
        else stopAudio();
        return () => stopAudio();
    }, [status]);

    useEffect(() => {
        if (status === 'calling') {
            noAnswerTimeout.current = setTimeout(() => {
                console.log("Call timed out");
                setError("No answer.");
                endCall(true);
            }, 20000);
        } else if (noAnswerTimeout.current) clearTimeout(noAnswerTimeout.current);
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
            if (pc.iceConnectionState === 'failed') {
                setError("Connection failed");
                endCall();
            }
        };

        pc.connectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                setStatus('connected');
                stopAudio();
            }
        };

        pc.ontrack = (event) => {
            console.log("Remote track received", event.track.kind);
            let stream = event.streams[0];
            if (!stream) {
                stream = new MediaStream();
                stream.addTrack(event.track);
            }
            const newStreamRef = new MediaStream(stream.getTracks());
            setRemoteStream(newStreamRef);
        };

        peerConnection.current = pc;
        return pc;
    }, [isIncoming, caller, targetUser, socket]);

    // Cleanup
    useEffect(() => {
        return () => { endCall(false); };
    }, []);

    // Get Local Media
    useEffect(() => {
        let mounted = true;

        const startMedia = async () => {
            if (status === 'idle' || status === 'incoming') return;
            if (localStreamRef.current) return;

            // HTTPS Check
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                setError("Get Media Failed: HTTPS Required");
                console.error("getUserMedia requires HTTPS!");
                return;
            }

            try {
                console.log("Acquiring local media...");
                // Attempt high quality first
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: isVideo ? { facingMode: 'user' } : false, // facingMode for mobile
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });

                if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

                console.log("Got local media (HQ)", stream.id);
                setLocalStream(stream);
                localStreamRef.current = stream;
                // Sync initial toggle states (in case they were toggled before media was ready)
                stream.getAudioTracks().forEach(t => t.enabled = micEnabled);
                stream.getVideoTracks().forEach(t => t.enabled = videoEnabled);

                if (status === 'calling') createOffer(stream);

            } catch (err) {
                console.warn("HQ Media Failed, trying basic...", err);
                try {
                    // Fallback to basic constraints
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: isVideo,
                        audio: true
                    });

                    if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

                    console.log("Got local media (Basic)", stream.id);
                    setLocalStream(stream);
                    localStreamRef.current = stream;
                    stream.getAudioTracks().forEach(t => t.enabled = micEnabled);
                    stream.getVideoTracks().forEach(t => t.enabled = videoEnabled);

                    if (status === 'calling') createOffer(stream);

                } catch (fallbackErr) {
                    console.error("Media Error:", fallbackErr);
                    // More specific error messages
                    if (fallbackErr.name === 'NotAllowedError') setError("Permission denied. Allow Camera/Mic.");
                    else if (fallbackErr.name === 'NotFoundError') setError("No camera/mic found.");
                    else setError("Could not access media.");
                }
            }
        };

        startMedia();

        return () => {
            mounted = false;
        };
    }, [status, isVideo, micEnabled, videoEnabled]);




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
                        const answer = await pc.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
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

        // Safely add tracks (Check if already added to prevent InvalidAccessError during renegotiation)
        const senders = pc.getSenders();
        stream.getTracks().forEach(track => {
            const alreadyHas = senders.some(sender => sender.track === track);
            if (!alreadyHas) {
                pc.addTrack(track, stream);
            }
        });

        try {
            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
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
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            setLocalStream(stream);
            localStreamRef.current = stream;
            setStatus('connecting');

            const pc = createPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            if (offerData && offerData.sdp) {
                if (pc.signalingState === "stable") {
                    await pc.setRemoteDescription(new RTCSessionDescription(offerData.sdp));
                    const answer = await pc.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
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

        // Robust Cleanup: Stop all tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => {
                t.stop();
                t.enabled = false;
            });
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
            const audioTracks = localStreamRef.current.getAudioTracks();
            if (audioTracks.length > 0) {
                // Toggle tracks
                const enabled = !micEnabled;
                audioTracks.forEach(t => t.enabled = enabled);
                setMicEnabled(enabled);
            }
        }
    };

    const toggleVideo = async () => {
        if (localStreamRef.current) {
            const videoTracks = localStreamRef.current.getVideoTracks();
            if (videoTracks.length > 0) {
                // Toggle existing track
                const enabled = !videoEnabled;
                videoTracks.forEach(t => t.enabled = enabled);
                setVideoEnabled(enabled);
            } else {
                // Upgrade to Video
                try {
                    console.log("Upgrading to video...");
                    // We need video, but getUserMedia might request audio too if we aren't careful.
                    // Requesting audio: true creates a second mic track -> LEAK!
                    // Requesting ONLY video: true avoids the audio leak.
                    const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    const newVideoTrack = newStream.getVideoTracks()[0];

                    if (newVideoTrack) {
                        localStreamRef.current.addTrack(newVideoTrack);

                        // Force state update with NEW stream object to ensure UI renders
                        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

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
