import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import SocialFeed from './pages/SocialFeed';
import VideoModeration from './pages/VideoModeration';
import TextModeration from './pages/TextModeration';
import ImageModeration from './pages/ImageModeration';
import AudioModeration from './pages/AudioModeration';
import History from './pages/History';
import Settings from './pages/Settings';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import ForgotPassword from './pages/ForgotPassword';
import ReviewQueue from './pages/ReviewQueue';
import LandingPage from './pages/LandingPage';
import UserProfile from './pages/UserProfile';
import Chat from './pages/Chat';
import Friends from './pages/Friends';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CallProvider, useCall } from './context/CallContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';
import AnimatedBackground from './components/AnimatedBackground';
import PostView from './pages/PostView';

import ErrorBoundary from './components/ErrorBoundary';

import CallModal from './components/CallModal';

const GlobalCallUI = () => {
  const { callData, isMinimized, setIsMinimized, user, socket, endCall } = useCall();

  if (!callData) return null;

  if (isMinimized) {
    // Mini Bar (Call Bar)
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 right-4 z-[9999] bg-gray-900 border border-white/20 rounded-lg p-3 flex items-center gap-3 shadow-2xl cursor-pointer animate-in fade-in slide-in-from-bottom-5 hover:scale-105 transition-transform"
      >
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-xs">{callData.isVideo ? 'VIDEO' : 'VOICE'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-white text-sm font-bold">{callData.isIncoming ? callData.caller?.username : callData.targetUser?.username}</span>
          <span className="text-gray-400 text-xs">Tap to return</span>
        </div>
      </div>
    );
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
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                  <Route path="/chat" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
                  <Route path="/social" element={<ProtectedRoute><Layout><SocialFeed /></Layout></ProtectedRoute>} />
                  <Route path="/post/:postId" element={<Layout><PostView /></Layout>} /> {/* Publicly accessible wrapper, internal checks handle auth/privacy */}
                  <Route path="/video" element={<ProtectedRoute><Layout><VideoModeration /></Layout></ProtectedRoute>} />
                  <Route path="/text" element={<ProtectedRoute><Layout><TextModeration /></Layout></ProtectedRoute>} />
                  <Route path="/image" element={<ProtectedRoute><Layout><ImageModeration /></Layout></ProtectedRoute>} />
                  <Route path="/audio" element={<ProtectedRoute><Layout><AudioModeration /></Layout></ProtectedRoute>} />
                  <Route path="/history" element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />

                  {/* Profile Routes */}
                  <Route path="/profile/:userId" element={<ProtectedRoute><Layout><UserProfile /></Layout></ProtectedRoute>} />
                  <Route path="/account" element={<ProtectedRoute><Layout><Account /></Layout></ProtectedRoute>} />
                  <Route path="/friends" element={<ProtectedRoute><Layout><Friends /></Layout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
                  <Route path="/review" element={<ProtectedRoute><Layout><ReviewQueue /></Layout></ProtectedRoute>} />
                  <Route path="/about" element={<ProtectedRoute><Layout><About /></Layout></ProtectedRoute>} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          </NotificationProvider>
        </CallProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
