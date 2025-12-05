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
