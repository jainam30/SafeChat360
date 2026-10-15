import React, { useRef } from 'react';
import { Image, Globe, Users, Lock, X, Send } from 'lucide-react';

export default function ChatBotCard({
  content,
  onChange,
  onFileSelect,
  onSubmit,
  loading,
  mediaPreview,
  privacy,
  onPrivacyToggle,
  onClearMedia
}) {
  const fileInputRef = useRef(null);

  const getPrivacyDetails = () => {
    switch (privacy) {
      case 'friends':
        return { label: 'Friends', icon: <Users size={14} className="text-blue-500" /> };
      case 'private':
        return { label: 'Only Me', icon: <Lock size={14} className="text-amber-500" /> };
      default:
        return { label: 'Public', icon: <Globe size={14} className="text-emerald-500" /> };
    }
  };

  const privacyDetails = getPrivacyDetails();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <div className="relative">
        <textarea
          id="chat_bot"
          name="chat_bot"
          rows={3}
          placeholder="Share something with your community or network..."
          value={content}
          onChange={onChange}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-transparent focus:ring-0 outline-none resize-none transition-all leading-relaxed"
        />

        {mediaPreview && (
          <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 max-h-60 bg-slate-900 group">
            <img 
              src={mediaPreview} 
              alt="Upload Preview" 
              className="w-full h-48 object-cover group-hover:opacity-95 transition-opacity" 
            />
            <button 
              type="button"
              onClick={onClearMedia} 
              className="absolute top-2 right-2 w-7 h-7 bg-slate-900/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md backdrop-blur-sm"
              title="Remove media"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Add Media Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Attach image or video"
          >
            <Image size={16} className="text-blue-500" />
            <span className="hidden sm:inline">Photo / Media</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*" 
            onChange={onFileSelect} 
          />

          {/* Privacy Toggle Button */}
          <button
            type="button"
            onClick={onPrivacyToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Toggle visibility"
          >
            {privacyDetails.icon}
            <span>{privacyDetails.label}</span>
          </button>
        </div>

        {/* Post Button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || (!content.trim() && !mediaPreview)}
          className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow"
        >
          {loading ? (
            <span className="animate-pulse">Posting...</span>
          ) : (
            <>
              <span>Post</span>
              <Send size={13} className="-mr-0.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
