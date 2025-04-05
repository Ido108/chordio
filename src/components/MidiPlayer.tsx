'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

interface MidiPlayerProps {
  midiBase64: string | null;
  isPlaying: boolean;
  volume?: number; // 0-1
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onEnded: () => void;
  seekTime: number | null; // Time in seconds to seek to
  onReady: () => void; // Callback when player is ready
}

const MidiPlayer: React.FC<MidiPlayerProps> = ({
  midiBase64,
  isPlaying,
  volume = 0.8,
  onTimeUpdate,
  onDurationChange,
  onEnded,
  seekTime,
  onReady,
}) => {
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const midiDataRef = useRef<Midi | null>(null);
  const scheduledEventsRef = useRef<number[]>([]); // Store Tone.Transport event IDs
  const isReadyRef = useRef(false);
  const durationRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize Synth
  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
        // Simple synth options
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
    }).toDestination();
    // Set initial volume
     if (synthRef.current) {
        synthRef.current.volume.value = Tone.gainToDb(volume);
     }
    return () => {
      synthRef.current?.dispose();
      Tone.Transport.cancel(); // Clear transport on unmount
      scheduledEventsRef.current = [];
       if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [volume]); // Re-create synth if volume prop changes? Maybe just update volume.

   // Update volume when prop changes
   useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = Tone.gainToDb(volume);
    }
  }, [volume]);


  // Load MIDI data
  useEffect(() => {
    if (!midiBase64) {
        midiDataRef.current = null;
        isReadyRef.current = false;
        Tone.Transport.cancel(); // Clear previous events
        scheduledEventsRef.current = [];
        return;
    }

    isReadyRef.current = false; // Mark as not ready while loading new MIDI
    Tone.Transport.cancel(); // Clear previous events
    scheduledEventsRef.current = [];

    const loadMidi = async () => {
      try {
        await Tone.start(); // Ensure AudioContext is running
        const midiBinary = Uint8Array.from(atob(midiBase64), c => c.charCodeAt(0));
        const midi = new Midi(midiBinary);
        midiDataRef.current = midi;
        durationRef.current = midi.duration;
        onDurationChange(midi.duration); // Notify parent of new duration

        // Schedule MIDI events
        if (synthRef.current && midiDataRef.current) {
          const now = Tone.now() + 0.1; // Add slight delay for scheduling
          midiDataRef.current.tracks.forEach(track => {
            track.notes.forEach(note => {
              const eventId = Tone.Transport.scheduleOnce(time => {
                synthRef.current?.triggerAttackRelease(
                  note.name,
                  note.duration,
                  time,
                  note.velocity
                );
              }, note.time + now); // Schedule relative to Transport start + offset
               scheduledEventsRef.current.push(eventId);
            });
          });

           // Schedule the end event
           const endEventId = Tone.Transport.scheduleOnce(() => {
               console.log("MIDI playback finished via scheduleOnce");
               onEnded(); // Call onEnded when the last note should finish
           }, midi.duration + now);
           scheduledEventsRef.current.push(endEventId);

          isReadyRef.current = true;
          onReady(); // Notify parent that player is ready
          console.log("MIDI Player ready, duration:", midi.duration);
        }
      } catch (error) {
        console.error('Error loading or scheduling MIDI:', error);
        midiDataRef.current = null;
        isReadyRef.current = false;
      }
    };

    loadMidi();

  }, [midiBase64, onDurationChange, onReady, onEnded]); // Rerun when MIDI data changes

  // Control Playback State & Time Updates
  useEffect(() => {
    if (!isReadyRef.current) return;

    const tick = () => {
      if (Tone.Transport.state === 'started') {
        onTimeUpdate(Tone.Transport.seconds);
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    if (isPlaying && Tone.Transport.state !== 'started') {
      Tone.Transport.start();
      animationFrameRef.current = requestAnimationFrame(tick);
      console.log("Tone.Transport started");
    } else if (!isPlaying && Tone.Transport.state === 'started') {
      Tone.Transport.pause();
       if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      console.log("Tone.Transport paused");
    }

     // Cleanup function for stopping animation frame on effect change
     return () => {
       if (animationFrameRef.current) {
         cancelAnimationFrame(animationFrameRef.current);
       }
     };

  }, [isPlaying, onTimeUpdate]);

  // Handle Seeking
  useEffect(() => {
    if (seekTime !== null && isReadyRef.current && durationRef.current > 0) {
      const validSeekTime = Math.max(0, Math.min(seekTime, durationRef.current));
      console.log(`Seeking MIDI to: ${validSeekTime}`);
      Tone.Transport.seconds = validSeekTime;
      // If paused, update time immediately for display
      if (Tone.Transport.state !== 'started') {
          onTimeUpdate(validSeekTime);
      }
    }
  }, [seekTime, onTimeUpdate]); // Depend on seekTime

  // Render nothing - this is a non-visual component
  return null;
};

export default MidiPlayer;
