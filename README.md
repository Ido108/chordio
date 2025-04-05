# Chordio - Chord Extraction Web App

Chordio is a full-stack web application that extracts chord progressions from audio files or YouTube links and generates a synchronized MIDI representation.

## Features

-   **Audio Input**: Upload common audio formats (WAV, MP3, OGG, FLAC, M4A, AAC) or provide a YouTube video URL.
-   **Chord Detection**: Extracts chords and their precise start/end times from the audio source using Essentia.js.
-   **MIDI Generation**: Creates a MIDI sequence based on the detected chords, preserving the original timing.
-   **Synchronized Playback**: Play the original audio (YouTube only for now) or the generated MIDI side-by-side.
-   **Real-time Highlighting**: The currently playing chord is highlighted in the displayed chord list.

## Tech Stack

-   **Framework**: Next.js (React) with TypeScript
-   **Styling**: Tailwind CSS
-   **Chord Detection**: Essentia.js
-   **YouTube Audio Extraction**: yt-dlp (via `youtube-dl-exec`)
-   **MIDI Generation**: @tonejs/midi, Tone.js
-   **File Uploads**: Formidable
-   **Deployment**: Railway (using Nixpacks)

## Local Development Setup

1.  **Prerequisites**:
    *   Node.js (v18.17.0 or later recommended, as required by Next.js 14.2+)
    *   npm or yarn
    *   `yt-dlp`: Required for YouTube link processing. Install it following the instructions here: [https://github.com/yt-dlp/yt-dlp#installation](https://github.com/yt-dlp/yt-dlp#installation)

2.  **Clone the repository**:
    ```bash
    git clone <your-repository-url>
    cd chordio
    ```

3.  **Install dependencies**:
    ```bash
    npm install
    # or
    # yarn install
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    The application should now be running at [http://localhost:3000](http://localhost:3000).

## Deployment to Railway

This project is configured for easy deployment on Railway using Nixpacks.

1.  **Create a Railway Project**: Go to [railway.app](https://railway.app/) and create a new project, linking it to your Git repository (e.g., GitHub).
2.  **Build and Deploy**: Railway will automatically detect the `nixpacks.toml` file.
    *   It will install the necessary Nix packages (including `yt-dlp`).
    *   It will run `npm install` and `npm run build`.
    *   It will start the application using `npm run start`.
3.  **Environment Variables**: No specific environment variables are required by default for this setup. Railway automatically provides the `PORT` variable.

Once deployed, Railway will provide a public URL for your Chordio application.

## Notes

-   **Essentia.js WASM**: Essentia.js relies on a WebAssembly (WASM) module. Ensure this module (`essentia-wasm.wasm`) is correctly served alongside the application, especially in production builds. Next.js should handle static assets appropriately, but verify during deployment.
-   **YouTube Playback**: Original audio playback for *uploaded* files is not currently implemented in the UI (only YouTube original playback is shown).
-   **Error Handling**: Basic error handling is in place, but could be enhanced for specific scenarios (e.g., invalid audio formats, YouTube API errors/throttling).
-   **Performance**: Chord detection performance depends on audio length and server resources. Long files may take time to process.
