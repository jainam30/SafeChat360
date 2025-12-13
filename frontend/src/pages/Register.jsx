import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import GradientButton from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Shield, User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import logoImg from '../assets/safechat_logo.png';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate Phone Number
    if (!phoneNumber.trim().startsWith('+') || phoneNumber.replace(/[^0-9]/g, '').length < 7) {
      const msg = 'Please enter a valid mobile number with country code (e.g. +91...)';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      console.log("Submitting registration...");

      // 1. Create User in Firebase
      let firebaseUser;
      let token;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
        token = await firebaseUser.getIdToken();
      } catch (firebaseErr) {
        if (firebaseErr.code === 'auth/email-already-in-use') {
          // Handled gracefully - no console.error needed
          toast.success("Account already exists! Redirecting to Login...");
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        console.error("Firebase Registration Error:", firebaseErr);
        throw new Error("Security check failed: " + firebaseErr.message);
      }

      // 2. Register in Backend
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username,
          phone_number: phoneNumber,
          password,
          full_name: fullName,
          firebase_token: token // Send token to backend
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("JSON Parse Error:", jsonErr);
        throw new Error("Invalid server response");
      }

      if (res.ok) {
        toast.success('Registration successful! Logging you in...');

        // AUTO-LOGIN Logic
        if (data.data && data.data.access_token) {
          login(data.data.access_token);
          navigate('/dashboard');
        } else {
          // Fallback if no token returned
          setTimeout(() => navigate('/login'), 1500);
        }
      } else {
        const msg = data.detail || 'Registration failed';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      console.error("Registration Error:", err);
      const msg = err.message || 'Request failed';
      setError(msg);
      toast.error(msg);
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
            <h1 className="text-3xl font-bold text-cyber-text mb-2 tracking-tight">Create Account</h1>
            <p className="text-cyber-muted">Join the secure communication platform</p>
          </div>

          {error && (
            <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-500 rounded-lg text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted w-5 h-5 group-focus-within:text-cyber-primary transition-colors" />
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="glass-input pl-10"
              />
            </div>

            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted w-5 h-5 group-focus-within:text-cyber-primary transition-colors" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="glass-input pl-10"
              />
            </div>

            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted w-5 h-5 group-focus-within:text-cyber-primary transition-colors" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass-input pl-10"
              />
            </div>

            <div className="relative group">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted w-5 h-5 group-focus-within:text-cyber-primary transition-colors" />
              <input
                type="tel"
                placeholder="Mobile Number (e.g. +91 9876543210)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="glass-input pl-10"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted w-5 h-5 group-focus-within:text-cyber-primary transition-colors" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass-input pl-10"
              />
            </div>

            <div className="flex justify-center mt-6">
              <GradientButton text="Sign Up" type="submit" disabled={loading} />
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-cyber-muted">
            Already have an account? <a href="/login" className="text-cyber-primary hover:text-cyber-secondary transition-colors font-medium">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}
