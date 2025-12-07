import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Trash2, Plus } from 'lucide-react';

const BlocklistSettings = () => {
  const { token } = useAuth();
  const [terms, setTerms] = useState([]);
  const [newTerm, setNewTerm] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (token) fetchTerms();
  }, [token]);

  const fetchTerms = async () => {
    try {
      const res = await fetch(getApiUrl('/api/blocklist/'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTerms(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addTerm = async (e) => {
    e.preventDefault();
    if (!newTerm.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/blocklist/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ term: newTerm })
      });
      if (res.ok) {
        setNewTerm('');
        fetchTerms();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeTerm = async (id) => {
    if (!confirm('Remove this term?')) return;
    try {
      const res = await fetch(getApiUrl(`/api/blocklist/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTerms(terms.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-6">
      <h2 className="text-xl font-semibold mb-4">Custom Blocked Words</h2>
      <p className="text-sm text-gray-400 mb-4">Add specific words or phrases to automatically flag.</p>

      <form onSubmit={addTerm} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTerm}
          onChange={e => setNewTerm(e.target.value)}
          placeholder="Enter word to block..."
          className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !newTerm.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Plus size={16} /> Add
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {terms.map(term => (
          <span key={term.id} className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-200 flex items-center gap-2 border border-gray-600">
            {term.term}
            <button onClick={() => removeTerm(term.id)} className="text-gray-400 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </span>
        ))}
        {terms.length === 0 && <span className="text-sm text-gray-500 italic">No custom rules added.</span>}
      </div>
    </div>
  );
};


export default function Settings() {
  const { user, logout } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">⚙️ Settings</h1>

      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input type="email" value={user?.email || ''} disabled className="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded border border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
            <input type="text" value={user?.role || ''} disabled className="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded border border-gray-600" />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Moderation Settings</h2>
        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" /> Auto-flag explicit content
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" /> Enable audio transcription
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" /> Send notifications on flags
          </label>
        </div>
      </div>

      <BlocklistSettings />


      <div className="flex gap-3">
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
        <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Logout
        </button>
      </div>
    </div>
  );
}
