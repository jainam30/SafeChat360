import React, { useState } from 'react';
import { getApiUrl } from '../config';
import FlaggedContentCard from '../components/FlaggedContentCard';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Upload, Zap, ArrowLeft } from 'lucide-react';

const ImageModeration = () => {
  const [imageFile, setImageFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setResults(null);
    }
  };

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Only base64 data
      reader.onerror = (error) => reject(error);
    });

  const handleModerateImage = async () => {
    if (!imageFile) return;
    setLoading(true);
    const base64Image = await convertToBase64(imageFile);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(getApiUrl('/api/moderate/image-base64'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ image_base64: base64Image }),
      });

      const data = await res.json();
      setResults({ ...data.data, image: URL.createObjectURL(imageFile) });
    } catch (err) {
      console.error('Image moderation error:', err);
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
          <ImageIcon className="text-white" />
          Image Moderation
        </h1>
        <p className="text-white/80 font-medium">Scan images for explicit content, violence, and other unsafe elements.</p>
      </div>

      <div className="bg-white/90 backdrop-blur-md shadow-lg p-8 rounded-2xl mb-8 flex flex-col items-center justify-center border-dashed border-2 border-slate-300 hover:border-blue-500 transition-colors bg-slate-50">
        <input
          type="file"
          accept="image/*"
          id="image-upload"
          onChange={handleImageChange}
          className="hidden"
        />

        {!imageFile ? (
          <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-4 py-8 w-full">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-[#12c2e9] mb-2 shadow-inner">
              <Upload size={36} />
            </div>
            <div className="text-center">
              <p className="text-slate-800 font-bold text-xl">Click to upload an image</p>
              <p className="text-slate-500 text-sm mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
            </div>
          </label>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="relative group max-w-full">
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Preview"
                className="max-h-64 rounded-xl shadow-xl border border-slate-200"
              />
              <label htmlFor="image-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
                <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Change Image</span>
              </label>
            </div>

            <button
              onClick={handleModerateImage}
              className="px-8 py-3 bg-[#12c2e9] text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Scanning...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Moderate Image
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {results && (
        <div className="animate-float">
          <FlaggedContentCard content={results} />
        </div>
      )}
    </div>
  );
};

export default ImageModeration;
