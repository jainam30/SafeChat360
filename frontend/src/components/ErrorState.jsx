import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AlertOctagon, ShieldAlert, WifiOff, ServerCrash, Frown, 
    Ban, MessageSquare, Users, Image as ImageIcon, Search, Bookmark
} from 'lucide-react';

export default function ErrorState({ type = '404', title, message, onRetry, actionText }) {
    const navigate = useNavigate();

    const ERROR_CONFIG = {
        '404': {
            icon: <Frown size={64} className="text-slate-300" strokeWidth={1.5} />,
            title: title || 'Page not found',
            desc: message || "The page you're looking for doesn't exist or may have been moved.",
            actionText: actionText || 'Go to Dashboard',
            onAction: () => navigate('/dashboard'),
            bgColor: 'bg-slate-50',
            iconColor: 'bg-white border-slate-200 text-slate-400'
        },
        '403': {
            icon: <ShieldAlert size={64} className="text-amber-500" strokeWidth={1.5} />,
            title: title || 'Access denied',
            desc: message || "You don't have permission to access this resource.",
            actionText: actionText || 'Go Back',
            onAction: () => navigate(-1),
            bgColor: 'bg-amber-50/30',
            iconColor: 'bg-amber-50 border-amber-200 text-amber-500'
        },
        '401': {
            icon: <Ban size={64} className="text-red-500" strokeWidth={1.5} />,
            title: title || 'Session Expired',
            desc: message || "Please log in again to continue securely.",
            actionText: actionText || 'Log In',
            onAction: () => navigate('/login'),
            bgColor: 'bg-red-50/30',
            iconColor: 'bg-red-50 border-red-200 text-red-500'
        },
        'network': {
            icon: <WifiOff size={64} className="text-slate-400" strokeWidth={1.5} />,
            title: title || 'No Internet Connection',
            desc: message || "Please check your network settings and try again.",
            actionText: actionText || 'Try Again',
            onAction: onRetry || (() => window.location.reload()),
            bgColor: 'bg-slate-50',
            iconColor: 'bg-white border-slate-200 text-slate-400'
        },
        '500': {
            icon: <ServerCrash size={64} className="text-red-400" strokeWidth={1.5} />,
            title: title || 'Server Error',
            desc: message || "Something went wrong on our end. Please try again later.",
            actionText: actionText || 'Return Home',
            onAction: () => navigate('/dashboard'),
            bgColor: 'bg-red-50/30',
            iconColor: 'bg-white border-red-100 text-red-400'
        },
        'empty-chats': {
            icon: <MessageSquare size={64} className="text-blue-300" strokeWidth={1.5} />,
            title: title || 'No conversations yet',
            desc: message || "Start a new conversation to connect with your friends.",
            actionText: actionText || 'Start Chat',
            onAction: onRetry,
            bgColor: 'bg-blue-50/30',
            iconColor: 'bg-blue-50 border-blue-100 text-blue-500'
        },
        'empty-friends': {
            icon: <Users size={64} className="text-indigo-300" strokeWidth={1.5} />,
            title: title || 'No friends added',
            desc: message || "Search for people you know and add them to your contacts.",
            actionText: actionText || 'Find Friends',
            onAction: onRetry,
            bgColor: 'bg-indigo-50/30',
            iconColor: 'bg-indigo-50 border-indigo-100 text-indigo-500'
        },
        'empty-media': {
            icon: <ImageIcon size={64} className="text-emerald-300" strokeWidth={1.5} />,
            title: title || 'No media found',
            desc: message || "Upload photos or videos to start building your gallery.",
            actionText: actionText || 'Upload Media',
            onAction: onRetry,
            bgColor: 'bg-emerald-50/30',
            iconColor: 'bg-emerald-50 border-emerald-100 text-emerald-500'
        },
        'empty-saved': {
            icon: <Bookmark size={64} className="text-purple-300" strokeWidth={1.5} />,
            title: title || 'No saved items',
            desc: message || "Items you save will appear here for easy access.",
            actionText: actionText || 'Explore Posts',
            onAction: onRetry || (() => navigate('/dashboard')),
            bgColor: 'bg-purple-50/30',
            iconColor: 'bg-purple-50 border-purple-100 text-purple-500'
        },
        'empty-search': {
            icon: <Search size={64} className="text-slate-300" strokeWidth={1.5} />,
            title: title || 'No results found',
            desc: message || "We couldn't find anything matching your search. Try different keywords.",
            actionText: actionText || 'Clear Search',
            onAction: onRetry,
            bgColor: 'bg-slate-50',
            iconColor: 'bg-white border-slate-200 text-slate-400'
        },
        'unavailable': {
            icon: <AlertOctagon size={64} className="text-slate-400" strokeWidth={1.5} />,
            title: title || 'Feature unavailable',
            desc: message || "This feature is currently being updated. Check back soon.",
            actionText: actionText || 'Go Back',
            onAction: () => navigate(-1),
            bgColor: 'bg-slate-50',
            iconColor: 'bg-white border-slate-200 text-slate-400'
        }
    };

    const config = ERROR_CONFIG[type] || ERROR_CONFIG['404'];

    return (
        <div className={`flex flex-col items-center justify-center min-h-[70vh] p-6 text-center w-full rounded-2xl ${config.bgColor}`}>
            <div className={`w-32 h-32 rounded-full border-[6px] border-white/60 shadow-sm flex items-center justify-center mb-6 relative overflow-hidden ${config.iconColor}`}>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                {config.icon}
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">{config.title}</h1>
            <p className="text-slate-500 max-w-sm mb-8 text-sm font-medium leading-relaxed">{config.desc}</p>
            
            {config.onAction && (
                <button 
                    onClick={config.onAction}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                    {config.actionText}
                </button>
            )}
        </div>
    );
}
