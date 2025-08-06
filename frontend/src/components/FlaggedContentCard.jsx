// Component to display flagged content
import React from 'react';

const FlaggedContentCard = ({ content }) => {
  return (
    <div className="border p-4 rounded shadow bg-white">
      <p className="text-gray-700 mb-2"><strong>Text:</strong> {content.text}</p>

      {content.flags.length > 0 ? (
        <div>
          <h3 className="text-red-600 font-semibold mb-2">⚠️ Flags:</h3>
          <ul className="list-disc list-inside text-sm text-gray-800">
            {content.flags.map((flag, i) => (
              <li key={i}>
                {flag.label.toUpperCase()} — Confidence: {flag.score}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-green-600">✅ No issues detected</p>
      )}
    </div>
  );
};

export default FlaggedContentCard;
