import React, { useState } from 'react';
import { getApiUrl } from '../config';
import FlaggedContentCard from '../components/FlaggedContentCard';
import { useAuth } from '../context/AuthContext';
import { Image as ImageIcon, Upload, Zap } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <ImageIcon className="text-cyber-primary" />
          Image Moderation
        </h1>
        <p className="text-cyber-muted">Scan images for explicit content, violence, and other unsafe elements.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl mb-8 flex flex-col items-center justify-center border-dashed border-2 border-white/10 hover:border-cyber-primary/30 transition-colors bg-black/20">
        <input
          type="file"
          accept="image/*"
          id="image-upload"
          onChange={handleImageChange}
          className="hidden"
        />

        {!imageFile ? (
          <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-cyber-primary/10 flex items-center justify-center text-cyber-primary mb-2">
              <Upload size={32} />
            </div>
            <div className="text-center">
              <p className="text-white font-medium text-lg">Click to upload an image</p>
              <p className="text-cyber-muted text-sm mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
            </div>
          </label>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="relative group">
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Preview"
                className="max-h-64 rounded-lg shadow-2xl border border-white/10"
              />
              <label htmlFor="image-upload" className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                <span className="text-white font-medium">Change Image</span>
              </label>
            </div>

            <button
              onClick={handleModerateImage}
              className="glass-button-primary flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                  Scanning...
                </>
              ) : (
                <>
                  <Zap size={18} />
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
