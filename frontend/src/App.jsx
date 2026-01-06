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
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';
import AnimatedBackground from './components/AnimatedBackground';
import PostView from './pages/PostView';

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-cyber-background text-cyber-text font-sans relative">
            <AnimatedBackground />
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
      </AuthProvider>
    </ErrorBoundary>
  );
}
