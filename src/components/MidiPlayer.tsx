"use client";

import React, { useState, useEffect } from 'react';
// import * as Tone from 'tone'; // Import Tone.js if using it for playback

interface MidiPlayerProps {
  midiDataUri: string | null; // Expect base64 data URI from midiUtils
  title?: string;
}

const MidiPlayer: React.FC<MidiPlayerProps> = ({ midiDataUri, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clean up playback when component unmounts or midiDataUri changes
    return () => {
      // TODO: Stop any ongoing Tone.js playback here
      // Tone.Transport.stop();
      // Tone.Transport.cancel();
      setIsPlaying(false);
    };
  }, [midiDataUri]);

  const handlePlay = async () => {
    if (!midiDataUri) {
        setError("No MIDI data available to play.");
        return;
    }
    setError(null);
    setIsPlaying(true);
    console.log("Attempting to play MIDI:", title);

    try {
      // --- TODO: Implement MIDI Playback Logic ---
      // Option 1: Using Tone.js
      // await Tone.start(); // Start audio context on user interaction
      // const midi = await Tone.Midi.fromUrl(midiDataUri);
      // // Configure a synth
      // const synth = new Tone.PolySynth(Tone.Synth).toDestination();
      // // Schedule playback
      // Tone.Transport.scheduleRepeat(time => {
      //    midi.tracks.forEach(track => {
      //        track.notes.forEach(note => {
      //            if (note.time === time) { // This timing logic needs refinement
      //                synth.triggerAttackRelease(note.name, note.duration, time, note.velocity);
      //            }
      //        });
      //    });
      // }, "8n"); // Example scheduling interval
      // Tone.Transport.start();

      // Option 2: Using Web MIDI API (more complex, requires browser support & setup)

      // Option 3: Simple download link for now
      console.warn("MIDI playback not fully implemented yet.");
      // Simulate playback ending after a short time
      setTimeout(() => setIsPlaying(false), 3000);

    } catch (err: any) {
      console.error("Error playing MIDI:", err);
      setError(`Failed to play MIDI: ${err.message}`);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
     // TODO: Stop Tone.js playback
     // Tone.Transport.stop();
     // Tone.Transport.cancel();
     console.log("Stopping MIDI playback");
     setIsPlaying(false);
  };

  const handleDownload = () => {
    if (!midiDataUri) return;
    const link = document.createElement('a');
    link.href = midiDataUri;
    link.download = `${title || 'chords'}.mid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
       {title && <h3 className="text-md font-semibold mb-3 text-gray-800">MIDI Output: {title}</h3>}
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      {midiDataUri ? (
        <div className="flex items-center space-x-2">
          <button
            onClick={isPlaying ? handleStop : handlePlay}
            disabled={!midiDataUri} // Disable if no MIDI data
            className={`px-3 py-1 text-sm font-medium rounded-md text-white ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 ${isPlaying ? 'focus:ring-red-500' : 'focus:ring-green-500'} disabled:opacity-50`}
          >
            {isPlaying ? 'Stop MIDI' : 'Play MIDI'}
          </button>
           <button
            onClick={handleDownload}
            disabled={!midiDataUri}
            className="px-3 py-1 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Download .mid
          </button>
          {/* Placeholder for playback progress or visualization */}
        </div>
      ) : (
         <p className="text-sm text-gray-500">No MIDI generated yet.</p>
      )}
    </div>
  );
};

export default MidiPlayer;
