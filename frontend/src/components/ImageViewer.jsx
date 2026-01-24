import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const ImageViewer = ({ src, alt, onClose }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!src) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center animate-fade-in cursor-zoom-out"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 bg-black/50 rounded-full"
            >
                <X size={24} />
            </button>

            <div
                className="relative max-w-full max-h-screen p-4 flex items-center justify-center cursor-default"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image itself? Text says "tapping outside". Usually clicking image does nothing or zooms. Let's stick to outside closes.
            >
                <img
                    src={src}
                    alt={alt || "Full View"}
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-up"
                />
            </div>
        </div>
    );
};

export default ImageViewer;
