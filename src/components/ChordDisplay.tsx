"use client";

import React from 'react';

// Re-use the ChordResult interface (or import if moved to a types file)
interface ChordResult {
  startTime: number;
  endTime: number;
  chord: string;
}

interface ChordDisplayProps {
  chords: ChordResult[];
  title?: string;
}

const ChordDisplay: React.FC<ChordDisplayProps> = ({ chords, title }) => {
  if (!chords || chords.length === 0) {
    return null; // Don't render anything if no chords
  }

  return (
    <div className="mt-8 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
      {title && <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>}
      <h4 className="text-md font-medium mb-2 text-gray-700">Detected Chords:</h4>
      <ul className="space-y-1 max-h-60 overflow-y-auto">
        {chords.map((chord, index) => (
          <li key={index} className="text-sm text-gray-600 p-1 rounded hover:bg-gray-100">
            <span className="font-mono inline-block w-28">
              [{chord.startTime.toFixed(2)}s - {chord.endTime.toFixed(2)}s]
            </span>
            <span className="font-semibold ml-2">{chord.chord}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChordDisplay;
