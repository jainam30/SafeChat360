import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Shield, Lock, Mail, ArrowRight, AlertTriangle } from 'lucide-react';
import logoImg from '../assets/safechat_logo.png';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email) {
      setError('Please enter a valid email or username');
      setLoading(false);
      return;
    }

    try {
      // 1. Attempt Normal Login
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password, device_id: navigator.userAgent }),
      });
      const data = await res.json();

      if (res.ok && data.access_token) {
        login(data.access_token);
        navigate('/dashboard');
        return;
      }

      // 2. Handle Device Limit / Verification Needed
      if (res.status === 403 && (data.detail === 'DEVICE_LIMIT_EXCEEDED' || data.detail === 'THREAT_DETECTED')) {
        const proceed = window.confirm("New device detected or session limit exceeded. Verify identity to continue?");

        if (proceed) {
          setError('Verifying identity with security provider...');
          // 3. Authenticate with Firebase to get proof
          try {
            // We use the password user just entered to get a firebase token
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken();

            // 4. Send Proof to Backend
            const verifyRes = await fetch(getApiUrl('/api/auth/verify-identity'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ firebase_token: token, device_id: navigator.userAgent }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.access_token) {
              login(verifyData.access_token);
              navigate('/dashboard');
              return;
            } else {
              setError(verifyData.detail || 'Identity verification failed.');
            }

          } catch (firebaseErr) {
            console.error("Firebase Auth Error", firebaseErr);
            setError('Security verification failed. Please check your credentials.');
          }
        } else {
          setError('Login cancelled.');
        }
      } else {
        setError(data.detail || 'Login failed');
      }

    } catch (err) {
      setError('Request failed: ' + err.message);
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
            <h1 className="text-3xl font-bold text-cyber-text mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-cyber-muted">Sign in to access your secure dashboard</p>
          </div>

          {error && (
            <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-500 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-cyber-muted ml-1">Email or Username</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted w-5 h-5 group-focus-within:text-cyber-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Username or name@company.com"
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
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="glass-input pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 group mt-6"
            >
              {loading ? 'Authenticating...' : (
                <>
                  Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
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
