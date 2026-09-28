import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import SocialFeed from './pages/SocialFeed';
import VideoModeration from './pages/VideoModeration';
import TextModeration from './pages/TextModeration';
import ImageModeration from './pages/ImageModeration';
import AudioModeration from './pages/AudioModeration';
import Settings from './pages/Settings';
import AuthPage from './pages/AuthPage';
import ForgotPassword from './pages/ForgotPassword';
import ReviewQueue from './pages/ReviewQueue';
import ModerationTools from './pages/ModerationTools';
import LandingPage from './pages/LandingPage';
import UserProfile from './pages/UserProfile';
import Chat from './pages/Chat';
import Friends from './pages/Friends';
import Media from './pages/Media';
import Notifications from './pages/Notifications';
import Security from './pages/Security';
import Help from './pages/Help';
import VerifyEmail from './pages/VerifyEmail';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CallProvider, useCall } from './context/CallContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster, toast } from 'react-hot-toast';
import AnimatedBackground from './components/AnimatedBackground';
import PostView from './pages/PostView';
import ErrorBoundary from './components/ErrorBoundary';
import FloatingVideo from './components/FloatingVideo';
import CallModal from './components/CallModal';

const GlobalCallUI = () => {
  const { callData, isMinimized, setIsMinimized, user, socket, endCall } = useCall();

  if (!callData) return null;

  if (isMinimized) {
    return <FloatingVideo />;
  }

  return (
    <CallModal
      {...callData}
      user={user}
      socket={socket}
      onClose={endCall}
      onMinimize={() => setIsMinimized(true)}
    />
  );
};

export default function App() {
  useEffect(() => {
    const handleOffline = () => toast.error("You are offline. Check your internet connection.");
    const handleOnline = () => toast.success("Back online!");

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CallProvider>
          <NotificationProvider>
            <div className="min-h-screen bg-cyber-background text-cyber-text font-sans relative">
              <AnimatedBackground />
              <GlobalCallUI />
              <div className="relative z-10 h-full">
                <Toaster position="top-right" toastOptions={{
                  className: 'glass-card text-sm',
                  style: {
                    background: '#fff',
                    color: '#333',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                }} />
                <Routes>
                  {/* Public / Auth Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/register" element={<AuthPage />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />

                  {/* Primary Navigation Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                  <Route path="/chats" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
                  <Route path="/chats/:conversationId" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
                  <Route path="/chats/group/:groupId" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
                  <Route path="/social" element={<ProtectedRoute><Layout><SocialFeed /></Layout></ProtectedRoute>} />
                  <Route path="/contacts" element={<ProtectedRoute><Layout><Friends /></Layout></ProtectedRoute>} />
                  <Route path="/media" element={<ProtectedRoute><Layout><Media /></Layout></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
                  <Route path="/security" element={<ProtectedRoute><Layout><Security /></Layout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
                  <Route path="/help" element={<ProtectedRoute><Layout><Help /></Layout></ProtectedRoute>} />

                  {/* Profile & Content Routes */}
                  <Route path="/profile" element={<ProtectedRoute><Layout><UserProfile /></Layout></ProtectedRoute>} />
                  <Route path="/profile/:username" element={<ProtectedRoute><Layout><UserProfile /></Layout></ProtectedRoute>} />
                  <Route path="/post/:postId" element={<Layout><PostView /></Layout>} />

                  {/* Moderation / Admin Routes */}
                  <Route path="/moderation" element={<ProtectedRoute><Layout><ModerationTools /></Layout></ProtectedRoute>} />
                  <Route path="/moderation/review" element={<ProtectedRoute><Layout><ReviewQueue /></Layout></ProtectedRoute>} />
                  
                  {/* Legacy or Specific Moderation Routes (Can be refactored into Mod Tools later) */}
                  <Route path="/video" element={<ProtectedRoute><Layout><VideoModeration /></Layout></ProtectedRoute>} />
                  <Route path="/text" element={<ProtectedRoute><Layout><TextModeration /></Layout></ProtectedRoute>} />
                  <Route path="/image" element={<ProtectedRoute><Layout><ImageModeration /></Layout></ProtectedRoute>} />
                  <Route path="/audio" element={<ProtectedRoute><Layout><AudioModeration /></Layout></ProtectedRoute>} />

                  <Route path="*" element={<Layout><ErrorState type="404" /></Layout>} />
                </Routes>
              </div>
            </div>
          </NotificationProvider>
        </CallProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
