# Chord Extractor Web Application

This web application extracts chords from audio files and YouTube videos, then generates MIDI files with accurate timing that match the original song. It features a modern web interface with audio visualization and playback capabilities.

## Features

- Upload and process audio files in various formats (MP3, WAV, OGG, FLAC)
- Extract audio from YouTube videos via URL
- Detect chords with precise timing information
- Generate MIDI files from detected chords
- Play back original audio with synchronized chord highlighting
- Play generated MIDI with accurate chord transitions
- Visualize audio waveform with chord markers
- Download MIDI files for use in other applications

## Technology Stack

- Next.js for the frontend and API routes
- React for the user interface
- Tailwind CSS for styling
- Tone.js for audio processing and playback
- @tonejs/midi for MIDI generation and playback
- ytdl-core for YouTube audio extraction

## How It Works

1. **Audio Analysis**: The application analyzes the audio using advanced signal processing techniques to identify the harmonic content and extract the chord progression with precise timing.

2. **Chord Detection**: Our algorithm compares the audio's harmonic profile against chord templates to identify major, minor, seventh, and other chord types throughout the song.

3. **MIDI Generation**: The detected chords are converted to MIDI format with accurate timing, allowing you to play them back or use them in your favorite music software.

## Usage

1. **Upload Audio File**:
   - Click on the "Upload Audio File" tab
   - Drag and drop an audio file or click to select one
   - Wait for processing to complete
   - View detected chords and play back the audio or MIDI

2. **Process YouTube Video**:
   - Click on the "YouTube Link" tab
   - Enter a YouTube video URL
   - Click "Extract Chords"
   - Wait for processing to complete
   - View detected chords and play back the audio or MIDI

3. **Playback Controls**:
   - Use the play/stop buttons to control audio playback
   - Click on chord buttons to jump to specific sections
   - Use the progress bar to seek through the audio
   - Download MIDI files using the provided links

## Deployment

The application is deployed on Vercel, which provides server-side functionality for processing audio files and YouTube videos. This ensures all features work correctly, including the YouTube link processing capability.

## Future Enhancements

- Improved chord detection accuracy for complex harmonies
- Support for more chord types (suspended, augmented, etc.)
- Melody extraction and transcription
- User accounts to save and share chord progressions
- Mobile app version for on-the-go chord extraction
