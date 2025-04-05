import { useState, useEffect, useRef } from 'react';
import { ChordDetector, ChordWithTiming } from '@/lib/chord-detection/ChordDetector';
import { MidiGenerator } from '@/lib/MidiGenerator';
import * as Tone from 'tone';

/**
 * Custom hook for audio processing and chord detection
 */
export const useAudioProcessor = () => {
  // State for audio processing
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedChords, setDetectedChords] = useState<ChordWithTiming[]>([]);
  const [midiUrl, setMidiUrl] = useState<string | null>(null);
  const [midiWithMelodyUrl, setMidiWithMelodyUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const chordDetectorRef = useRef<ChordDetector | null>(null);
  const playerRef = useRef<Tone.Player | null>(null);
  
  // Initialize chord detector
  useEffect(() => {
    const initChordDetector = async () => {
      try {
        const detector = new ChordDetector();
        await detector.initialize();
        chordDetectorRef.current = detector;
      } catch (err) {
        console.error('Failed to initialize chord detector:', err);
        setError('Failed to initialize audio processing. Please try again.');
      }
    };
    
    initChordDetector();
    
    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current.dispose();
      }
      
      // Revoke object URLs
      if (midiUrl) URL.revokeObjectURL(midiUrl);
      if (midiWithMelodyUrl) URL.revokeObjectURL(midiWithMelodyUrl);
    };
  }, []);
  
  /**
   * Process audio file for chord detection
   * @param file - Audio file to process
   */
  const processAudioFile = async (file: File) => {
    if (!chordDetectorRef.current) {
      setError('Audio processor not initialized. Please refresh the page.');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Load audio file
      const buffer = await chordDetectorRef.current.loadAudio(file);
      setAudioBuffer(buffer);
      
      // Detect chords
      const chords = await chordDetectorRef.current.detectChords(buffer);
      setDetectedChords(chords);
      
      // Generate MIDI files
      const midiBlob = MidiGenerator.generateMidiFromChords(chords);
      const midiWithMelodyBlob = MidiGenerator.generateMidiWithMelody(chords);
      
      // Create download URLs
      const midiDownloadUrl = MidiGenerator.createDownloadLink(midiBlob, 'chord-progression.mid');
      const midiWithMelodyDownloadUrl = MidiGenerator.createDownloadLink(
        midiWithMelodyBlob, 
        'chord-progression-with-melody.mid'
      );
      
      setMidiUrl(midiDownloadUrl);
      setMidiWithMelodyUrl(midiWithMelodyDownloadUrl);
      
      setIsProcessing(false);
    } catch (err) {
      console.error('Error processing audio:', err);
      setIsProcessing(false);
      setError('Failed to process audio file. Please try a different file.');
    }
  };
  
  /**
   * Process audio from URL for chord detection
   * @param url - URL of audio file to process
   */
  const processAudioUrl = async (url: string) => {
    if (!chordDetectorRef.current) {
      setError('Audio processor not initialized. Please refresh the page.');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Load audio from URL
      const buffer = await chordDetectorRef.current.loadAudio(url);
      setAudioBuffer(buffer);
      
      // Detect chords
      const chords = await chordDetectorRef.current.detectChords(buffer);
      setDetectedChords(chords);
      
      // Generate MIDI files
      const midiBlob = MidiGenerator.generateMidiFromChords(chords);
      const midiWithMelodyBlob = MidiGenerator.generateMidiWithMelody(chords);
      
      // Create download URLs
      const midiDownloadUrl = MidiGenerator.createDownloadLink(midiBlob, 'chord-progression.mid');
      const midiWithMelodyDownloadUrl = MidiGenerator.createDownloadLink(
        midiWithMelodyBlob, 
        'chord-progression-with-melody.mid'
      );
      
      setMidiUrl(midiDownloadUrl);
      setMidiWithMelodyUrl(midiWithMelodyDownloadUrl);
      
      setIsProcessing(false);
    } catch (err) {
      console.error('Error processing audio from URL:', err);
      setIsProcessing(false);
      setError('Failed to process audio from URL. Please try a different URL.');
    }
  };
  
  /**
   * Play the original audio
   */
  const playOriginalAudio = async () => {
    if (!audioBuffer) return;
    
    try {
      // Initialize Tone.js if needed
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      
      // Stop any existing playback
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current.dispose();
      }
      
      // Create new player
      const player = new Tone.Player().toDestination();
      player.buffer = new Tone.ToneAudioBuffer(audioBuffer);
      playerRef.current = player;
      
      // Start playback
      player.start();
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Failed to play audio. Please try again.');
    }
  };
  
  /**
   * Stop audio playback
   */
  const stopPlayback = () => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
  };
  
  /**
   * Play MIDI file
   * @param withMelody - Whether to play the version with melody
   */
  const playMidi = async (withMelody: boolean = false) => {
    const midiUrlToPlay = withMelody ? midiWithMelodyUrl : midiUrl;
    
    if (!midiUrlToPlay) {
      setError('No MIDI file available. Please process an audio file first.');
      return;
    }
    
    try {
      // Initialize Tone.js if needed
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      
      // Stop any existing playback
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current.dispose();
      }
      
      // Create a synth for MIDI playback
      const synth = new Tone.PolySynth(Tone.Synth).toDestination();
      
      // Load and parse MIDI file
      const midi = await Tone.Midi.fromUrl(midiUrlToPlay);
      
      // Get notes from the first track
      const notes = midi.tracks[0].notes;
      
      // Schedule notes
      const now = Tone.now();
      notes.forEach(note => {
        synth.triggerAttackRelease(
          note.name,
          note.duration,
          note.time + now,
          note.velocity
        );
      });
      
      // If there's a second track (melody), play it too
      if (midi.tracks.length > 1 && midi.tracks[1].notes.length > 0) {
        const melodySynth = new Tone.PolySynth(Tone.Synth).toDestination();
        const melodyNotes = midi.tracks[1].notes;
        
        melodyNotes.forEach(note => {
          melodySynth.triggerAttackRelease(
            note.name,
            note.duration,
            note.time + now,
            note.velocity
          );
        });
      }
    } catch (err) {
      console.error('Error playing MIDI:', err);
      setError('Failed to play MIDI. Please try again.');
    }
  };
  
  return {
    audioBuffer,
    isProcessing,
    detectedChords,
    midiUrl,
    midiWithMelodyUrl,
    error,
    processAudioFile,
    processAudioUrl,
    playOriginalAudio,
    stopPlayback,
    playMidi
  };
};
