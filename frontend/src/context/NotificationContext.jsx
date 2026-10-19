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
            const headers = { 'Authorization': `Bearer ${token}` };
            const [resReq, resNotif] = await Promise.allSettled([
                fetch(getApiUrl('/api/friends/requests'), { headers }),
                fetch(getApiUrl('/api/notifications/'), { headers })
            ]);

            const newNotifications = [];

            // 1. Friend Pending Requests
            if (resReq.status === 'fulfilled' && resReq.value.ok) {
                const data = await resReq.value.json();
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

            // 2. System Notifications
            if (resNotif.status === 'fulfilled' && resNotif.value.ok) {
                const data = await resNotif.value.json();
                if (Array.isArray(data)) {
                    const unreadCount = data.filter(n => !n.is_read).length;
                    setUnreadMessages(unreadCount);

                    const systemNotifs = data.map(n => ({
                        id: n.id,
                        type: n.type,
                        requester_name: n.source_name,
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
            console.error("Failed to check notifications:", e);
        }
    };

    useEffect(() => {
        if (token && user) {
            checkNotifications();

            // POLL for notifications when tab is visible
            const interval = setInterval(() => {
                if (typeof document !== 'undefined' && document.hidden) return;
                checkNotifications();
            }, 10000);

            const handleVisibilityChange = () => {
                if (typeof document !== 'undefined' && !document.hidden) {
                    checkNotifications();
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                clearInterval(interval);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }
    }, [token, user]);

    const markAsRead = async (notificationId) => {
        if (!token) return;
        if (typeof notificationId === 'string' && notificationId.startsWith('req-')) {
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            setFriendRequests(prev => Math.max(0, prev - 1));
            return;
        }
        try {
            const res = await fetch(getApiUrl(`/api/notifications/${notificationId}/read`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
                setUnreadMessages(prev => Math.max(0, prev - 1));
            }
        } catch (e) {
            console.error("Failed to mark notification as read", e);
        }
    };

    const markAllAsRead = async () => {
        if (!token) return;
        try {
            const res = await fetch(getApiUrl('/api/notifications/read-all'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadMessages(0);
                toast.success('All notifications marked as read');
            }
        } catch (e) {
            console.error("Failed to mark all notifications as read", e);
        }
    };

    const totalUnread = friendRequests + unreadMessages;

    return (
        <NotificationContext.Provider value={{
            friendRequests,
            unreadMessages,
            totalUnread,
            notifications,
            checkNotifications,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
