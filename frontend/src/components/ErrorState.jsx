import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, ShieldAlert, WifiOff, ServerCrash, Frown, Ban } from 'lucide-react';

export default function ErrorState({ type = '404', message, onRetry }) {
    const navigate = useNavigate();

    const ERROR_CONFIG = {
        '404': {
            icon: <Frown size={64} className="text-slate-300 mb-4" />,
            title: 'Page not found',
            desc: message || "The page you're looking for doesn't exist or may have moved.",
            actionText: 'Go to Dashboard',
            onAction: () => navigate('/dashboard')
        },
        '403': {
            icon: <ShieldAlert size={64} className="text-amber-500 mb-4" />,
            title: 'Access denied',
            desc: message || "You don't have permission to access this resource.",
            actionText: 'Go Back',
            onAction: () => navigate(-1)
        },
        '401': {
            icon: <Ban size={64} className="text-red-500 mb-4" />,
            title: 'Session Expired',
            desc: message || "Please log in again to continue.",
            actionText: 'Log In',
            onAction: () => navigate('/login')
        },
        'network': {
            icon: <WifiOff size={64} className="text-slate-400 mb-4" />,
            title: 'Unable to connect',
            desc: message || "Check your connection and try again.",
            actionText: 'Retry',
            onAction: onRetry || (() => window.location.reload())
        },
        '500': {
            icon: <ServerCrash size={64} className="text-red-400 mb-4" />,
            title: 'Server Error',
            desc: message || "Something went wrong on our end. Please try again later.",
            actionText: 'Return Home',
            onAction: () => navigate('/dashboard')
        },
        'unavailable': {
            icon: <AlertOctagon size={64} className="text-slate-400 mb-4" />,
            title: 'Feature unavailable',
            desc: message || "This feature is not currently available in this deployment.",
            actionText: 'Go Back',
            onAction: () => navigate(-1)
        }
    };

    const config = ERROR_CONFIG[type] || ERROR_CONFIG['404'];

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
            {config.icon}
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{config.title}</h1>
            <p className="text-slate-500 max-w-md mb-8">{config.desc}</p>
            {config.onAction && (
                <button 
                    onClick={config.onAction}
                    className="px-6 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                    {config.actionText}
                </button>
            )}
        </div>
    );
}
