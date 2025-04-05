import { Midi } from '@tonejs/midi';
import { ChordResult } from './chordDetection'; // Import the interface
import * as Tone from 'tone'; // Import Tone.js for potential chord parsing utilities if needed

// Basic mapping from chord quality symbols to intervals (semitones from root)
// This is a simplified mapping and can be expanded significantly.
const chordQualityIntervals: { [key: string]: number[] } = {
  // Major Chords
  'maj': [0, 4, 7],
  '': [0, 4, 7], // Default to major if no quality specified
  'M': [0, 4, 7],
  // Minor Chords
  'min': [0, 3, 7],
  'm': [0, 3, 7],
  // Dominant 7th
  '7': [0, 4, 7, 10],
  'dom7': [0, 4, 7, 10],
  // Major 7th
  'maj7': [0, 4, 7, 11],
  'M7': [0, 4, 7, 11],
  // Minor 7th
  'min7': [0, 3, 7, 10],
  'm7': [0, 3, 7, 10],
  // Diminished
  'dim': [0, 3, 6],
  // Augmented
  'aug': [0, 4, 8],
  // Sus4
  'sus4': [0, 5, 7],
  // Sus2
  'sus2': [0, 2, 7],
  // Add more complex chords as needed (e.g., 9ths, 11ths, 13ths, altered chords)
};

// Function to parse a chord name (e.g., "C#m7") into root note and quality
function parseChordName(chordName: string): { root: string; quality: string } | null {
  // Match root note (including accidentals) and the rest as quality
  const match = chordName.match(/^([A-G][#b]?)(.*)$/);
  if (!match) {
    console.warn(`Could not parse chord name: ${chordName}`);
    return null; // Return null if parsing fails
  }
  const [, root, quality] = match;
  return { root, quality: quality || '' }; // Default quality to empty string (major)
}

// Function to convert a note name (e.g., "C#4") to a MIDI number
function noteNameToMidi(noteName: string): number | null {
  try {
    // Use Tone.js's built-in conversion
    return Tone.Frequency(noteName).toMidi();
  } catch (e) {
    console.warn(`Could not convert note name to MIDI: ${noteName}`, e);
    return null;
  }
}

// Main function to generate MIDI data from chord results
export function generateMidiFromChords(chords: ChordResult[], bpm: number = 120): Uint8Array {
  const midi = new Midi();
  midi.header.setTempo(bpm); // Set a default tempo, could be estimated from audio later

  const track = midi.addTrack();
  track.name = "Detected Chords";

  chords.forEach(chordInfo => {
    const parsed = parseChordName(chordInfo.chord);
    if (!parsed) return; // Skip if chord name couldn't be parsed

    const { root, quality } = parsed;
    const intervals = chordQualityIntervals[quality];

    if (!intervals) {
      console.warn(`Unknown chord quality: ${quality} in chord ${chordInfo.chord}`);
      return; // Skip if quality is not recognized
    }

    // Determine the octave (e.g., middle C range)
    const octave = 4;
    const rootNoteName = `${root}${octave}`;
    const rootMidi = noteNameToMidi(rootNoteName);

    if (rootMidi === null) return; // Skip if root note couldn't be converted

    const duration = chordInfo.end - chordInfo.start;
    const startTime = chordInfo.start;

    // Add notes for the chord
    intervals.forEach(interval => {
      const noteMidi = rootMidi + interval;
      // Ensure MIDI note number is within valid range (0-127)
      if (noteMidi >= 0 && noteMidi <= 127) {
        track.addNote({
          midi: noteMidi,
          time: startTime,
          duration: duration,
          velocity: 0.8 // Default velocity
        });
      }
    });
  });

  return midi.toArray(); // Return MIDI data as Uint8Array
}
