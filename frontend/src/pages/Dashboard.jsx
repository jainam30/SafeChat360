// Dashboard with flagged content
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import FlaggedContentCard from '../components/FlaggedContentCard';
import { Shield, Activity, Zap } from 'lucide-react';

const Dashboard = () => {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleModerateText = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(getApiUrl('/api/moderate/text'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: inputText }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.data) {
        setResults({ ...data.data, text: inputText });
      } else {
        console.error('Invalid response structure:', data);
      }
    } catch (err) {
      console.error('Moderation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Shield className="text-cyber-primary" />
          SafeChat360 Dashboard
        </h1>
        <p className="text-cyber-muted">Real-time content moderation and threat detection.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={48} />
          </div>
          <h3 className="text-cyber-muted text-sm font-medium uppercase tracking-wider mb-1">System Status</h3>
          <div className="text-2xl font-bold text-cyber-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse"></span>
            Operational
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={48} />
          </div>
          <h3 className="text-cyber-muted text-sm font-medium uppercase tracking-wider mb-1">Response Time</h3>
          <div className="text-2xl font-bold text-white">~45ms</div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield size={48} />
          </div>
          <h3 className="text-cyber-muted text-sm font-medium uppercase tracking-wider mb-1">Active Filters</h3>
          <div className="text-2xl font-bold text-white">All Enabled</div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-cyber-primary rounded-full"></div>
          Quick Moderation Check
        </h2>

        <div className="relative">
          <textarea
            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all resize-none"
            rows={4}
            placeholder="Enter text to analyze for toxicity, hate speech, or other violations..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="absolute bottom-3 right-3">
            <button
              onClick={handleModerateText}
              disabled={loading || !inputText.trim()}
              className="glass-button-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                  Checking...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Analyze Text
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {results && (
        <div className="animate-float">
          <FlaggedContentCard content={results} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
