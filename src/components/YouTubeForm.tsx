import React, { useState } from 'react';
import { useAudioProcessor } from '@/hooks/useAudioProcessor';

export default function YouTubeForm() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  
  const {
    isProcessing,
    detectedChords,
    midiUrl,
    midiWithMelodyUrl,
    error,
    processAudioUrl,
    playOriginalAudio,
    stopPlayback,
    playMidi
  } = useAudioProcessor();

  // Validate YouTube URL
  const validateYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    setIsValidUrl(validateYouTubeUrl(url));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidUrl) {
      return;
    }
    
    // Extract video ID from YouTube URL
    let videoId = '';
    
    if (youtubeUrl.includes('youtube.com')) {
      const urlParams = new URLSearchParams(new URL(youtubeUrl).search);
      videoId = urlParams.get('v') || '';
    } else if (youtubeUrl.includes('youtu.be')) {
      videoId = youtubeUrl.split('/').pop() || '';
    }
    
    if (!videoId) {
      alert('Could not extract video ID from URL');
      return;
    }
    
    // Process the YouTube video
    try {
      // We'll use our server-side API to extract audio from YouTube
      const apiUrl = `/api/youtube-audio?videoId=${videoId}`;
      await processAudioUrl(apiUrl);
    } catch (error) {
      console.error('Error processing YouTube video:', error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Process YouTube Video</h2>
      
      {/* YouTube URL input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-1">
            YouTube URL
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              name="youtube-url"
              id="youtube-url"
              className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300 p-2 border"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={handleInputChange}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Enter a YouTube video URL to extract chords from the audio
          </p>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={!isValidUrl || isProcessing}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              !isValidUrl || isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Extract Chords'}
          </button>
        </div>
      </form>
      
      {/* Processing status */}
      {isProcessing && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Processing YouTube audio... This may take a moment.</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          <p>{error}</p>
        </div>
      )}
      
      {/* Results section */}
      {detectedChords.length > 0 && !isProcessing && (
        <div className="mt-8 space-y-6">
          <h3 className="text-xl font-semibold">Detected Chords</h3>
          
          {/* Playback controls */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={playOriginalAudio}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Play Original Audio
            </button>
            <button
              onClick={() => playMidi(false)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Play Chords
            </button>
            <button
              onClick={() => playMidi(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Play Chords with Melody
            </button>
            <button
              onClick={stopPlayback}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Stop
            </button>
          </div>
          
          {/* Download links */}
          <div className="flex flex-wrap gap-3">
            {midiUrl && (
              <a
                href={midiUrl}
                download="chord-progression.mid"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Download MIDI (Chords Only)
              </a>
            )}
            {midiWithMelodyUrl && (
              <a
                href={midiWithMelodyUrl}
                download="chord-progression-with-melody.mid"
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
              >
                Download MIDI (With Melody)
              </a>
            )}
          </div>
          
          {/* Chord list */}
          <div className="mt-4 border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chord</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detectedChords.map((chord, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {chord.startTime.toFixed(2)}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {chord.endTime.toFixed(2)}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {chord.chord}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(chord.confidence * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
