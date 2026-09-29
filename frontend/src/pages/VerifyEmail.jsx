import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowLeft, Users, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../config';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'you@example.com';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(28);
  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      // Paste logic
      const pasted = value.slice(0, 6).split('');
      const newCode = [...code];
      pasted.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex].focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && index > 0 && code[index] === '') {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/auth/verify-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });
      
      if (response.ok) {
        toast.success('Email verified successfully!');
        navigate('/login');
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Verification failed');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">SafeChat<span className="text-blue-600">360</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="/" className="hover:text-blue-600">Home</a>
          <a href="#" className="hover:text-blue-600">Features</a>
          <a href="#" className="hover:text-blue-600">Security</a>
          <a href="#" className="hover:text-blue-600">Pricing</a>
          <a href="/help" className="hover:text-blue-600">About</a>
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-lg bg-white shadow-sm">Log in</button>
          <button onClick={() => navigate('/register')} className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg">Create account</button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto pt-24 px-6 gap-12 lg:gap-24">
        
        {/* Left Side: Marketing Copy */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 relative pb-12">
          <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4 flex gap-3">
            <span>Secure</span> • <span>Private</span> • <span>Always Yours</span>
          </div>
          
          <h1 className="text-5xl font-extrabold text-slate-900 leading-[1.1] mb-6">
            Verify your email, <br />one step closer <br />to <span className="text-blue-600">safer chats.</span>
          </h1>
          
          <p className="text-lg text-slate-600 mb-10 max-w-md">
            We've sent a verification link (or code) to your email address. This helps us keep your account secure and protect your data.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Confirms it's really you</h3>
                <p className="text-sm text-slate-500">Helps us keep your account safe.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Prevents unauthorized access</h3>
                <p className="text-sm text-slate-500">Only you can sign in.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">A more secure community</h3>
                <p className="text-sm text-slate-500">Real people, real conversations.</p>
              </div>
            </div>
          </div>
          
          <div className="absolute -bottom-10 -right-20 w-[120%] opacity-20 pointer-events-none -z-10 bg-gradient-to-tr from-blue-100 to-transparent h-64 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end py-12 z-10">
          <div className="bg-white w-full max-w-md p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            
            <div className="flex justify-center mb-6">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                   <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                 </div>
                 <span className="text-xl font-bold text-slate-900 tracking-tight">SafeChat<span className="text-blue-600">360</span></span>
               </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Verify your email</h2>
            <p className="text-sm text-slate-500 text-center mb-8 px-4">
              We've sent a 6-digit verification code to <br/><span className="font-semibold text-slate-700">{email}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 text-center block">Enter verification code</label>
                <div className="flex justify-center gap-2 md:gap-3">
                  {code.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => inputRefs.current[idx] = el}
                      type="text"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              <div className="text-center text-sm text-slate-500">
                Didn't receive the code?{' '}
                {countdown > 0 ? (
                  <span className="text-blue-600 font-medium">Resend in 00:{countdown.toString().padStart(2, '0')}</span>
                ) : (
                  <button type="button" onClick={() => setCountdown(30)} className="text-blue-600 font-bold hover:underline">Resend now</button>
                )}
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                Verify email {!loading && <span className="text-lg leading-none">→</span>}
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button type="button" className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="text-center mt-6">
                <button type="button" onClick={() => navigate('/login')} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1.5 mx-auto">
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
