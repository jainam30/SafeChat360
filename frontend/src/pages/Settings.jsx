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
    <div className="bg-white/90 backdrop-blur-md shadow-lg p-6 rounded-2xl mb-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Custom Blocked Words</h2>
      <p className="text-sm text-slate-600 mb-4">Add specific words or phrases to automatically flag.</p>

      <form onSubmit={addTerm} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTerm}
          onChange={e => setNewTerm(e.target.value)}
          placeholder="Enter word to block..."
          className="flex-1 px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !newTerm.trim()}
          className="px-4 py-2 bg-[#12c2e9] text-white font-medium rounded-xl hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2 shadow-md transition-all"
        >
          <Plus size={16} /> Add
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {terms.map(term => (
          <span key={term.id} className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-700 flex items-center gap-2 border border-slate-200 shadow-sm">
            {term.term}
            <button onClick={() => removeTerm(term.id)} className="text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </span>
        ))}
        {terms.length === 0 && <span className="text-sm text-slate-400 italic">No custom rules added.</span>}
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
      <h1 className="text-3xl font-bold text-white mb-6 drop-shadow-md">⚙️ Settings</h1>

      <div className="bg-white/90 backdrop-blur-md shadow-lg p-6 rounded-2xl mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input type="email" value={user?.email || ''} disabled className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
            <input type="text" value={user?.role || ''} disabled className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200" />
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-md shadow-lg p-6 rounded-2xl mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Moderation Settings</h2>
        <div className="space-y-3 text-slate-700">
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="mr-3 w-5 h-5 accent-blue-500 rounded" />
            <span className="font-medium">Auto-flag explicit content</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="mr-3 w-5 h-5 accent-blue-500 rounded" />
            <span className="font-medium">Enable audio transcription</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" className="mr-3 w-5 h-5 accent-blue-500 rounded" />
            <span className="font-medium">Send notifications on flags</span>
          </label>
        </div>
      </div>

      <BlocklistSettings />


      <div className="flex gap-3">
        <button onClick={handleSave} className="px-6 py-2.5 bg-[#12c2e9] text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all">
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
        <button onClick={logout} className="px-6 py-2.5 bg-red-500/10 text-red-600 font-bold border border-red-200 rounded-xl hover:bg-red-500 hover:text-white transition-all">
          Logout
        </button>
      </div>
    </div>
  );
}
