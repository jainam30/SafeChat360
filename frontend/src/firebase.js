// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBajXeXwk1iUnIouY2HXxEG9ddLqENrrSk",
    authDomain: "safechat360.firebaseapp.com",
    projectId: "safechat360",
    storageBucket: "safechat360.firebasestorage.app",
    messagingSenderId: "988399075566",
    appId: "1:988399075566:web:e354803d46403bc185b3ff",
    measurementId: "G-77GLZNJ2QJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export default app;
