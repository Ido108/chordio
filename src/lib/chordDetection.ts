import Essentia from 'essentia.js';
import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm'; // Use specific path for WASM

// Define the expected structure for chord results
export interface ChordResult {
  chord: string;
  start: number;
  end: number;
}

// Function to decode audio data (assuming input is ArrayBuffer)
async function decodeAudioData(audioBuffer: ArrayBuffer): Promise<Float32Array> {
  const audioCtx = new (globalThis.AudioContext || (globalThis as any).webkitAudioContext)();
  const decodedBuffer = await audioCtx.decodeAudioData(audioBuffer);
  // Use mono audio for chord detection
  const monoChannel = decodedBuffer.getChannelData(0);
  return monoChannel;
}

// Main function to detect chords
export async function detectChords(audioBuffer: ArrayBuffer): Promise<ChordResult[]> {
  try {
    const essentia = new Essentia(EssentiaWASM); // Initialize Essentia with WASM

    // Decode audio buffer to Float32Array
    const audioVector = essentia.arrayToVector(await decodeAudioData(audioBuffer));

    // Perform chord detection using Essentia's ChordsDetection algorithm
    // Adjust parameters as needed for accuracy vs. performance
    const chordsResult = essentia.ChordsDetection(
      audioVector, // input audio vector
      16384,       // frameSize (adjust based on experimentation)
      4096,        // hopSize (adjust based on experimentation)
      0.5,         // magnitudeThreshold (adjust sensitivity)
      100,         // minChordDuration (in frames, adjust as needed)
      "degara",    // profile type (e.g., "degara", "wef", "krumhansl")
      false,       // hpcf (use Harmonic Pitch Class Profile)
      44100        // sampleRate (assuming 44.1kHz)
    );

    // Process the results into the desired format
    const chords: string[] = chordsResult.chords;
    const startTimes: number[] = chordsResult.startTimes;
    const endTimes: number[] = chordsResult.endTimes;

    const formattedResults: ChordResult[] = [];
    for (let i = 0; i < chords.length; i++) {
      // Filter out 'N' (no chord) results if desired
      if (chords[i] !== 'N') {
        formattedResults.push({
          chord: chords[i],
          start: startTimes[i],
          end: endTimes[i],
        });
      }
    }

    console.log("Chord detection successful:", formattedResults.length, "chords found.");
    return formattedResults;

  } catch (error) {
    console.error("Error during chord detection:", error);
    throw new Error(`Chord detection failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to fetch and load the WASM module if running in Node.js
// This might be needed depending on the environment Essentia runs in.
// For server-side Next.js, direct import might work, but this is safer.
async function loadWasm() {
  // In a Node.js environment, you might need to load the WASM file explicitly.
  // This depends on how essentia.js handles WASM loading in different environments.
  // If running server-side, ensure the WASM file is accessible.
  // For now, assume direct import works or handle WASM loading as needed.
}

// Call loadWasm if necessary, e.g., at module initialization
// loadWasm();
