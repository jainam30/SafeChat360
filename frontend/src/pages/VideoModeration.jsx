import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Upload, AlertTriangle, Check, Play, Film } from 'lucide-react';
import { getApiUrl } from '../config';
import FlaggedContentCard from '../components/FlaggedContentCard';

const VideoModeration = () => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);
    const { token } = useAuth();

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
            setResult(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(getApiUrl('/api/moderate/video'), {
                method: 'POST',
                headers,
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error("Server API Error:", res.status, res.statusText, errData);
                throw new Error(errData.detail || 'Analysis failed');
            }

            const data = await res.json();
            if (data.data?.error) {
                throw new Error(data.data.error);
            }
            setResult(data.data);
        } catch (err) {
            console.error("Full error object:", err);
            alert(`Error analyzing video: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Film className="text-cyber-primary" />
                    Video Moderation
                </h1>
                <p className="text-cyber-muted">Analyze video content for visual and audio violations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload & Preview */}
                <div className="glass-panel p-6 rounded-2xl">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/20 rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-cyber-primary/50 hover:bg-white/5 transition-all overflow-hidden relative group"
                    >
                        {previewUrl ? (
                            <video
                                src={previewUrl}
                                className="w-full h-full object-contain"
                                controls
                            />
                        ) : (
                            <div className="text-center p-6">
                                <Upload size={48} className="mx-auto text-cyber-muted mb-4 group-hover:text-cyber-primary transition-colors" />
                                <p className="text-white font-medium">Click to upload video</p>
                                <p className="text-sm text-cyber-muted mt-1">MP4, MOV supported</p>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="video/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleAnalyze}
                            disabled={!file || loading}
                            className="glass-button-primary disabled:opacity-50 flex items-center gap-2 w-full justify-center py-3"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                    Analyzing Frames & Audio...
                                </>
                            ) : (
                                <>
                                    <Shield size={18} />
                                    Analyze Video
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="glass-panel p-6 rounded-2xl h-full">
                    <h3 className="text-xl font-semibold text-white mb-4">Analysis Report</h3>

                    {!result && !loading && (
                        <div className="h-48 flex items-center justify-center text-cyber-muted text-center italic">
                            Upload a video and click Analyze<br />to see moderation results
                        </div>
                    )}

                    {loading && (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-10 bg-white/5 rounded-lg w-full"></div>
                            <div className="h-4 bg-white/5 rounded w-3/4"></div>
                            <div className="h-4 bg-white/5 rounded w-1/2"></div>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6">
                            {/* Status Banner */}
                            <div className={`p-4 rounded-xl flex items-center gap-4 ${result.is_flagged ? 'bg-red-500/20 border border-red-500/30' : 'bg-green-500/20 border border-green-500/30'}`}>
                                {result.is_flagged ? (
                                    <AlertTriangle className="text-red-400" size={32} />
                                ) : (
                                    <Check className="text-green-400" size={32} />
                                )}
                                <div>
                                    <h4 className={`text-lg font-bold ${result.is_flagged ? 'text-red-400' : 'text-green-400'}`}>
                                        {result.is_flagged ? 'Content Flagged' : 'Content Safe'}
                                    </h4>
                                    <p className="text-sm text-white/70">
                                        {result.is_flagged ? 'Violations detected in video or audio.' : 'No inappropriate content detected.'}
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/20 p-3 rounded-lg">
                                    <div className="text-xs text-cyber-muted uppercase">Scanned Frames</div>
                                    <div className="text-xl font-bold text-white">{result.scanned_frames || 0}</div>
                                </div>
                                <div className="bg-black/20 p-3 rounded-lg">
                                    <div className="text-xs text-cyber-muted uppercase">Issues Found</div>
                                    <div className="text-xl font-bold text-white">{result.flags?.length || 0}</div>
                                </div>
                            </div>

                            {/* Issues List */}
                            {result.flags?.length > 0 && (
                                <div className="bg-black/20 p-4 rounded-xl max-h-[300px] overflow-y-auto custom-scrollbar">
                                    <h5 className="text-sm font-medium text-cyber-muted mb-3 uppercase tracking-wider">Detailed Findings</h5>
                                    <div className="space-y-3">
                                        {result.flags.map((flag, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                <span className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded font-mono">
                                                    {flag.timestamp}
                                                </span>
                                                <div>
                                                    <div className="text-sm font-bold text-white uppercase">{flag.type.replace('_', ' ')}</div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {flag.details?.map(d => d.label || d.reason).join(', ') || 'Unspecified violation'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoModeration;
