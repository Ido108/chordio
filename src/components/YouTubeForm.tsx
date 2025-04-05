'use client';

import React, { useState } from 'react';

interface YouTubeFormProps {
  onProcessingStart: () => void;
  onProcessingComplete: (data: any) => void; // Define a more specific type later
  onProcessingError: (error: string) => void;
}

const YouTubeForm: React.FC<YouTubeFormProps> = ({
  onProcessingStart,
  onProcessingComplete,
  onProcessingError,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(event.target.value);
    // Clear previous errors when URL changes
    onProcessingError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!youtubeUrl.trim()) {
      onProcessingError('Please enter a YouTube URL.');
      return;
    }

    // Basic validation (more robust validation happens server-side)
    if (!/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(youtubeUrl)) {
        onProcessingError('Please enter a valid YouTube URL.');
        return;
    }


    setIsProcessing(true);
    onProcessingStart();

    try {
      const response = await fetch('/api/youtube-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtubeUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      console.log('YouTube URL processing successful:', result);
      onProcessingComplete(result); // Pass data to parent

    } catch (error: any) {
      console.error('Error processing YouTube URL:', error);
      onProcessingError(error.message || 'An unknown error occurred while processing the YouTube link.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded shadow-md w-full max-w-md">
      <h2 className="text-xl font-semibold mb-3">Process YouTube Link</h2>
      <div className="mb-4">
        <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Paste YouTube URL
        </label>
        <input
          type="url"
          id="youtubeUrl"
          name="youtubeUrl"
          value={youtubeUrl}
          onChange={handleUrlChange}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={isProcessing}
          required
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={!youtubeUrl || isProcessing}
        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition duration-150 ease-in-out"
      >
        {isProcessing ? 'Processing...' : 'Process YouTube Link'}
      </button>
    </form>
  );
};

export default YouTubeForm;
