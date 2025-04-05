'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import FileUploadForm from '@/components/FileUploadForm';
import YouTubeForm from '@/components/YouTubeForm';
import ChordDisplay from '@/components/ChordDisplay';
import MidiPlayer from '@/components/MidiPlayer';
import YouTube, { YouTubePlayer, YouTubeProps, YouTubeEvent } from 'react-youtube'; // Import YouTubeEvent
import { ChordResult } from '@/lib/chordDetection';

type ProcessingState = 'idle' | 'processing' | 'complete' | 'error';
type PlaybackMode = 'original' | 'midi';

interface AppData {
  chords: ChordResult[];
  midiBase64: string;
  originalFilename: string;
  sourceType: 'file' | 'youtube';
  sourceValue: string; // File URL or YouTube Video ID
}

export default function Home() {
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [appData, setAppData] = useState<AppData | null>(null);
  const [error, setError] = useState<string>('');

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('original');
  const [seekTime, setSeekTime] = useState<number | null>(null); // To trigger seeks
  const [isOriginalReady, setIsOriginalReady] = useState<boolean>(false);
  const [isMidiReady, setIsMidiReady] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8); // Volume 0-1

  // Refs for players
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);

  // --- Handlers for Forms ---
  const handleProcessingStart = useCallback(() => {
    setProcessingState('processing');
    setError('');
    setAppData(null); // Clear previous results
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsOriginalReady(false);
    setIsMidiReady(false);
    // Reset players if they exist
    if (audioPlayerRef.current) audioPlayerRef.current.src = '';
    // YouTube player is controlled by videoId prop change
  }, []);

  const handleProcessingComplete = useCallback((data: any) => {
    console.log("Processing complete, received data:", data);
    if (!data.chords || !data.midiBase64 || !data.originalFilename) {
        handleProcessingError("Incomplete data received from server.");
        return;
    }

    let sourceType: 'file' | 'youtube' = 'file';
    let sourceValue = '';

    // Determine source type and value based on which form submitted
    // This is a bit implicit; could be improved with explicit source tracking
    if (data.originalFilename.endsWith('.mid') || data.originalFilename === 'YouTube Audio' || data.originalFilename.startsWith('yt-')) { // Heuristic for YT
        sourceType = 'youtube';
        // Attempt to extract video ID from URL if needed (or pass it from form state)
        // For now, assume we need to store the original URL or ID if available
        // Let's assume the API returns the video ID or we store it from the form
        // This part needs refinement based on actual data flow
        sourceValue = data.youtubeVideoId || ''; // Placeholder - needs actual ID
         if (!sourceValue && data.youtubeUrl) { // If API didn't return ID, try parsing URL
            const match = data.youtubeUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
            if (match && match[1]) sourceValue = match[1];
         }
         console.log("Detected YouTube source, Video ID:", sourceValue);
    } else {
        sourceType = 'file';
        // Create a blob URL for the original uploaded file if needed for playback
        // This requires handling the original file blob on the client-side
        // For simplicity now, we won't play back the *uploaded* original directly
        // We'll focus on YouTube original playback first.
        // sourceValue = URL.createObjectURL(originalFileBlob); // Needs file blob
        sourceValue = ''; // Placeholder for file source
        console.log("Detected File source");
    }


    setAppData({
      chords: data.chords,
      midiBase64: data.midiBase64,
      originalFilename: data.originalFilename,
      sourceType: sourceType,
      sourceValue: sourceValue, // Store Video ID or File URL
    });
    setProcessingState('complete');
    setError('');
    setCurrentTime(0); // Reset time for new content
    setPlaybackMode('original'); // Default to original playback first
  }, []);

  const handleProcessingError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setProcessingState('error');
    setAppData(null);
    setIsPlaying(false);
  }, []);

  // --- Handlers for Playback ---
  const handlePlayPause = () => {
    if (!appData) return;
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

   const handleDurationChange = useCallback((newDuration: number) => {
    // Use the longer duration if players report different ones
    setDuration(prevDuration => Math.max(prevDuration, newDuration));
  }, []);

  const handleEnded = useCallback(() => {
    console.log("Playback ended");
    setIsPlaying(false);
    setCurrentTime(duration); // Set to end
    // Optionally loop or reset time: setCurrentTime(0);
  }, [duration]);

  const handleSeek = (time: number) => {
    if (!appData || duration <= 0) return;
    const validTime = Math.max(0, Math.min(time, duration));
    console.log(`Seeking to ${validTime}`);
    setCurrentTime(validTime); // Update state immediately for responsiveness
    setSeekTime(validTime); // Trigger seek in players

    // Manually seek players if needed (especially if paused)
     if (!isPlaying) {
        if (playbackMode === 'original') {
            if (appData.sourceType === 'youtube' && youtubePlayerRef.current) {
                youtubePlayerRef.current.seekTo(validTime, true);
            } else if (appData.sourceType === 'file' && audioPlayerRef.current) {
                audioPlayerRef.current.currentTime = validTime;
            }
        }
        // MidiPlayer handles seek via prop change
     }

     // Reset seekTime trigger after a short delay
     setTimeout(() => setSeekTime(null), 50);
  };

  const handleChordClick = (time: number) => {
    handleSeek(time);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioPlayerRef.current) {
        audioPlayerRef.current.volume = newVolume;
    }
     if (youtubePlayerRef.current) {
        youtubePlayerRef.current.setVolume(newVolume * 100); // YouTube uses 0-100
    }
    // MidiPlayer volume is handled via prop
  };

  // --- YouTube Player Specific Handlers ---
   const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    youtubePlayerRef.current = event.target;
    console.log("YouTube Player Ready");
    setIsOriginalReady(true);
    handleDurationChange(event.target.getDuration());
     event.target.setVolume(volume * 100); // Set initial volume
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    // Sync app state with YouTube player state if needed
    // event.data: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    console.log("YouTube Player State Change:", event.data);
     if (event.data === 0) { // Ended
        handleEnded();
    } else if (event.data === 1) { // Playing
        if (!isPlaying) setIsPlaying(true); // Sync if YT play initiated externally
         // Start polling time if playing
         pollYoutubeTime();
    } else if (event.data === 2) { // Paused
        if (isPlaying) setIsPlaying(false); // Sync if YT pause initiated externally
         stopYoutubeTimePolling();
    } else if (event.data === 5) { // Cued
        setIsOriginalReady(true); // Mark as ready when cued
        handleDurationChange(event.target.getDuration());
    } else {
        stopYoutubeTimePolling();
    }
  };

   const youtubeTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

   const pollYoutubeTime = () => {
       stopYoutubeTimePolling(); // Clear existing interval
       youtubeTimeIntervalRef.current = setInterval(() => {
           if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
               const ytTime = youtubePlayerRef.current.getCurrentTime();
               handleTimeUpdate(ytTime);
           }
       }, 250); // Poll every 250ms
   };

   const stopYoutubeTimePolling = () => {
       if (youtubeTimeIntervalRef.current) {
           clearInterval(youtubeTimeIntervalRef.current);
           youtubeTimeIntervalRef.current = null;
       }
   };

   // Cleanup interval on unmount
   useEffect(() => {
       return () => stopYoutubeTimePolling();
   }, []);


  // --- Effect for controlling players based on isPlaying state ---
  useEffect(() => {
    if (!appData) return;

    if (playbackMode === 'original') {
      // Control Original Player (Audio or YouTube)
      if (appData.sourceType === 'youtube' && youtubePlayerRef.current) {
        if (isPlaying) youtubePlayerRef.current.playVideo();
        else youtubePlayerRef.current.pauseVideo();
      } else if (appData.sourceType === 'file' && audioPlayerRef.current) {
        if (isPlaying) audioPlayerRef.current.play().catch(e => console.error("Audio play error:", e));
        else audioPlayerRef.current.pause();
      }
    }
    // MidiPlayer is controlled via its isPlaying prop directly
  }, [isPlaying, playbackMode, appData]);


  // --- Effect for seeking ---
  // This effect ensures players seek when the seekTime state changes
  useEffect(() => {
      if (seekTime === null || !appData) return;

      if (playbackMode === 'original') {
          if (appData.sourceType === 'youtube' && youtubePlayerRef.current) {
              youtubePlayerRef.current.seekTo(seekTime, true);
          } else if (appData.sourceType === 'file' && audioPlayerRef.current) {
              audioPlayerRef.current.currentTime = seekTime;
          }
      }
      // MidiPlayer handles seek via its seekTime prop

  }, [seekTime, playbackMode, appData]);


  const isPlayerReady = playbackMode === 'original' ? isOriginalReady : isMidiReady;
  const canPlay = appData && isPlayerReady;

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 lg:p-24 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-4xl font-bold mb-8">Chordio</h1>
      <p className="mb-8 text-lg text-center text-gray-600 dark:text-gray-400">
        Upload an audio file or paste a YouTube link to extract chords and generate MIDI.
      </p>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl mb-8">
        <FileUploadForm
          onProcessingStart={handleProcessingStart}
          onProcessingComplete={handleProcessingComplete}
          onProcessingError={handleProcessingError}
        />
        <YouTubeForm
          onProcessingStart={handleProcessingStart}
          onProcessingComplete={handleProcessingComplete}
          onProcessingError={handleProcessingError}
        />
      </div>

      {/* Status Display */}
      {processingState === 'processing' && (
        <div className="my-4 text-center">
          <p className="text-lg font-semibold animate-pulse">Processing audio...</p>
          {/* Optional: Add a spinner */}
        </div>
      )}
      {processingState === 'error' && (
        <div className="my-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded w-full max-w-2xl">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Results and Player */}
      {processingState === 'complete' && appData && (
        <div className="w-full max-w-4xl mt-8 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4">
            Results for: <span className="font-normal">{appData.originalFilename}</span>
          </h2>

          {/* Playback Controls */}
          <div className="flex items-center gap-4 mb-4 p-4 border rounded shadow-md bg-white dark:bg-gray-800 w-full max-w-2xl">
             <button
                onClick={handlePlayPause}
                disabled={!canPlay}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-blue-700 transition"
             >
                {isPlaying ? 'Pause' : 'Play'}
             </button>
             <div className="flex items-center gap-2 flex-grow">
                 <span className="text-xs font-mono w-12 text-right">{new Date(currentTime * 1000).toISOString().substr(14, 5)}</span>
                 <input
                    type="range"
                    min="0"
                    max={duration || 1}
                    step="0.1"
                    value={currentTime}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    disabled={!canPlay || duration <= 0}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                    title="Seek"
                 />
                 <span className="text-xs font-mono w-12">{new Date(duration * 1000).toISOString().substr(14, 5)}</span>
             </div>
             {/* Volume Control */}
             <div className="flex items-center gap-1">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                 </svg>
                 <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                    title="Volume"
                 />
             </div>
             {/* Playback Mode Toggle */}
             <div className="flex items-center border rounded-md overflow-hidden">
                 <button
                    onClick={() => setPlaybackMode('original')}
                    disabled={!isOriginalReady}
                    className={`px-3 py-1 text-sm ${playbackMode === 'original' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                 >
                    Original
                 </button>
                 <button
                    onClick={() => setPlaybackMode('midi')}
                    disabled={!isMidiReady}
                    className={`px-3 py-1 text-sm ${playbackMode === 'midi' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                 >
                    MIDI
                 </button>
             </div>
          </div>

          {/* Hidden Players */}
          {/* HTML5 Audio Player (for file uploads - currently not implemented fully) */}
           {appData.sourceType === 'file' && (
               <audio
                 ref={audioPlayerRef}
                 // src={appData.sourceValue} // Needs Blob URL
                 onTimeUpdate={(e) => playbackMode === 'original' && handleTimeUpdate(e.currentTarget.currentTime)}
                 onLoadedMetadata={(e) => {
                     playbackMode === 'original' && handleDurationChange(e.currentTarget.duration);
                     setIsOriginalReady(true);
                 }}
                 onEnded={() => playbackMode === 'original' && handleEnded()}
                 onPlay={() => playbackMode === 'original' && !isPlaying && setIsPlaying(true)}
                 onPause={() => playbackMode === 'original' && isPlaying && setIsPlaying(false)}
                 className="hidden"
               />
           )}

           {/* YouTube Player */}
           {appData.sourceType === 'youtube' && appData.sourceValue && (
               <div className={`w-full max-w-xs mx-auto my-4 ${playbackMode === 'original' ? 'block' : 'hidden'}`}>
                 <YouTube
                   videoId={appData.sourceValue}
                   opts={{
                     height: '150', // Smaller player
                     width: '100%',
                     playerVars: {
                       // https://developers.google.com/youtube/player_parameters
                       autoplay: 0, // Don't autoplay initially
                       controls: 0, // Hide default controls
                       modestbranding: 1,
                       rel: 0,
                     },
                   }}
                   onReady={onPlayerReady}
                   onStateChange={onPlayerStateChange}
                   onError={(e: YouTubeEvent<number>) => console.error("YouTube Player Error:", e.data)} // Add type YouTubeEvent<number> and log e.data
                   className="aspect-video" // Maintain aspect ratio
                 />
               </div>
           )}


          {/* MIDI Player Component (Non-visual) */}
          <MidiPlayer
            midiBase64={appData.midiBase64}
            isPlaying={playbackMode === 'midi' && isPlaying}
            volume={volume}
            onTimeUpdate={(time) => playbackMode === 'midi' && handleTimeUpdate(time)}
            onDurationChange={handleDurationChange} // MIDI player also reports duration
            onEnded={() => playbackMode === 'midi' && handleEnded()}
            seekTime={playbackMode === 'midi' ? seekTime : null} // Only seek MIDI when active
            onReady={() => setIsMidiReady(true)}
          />

          {/* Chord Display */}
          <ChordDisplay
            chords={appData.chords}
            currentTime={currentTime}
            onChordClick={handleChordClick}
          />

        </div>
      )}
    </main>
  );
}
