import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

// Helper to decode JWT safely
const decodeToken = (token) => {
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
          // We need to use getApiUrl in case we are in prod without proxy, 
          // but if we are using vite proxy, relative path is fine. 
          // Ideally import getApiUrl. For now assuming proxy or we add import.
          // Let's use the basic decoding first to render something fast
          const decoded = decodeToken(token);
          setUser(prev => ({ ...prev, ...decoded })); // Optimistic update

          // Then fetch real data
          const res = await axios.get('/api/users/me');
          if (res.data) {
            setUser(res.data); // Replace with fresh DB data (includes specific avatar, name etc)
          }
        } catch (err) {
          console.error("Failed to fetch user profile", err);
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

  // However, the above useEffect for setUser creates a second render again if token changes.
  // The synchronous init handles the RELOAD case.
  // The 'login' function below needs to ensure user is set immediately or let effect do it.

  // To handle login explicitly so UI updates fast:
  const login = (newToken) => {
    setToken(newToken);
    // optional: setUser(decodeToken(newToken)); // The effect will catch this, but explicit set is faster.
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
