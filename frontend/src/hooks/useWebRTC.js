import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiUrl } from '../config';

let cachedIceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
];

export const checkIsSecureContext = () => {
    if (typeof window === 'undefined') return true;
    if (window.isSecureContext) return true;
    const host = window.location.hostname;
    if (['localhost', '127.0.0.1', '::1', '[::1]'].includes(host) || host.endsWith('.localhost')) {
        return true;
    }
    if (window.location.protocol === 'https:') return true;
    return false;
};

export const useWebRTC = ({ user, socket, isIncoming, isVideo, caller, targetUser, offerData, onClose, token }) => {
    // State
    const [status, setStatus] = useState('idle');
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [micEnabled, setMicEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(isVideo);
    const [error, setError] = useState(null);

    const peerConnection = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const candidatesQueue = useRef([]);
    const noAnswerTimeout = useRef(null);

    // Refs for live closure access
    const callerRef = useRef(caller);
    const targetUserRef = useRef(targetUser);
    const isIncomingRef = useRef(isIncoming);

    useEffect(() => {
        callerRef.current = caller;
        targetUserRef.current = targetUser;
        isIncomingRef.current = isIncoming;
    }, [caller, targetUser, isIncoming]);

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
                console.log("[WebRTC] Call timed out - no answer after 20s");
                setError("No answer.");
                setTimeout(() => {
                    endCall(true);
                }, 2000);
            }, 20000);
        } else if (noAnswerTimeout.current) clearTimeout(noAnswerTimeout.current);
        return () => { if (noAnswerTimeout.current) clearTimeout(noAnswerTimeout.current); };
    }, [status]);

    // Fetch ICE servers on mount or token change
    useEffect(() => {
        const authToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
        if (!authToken) return;
        fetch(getApiUrl('/api/chat/ice-servers'), {
            headers: { 'Authorization': `Bearer ${authToken}` }
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (data?.ice_servers && Array.isArray(data.ice_servers)) {
                cachedIceServers = data.ice_servers;
                console.log("[WebRTC] Retrieved dynamic ICE servers:", cachedIceServers.length);
            }
        })
        .catch(err => {
            console.warn("[WebRTC] Failed to fetch dynamic ICE servers, using fallback STUN:", err);
        });
    }, [token]);

    // Initialize PeerConnection
    const createPeerConnection = useCallback(() => {
        if (peerConnection.current) return peerConnection.current;
        console.log("Creating RTCPeerConnection");
        const pc = new RTCPeerConnection({ iceServers: cachedIceServers });

        pc.onicecandidate = (event) => {
            if (event.candidate && socket && socket.readyState === WebSocket.OPEN) {
                const targetId = isIncomingRef.current ? callerRef.current?.id : targetUserRef.current?.id;
                if (targetId) {
                    socket.send(JSON.stringify({
                        type: 'ice-candidate',
                        candidate: event.candidate,
                        receiver_id: targetId
                    }));
                }
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", pc.iceConnectionState);
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                setStatus('connected');
                stopAudio();
            } else if (pc.iceConnectionState === 'failed') {
                setError("Connection failed");
                endCall();
            }
        };

        pc.onconnectionstatechange = () => {
            console.log("Peer connection state:", pc.connectionState);
            if (pc.connectionState === 'connected') {
                setStatus('connected');
                stopAudio();
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                endCall(false);
            }
        };

        pc.ontrack = (event) => {
            console.log("Remote track received", event.track.kind, event.streams[0]?.id);

            // Always create a new MediaStream to ensure React detects the state change
            // event.streams[0] might be the same reference for multiple tracks (audio + video)
            const incomingStream = event.streams[0];

            if (incomingStream) {
                // Determine tracks from the incoming stream
                const newStream = new MediaStream(incomingStream.getTracks());

                // Add listener for future tracks (though ontrack usually covers this)
                incomingStream.onaddtrack = () => {
                    console.log("Track added to incoming stream later, updating state");
                    setRemoteStream(new MediaStream(incomingStream.getTracks()));
                };

                setRemoteStream(newStream);
            } else {
                // Fallback for browsers not sending streams
                if (!remoteStreamRef.current) {
                    remoteStreamRef.current = new MediaStream();
                }
                remoteStreamRef.current.addTrack(event.track);
                setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
            }
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

            // 1. Secure Context & Device Availability Check
            const isSecure = checkIsSecureContext();
            if (!isSecure && !navigator?.mediaDevices?.getUserMedia) {
                const msg = "Camera/Mic requires a Secure Context (HTTPS or localhost). On mobile LAN, use an HTTPS tunnel or configure HTTPS in Vite.";
                console.error("[WebRTC] Insecure context detected:", window.location.origin);
                setError(msg);
                setTimeout(() => { endCall(true); }, 5000);
                return;
            }

            if (!navigator?.mediaDevices?.getUserMedia) {
                const msg = "Media devices API is not supported in this browser.";
                console.error("[WebRTC] navigator.mediaDevices not supported");
                setError(msg);
                setTimeout(() => { endCall(true); }, 4000);
                return;
            }

            try {
                console.log("[WebRTC] Acquiring local media (HQ)...");
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

                console.log("[WebRTC] Got local media (HQ):", stream.id);
                setLocalStream(stream);
                localStreamRef.current = stream;
                // Sync initial toggle states (in case they were toggled before media was ready)
                stream.getAudioTracks().forEach(t => t.enabled = micEnabled);
                stream.getVideoTracks().forEach(t => t.enabled = videoEnabled);

                if (status === 'calling') createOffer(stream);

            } catch (err) {
                console.warn("[WebRTC] HQ Media Failed, trying basic...", err);
                try {
                    // Fallback to basic constraints
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: isVideo,
                        audio: true
                    });

                    if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

                    console.log("[WebRTC] Got local media (Basic):", stream.id);
                    setLocalStream(stream);
                    localStreamRef.current = stream;
                    stream.getAudioTracks().forEach(t => t.enabled = micEnabled);
                    stream.getVideoTracks().forEach(t => t.enabled = videoEnabled);

                    if (status === 'calling') createOffer(stream);

                } catch (fallbackErr) {
                    console.error("[WebRTC] Media Acquisition Error:", fallbackErr);
                    let errMessage = "Could not access camera/microphone.";
                    if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
                        errMessage = "Permission denied. Please allow Camera/Microphone access in your browser.";
                    } else if (fallbackErr.name === 'NotFoundError' || fallbackErr.name === 'DevicesNotFoundError') {
                        errMessage = "No camera or microphone found on this device.";
                    } else if (fallbackErr.name === 'NotReadableError' || fallbackErr.name === 'TrackStartError') {
                        errMessage = "Camera or microphone is already in use by another application.";
                    } else if (fallbackErr.name === 'OverconstrainedError') {
                        errMessage = "Requested camera resolution or constraints are not supported.";
                    } else if (fallbackErr.message) {
                        errMessage = `Media error: ${fallbackErr.message}`;
                    }
                    setError(errMessage);
                    // Bounded dismissal so call does not hang at CALLING... forever
                    setTimeout(() => {
                        endCall(true);
                    }, 4000);
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
                    stopAudio();

                    // Stop Local Stream immediately
                    if (localStreamRef.current) {
                        localStreamRef.current.getTracks().forEach(t => {
                            t.stop();
                            t.enabled = false;
                        });
                        localStreamRef.current = null;
                        setLocalStream(null);
                    }

                    // Close PC immediately
                    if (pc) {
                        pc.close();
                        peerConnection.current = null;
                    }
                    remoteStreamRef.current = null;
                    setRemoteStream(null);

                    // Delay UI close for user feedback
                    setTimeout(() => {
                        onClose();
                    }, 1000);
                }

                else if (data.type === 'call-response') {
                    if (data.response === 'reject' || data.response === 'rejected') {
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
                            const cand = candidatesQueue.current.shift();
                            try {
                                await pc.addIceCandidate(cand);
                            } catch (e) {
                                console.warn("Error adding queued ICE candidate on answer:", e);
                            }
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

            const recipientId = targetUserRef.current?.id || targetUser?.id;
            if (socket && socket.readyState === WebSocket.OPEN && recipientId) {
                socket.send(JSON.stringify({
                    type: 'offer',
                    sdp: offer,
                    sender_id: user.id,
                    sender_username: user?.username || user?.display_name || user?.email,
                    receiver_id: recipientId,
                    isVideo
                }));
            } else {
                setError("Connection lost: WebSocket not connected.");
                setTimeout(() => { endCall(true); }, 3000);
            }
        } catch (e) {
            console.error("Create Offer Failed", e);
            setError("Failed to start call");
            setTimeout(() => { endCall(true); }, 3000);
        }
    };

    const acceptCall = async () => {
        try {
            stopAudio(); // Stop ringing
            
            if (!navigator?.mediaDevices?.getUserMedia) {
                const isSecure = checkIsSecureContext();
                const msg = !isSecure 
                    ? "Camera/Mic requires a Secure Context (HTTPS or localhost)."
                    : "Media devices API is not supported in this browser.";
                setError(msg);
                setTimeout(() => { rejectCall(); }, 4000);
                return;
            }

            // Resilient media capture: try requested constraints, fall back to basic audio if camera is absent/blocked
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: isVideo ? { facingMode: 'user' } : false,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
            } catch (mediaErr) {
                console.warn("Primary getUserMedia failed, attempting audio fallback:", mediaErr);
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                } catch (audioErr) {
                    console.error("All getUserMedia attempts failed:", audioErr);
                    setError("Could not access microphone/camera. Please grant permissions.");
                    setTimeout(() => { rejectCall(); }, 4000);
                    return;
                }
            }

            setLocalStream(stream);
            localStreamRef.current = stream;
            setStatus('connecting');

            const pc = createPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            if (offerData && offerData.sdp) {
                if (pc.signalingState === "stable") {
                    await pc.setRemoteDescription(new RTCSessionDescription(offerData.sdp));
                }
                if (pc.signalingState === "have-remote-offer") {
                    const answer = await pc.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
                    await pc.setLocalDescription(answer);

                    const recipientId = callerRef.current?.id || caller?.id;
                    if (socket && socket.readyState === WebSocket.OPEN && recipientId) {
                        socket.send(JSON.stringify({
                            type: 'answer',
                            sdp: answer,
                            sender_id: user.id,
                            receiver_id: recipientId,
                            isVideo
                        }));
                    }

                    while (candidatesQueue.current.length) {
                        const cand = candidatesQueue.current.shift();
                        try {
                            await pc.addIceCandidate(cand);
                        } catch (iceErr) {
                            console.warn("Error adding queued ICE candidate in acceptCall:", iceErr);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Accept Call Failed", e);
            setError("Failed to accept call");
            setTimeout(() => { rejectCall(); }, 3000);
        }
    };

    const rejectCall = () => {
        stopAudio();
        const callerId = callerRef.current?.id || caller?.id;
        if (socket && callerId && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'call-response',
                response: 'reject',
                receiver_id: callerId
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
            localStreamRef.current = null;
        }

        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        remoteStreamRef.current = null;

        // Notify Peer
        if (notifyPeer && socket && socket.readyState === WebSocket.OPEN) {
            const peerId = isIncomingRef.current ? callerRef.current?.id : targetUserRef.current?.id;
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
