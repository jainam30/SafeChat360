import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, FileText, Image as ImageIcon, Users, MessageSquare, Shield, Zap, Lock } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">SafeChat<span className="text-blue-600">360</span></span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-blue-600">Product</a>
          <a href="#" className="hover:text-blue-600">Security</a>
          <a href="#" className="hover:text-blue-600">Features</a>
          <a href="#" className="hover:text-blue-600">Developers</a>
          <a href="#" className="hover:text-blue-600">Pricing</a>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/login')} className="px-5 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">Log in</button>
          <button onClick={() => navigate('/register')} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-[0_4px_14px_0_rgb(37,99,235,0.39)]">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Hero Text */}
          <div className="w-full lg:w-1/2">
            <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-6 flex gap-3">
              <span>Secure</span> • <span>Private</span> • <span>Always Yours</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Private conversations. <br/><span className="text-blue-600">Built for trust.</span>
            </h1>
            <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
              SafeChat360 is a modern, end-to-end encrypted messaging platform that gives you complete control over your conversations, data and privacy.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <button onClick={() => navigate('/register')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-[0_4px_14px_0_rgb(37,99,235,0.39)]">
                Get started free <span>→</span>
              </button>
              <button className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm">
                Explore security
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> End-to-end encrypted</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> No unwanted tracking</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Open and transparent</div>
            </div>
          </div>

          {/* Hero UI Mockup */}
          <div className="w-full lg:w-1/2 relative">
            <div className="absolute inset-0 bg-blue-100/50 rounded-[40px] transform rotate-3 scale-105 -z-10"></div>
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[500px]">
              {/* Fake Window Header */}
              <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
              </div>
              {/* Fake App Interface */}
              <div className="flex flex-1 overflow-hidden">
                <div className="w-16 bg-slate-50 border-r border-slate-100 flex flex-col items-center py-4 space-y-6">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                  </div>
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <Users className="w-5 h-5 text-slate-400" />
                  <Shield className="w-5 h-5 text-slate-400" />
                </div>
                <div className="w-64 border-r border-slate-100 bg-white p-4">
                  <div className="h-8 bg-slate-100 rounded mb-4"></div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                      <div className="w-10 h-10 bg-slate-300 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-3 w-20 bg-slate-800 rounded mb-1"></div>
                        <div className="h-2 w-16 bg-slate-400 rounded"></div>
                      </div>
                    </div>
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-3 w-16 bg-slate-300 rounded mb-1"></div>
                          <div className="h-2 w-24 bg-slate-100 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 bg-slate-50/50 relative flex flex-col">
                  <div className="h-16 border-b border-slate-100 bg-white flex items-center px-6">
                     <div className="h-4 w-32 bg-slate-800 rounded"></div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col gap-4">
                     <div className="self-end bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] text-sm">
                       Yes! I'll share the updated docs in a minute.
                     </div>
                     <div className="self-start bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[80%] text-sm flex items-center gap-3 shadow-sm">
                       <div className="w-8 h-8 bg-red-100 text-red-600 rounded flex items-center justify-center"><FileText className="w-4 h-4" /></div>
                       <div><p className="font-bold">Project_Plan_v2.pdf</p><p className="text-xs text-slate-400">2.4 MB</p></div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-0.5 flex items-center gap-1">End-to-end encryption <span className="text-slate-300">→</span></h3>
              <p className="text-xs text-slate-500 leading-relaxed">Your messages, calls and files stay between you and the people you chat with.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-0.5 flex items-center gap-1">Private by design <span className="text-slate-300">→</span></h3>
              <p className="text-xs text-slate-500 leading-relaxed">No unwanted tracking, no ads, and no third-party access. Your privacy comes first.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-0.5 flex items-center gap-1">Fast & reliable <span className="text-slate-300">→</span></h3>
              <p className="text-xs text-slate-500 leading-relaxed">Real-time messaging with a smooth and responsive experience across all your devices.</p>
            </div>
          </div>
        </div>

        {/* Bottom Detailed Section */}
        <div className="mt-16 flex flex-col lg:flex-row gap-12 items-end">
          <div className="lg:w-1/3">
            <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">Features</div>
            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight mb-4">More than just messaging. A safer way to stay connected.</h2>
            <p className="text-sm text-slate-600 leading-relaxed">Everything you need for secure and seamless communication, all in one place.</p>
          </div>
          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><Users className="w-5 h-5"/></div>
                 <div>
                   <h4 className="font-bold text-slate-900 text-sm">Group chats</h4>
                   <p className="text-xs text-slate-500">Connect and collaborate securely.</p>
                 </div>
               </div>
               <div className="mt-auto bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                 <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">PT</div>
                 <div>
                   <p className="text-xs font-bold text-slate-800">Project Team</p>
                   <p className="text-[10px] text-slate-400">12 members</p>
                 </div>
               </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><ImageIcon className="w-5 h-5"/></div>
                 <div>
                   <h4 className="font-bold text-slate-900 text-sm">Media sharing</h4>
                   <p className="text-xs text-slate-500">Share photos & videos privately.</p>
                 </div>
               </div>
               <div className="mt-auto flex gap-2">
                 <div className="h-16 flex-1 bg-slate-200 rounded-lg"></div>
                 <div className="h-16 flex-1 bg-slate-200 rounded-lg"></div>
               </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
