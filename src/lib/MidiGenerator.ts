import { Midi } from '@tonejs/midi';
import { ChordWithTiming } from './chord-detection/ChordDetector';

/**
 * Class for generating MIDI files from detected chords with timing information
 */
export class MidiGenerator {
  /**
   * Convert chord name to MIDI notes
   * @param chordName - Name of the chord (e.g., "C", "Dm", "G7")
   * @returns Array of MIDI note numbers
   */
  private static chordToNotes(chordName: string): number[] {
    // Parse chord name to extract root note and chord type
    const regex = /^([A-G][#b]?)([a-zA-Z0-9]*)$/;
    const match = chordName.match(regex);
    
    if (!match) {
      console.warn(`Could not parse chord name: ${chordName}`);
      return [];
    }
    
    const [, rootNote, chordType] = match;
    
    // Convert root note to MIDI number (C4 = 60)
    const rootNoteNumber = this.noteToMidiNumber(rootNote);
    
    // Define intervals for different chord types
    let intervals: number[] = [];
    
    switch (chordType) {
      case '':
        // Major chord
        intervals = [0, 4, 7];
        break;
      case 'm':
        // Minor chord
        intervals = [0, 3, 7];
        break;
      case '7':
        // Dominant 7th
        intervals = [0, 4, 7, 10];
        break;
      case 'maj7':
        // Major 7th
        intervals = [0, 4, 7, 11];
        break;
      case 'm7':
        // Minor 7th
        intervals = [0, 3, 7, 10];
        break;
      case 'dim':
        // Diminished
        intervals = [0, 3, 6];
        break;
      case 'aug':
        // Augmented
        intervals = [0, 4, 8];
        break;
      case 'sus2':
        // Suspended 2nd
        intervals = [0, 2, 7];
        break;
      case 'sus4':
        // Suspended 4th
        intervals = [0, 5, 7];
        break;
      default:
        console.warn(`Unknown chord type: ${chordType}`);
        intervals = [0, 4, 7]; // Default to major
    }
    
    // Convert intervals to MIDI note numbers
    return intervals.map(interval => rootNoteNumber + interval);
  }
  
  /**
   * Convert note name to MIDI number
   * @param noteName - Name of the note (e.g., "C", "F#")
   * @param octave - Octave number (default: 4)
   * @returns MIDI note number
   */
  private static noteToMidiNumber(noteName: string, octave: number = 4): number {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Handle flat notes
    noteName = noteName.replace('b', '#');
    noteName = noteName.replace('Db', 'C#')
                       .replace('Eb', 'D#')
                       .replace('Gb', 'F#')
                       .replace('Ab', 'G#')
                       .replace('Bb', 'A#');
    
    const noteIndex = noteNames.indexOf(noteName);
    
    if (noteIndex === -1) {
      console.warn(`Unknown note name: ${noteName}`);
      return 60; // Default to C4
    }
    
    return 12 * (octave + 1) + noteIndex;
  }
  
  /**
   * Generate MIDI file from detected chords
   * @param chords - Array of detected chords with timing information
   * @param bpm - Tempo in beats per minute
   * @returns MIDI file as a Blob
   */
  static generateMidiFromChords(chords: ChordWithTiming[], bpm: number = 120): Blob {
    // Create a new MIDI file
    const midi = new Midi();
    
    // Set the tempo
    midi.header.setTempo(bpm);
    
    // Create a track for the chords
    const track = midi.addTrack();
    track.name = "Chord Progression";
    track.channel = 0;
    
    // Add each chord as a set of notes
    for (const chord of chords) {
      const notes = this.chordToNotes(chord.chord);
      const startTime = chord.startTime;
      const duration = chord.endTime - chord.startTime;
      
      // Add each note in the chord
      for (const note of notes) {
        track.addNote({
          midi: note,
          time: startTime,
          duration: duration,
          velocity: 0.8 // Medium-high velocity
        });
      }
    }
    
    // Convert to MIDI file
    const midiData = midi.toArray();
    return new Blob([midiData], { type: 'audio/midi' });
  }
  
  /**
   * Generate MIDI file with melody and chords
   * @param chords - Array of detected chords with timing information
   * @param bpm - Tempo in beats per minute
   * @returns MIDI file as a Blob
   */
  static generateMidiWithMelody(chords: ChordWithTiming[], bpm: number = 120): Blob {
    // Create a new MIDI file
    const midi = new Midi();
    
    // Set the tempo
    midi.header.setTempo(bpm);
    
    // Create a track for the chords
    const chordTrack = midi.addTrack();
    chordTrack.name = "Chord Progression";
    chordTrack.channel = 0;
    
    // Create a track for the melody (arpeggiated chords)
    const melodyTrack = midi.addTrack();
    melodyTrack.name = "Melody";
    melodyTrack.channel = 1;
    
    // Add each chord as a set of notes
    for (const chord of chords) {
      const notes = this.chordToNotes(chord.chord);
      const startTime = chord.startTime;
      const duration = chord.endTime - chord.startTime;
      
      // Add chord notes
      for (const note of notes) {
        chordTrack.addNote({
          midi: note,
          time: startTime,
          duration: duration,
          velocity: 0.6 // Medium velocity for chords
        });
      }
      
      // Add arpeggiated notes for melody
      const noteDuration = Math.min(0.25, duration / notes.length);
      for (let i = 0; i < Math.floor(duration / noteDuration); i++) {
        const noteIndex = i % notes.length;
        melodyTrack.addNote({
          midi: notes[noteIndex] + 12, // One octave higher
          time: startTime + (i * noteDuration),
          duration: noteDuration * 0.8, // Slightly shorter for articulation
          velocity: 0.8 // Medium-high velocity for melody
        });
      }
    }
    
    // Convert to MIDI file
    const midiData = midi.toArray();
    return new Blob([midiData], { type: 'audio/midi' });
  }
  
  /**
   * Create a downloadable link for a MIDI file
   * @param midiBlob - MIDI file as a Blob
   * @param filename - Name for the downloaded file
   * @returns URL for downloading the MIDI file
   */
  static createDownloadLink(midiBlob: Blob, filename: string = 'chord-progression.mid'): string {
    return URL.createObjectURL(midiBlob);
  }
}
