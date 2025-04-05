import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import youtubeDl from 'youtube-dl-exec';
import { detectChords, ChordResult } from '@/lib/chordDetection';
import { generateMidiFromChords } from '@/lib/midiUtils';

// Helper function to validate YouTube URL (basic check)
function isValidYoutubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
  return youtubeRegex.test(url);
}

// Helper function to convert Node.js Buffer to ArrayBuffer
function nodeBufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return arrayBuffer;
}


export async function POST(req: NextRequest) {
  console.log("Received request for /api/youtube-audio");
  let tempAudioPath: string | null = null;

  try {
    const body = await req.json();
    const youtubeUrl = body.youtubeUrl;

    if (!youtubeUrl || typeof youtubeUrl !== 'string' || !isValidYoutubeUrl(youtubeUrl)) {
      console.error("Invalid or missing YouTube URL:", youtubeUrl);
      return NextResponse.json({ error: 'Invalid or missing YouTube URL.' }, { status: 400 });
    }

    console.log(`Processing YouTube URL: ${youtubeUrl}`);

    // --- Download Audio using yt-dlp ---
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chordio-yt-'));
    tempAudioPath = path.join(tempDir, 'audio.%(ext)s'); // yt-dlp will replace %(ext)s

    console.log(`Attempting to download audio to: ${tempAudioPath}`);

    // Execute youtube-dl-exec
    // Ensure yt-dlp is installed in the environment (especially for Railway)
    await youtubeDl(youtubeUrl, {
      output: tempAudioPath,
      format: 'bestaudio[ext=m4a]/bestaudio[ext=aac]/bestaudio/best', // Prioritize efficient formats
      extractAudio: true,
      audioFormat: 'm4a', // Request m4a container if possible
      // Add any other necessary yt-dlp flags (e.g., cookies, geo-bypass) if needed
      // Be mindful of potential rate limiting or blocks from YouTube
    });

    // yt-dlp adds the extension, find the actual downloaded file
    const filesInTemp = await fs.readdir(tempDir);
    const downloadedFile = filesInTemp.find(f => f.startsWith('audio.'));

    if (!downloadedFile) {
        throw new Error('Failed to find downloaded audio file after yt-dlp execution.');
    }
    const actualAudioPath = path.join(tempDir, downloadedFile);
    tempAudioPath = actualAudioPath; // Update path for cleanup
    console.log(`Audio downloaded successfully to: ${actualAudioPath}`);


    // --- Read Audio File ---
    const nodeBuffer = await fs.readFile(actualAudioPath);
    console.log(`Read downloaded audio file buffer, size: ${nodeBuffer.byteLength} bytes`);
    const arrayBuffer = nodeBufferToArrayBuffer(nodeBuffer); // Convert to ArrayBuffer

    // --- Chord Detection ---
    console.log("Starting chord detection for YouTube audio...");
    const chords: ChordResult[] = await detectChords(arrayBuffer);
     if (!chords || chords.length === 0) {
        console.warn("No chords detected or detection failed for YouTube audio.");
        // Return empty results for now
    }
    console.log(`Chord detection finished. Found ${chords.length} chords.`);

    // --- MIDI Generation ---
    console.log("Starting MIDI generation for YouTube audio...");
    const midiDataUint8 = generateMidiFromChords(chords);
    const midiDataBase64 = Buffer.from(midiDataUint8).toString('base64');
    console.log("MIDI generation finished.");

    // --- Extract Video Title (Optional but nice) ---
    let videoTitle = 'YouTube Audio';
    try {
        const metadata = await youtubeDl(youtubeUrl, { getTitle: true, skipDownload: true });
        // youtube-dl-exec might return metadata directly or as a string depending on version/flags
        if (typeof metadata === 'string') {
             videoTitle = metadata.trim();
        } else if (metadata && typeof (metadata as any).title === 'string') {
             videoTitle = (metadata as any).title;
        }
         console.log(`Extracted video title: ${videoTitle}`);
    } catch (titleError) {
        console.warn("Could not extract video title:", titleError);
    }


    // Return the results
    return NextResponse.json({
      chords: chords,
      midiBase64: midiDataBase64,
      originalFilename: videoTitle, // Use video title as filename
    });

  } catch (error: any) {
    console.error("Error processing YouTube URL:", error);
    // Handle yt-dlp errors specifically if possible
    let errorMessage = 'Failed to process YouTube URL.';
    if (error.stderr) { // youtube-dl-exec often puts errors in stderr
        errorMessage = `yt-dlp error: ${error.stderr}`;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });

  } finally {
    // --- Cleanup ---
    // Delete the temporary directory and its contents
    if (tempAudioPath) {
        const tempDir = path.dirname(tempAudioPath);
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
            console.log(`Deleted temporary directory: ${tempDir}`);
        } catch (cleanupError) {
            console.error(`Error deleting temporary directory ${tempDir}:`, cleanupError);
        }
    }
  }
}
