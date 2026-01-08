import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import GradientButton from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Shield, Lock, Mail, ArrowRight, AlertTriangle } from 'lucide-react';
import logoImg from '../assets/safechat_logo.png';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // NEW STATE
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [errorDetail, setErrorDetail] = useState(null); // NEW STATE

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrorDetail(null);

    // 1. Validate Input
    if (!email) {
      toast.error('Please enter a valid email');
      setLoading(false);
      return;
    }

    try {
      // 2. FIREBASE LOGIN (Primary Authentication)
      // This is the "Source of Truth". If this passes, the user is who they say they are.
      console.log("Attempting Firebase Login...");
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (fbError) {
        console.error("Firebase Login Failed:", fbError);
        // Handle specific Firebase errors
        if (fbError.code === 'auth/invalid-credential' || fbError.code === 'auth/wrong-password' || fbError.code === 'auth/user-not-found') {
          throw new Error("Invalid email or password.");
        } else if (fbError.code === 'auth/too-many-requests') {
          throw new Error("Too many failed attempts. Please try again later.");
        } else if (fbError.code === 'auth/invalid-email') {
          throw new Error("Please use a valid Email Address (not username).");
        }
        throw new Error(fbError.message);
      }

      const token = await userCredential.user.getIdToken();
      console.log("Firebase Login Success. Token obtained.");

      // 3. BACKEND SESSION EXCHANGE
      // Send the proof (token) to backend to get a session/access_token
      const verifyRes = await fetch(getApiUrl('/api/auth/verify-identity'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_token: token, device_id: navigator.userAgent }),
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.access_token) {
        toast.success("Login successful!");
        login(verifyData.access_token);
        navigate('/dashboard');
        return;
      } else {
        // Backend rejected the valid Firebase User (rare, hopefully JIT fixes this)
        console.error("Backend Verification Failed:", verifyData);
        setErrorDetail(verifyData.detail || "Backend rejected valid authentication.");
        throw new Error(verifyData.detail || "Login failed on server.");
      }

    } catch (err) {
      console.error("Login Error:", err);
      // Show error in the red box if it's a detail error, otherwise toast
      if (err.message.includes("Invalid email")) {
        setError(err.message);
      } else {
        setError(err.message);
      }
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-cyber-background">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-300/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-300/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 p-4">
        <div className="glass-card p-8 shadow-2xl">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyber-primary to-cyber-secondary p-[1px] mb-4 shadow-lg shadow-cyber-primary/20 hover:scale-105 transition-transform">
              <img src={logoImg} alt="SafeChat360" className="w-full h-full rounded-2xl object-cover" />
            </Link>
            <h1 className="text-3xl font-bold text-black mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-black">Sign in to access your secure dashboard</p>
          </div>

          {error && (
            <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-500 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-cyber-muted ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted w-5 h-5 group-focus-within:text-cyber-primary transition-colors" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="glass-input pl-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-cyber-muted ml-1">Password</label>
                <Link to="/forgot-password" className="text-xs text-cyber-primary hover:text-cyber-secondary transition-colors">Forgot password?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted w-5 h-5 group-focus-within:text-cyber-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="glass-input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-primary transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <GradientButton text="Sign In" type="submit" disabled={loading} />
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-cyber-muted">
            <p className="mb-2">Don't have an account?</p>
            <Link to="/register" className="text-cyber-primary hover:text-cyber-secondary transition-colors font-medium text-base">
              Create Free Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
