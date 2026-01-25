import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { getApiUrl } from '../config';

const CallContext = createContext(null);

export const useCall = () => {
    return useContext(CallContext);
};

export const CallProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);

    // Call State
    const [callData, setCallData] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);

    const reconnectAttempts = useRef(0);

    // Socket Connection Logic (Hoisted from Chat.jsx)
    useEffect(() => {
        if (!user || !token) {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
            return;
        }

        const connect = () => {
            if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) return;

            // Determine WS Protocol
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            let wsUrl = '';
            const apiUrl = getApiUrl('');

            if (apiUrl.startsWith('http')) {
                wsUrl = apiUrl.replace(/^http/, 'ws');
            } else {
                wsUrl = `${protocol}//${window.location.host}${apiUrl}`;
            }
            if (wsUrl.endsWith('/')) wsUrl = wsUrl.slice(0, -1);

            wsUrl = `${wsUrl}/api/chat/ws/${user.id}?token=${token}`;

            console.log("Global WS Connecting:", wsUrl);
            const newSocket = new WebSocket(wsUrl);

            newSocket.onopen = () => {
                console.log("Global WS Connected");
                setIsConnected(true);
                setSocket(newSocket);
                ws.current = newSocket;
                reconnectAttempts.current = 0; // Reset attempts on success
                if (reconnectTimeout.current) {
                    clearTimeout(reconnectTimeout.current);
                    reconnectTimeout.current = null;
                }
            };

            newSocket.onclose = (event) => {
                console.log("Global WS Disconnected", event.code, event.reason);
                setIsConnected(false);
                setSocket(null);
                ws.current = null;

                // Don't reconnect if auth failed (4001 or 4003 or similar likely used by backend)
                // or if closed cleanly (1000)
                if (event.code === 4001 || event.code === 1008) {
                    console.error("WS Auth Failed, not reconnecting.");
                    return;
                }

                // Exponential Backoff
                const delay = Math.min(3000 * Math.pow(2, reconnectAttempts.current), 30000);
                console.log(`Reconnecting in ${delay}ms (Attempt ${reconnectAttempts.current + 1})`);
                reconnectAttempts.current += 1;

                reconnectTimeout.current = setTimeout(connect, delay);
            };

            newSocket.onerror = (err) => {
                console.error("Global WS Error", err);
                newSocket.close();
            };

            // Initial Message Handler for Incoming Calls
            const handleCallMessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Intercept Offer to trigger incoming call UI
                    if (data.type === 'offer') {
                        setCallData(prev => {
                            if (prev) return prev; // Already in call
                            return {
                                isIncoming: true,
                                caller: { id: data.sender_id, username: data.sender_username || "Unknown" },
                                isVideo: data.isVideo,
                                offerData: data
                            };
                        });
                    }
                } catch (e) { }
            };

            newSocket.addEventListener('message', handleCallMessage);
        };

        connect();

        return () => {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };
    }, [user, token]);


    // WebRTC Hook
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
    } = useWebRTC({
        user,
        socket: socket,
        isIncoming: callData?.isIncoming,
        isVideo: callData?.isVideo,
        caller: callData?.caller,
        targetUser: callData?.targetUser,
        offerData: callData?.offerData,
        onClose: () => {
            setCallData(null);
            setIsMinimized(false);
        }
    });

    const startCall = (targetUser, isVideo = false) => {
        if (!targetUser) return;
        setCallData({
            isIncoming: false,
            isVideo,
            targetUser,
            caller: user
        });
        setIsMinimized(false);
    };

    const value = {
        socket,
        isConnected,
        startCall,
        endCall,
        acceptCall,
        rejectCall,
        toggleMic,
        toggleVideo,
        callData,
        status,
        localStream,
        remoteStream,
        micEnabled,
        videoEnabled,
        error,
        isMinimized,
        setIsMinimized
    };

    return (
        <CallContext.Provider value={value}>
            {children}
        </CallContext.Provider>
    );
};
