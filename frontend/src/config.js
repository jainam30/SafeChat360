// In development, the proxy in vite.config.js handles the /api requests.
// In production, we need to point to the backend URL directly if it's on a different domain.
// VITE_API_URL should be set in Vercel environment variables, e.g. "https://my-backend.onrender.com"
// If not set, it defaults to empty string, meaning it will use the current domain (relative path).

export const API_URL = import.meta.env.VITE_API_URL || "";

// Helper to construct full URL
export const getApiUrl = (path) => {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_URL}${normalizedPath}`;
};

// Unique, persistent device identifier stored in localStorage
export const getDeviceId = () => {
    try {
        let id = localStorage.getItem("safechat_device_id");
        if (!id) {
            id = "dev_" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).substring(2) + Date.now().toString(36)));
            localStorage.setItem("safechat_device_id", id);
        }
        return id;
    } catch (e) {
        return "dev_fallback";
    }
};
