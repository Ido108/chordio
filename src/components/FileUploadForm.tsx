'use client';

import React, { useState, useRef } from 'react';

interface FileUploadFormProps {
  onProcessingStart: () => void;
  onProcessingComplete: (data: any) => void; // Define a more specific type later
  onProcessingError: (error: string) => void;
}

const FileUploadForm: React.FC<FileUploadFormProps> = ({
  onProcessingStart,
  onProcessingComplete,
  onProcessingError,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      // Clear any previous errors when a new file is selected
      onProcessingError('');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      onProcessingError('Please select an audio file first.');
      return;
    }

    setIsUploading(true);
    onProcessingStart(); // Notify parent component that processing has started

    const formData = new FormData();
    formData.append('audioFile', selectedFile); // Key must match API route

    try {
      const response = await fetch('/api/process-file', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      console.log('File processing successful:', result);
      onProcessingComplete(result); // Pass data (chords, midiBase64, filename) to parent

    } catch (error: any) {
      console.error('Error uploading or processing file:', error);
      onProcessingError(error.message || 'An unknown error occurred during file processing.');
    } finally {
      setIsUploading(false);
      // Optionally clear the file input after submission
      // setSelectedFile(null);
      // if (fileInputRef.current) {
      //   fileInputRef.current.value = '';
      // }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded shadow-md w-full max-w-md">
      <h2 className="text-xl font-semibold mb-3">Upload Audio File</h2>
      <div className="mb-4">
        <label htmlFor="audioFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Select Audio File (WAV, MP3, OGG, FLAC, M4A, AAC)
        </label>
        <input
          type="file"
          id="audioFile"
          name="audioFile"
          ref={fileInputRef}
          accept=".wav,.mp3,.ogg,.flac,.m4a,.aac"
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500 dark:text-gray-400
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 dark:file:bg-blue-900
                     file:text-blue-700 dark:file:text-blue-300
                     hover:file:bg-blue-100 dark:hover:file:bg-blue-800
                     disabled:opacity-50"
        />
      </div>
      {selectedFile && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}
      <button
        type="submit"
        disabled={!selectedFile || isUploading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition duration-150 ease-in-out"
      >
        {isUploading ? 'Processing...' : 'Process File'}
      </button>
    </form>
  );
};

export default FileUploadForm;
