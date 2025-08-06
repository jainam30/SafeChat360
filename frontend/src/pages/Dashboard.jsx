// Dashboard with flagged content
import React, { useState } from 'react';
import FlaggedContentCard from '../components/FlaggedContentCard';

const Dashboard = () => {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleModerateText = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/moderate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await res.json();
      setResults(data.data);
    } catch (err) {
      console.error('Moderation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🛡️ SafeChat360 Dashboard</h1>

      <textarea
        className="w-full p-3 border rounded text-gray-800"
        rows={4}
        placeholder="Type some user message here..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <button
        onClick={handleModerateText}
        className="mt-3 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
        disabled={loading}
      >
        {loading ? 'Checking...' : 'Moderate Text'}
      </button>

      {results && (
        <div className="mt-6">
          <FlaggedContentCard content={results} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
