"use client";

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Import components
import YouTubeForm from '@/components/YouTubeForm';
import ChordDisplay from '@/components/ChordDisplay';
import MidiPlayer from '@/components/MidiPlayer';

// Dynamically import FileUploadForm (might use client-only features)
const FileUploadForm = dynamic(() => import('@/components/FileUploadForm'), {
  ssr: false,
  loading: () => <p>Loading file uploader...</p>
});

// Import utility functions (placeholders for now)
import { analyzeAudioForChords } from '@/lib/chordDetection';
import { generateMidiFromChords } from '@/lib/midiUtils';

// Type definitions
interface ChordResult {
  startTime: number;
  endTime: number;
  chord: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'file' | 'youtube'>('file');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chords, setChords] = useState<ChordResult[] | null>(null);
  const [midiDataUri, setMidiDataUri] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>('');

  // --- Handlers ---

  const resetState = () => {
    setIsLoading(false);
    setError(null);
    setChords(null);
    setMidiDataUri(null);
    setCurrentTitle('');
  };

  const handleAnalysis = useCallback(async (audioSource: File | string, sourceTitle: string) => {
    resetState();
    setIsLoading(true);
    setCurrentTitle(sourceTitle);

    try {
      let audioBuffer: ArrayBuffer | AudioBuffer;

      if (audioSource instanceof File) {
        // Handle File upload
        audioBuffer = await audioSource.arrayBuffer();
        // TODO: Decode ArrayBuffer to AudioBuffer if needed by analyzeAudioForChords
        // const audioContext = new AudioContext();
        // audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      } else {
        // Handle YouTube ID -> Fetch audio URL from API
        const response = await fetch('/api/youtube-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId: audioSource }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch YouTube audio info (${response.status})`);
        }

        const { audioUrl } = await response.json();
        // TODO: Fetch the actual audio from audioUrl and get ArrayBuffer/AudioBuffer
        // This requires careful handling of CORS and potentially server-side fetching/proxying
        // For now, we'll pass a placeholder to the analysis function
        console.warn("YouTube audio fetching not fully implemented, using placeholder for analysis.");
        audioBuffer = new ArrayBuffer(0); // Placeholder
      }

      // Analyze audio (using placeholder function for now)
      const detectedChords = await analyzeAudioForChords(audioBuffer);
      setChords(detectedChords);

      // Generate MIDI (using placeholder function for now)
      if (detectedChords.length > 0) {
        const generatedMidi = generateMidiFromChords(detectedChords);
        setMidiDataUri(generatedMidi);
      }

    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || "An unknown error occurred during analysis.");
      setChords(null);
      setMidiDataUri(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencies will be added if needed

  const handleFileUploadSubmit = (file: File) => {
    handleAnalysis(file, file.name);
  };

  const handleYouTubeSubmit = (videoId: string) => {
    // We'll fetch the title later inside handleAnalysis or get it from API
    handleAnalysis(videoId, `YouTube Video (${videoId})`);
  };


  // --- Render ---

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold sm:text-5xl tracking-tight lg:text-6xl">
            Chord Extractor AI
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400">
            Upload an audio file or provide a YouTube link to extract chords and generate MIDI.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-300 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex justify-center space-x-8" aria-label="Tabs">
            <button
              onClick={() => { resetState(); setActiveTab('file'); }}
              className={`${
                activeTab === 'file'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150`}
            >
              Upload Audio File
            </button>
            <button
              onClick={() => { resetState(); setActiveTab('youtube'); }}
              className={`${
                activeTab === 'youtube'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150`}
            >
              YouTube Link
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          {activeTab === 'file' ? (
            <FileUploadForm onSubmit={handleFileUploadSubmit} isLoading={isLoading} />
          ) : (
            <YouTubeForm onSubmit={handleYouTubeSubmit} isLoading={isLoading} />
          )}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mt-8 text-center">
            <p className="text-lg font-medium text-blue-600 dark:text-blue-400 animate-pulse">
              Processing audio, please wait...
            </p>
            {/* Optional: Add a spinner */}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-8 p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 rounded-lg shadow-sm">
            <h3 className="text-md font-semibold text-red-800 dark:text-red-300">Error</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {!isLoading && !error && (chords || midiDataUri) && (
          <div className="mt-8 space-y-6">
            <ChordDisplay chords={chords || []} title={currentTitle} />
            <MidiPlayer midiDataUri={midiDataUri} title={currentTitle} />
            {/* TODO: Add original audio player */}
          </div>
        )}

      </div>
    </main>
  );
}
