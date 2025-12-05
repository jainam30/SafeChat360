import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { FileText, Zap, Eraser } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <FileText className="text-cyber-primary" />
          Text Moderation
        </h1>
        <p className="text-cyber-muted">Analyze text for toxicity, sentiment, and safety violations.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl mb-8">
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text to moderate..."
          className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all resize-none mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={handleModerate}
            disabled={loading || !text.trim()}
            className="glass-button-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
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
            className="glass-button flex items-center gap-2"
          >
            <Eraser size={18} />
            Clear
          </button>
        </div>
      </div>

      {result && (
        <div className="glass-card p-6 animate-float">
          <h3 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2">Analysis Result</h3>
          <pre className="text-sm whitespace-pre-wrap text-cyber-text font-mono overflow-auto bg-black/20 p-4 rounded-lg border border-white/5">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
