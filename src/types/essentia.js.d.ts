declare module 'essentia.js' {
  export class Essentia {
    constructor(wasmModule: any);
    arrayToVector(data: Float32Array): any; // Use 'any' for simplicity, refine if needed
    ChordsDetection(
      audioVector: any,
      frameSize?: number,
      hopSize?: number,
      magnitudeThreshold?: number,
      minChordDuration?: number,
      profileType?: string,
      hpcf?: boolean,
      sampleRate?: number
    ): {
      chords: string[];
      startTimes: number[];
      endTimes: number[];
      // Add other potential fields if known
    };
    // Add other Essentia methods used in the project here
  }
  export default Essentia;
}

// Also declare the specific WASM module path if needed, though this might
// still require runtime handling or configuration adjustments.
// For now, focusing on the main module declaration.
declare module 'essentia.js/dist/essentia-wasm' {
    const EssentiaWASM: any; // Define the type for the WASM module export
    export { EssentiaWASM };
}
