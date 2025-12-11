import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getApiUrl } from '../config';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { token } = useAuth();
    const [friendRequests, setFriendRequests] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);

    const checkNotifications = async () => {
        if (!token) return;
        try {
            // Check Friend Requests
            const res = await fetch(getApiUrl('/api/friends/requests'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFriendRequests(data.length);
            }

            // Unread Messages - For now we don't have an endpoint for count, 
            // but we could add one. mocking for now or relying on WS events if we had global WS.
            // setUnreadMessages(0); 
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (token) {
            checkNotifications();
            const interval = setInterval(checkNotifications, 15000); // Poll every 15s
            return () => clearInterval(interval);
        } else {
            setFriendRequests(0);
        }
    }, [token]);

    return (
        <NotificationContext.Provider value={{ friendRequests, unreadMessages, checkNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
