import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { FileText, Zap, Eraser, ArrowLeft } from 'lucide-react';

export default function TextModeration() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleModerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(getApiUrl('/api/moderate/text'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/moderation" className="inline-flex items-center gap-2 text-cyber-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft size={20} />
        Back to Tools
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 drop-shadow-md">
          <FileText className="text-white" />
          Text Moderation
        </h1>
        <p className="text-white/80 font-medium">Analyze text for toxicity, sentiment, and safety violations.</p>
      </div>

      <div className="bg-white/90 backdrop-blur-md shadow-lg p-6 rounded-2xl mb-8">
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text to moderate..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none mb-4 shadow-inner"
        />

        <div className="flex gap-3">
          <button
            onClick={handleModerate}
            disabled={loading || !text.trim()}
            className="px-6 py-2.5 bg-[#12c2e9] text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Analyzing...
              </>
            ) : (
              <>
                <Zap size={18} />
                Moderate Text
              </>
            )}
          </button>
          <button
            onClick={() => { setText(''); setResult(null); }}
            className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <Eraser size={18} />
            Clear
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white/90 backdrop-blur-md shadow-lg p-6 rounded-2xl animate-float border border-white/50">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Analysis Result</h3>
          <pre className="text-sm whitespace-pre-wrap text-slate-700 font-mono overflow-auto bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-inner">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
