"use client";

import React, { useState, useRef } from 'react';

interface FileUploadFormProps {
  onSubmit: (file: File) => void;
  isLoading: boolean;
}

const FileUploadForm: React.FC<FileUploadFormProps> = ({ onSubmit, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation (can be expanded)
      if (!file.type.startsWith('audio/')) {
        setError('Invalid file type. Please select an audio file.');
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset input
        }
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedFile) {
      onSubmit(selectedFile);
    } else {
        setError('Please select an audio file first.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="audio-file" className="block text-sm font-medium text-gray-700">
          Upload Audio File
        </label>
        <div className="mt-1">
          <input
            ref={fileInputRef}
            type="file"
            name="audio-file"
            id="audio-file"
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            onChange={handleFileChange}
            accept="audio/*" // Accept all audio types
            required
            disabled={isLoading}
          />
        </div>
         {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
         {selectedFile && !error && <p className="mt-2 text-sm text-green-600">Selected: {selectedFile.name}</p>}
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading || !selectedFile || !!error}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Process Audio File'}
        </button>
      </div>
    </form>
  );
};

export default FileUploadForm;
