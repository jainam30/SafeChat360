import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config';
import { Shield, User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username,
          phone_number: phoneNumber,
          password,
          full_name: fullName
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Registration successful! Please login.');
        navigate('/login');
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      setError('Request failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-cyber-black">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyber-primary/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyber-secondary/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 p-4">
        <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyber-primary to-cyber-secondary p-[1px] mb-4 shadow-lg shadow-cyber-primary/20">
              <div className="w-full h-full rounded-2xl bg-cyber-card flex items-center justify-center">
                <Shield size={32} className="text-cyber-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
            <p className="text-cyber-muted">Join the secure communication platform</p>
          </div>

          {error && (
            <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
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
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all"
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
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all"
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
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all"
              />
            </div>

            <div className="relative group">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted w-5 h-5 group-focus-within:text-cyber-primary transition-colors" />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all"
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
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyber-primary to-cyber-secondary text-black font-bold rounded-xl hover:opacity-90 hover:shadow-[0_0_20px_rgba(18,196,148,0.3)] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-cyber-muted">
            Already have an account? <a href="/login" className="text-cyber-primary hover:text-cyber-secondary transition-colors font-medium">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}
