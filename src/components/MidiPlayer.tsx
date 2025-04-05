import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';
import { ChordWithTiming } from '@/lib/chord-detection/ChordDetector';

interface MidiPlayerProps {
  midiUrl: string | null;
  chords: ChordWithTiming[];
  onPlaybackStarted?: () => void;
  onPlaybackStopped?: () => void;
  onChordChange?: (chordIndex: number) => void;
}

export default function MidiPlayer({
  midiUrl,
  chords,
  onPlaybackStarted,
  onPlaybackStopped,
  onChordChange
}: MidiPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentChordIndex, setCurrentChordIndex] = useState(-1);
  
  // Refs for Tone.js objects
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const melodySynthRef = useRef<Tone.PolySynth | null>(null);
  const transportRef = useRef<typeof Tone.Transport | null>(null);
  const midiDataRef = useRef<Midi | null>(null);
  const scheduledEventsRef = useRef<number[]>([]);
  
  // Initialize Tone.js
  useEffect(() => {
    // Initialize transport
    transportRef.current = Tone.Transport;
    transportRef.current.bpm.value = 120;
    
    // Initialize synths
    synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    synthRef.current.volume.value = -6; // Slightly quieter for chords
    
    melodySynthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    melodySynthRef.current.volume.value = -3; // Slightly louder for melody
    
    // Set up update loop for current time
    const interval = setInterval(() => {
      if (isPlaying) {
        setCurrentTime(Tone.Transport.seconds);
        
        // Find current chord based on time
        const newChordIndex = chords.findIndex(
          (chord, index) => 
            Tone.Transport.seconds >= chord.startTime && 
            (index === chords.length - 1 || Tone.Transport.seconds < chords[index + 1].startTime)
        );
        
        if (newChordIndex !== -1 && newChordIndex !== currentChordIndex) {
          setCurrentChordIndex(newChordIndex);
          onChordChange?.(newChordIndex);
        }
      }
    }, 100);
    
    return () => {
      clearInterval(interval);
      stopPlayback();
      
      // Clean up Tone.js objects
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      
      if (melodySynthRef.current) {
        melodySynthRef.current.dispose();
      }
    };
  }, [chords, isPlaying, currentChordIndex, onChordChange]);
  
  // Load MIDI when URL changes
  useEffect(() => {
    if (!midiUrl) return;
    
    const loadMidi = async () => {
      try {
        const midi = await Midi.fromUrl(midiUrl);
        midiDataRef.current = midi;
        
        // Calculate total duration
        let maxEndTime = 0;
        midi.tracks.forEach(track => {
          track.notes.forEach(note => {
            const noteEndTime = note.time + note.duration;
            if (noteEndTime > maxEndTime) {
              maxEndTime = noteEndTime;
            }
          });
        });
        
        setDuration(maxEndTime);
      } catch (error) {
        console.error('Error loading MIDI:', error);
      }
    };
    
    loadMidi();
  }, [midiUrl]);
  
  // Start playback
  const startPlayback = async () => {
    if (!midiDataRef.current || !synthRef.current || !melodySynthRef.current || !transportRef.current) {
      return;
    }
    
    try {
      // Ensure Tone.js is started (needed for user interaction)
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      
      // Clear any previously scheduled events
      scheduledEventsRef.current.forEach(id => {
        Tone.Transport.clear(id);
      });
      scheduledEventsRef.current = [];
      
      // Reset transport
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      setCurrentTime(0);
      setCurrentChordIndex(-1);
      
      // Schedule notes for each track
      midiDataRef.current.tracks.forEach((track, trackIndex) => {
        const synth = trackIndex === 0 ? synthRef.current : melodySynthRef.current;
        
        if (!synth) return;
        
        track.notes.forEach(note => {
          const eventId = Tone.Transport.schedule((time) => {
            synth.triggerAttackRelease(
              note.name,
              note.duration,
              time,
              note.velocity
            );
          }, note.time);
          
          scheduledEventsRef.current.push(eventId);
        });
      });
      
      // Schedule end of playback
      const endEventId = Tone.Transport.schedule((time) => {
        stopPlayback();
      }, duration);
      scheduledEventsRef.current.push(endEventId);
      
      // Start transport
      Tone.Transport.start();
      setIsPlaying(true);
      onPlaybackStarted?.();
    } catch (error) {
      console.error('Error starting playback:', error);
    }
  };
  
  // Stop playback
  const stopPlayback = () => {
    if (!transportRef.current) return;
    
    Tone.Transport.stop();
    setIsPlaying(false);
    onPlaybackStopped?.();
  };
  
  // Seek to specific time
  const seekToTime = (time: number) => {
    if (!transportRef.current || time < 0 || time > duration) return;
    
    const wasPlaying = isPlaying;
    
    // Stop if playing
    if (wasPlaying) {
      stopPlayback();
    }
    
    // Set new position
    Tone.Transport.seconds = time;
    setCurrentTime(time);
    
    // Find current chord based on time
    const newChordIndex = chords.findIndex(
      (chord, index) => 
        time >= chord.startTime && 
        (index === chords.length - 1 || time < chords[index + 1].startTime)
    );
    
    if (newChordIndex !== -1 && newChordIndex !== currentChordIndex) {
      setCurrentChordIndex(newChordIndex);
      onChordChange?.(newChordIndex);
    }
    
    // Resume if was playing
    if (wasPlaying) {
      startPlayback();
    }
  };
  
  // Seek to specific chord
  const seekToChord = (chordIndex: number) => {
    if (chordIndex < 0 || chordIndex >= chords.length) return;
    
    seekToTime(chords[chordIndex].startTime);
  };
  
  return (
    <div className="w-full">
      {/* Playback controls */}
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={isPlaying ? stopPlayback : startPlayback}
          className={`px-4 py-2 rounded-md text-white ${
            isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
          disabled={!midiUrl}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        
        {/* Time display */}
        <div className="text-sm text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 cursor-pointer"
           onClick={(e) => {
             const rect = e.currentTarget.getBoundingClientRect();
             const percent = (e.clientX - rect.left) / rect.width;
             seekToTime(percent * duration);
           }}>
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${(currentTime / Math.max(duration, 0.1)) * 100}%` }}
        ></div>
      </div>
      
      {/* Chord visualization */}
      <div className="flex flex-wrap gap-2 mt-4">
        {chords.map((chord, index) => (
          <button
            key={index}
            className={`px-3 py-1 text-sm rounded-md ${
              index === currentChordIndex
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            onClick={() => seekToChord(index)}
          >
            {chord.chord}
          </button>
        ))}
      </div>
    </div>
  );
}

// Helper function to format time in MM:SS format
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
