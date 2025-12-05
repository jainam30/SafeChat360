// Component to display flagged content
import React from 'react';

const FlaggedContentCard = ({ content }) => {
  if (!content) return null;
  
  const flags = content.flags || [];
  const text = content.text || '';
  
  return (
    <div className="border p-4 rounded shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
      {text && (
        <p className="text-gray-700 dark:text-slate-100 mb-4">
          <strong>Text:</strong> {text.substring(0, 500)}{text.length > 500 ? '...' : ''}
        </p>
      )}

      {flags && flags.length > 0 ? (
        <div>
          <h3 className="text-red-600 dark:text-red-400 font-semibold mb-2">⚠️ Flags ({flags.length}):</h3>
          <ul className="list-disc list-inside text-sm text-gray-800 dark:text-slate-100 space-y-1">
            {flags.map((flag, i) => {
              const label = flag.label || 'UNKNOWN';
              const score = flag.score !== undefined ? (typeof flag.score === 'number' ? flag.score.toFixed(3) : flag.score) : 'N/A';
              const matched = flag.matched_words ? flag.matched_words.join(', ') : null;
              return (
                <li key={i}>
                  <strong>{label}</strong> — {matched ? `Words: ${matched}, ` : ''}Confidence: {score}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-green-600 dark:text-green-400">✅ No issues detected</p>
      )}
    </div>
  );
};

export default FlaggedContentCard;
