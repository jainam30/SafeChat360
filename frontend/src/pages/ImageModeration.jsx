import React, { useState } from 'react';
import FlaggedContentCard from '../components/FlaggedContentCard';

const ImageModeration = () => {
  const [imageFile, setImageFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
    setResults(null);
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
      const res = await fetch('http://localhost:8000/api/moderate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🖼️ Image Moderation</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="mb-4"
      />

      <button
        onClick={handleModerateImage}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Moderate Image'}
      </button>

      {results && (
        <div className="mt-6">
          <img
            src={results.image}
            alt="Uploaded"
            className="max-w-xs mb-4 rounded"
          />
          <FlaggedContentCard content={results} />
        </div>
      )}
    </div>
  );
};

export default ImageModeration;
