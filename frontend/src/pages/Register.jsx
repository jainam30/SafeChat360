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
  const [countryCode, setCountryCode] = useState('+91');

  const COUNTRY_CODES = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'Australia' },
    { code: '+81', country: 'Japan' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+86', country: 'China' },
    { code: '+7', country: 'Russia' },
    { code: '+971', country: 'UAE' },
    { code: '+65', country: 'Singapore' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate Phone Number
    // Validate Phone Number with Strict Country Code
    const fullPhoneNumber = countryCode + phoneNumber.trim();
    const phoneRegex = /^\+\d{1,4}[0-9\s-]{6,15}$/;

    if (!phoneNumber.trim()) {
      const msg = 'Please enter your mobile number.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    if (!phoneRegex.test(fullPhoneNumber)) {
      const msg = `Invalid Phone Number format. We checked: ${fullPhoneNumber}`;
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
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
        console.error("Firebase Registration Error Details:", firebaseErr);
        if (firebaseErr.code === 'auth/email-already-in-use') {
          toast.success("Account already exists! Redirecting to Login...");
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        if (firebaseErr.code === 'auth/weak-password') {
          throw new Error("Password is too weak. Please use at least 6 characters.");
        }
        if (firebaseErr.code === 'auth/invalid-email') {
          throw new Error("The email address is badly formatted.");
        }
        throw new Error("Security check failed: " + (firebaseErr.message || firebaseErr.code));
      }

      // 2. Register in Backend
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username,
          phone_number: fullPhoneNumber,
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
            <div className="p-4 mb-6 bg-red-900/10 border border-red-500/50 text-red-600 rounded-lg text-sm whitespace-pre-wrap break-words">
              <strong>REGISTRATION FAILED:</strong><br />
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

            <div className="flex gap-2 relative group">
              <div className="relative w-1/3">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="glass-input pl-2 pr-8 appearance-none w-full text-sm"
                  style={{ backgroundImage: 'none' }} // Remove default arrow if needed or keep standard
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} className="text-black">
                      {c.code} ({c.country})
                    </option>
                  ))}
                </select>
                {/* Custom Arrow */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-cyber-muted">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div className="relative w-2/3">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted w-5 h-5 group-focus-within:text-cyber-primary transition-colors" />
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="glass-input pl-10"
                />
              </div>
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
