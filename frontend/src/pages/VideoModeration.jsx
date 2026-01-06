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
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 drop-shadow-md">
                    <Film className="text-white" />
                    Video Moderation
                </h1>
                <p className="text-white/80 font-medium">Analyze video content for visual and audio violations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload & Preview */}
                <div className="bg-white/90 backdrop-blur-md shadow-lg p-6 rounded-2xl flex flex-col h-full">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-slate-50 transition-all overflow-hidden relative group bg-slate-50"
                    >
                        {previewUrl ? (
                            <video
                                src={previewUrl}
                                className="w-full h-full object-contain"
                                controls
                            />
                        ) : (
                            <div className="text-center p-6">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <Upload size={32} />
                                </div>
                                <p className="text-slate-800 font-bold text-lg">Click to upload video</p>
                                <p className="text-sm text-slate-500 mt-1">MP4, MOV supported</p>
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
                            className="px-6 py-3 bg-[#12c2e9] text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2 w-full justify-center"
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Analyzing Frames & Audio...
                                </>
                            ) : (
                                <>
                                    <Shield size={20} />
                                    Analyze Video
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="bg-white/90 backdrop-blur-md shadow-lg p-6 rounded-2xl h-full flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Analysis Report</h3>

                    {!result && !loading && (
                        <div className="flex-1 flex items-center justify-center text-slate-400 italic text-center p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                            Upload a video and click Analyze<br />to see moderation results
                        </div>
                    )}

                    {loading && (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-20 bg-slate-200 rounded-xl w-full"></div>
                                <div className="h-20 bg-slate-200 rounded-xl w-full"></div>
                            </div>
                            <div className="h-40 bg-slate-200 rounded-xl w-full"></div>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Status Banner */}
                            <div className={`p-4 rounded-xl flex items-center gap-4 shadow-sm border ${result.is_flagged ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                {result.is_flagged ? (
                                    <div className="p-3 bg-red-100 rounded-full text-red-500">
                                        <AlertTriangle size={24} />
                                    </div>
                                ) : (
                                    <div className="p-3 bg-green-100 rounded-full text-green-500">
                                        <Check size={24} />
                                    </div>
                                )}
                                <div>
                                    <h4 className={`text-lg font-bold ${result.is_flagged ? 'text-red-600' : 'text-green-600'}`}>
                                        {result.is_flagged ? 'Content Flagged' : 'Content Safe'}
                                    </h4>
                                    <p className="text-sm text-slate-600">
                                        {result.is_flagged ? 'Violations detected in video or audio.' : 'No inappropriate content detected.'}
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Scanned Frames</div>
                                    <div className="text-2xl font-black text-slate-800">{result.scanned_frames || 0}</div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Issues Found</div>
                                    <div className={`text-2xl font-black ${result.flags?.length > 0 ? 'text-red-500' : 'text-slate-800'}`}>{result.flags?.length || 0}</div>
                                </div>
                            </div>

                            {/* Issues List */}
                            {result.flags?.length > 0 && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                                    <h5 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Detailed Findings</h5>
                                    <div className="space-y-3">
                                        {result.flags.map((flag, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-mono font-bold">
                                                    {flag.timestamp}
                                                </span>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800 uppercase">{flag.type.replace('_', ' ')}</div>
                                                    <div className="text-xs text-slate-500 mt-1">
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
