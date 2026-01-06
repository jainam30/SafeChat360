import React from 'react';

const sample = [
  { id: 1, type: 'text', summary: 'User post flagged for hate speech', time: '2025-11-20' },
  { id: 2, type: 'image', summary: 'Image flagged for nudity', time: '2025-11-21' },
  { id: 3, type: 'audio', summary: 'Audio flagged for harassment', time: '2025-11-22' },
];

export default function History() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6 drop-shadow-md">📜 Moderation History</h1>
      <div className="space-y-4">
        {sample.map(item => (
          <div key={item.id} className="bg-white/90 backdrop-blur-md shadow-md hover:shadow-lg transition-all p-4 rounded-xl flex justify-between items-center border border-white/50">
            <div>
              <div className="font-bold text-slate-800 text-lg">{item.summary}</div>
              <div className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
                <span className="capitalize px-2 py-0.5 bg-slate-100 rounded text-slate-600 text-xs border border-slate-200">{item.type}</span>
                <span>•</span>
                <span>{item.time}</span>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">ID {item.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
