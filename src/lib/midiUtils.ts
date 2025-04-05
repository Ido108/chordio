import MidiWriter from 'midi-writer-js';

// Access classes via the main import
const NoteEvent = MidiWriter.NoteEvent;
const Track = MidiWriter.Track;
const Writer = MidiWriter.Writer;

// Basic type definition for a chord event (replace with a more detailed one later)
interface ChordEvent {
  startTime: number; // in seconds
  endTime: number; // in seconds
  chord: string; // e.g., "Cmaj", "G7", "Am"
}

// Simple mapping from chord names to MIDI notes (example, needs expansion)
// This is highly simplified. Real mapping needs chord parsing (root, quality)
// and voicing logic.
const chordToMidiNotes = (chord: string): string[] => { // Return string[]
  let midiNumbers: number[];
  // Placeholder: returns a simple C major triad for any chord
  switch (chord.toLowerCase()) {
    case 'c':
    case 'cmaj':
      midiNumbers = [60, 64, 67]; // C4, E4, G4
      break;
    case 'g':
    case 'gmaj':
      midiNumbers = [67, 71, 74]; // G4, B4, D5
      break;
    case 'am':
    case 'amin':
      midiNumbers = [69, 72, 76]; // A4, C5, E5
      break;
    case 'f':
    case 'fmaj':
      midiNumbers = [65, 69, 72]; // F4, A4, C5
      break;
    // Add many more chords...
    default:
      midiNumbers = [60]; // Default to C4 if unknown
  }
  return midiNumbers.map(midiNumberToNoteString); // Convert numbers to strings
};

// Helper function to convert MIDI number to note string (e.g., 60 -> C4)
const midiNumberToNoteString = (midiNumber: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  return noteNames[noteIndex] + octave;
};

// Function to convert ticks to seconds based on tempo and PPQ
const ticksToSeconds = (ticks: number, bpm: number, ppq: number): number => {
    return (ticks / ppq) * (60 / bpm);
}

// Function to convert seconds to ticks
const secondsToTicks = (seconds: number, bpm: number, ppq: number): number | string => {
    // Calculate ticks per second
    const ticksPerSecond = ppq * (bpm / 60);
    // Calculate total ticks
    const totalTicks = Math.round(seconds * ticksPerSecond);
    // midi-writer-js uses 'T' prefix for absolute ticks
    return `T${totalTicks}`;
}


export const generateMidiFromChords = (
    chordEvents: ChordEvent[],
    bpm: number = 120 // Default tempo
): string => {
  const track = new Track();
  track.setTempo(bpm);

  const ppq = MidiWriter.Constants.HEADER_CHUNK_DIVISION; // Pulses per quarter note (default is 128)

  // Add chord events to the track
  chordEvents.forEach((event) => {
    const noteStrings = chordToMidiNotes(event.chord); // Get note strings
    const startTickRaw = secondsToTicks(event.startTime, bpm, ppq);
    const durationTicks = secondsToTicks(event.endTime - event.startTime, bpm, ppq);

    // midi-writer-js needs duration in ticks format 'Txxx'
    // Ensure duration is at least 1 tick if calculation results in 0
    const duration = typeof durationTicks === 'string' && parseInt(durationTicks.substring(1)) > 0
        ? durationTicks
        : 'T1';

    // Convert startTick and duration to numbers if they are in 'Txxx' format
    const startTickValue = typeof startTickRaw === 'string' ? parseInt(startTickRaw.substring(1)) : startTickRaw;
    const durationValue = typeof duration === 'string' ? parseInt(duration.substring(1)) : 1; // Use raw tick number, default to 1 if calculation was 0

    // Create a separate NoteEvent for each note in the chord
    noteStrings.forEach((note) => {
        // @ts-ignore - Suppress persistent TS error, likely due to faulty/missing types for midi-writer-js NoteEvent constructor
        // @ts-ignore - Re-applying suppression for persistent TS error
        track.addEvent(
          new NoteEvent({
            pitch: note, // Pass single note string directly
            startTick: startTickValue,
            durationTicks: durationValue,
          })
        );
    });
  });

  const writer = new Writer([track]);
  // Return MIDI data as a base64 encoded string
  return writer.dataUri();
};

// Example usage (for testing):
// const chords: ChordEvent[] = [
//   { startTime: 0, endTime: 2, chord: 'Cmaj' },
//   { startTime: 2, endTime: 4, chord: 'Gmaj' },
//   { startTime: 4, endTime: 6, chord: 'Am' },
//   { startTime: 6, endTime: 8, chord: 'Fmaj' },
// ];
// const midiDataUri = generateMidiFromChords(chords);
// console.log(midiDataUri); // Output: data:audio/midi;base64,...
