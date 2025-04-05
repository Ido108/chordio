'use client';

import React from 'react';
import { ChordResult } from '@/lib/chordDetection'; // Import the interface

interface ChordDisplayProps {
  chords: ChordResult[];
  currentTime: number; // Current playback time in seconds
  onChordClick?: (time: number) => void; // Optional: Callback when a chord is clicked
}

const ChordDisplay: React.FC<ChordDisplayProps> = ({ chords, currentTime, onChordClick }) => {
  if (!chords || chords.length === 0) {
    return null; // Don't render anything if there are no chords
  }

  // Function to format time (e.g., 65.3 seconds -> 1:05.3)
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.round((timeInSeconds - Math.floor(timeInSeconds)) * 10); // One decimal place
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
  };

  return (
    <div className="mt-6 p-4 border rounded shadow-md w-full max-w-2xl">
      <h2 className="text-xl font-semibold mb-3">Detected Chords</h2>
      <div className="max-h-60 overflow-y-auto pr-2"> {/* Scrollable area */}
        <ul className="space-y-1">
          {chords.map((chord, index) => {
            const isActive = currentTime >= chord.start && currentTime < chord.end;
            const itemClasses = `
              p-2 rounded flex justify-between items-center text-sm transition-colors duration-150
              ${isActive
                ? 'bg-blue-200 dark:bg-blue-800 font-semibold'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
              ${onChordClick ? 'cursor-pointer' : ''}
            `;

            return (
              <li
                key={`${chord.chord}-${chord.start}-${index}`}
                className={itemClasses}
                onClick={() => onChordClick?.(chord.start)} // Call callback on click
                title={`Click to jump to ${formatTime(chord.start)}`}
              >
                <span className="w-1/3 font-mono text-lg">{chord.chord}</span>
                <span className="w-2/3 text-right text-xs font-mono text-gray-600 dark:text-gray-400">
                  {formatTime(chord.start)} - {formatTime(chord.end)}
                  <span className="ml-2">({(chord.end - chord.start).toFixed(2)}s)</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
       {chords.length > 10 && (
           <p className="text-xs text-gray-500 mt-2 text-center">Scroll for more chords</p>
       )}
    </div>
  );
};

export default ChordDisplay;
