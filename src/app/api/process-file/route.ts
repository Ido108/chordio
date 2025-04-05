import { NextRequest, NextResponse } from 'next/server';
import formidable, { File } from 'formidable';
import fs from 'fs/promises';
import { detectChords, ChordResult } from '@/lib/chordDetection';
import { generateMidiFromChords } from '@/lib/midiUtils';
import path from 'path';
import os from 'os';

// Disable Next.js body parsing for this route, as formidable handles it
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to parse form data
async function parseFormData(req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const form = formidable({
    // Keep extensions for potential type checking, though we rely on buffer analysis
    keepExtensions: true,
    // Store temporary files in the system's temp directory
    uploadDir: os.tmpdir(),
    // Set a reasonable max file size (e.g., 50MB)
    maxFileSize: 50 * 1024 * 1024,
  });

  return new Promise((resolve, reject) => {
    form.parse(req as any, (err, fields, files) => { // Need 'as any' due to type mismatch
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}

export async function POST(req: NextRequest) {
  console.log("Received request for /api/process-file");
  let tempFilePath: string | null = null;

  try {
    const { files } = await parseFormData(req);
    // Use type assertion after checking the file exists and is singular
    const uploadedFile = Array.isArray(files.audioFile) ? files.audioFile[0] : files.audioFile;

    if (!uploadedFile || !uploadedFile.filepath) {
      console.error("No valid audio file uploaded or filepath missing.");
      return NextResponse.json({ error: 'No valid audio file uploaded.' }, { status: 400 });
    }

    // Now we know uploadedFile is a formidable.File and filepath exists
    const currentFile = uploadedFile as formidable.File;
    tempFilePath = currentFile.filepath; // Keep track for cleanup
    console.log(`Audio file temporarily saved at: ${tempFilePath}`);

    // Read the uploaded file content into a Node.js Buffer
    const nodeBuffer = await fs.readFile(tempFilePath);
    console.log(`Read audio file buffer, size: ${nodeBuffer.byteLength} bytes`);

    // Convert Node.js Buffer to ArrayBuffer for Essentia
    // Create a new ArrayBuffer and copy the data to ensure the correct type
    const arrayBuffer = new ArrayBuffer(nodeBuffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < nodeBuffer.length; ++i) {
        view[i] = nodeBuffer[i];
    }

    // --- Chord Detection ---
    console.log("Starting chord detection...");
    const chords: ChordResult[] = await detectChords(arrayBuffer); // Pass the guaranteed ArrayBuffer
    if (!chords || chords.length === 0) {
        console.warn("No chords detected or detection failed.");
        // Decide if this is an error or just an empty result
        // return NextResponse.json({ error: 'Could not detect chords.' }, { status: 500 });
        // For now, return empty results if no chords found
    }
    console.log(`Chord detection finished. Found ${chords.length} chords.`);

    // --- MIDI Generation ---
    console.log("Starting MIDI generation...");
    const midiDataUint8 = generateMidiFromChords(chords);
    const midiDataBase64 = Buffer.from(midiDataUint8).toString('base64');
    console.log("MIDI generation finished.");

    // Return the results
    return NextResponse.json({
      chords: chords,
      midiBase64: midiDataBase64,
      originalFilename: currentFile.originalFilename || 'audio_file', // Use currentFile
    });

  } catch (error: any) {
    console.error("Error processing file upload:", error);
    // More specific error handling based on error type (e.g., formidable error, detection error)
    let errorMessage = 'Failed to process audio file.';
    let statusCode = 500;

    if (error.code === 'LIMIT_FILE_SIZE') {
        errorMessage = 'File size limit exceeded.';
        statusCode = 413; // Payload Too Large
    } else if (error instanceof Error) {
        errorMessage = error.message; // Use message from detection/MIDI errors
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });

  } finally {
    // --- Cleanup ---
    // Delete the temporary file after processing
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log(`Deleted temporary file: ${tempFilePath}`);
      } catch (cleanupError) {
        console.error(`Error deleting temporary file ${tempFilePath}:`, cleanupError);
      }
    }
  }
}
