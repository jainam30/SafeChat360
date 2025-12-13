import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getApiUrl } from '../config';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [friendRequests, setFriendRequests] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const ws = useRef(null);

    const checkNotifications = async () => {
        if (!token) return;
        try {
            const newNotifications = [];

            // 1. Fetch Friend Pending Requests (Legacy logic, keep as notification)
            const resReq = await fetch(getApiUrl('/api/friends/requests'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resReq.ok) {
                const data = await resReq.json();
                if (Array.isArray(data)) {
                    setFriendRequests(data.length);
                    const requestNotifs = data.map(req => ({
                        id: `req-${req.id}`,
                        type: 'friend_request',
                        requester_name: req.requester_name,
                        requester_id: req.requester_id,
                        requester_photo: req.requester_photo,
                        created_at: req.created_at,
                        data: req
                    }));
                    newNotifications.push(...requestNotifs);
                }
            }

            // 2. Fetch System Notifications (Mentions, etc.)
            const resNotif = await fetch(getApiUrl('/api/notifications/'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (resNotif.ok) {
                const data = await resNotif.json();
                if (Array.isArray(data)) {
                    // We show unread ones prominently or all?
                    // Let's filter unread for badge counts, but show all in list
                    const unreadCount = data.filter(n => !n.is_read).length;
                    setUnreadMessages(prev => Math.max(prev, unreadCount)); // Merge logic? Or just replace?

                    const systemNotifs = data.map(n => ({
                        id: n.id,
                        type: n.type,
                        requester_name: n.source_name, // Map source_name to requester_name for UI consistency if used
                        requester_id: n.source_id,
                        created_at: n.created_at,
                        is_read: n.is_read,
                        reference_id: n.reference_id
                    }));

                    newNotifications.push(...systemNotifs);
                }
            }

            // Sort by date desc
            newNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setNotifications(newNotifications);

        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (token && user) {
            checkNotifications();

            // Connect WebSocket for Real-time Notifications
            let wsUrl = getApiUrl(`/api/chat/ws/${user.id}?token=${token}`);
            if (wsUrl.startsWith('/')) {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                wsUrl = `${protocol}//${window.location.host}${wsUrl}`;
            } else {
                wsUrl = wsUrl.replace("http://", "ws://").replace("https://", "wss://");
            }

            const socket = new WebSocket(wsUrl);
            ws.current = socket;

            socket.onmessage = (event) => {
                const message = JSON.parse(event.data);

                if (message.type === 'notification') {
                    // Handle Notification
                    if (message.event === 'friend_request') {
                        // Add to local state immediately
                        setNotifications(prev => [
                            {
                                id: Date.now(), // Temp ID until refresh
                                type: 'friend_request',
                                requester_name: message.sender_username,
                                requester_id: message.sender_id,
                                created_at: new Date().toISOString()
                            },
                            ...prev
                        ]);

                        toast.success(`You have a new friend request from ${message.sender_username}!`, {
                            duration: 5000,
                            icon: '👋'
                        });
                    } else if (message.event === 'friend_accepted') {
                        toast.success(`${message.sender_username} accepted your friend request!`, {
                            duration: 5000,
                            icon: '✅'
                        });
                    }
                }
            };

            return () => {
                socket.close();
            };
        }
    }, [token, user]);

    return (
        <NotificationContext.Provider value={{ friendRequests, unreadMessages, notifications, checkNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
