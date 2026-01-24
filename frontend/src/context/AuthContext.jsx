import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { getApiUrl } from "../config";

const AuthContext = createContext();

// Helper to decode JWT safely
const decodeToken = (token) => {
  // ... existing decodeToken code ...
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      return { id: parseInt(payload.sub), email: payload.email, role: payload.role, username: payload.sub };
    }
  } catch (e) {
    console.warn("Token decode failed", e);
  }
  return null;
};

export function AuthProvider({ children }) {
  // Initialize state synchronously
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem("token");
    return t ? decodeToken(t) : null;
  });

  // Sync with localStorage and Axios on token change
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // define async fetcher
      const fetchUserData = async () => {
        try {
          // FIX: Use getApiUrl to ensure we hit the Backend, not the Frontend (Vercel)
          const decoded = decodeToken(token);
          setUser(prev => ({ ...prev, ...decoded })); // Optimistic update

          // Then fetch real data
          const res = await axios.get(getApiUrl('/api/users/me'));
          if (res.data) {
            setUser(res.data); // Replace with fresh DB data (includes specific avatar, name etc)
          }
        } catch (err) {
          console.warn("Failed to fetch user profile (Session likely expired):", err.message);
          // If 401, maybe logout?
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      };

      fetchUserData();
    } else {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
    }
  }, [token]);

  // NEW: Global Axios Interceptor to catch 401s from ANY request (chat, friends, etc)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Global 401 Interceptor: Session expired/invalid. Logging out.");
          logout(); // Reuse the existing logout function
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount to practice good hygiene
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []); // Run once on mount (logout is stable)

  // However, the above useEffect for setUser creates a second render again if token changes.
  // The synchronous init handles the RELOAD case.
  // The 'login' function below needs to ensure user is set immediately or let effect do it.

  // To handle login explicitly so UI updates fast:
  const login = (newToken) => {
    // 1. Set Token State
    setToken(newToken);

    // 2. IMMEDIATE: Set Axios Header (Fixes Race Condition where redirects fire before useEffect)
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    localStorage.setItem("token", newToken);

    // 3. Decode user immediately for UI
    setUser(decodeToken(newToken));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
