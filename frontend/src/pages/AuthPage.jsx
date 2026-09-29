import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Shield, Users, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { getApiUrl } from '../config';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  // Switch between login and register based on pathname
  React.useEffect(() => {
    if (location.pathname === '/register') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [location.pathname]);

  const toggleAuthMode = () => {
    navigate(isLogin ? '/register' : '/login');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!isLogin && !formData.agreeTerms) {
      toast.error('You must agree to the Terms of Service');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Successfully logged in!');
        navigate('/dashboard');
      } else {
        const response = await fetch(getApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            username: formData.username,
            full_name: formData.fullName
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          toast.success('Account created! Please verify your email.');
          navigate('/verify-email', { state: { email: formData.email } });
        } else {
          toast.error(data.detail || 'Registration failed');
        }
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
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">SafeChat<span className="text-blue-600">360</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="/" className="hover:text-blue-600">Home</a>
          <a href="#" className="hover:text-blue-600">Features</a>
          <a href="#" className="hover:text-blue-600">Security</a>
          <a href="#" className="hover:text-blue-600">Pricing</a>
          <a href="/help" className="hover:text-blue-600">Help</a>
        </nav>
        <div className="flex items-center gap-4">
          {!isLogin && <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-lg bg-white shadow-sm">Log in</button>}
          {isLogin && <button onClick={() => navigate('/register')} className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg">Create account</button>}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto pt-24 px-6 gap-12 lg:gap-24">
        
        {/* Left Side: Marketing Copy */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 relative pb-12">
          <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4 flex gap-3">
            <span>Secure</span> • <span>Private</span> • <span>Always Yours</span>
          </div>
          
          <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-6">
            {isLogin ? (
              <>Conversations <br />that stay <span className="text-blue-600">yours.</span></>
            ) : (
              <>Join SafeChat<span className="text-blue-600">360</span></>
            )}
          </h1>
          
          <p className="text-lg text-slate-600 mb-10 max-w-md">
            {isLogin ? 
              "SafeChat360 gives you a secure and private space to chat, share and collaborate — with end-to-end encryption and complete control over your data." : 
              "Create your account and start secure conversations with your friends, family or team. Your privacy comes first."
            }
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">End-to-end encrypted</h3>
                <p className="text-sm text-slate-500">Only you and the people you chat with can read your messages.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Private group chats</h3>
                <p className="text-sm text-slate-500">Connect and collaborate securely.</p>
              </div>
            </div>
            {!isLogin && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">No unwanted tracking</h3>
                  <p className="text-sm text-slate-500">No ads, no third-party access.</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Faded Laptop Illustration Placeholder */}
          <div className="absolute -bottom-10 -right-20 w-[120%] opacity-20 pointer-events-none -z-10 bg-gradient-to-tr from-blue-100 to-transparent h-64 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end py-12 z-10">
          <div className="bg-white w-full max-w-md p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            
            <div className="flex justify-center mb-6">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                   <MessageCircle className="w-5 h-5 text-white" />
                 </div>
                 <span className="text-xl font-bold text-slate-900 tracking-tight">SafeChat<span className="text-blue-600">360</span></span>
               </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-slate-500 text-center mb-8">
              {isLogin ? 'Sign in to continue to your secure space.' : 'Join a safer and more private chat experience.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {!isLogin && (
                <div className="flex gap-4">
                  <div className="w-1/2 space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Full name</label>
                    <div className="relative">
                      <input 
                        type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                        placeholder="Enter your full name"
                      />
                      <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="w-1/2 space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Username</label>
                    <div className="relative">
                      <input 
                        type="text" name="username" value={formData.username} onChange={handleInputChange} required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                        placeholder="Choose a username"
                      />
                      <span className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium">@</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Email address</label>
                <div className="relative">
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleInputChange} required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                    placeholder="you@example.com"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 4 10 8 10-8"/></svg>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                    placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Confirm password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                      placeholder="Confirm your password"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {isLogin ? (
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" className="peer sr-only" />
                      <div className="w-4 h-4 border-2 border-slate-300 rounded bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                      <Check className="w-3 h-3 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 select-none">Remember me</span>
                  </label>
                  <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  <label className="flex items-start gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleInputChange} className="peer sr-only" />
                      <div className="w-4 h-4 border-2 border-slate-300 rounded bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                      <Check className="w-3 h-3 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <span className="text-sm text-slate-600 leading-tight">
                      I agree to the <a href="#" className="text-blue-600 font-medium hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 font-medium hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                </div>
              )}

              <button 
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-6"
              >
                {isLogin ? 'Sign in' : 'Create account'} 
                {!loading && <span className="text-lg leading-none">→</span>}
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button type="button" className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="text-center mt-6">
                <span className="text-sm text-slate-500">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button type="button" onClick={toggleAuthMode} className="text-sm font-bold text-blue-600 hover:text-blue-700">
                  {isLogin ? 'Create account' : 'Sign in'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
      
      {/* Bottom Security Badge */}
      <div className="absolute bottom-6 right-6 lg:right-24 hidden md:flex items-center gap-3 bg-green-50 px-4 py-3 rounded-xl border border-green-100">
        <ShieldCheck className="w-6 h-6 text-green-600" />
        <div>
          <p className="text-sm font-bold text-green-800">Your data is protected with end-to-end encryption.</p>
          <p className="text-xs text-green-600">We never read your messages.</p>
        </div>
      </div>
    </div>
  );
}

// Quick MessageCircle mock to avoid extra lucide-react imports if it's missing in some versions
function MessageCircle(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  );
}
