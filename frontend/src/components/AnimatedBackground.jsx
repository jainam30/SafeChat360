import React from 'react';
import { Shield, MessageCircle, Lock, Heart, Zap, Star } from 'lucide-react';

const AnimatedBackground = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
            {/* Gradient Mesh */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>

            {/* Floating Stickers */}
            <div className="sticker absolute top-[15%] left-[10%] animate-float-slow text-cyber-primary">
                <Shield size={48} strokeWidth={1.5} />
            </div>

            <div className="sticker absolute top-[25%] right-[15%] animate-float-medium text-purple-400 delay-500">
                <MessageCircle size={64} strokeWidth={1.5} />
            </div>

            <div className="sticker absolute bottom-[20%] left-[20%] animate-float-fast text-pink-400 delay-1000">
                <Lock size={40} strokeWidth={1.5} />
            </div>

            <div className="sticker absolute bottom-[30%] right-[25%] animate-float-slow text-yellow-400 delay-2000">
                <Star size={32} strokeWidth={1.5} />
            </div>

            <div className="sticker absolute top-[50%] left-[50%] animate-spin-slow opacity-10 text-slate-300">
                <Zap size={120} strokeWidth={0.5} />
            </div>

            <div className="sticker absolute top-[10%] right-[40%] animate-bounce-slow text-green-300 delay-1500">
                <Heart size={24} strokeWidth={1.5} />
            </div>
        </div>
    );
};

export default AnimatedBackground;
