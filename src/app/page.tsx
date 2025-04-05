"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
// import FileUploadForm from '@/components/FileUploadForm'; // Import dynamically
import YouTubeForm from '@/components/YouTubeForm';

// Dynamically import FileUploadForm only on the client-side
const FileUploadForm = dynamic(() => import('@/components/FileUploadForm'), {
  ssr: false, // Disable server-side rendering for this component
  loading: () => <p>Loading file uploader...</p> // Optional loading state
});

export default function Home() {
  const [activeTab, setActiveTab] = useState<'file' | 'youtube'>('file');

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Chord Extractor
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Extract chords from audio files or YouTube videos and convert them to MIDI
          </p>
        </div>

        {/* Tab navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('file')}
              className={`${
                activeTab === 'file'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Upload Audio File
            </button>
            <button
              onClick={() => setActiveTab('youtube')}
              className={`${
                activeTab === 'youtube'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              YouTube Link
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="mt-8">
          {activeTab === 'file' ? <FileUploadForm /> : <YouTubeForm />}
        </div>

        {/* How it works section */}
        <div className="mt-16 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">How It Works</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Learn how our chord extraction technology works
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Audio Analysis</h3>
                <p className="text-sm text-blue-600">
                  We analyze the audio using advanced signal processing techniques to identify the harmonic content
                  and extract the chord progression with precise timing.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-medium text-green-800 mb-2">Chord Detection</h3>
                <p className="text-sm text-green-600">
                  Our algorithm compares the audio's harmonic profile against chord templates to identify major, minor,
                  seventh, and other chord types throughout the song.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="text-lg font-medium text-purple-800 mb-2">MIDI Generation</h3>
                <p className="text-sm text-purple-600">
                  The detected chords are converted to MIDI format with accurate timing, allowing you to play them
                  back or use them in your favorite music software.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="ml-3 text-base text-gray-700">Process local audio files in various formats</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="ml-3 text-base text-gray-700">Extract audio from YouTube videos</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="ml-3 text-base text-gray-700">Detect chords with accurate timing</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="ml-3 text-base text-gray-700">Generate MIDI files from detected chords</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="ml-3 text-base text-gray-700">Play back original audio and generated MIDI</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="ml-3 text-base text-gray-700">Create melodic interpretations of chord progressions</p>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Chord Extractor. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
