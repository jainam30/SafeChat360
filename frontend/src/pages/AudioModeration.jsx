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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 drop-shadow-md">
          <Mic className="text-white" />
          Audio Moderation
        </h1>
        <p className="text-white/80 font-medium">Transcribe and analyze audio files for safety violations.</p>
      </div>

      <div className="bg-white/90 backdrop-blur-md shadow-lg p-8 rounded-2xl mb-8">
        <div className="flex flex-col items-center justify-center border-dashed border-2 border-slate-300 rounded-xl p-8 bg-slate-50 hover:border-blue-500 transition-colors mb-6">
          <input
            type="file"
            accept="audio/*"
            id="audio-upload"
            onChange={handleChange}
            className="hidden"
          />

          {!file ? (
            <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center gap-4 w-full">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-[#12c2e9] mb-2 shadow-inner">
                <Upload size={36} />
              </div>
              <div className="text-center">
                <p className="text-slate-800 font-bold text-xl">Click to upload audio</p>
                <p className="text-slate-500 text-sm mt-1">MP3, WAV, or OGG</p>
              </div>
            </label>
          ) : (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-xl w-full max-w-md border border-slate-200 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Mic size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 font-bold truncate">{file.name}</p>
                  <p className="text-slate-500 text-xs font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <label htmlFor="audio-upload" className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-bold uppercase tracking-wide">
                  Change
                </label>
              </div>

              {playingUrl && (
                <audio controls src={playingUrl} className="w-full max-w-md shadow-md rounded-full" />
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={handleModerate}
            disabled={loading || !file}
            className="px-8 py-3 bg-[#12c2e9] text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Analyzing...
              </>
            ) : (
              <>
                <Zap size={20} />
                Moderate Audio
              </>
            )}
          </button>
          <button
            onClick={() => { setFile(null); setResult(null); setPlayingUrl(null); }}
            className="px-8 py-3 bg-slate-100 text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <Eraser size={20} />
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
