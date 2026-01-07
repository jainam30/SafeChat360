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
                if (reconnectTimeout.current) {
                    clearTimeout(reconnectTimeout.current);
                    reconnectTimeout.current = null;
                }
            };

            newSocket.onclose = () => {
                console.log("Global WS Disconnected");
                setIsConnected(false);
                setSocket(null);
                ws.current = null;
                // Auto reconnect
                reconnectTimeout.current = setTimeout(connect, 3000);
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
