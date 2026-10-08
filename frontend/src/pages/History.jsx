import React from 'react';

const sample = [
  { id: 1, type: 'text', summary: 'User post flagged for hate speech', time: '2025-11-20' },
  { id: 2, type: 'image', summary: 'Image flagged for nudity', time: '2025-11-21' },
  { id: 3, type: 'audio', summary: 'Audio flagged for harassment', time: '2025-11-22' },
];

export default function History(){
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📜 Moderation History</h1>
      <div className="space-y-3">
        {sample.map(item => (
          <div key={item.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <div className="font-semibold">{item.summary}</div>
              <div className="text-sm text-gray-500">Type: {item.type} · {item.time}</div>
            </div>
            <div className="text-xs text-gray-400">ID {item.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
