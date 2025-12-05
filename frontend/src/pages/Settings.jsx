import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings(){
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
