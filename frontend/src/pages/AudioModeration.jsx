import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Mic, Upload, Zap, Eraser } from 'lucide-react';

export default function AudioModeration() {
  const [file, setFile] = useState(null);
  const [playingUrl, setPlayingUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { token } = useAuth();

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);
      setPlayingUrl(URL.createObjectURL(selectedFile));
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (err) => reject(err);
    });

  const handleModerate = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const audioBase64 = await fileToBase64(file);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(getApiUrl('/api/moderate/audio-base64'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ audio_base64: audioBase64 }),
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
          <Mic className="text-cyber-primary" />
          Audio Moderation
        </h1>
        <p className="text-cyber-muted">Transcribe and analyze audio files for safety violations.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl mb-8">
        <div className="flex flex-col items-center justify-center border-dashed border-2 border-white/10 rounded-xl p-8 bg-black/20 hover:border-cyber-primary/30 transition-colors mb-6">
          <input
            type="file"
            accept="audio/*"
            id="audio-upload"
            onChange={handleChange}
            className="hidden"
          />

          {!file ? (
            <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-cyber-primary/10 flex items-center justify-center text-cyber-primary mb-2">
                <Upload size={32} />
              </div>
              <div className="text-center">
                <p className="text-white font-medium text-lg">Click to upload audio</p>
                <p className="text-cyber-muted text-sm mt-1">MP3, WAV, or OGG</p>
              </div>
            </label>
          ) : (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="flex items-center gap-4 bg-black/40 px-6 py-4 rounded-xl w-full max-w-md border border-white/5">
                <div className="w-10 h-10 rounded-full bg-cyber-primary/20 flex items-center justify-center text-cyber-primary">
                  <Mic size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-cyber-muted text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <label htmlFor="audio-upload" className="text-xs text-cyber-primary hover:text-cyber-secondary cursor-pointer font-medium">
                  Change
                </label>
              </div>

              {playingUrl && (
                <audio controls src={playingUrl} className="w-full max-w-md" />
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={handleModerate}
            disabled={loading || !file}
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
                Moderate Audio
              </>
            )}
          </button>
          <button
            onClick={() => { setFile(null); setResult(null); setPlayingUrl(null); }}
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
