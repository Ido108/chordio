"use client";

import React, { useState } from 'react';

interface YouTubeFormProps {
  onSubmit: (videoId: string) => void;
  isLoading: boolean;
}

const YouTubeForm: React.FC<YouTubeFormProps> = ({ onSubmit, isLoading }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const extractVideoId = (url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname === 'youtu.be') {
        return parsedUrl.pathname.slice(1);
      }
      if (parsedUrl.hostname.includes('youtube.com')) {
        const videoId = parsedUrl.searchParams.get('v');
        if (videoId) {
          return videoId;
        }
      }
    } catch (e) {
      // Invalid URL format
      return null;
    }
    return null;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const videoId = extractVideoId(youtubeUrl);

    if (!videoId) {
      setError('Invalid YouTube URL. Please use a valid video link (e.g., youtube.com/watch?v=... or youtu.be/...).');
      return;
    }
    onSubmit(videoId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700">
          YouTube Video URL
        </label>
        <div className="mt-1">
          <input
            type="url"
            name="youtube-url"
            id="youtube-url"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading || !youtubeUrl}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Process YouTube Link'}
        </button>
      </div>
    </form>
  );
};

export default YouTubeForm;
