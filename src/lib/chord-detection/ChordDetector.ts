import { EssentiaWASM } from 'essentia.js';
import * as Tone from 'tone';

// Define chord templates for major, minor, and other common chord types
const chordTemplates = {
  major: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0], // C, E, G
  minor: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0], // C, Eb, G
  dominant7: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], // C, E, G, Bb
  major7: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1], // C, E, G, B
  minor7: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0], // C, Eb, G, Bb
  diminished: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0], // C, Eb, Gb
  augmented: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // C, E, G#
  sus2: [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0], // C, D, G
  sus4: [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0], // C, F, G
};

// Note names for converting between MIDI numbers and note names
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * ChordDetector class for analyzing audio and detecting chords with timing information
 */
export class ChordDetector {
  private essentia: any;
  private initialized: boolean = false;
  private sampleRate: number = 44100;

  /**
   * Initialize the ChordDetector
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Initialize Essentia.js
      const essentia = await EssentiaWASM();
      this.essentia = essentia;
      this.initialized = true;
      console.log('ChordDetector initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ChordDetector:', error);
      throw error;
    }
  }

  /**
   * Analyze audio buffer and detect chords with timing information
   * @param audioBuffer - The audio buffer to analyze
   * @param minDuration - Minimum duration for a chord in seconds
   * @returns Array of detected chords with timing information
   */
  async detectChords(audioBuffer: AudioBuffer, minDuration: number = 0.5): Promise<ChordWithTiming[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Convert AudioBuffer to format needed by Essentia
    const audioData = this.convertAudioBufferToFloat32Array(audioBuffer);
    this.sampleRate = audioBuffer.sampleRate;

    // Extract chroma features (pitch class profile)
    const frameSize = 4096;
    const hopSize = 2048;
    const chromaFeatures = await this.extractChromaFeatures(audioData, frameSize, hopSize);
    
    // Detect chords from chroma features
    const rawChords = this.detectChordsFromChroma(chromaFeatures, hopSize);
    
    // Post-process chords (smooth and filter short chords)
    const processedChords = this.postProcessChords(rawChords, minDuration);
    
    return processedChords;
  }

  /**
   * Convert AudioBuffer to Float32Array for processing
   * @param audioBuffer - The audio buffer to convert
   * @returns Float32Array of mono audio data
   */
  private convertAudioBufferToFloat32Array(audioBuffer: AudioBuffer): Float32Array {
    // If stereo, convert to mono by averaging channels
    if (audioBuffer.numberOfChannels > 1) {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      const monoData = new Float32Array(left.length);
      
      for (let i = 0; i < left.length; i++) {
        monoData[i] = (left[i] + right[i]) / 2;
      }
      
      return monoData;
    }
    
    // If already mono, just return the data
    return audioBuffer.getChannelData(0);
  }

  /**
   * Extract chroma features from audio data
   * @param audioData - The audio data to analyze
   * @param frameSize - The frame size for analysis
   * @param hopSize - The hop size between frames
   * @returns Array of chroma vectors
   */
  private async extractChromaFeatures(audioData: Float32Array, frameSize: number, hopSize: number): Promise<number[][]> {
    const chromaFeatures: number[][] = [];
    
    // Process audio in frames
    for (let frameStart = 0; frameStart + frameSize <= audioData.length; frameStart += hopSize) {
      const frame = audioData.slice(frameStart, frameStart + frameSize);
      
      // Apply window function
      const windowedFrame = this.essentia.vectorMultiply(
        frame, 
        this.essentia.hann(frameSize)
      );
      
      // Compute spectrum
      const spectrum = this.essentia.spectrum(windowedFrame);
      
      // Compute HPCP (Harmonic Pitch Class Profile, similar to chroma)
      const hpcp = this.essentia.hpcp(spectrum.magnitude);
      
      // Add to chroma features
      chromaFeatures.push(Array.from(hpcp.hpcp));
    }
    
    return chromaFeatures;
  }

  /**
   * Detect chords from chroma features
   * @param chromaFeatures - Array of chroma vectors
   * @param hopSize - The hop size used during feature extraction
   * @returns Array of detected chords with timing information
   */
  private detectChordsFromChroma(chromaFeatures: number[][], hopSize: number): ChordWithTiming[] {
    const detectedChords: ChordWithTiming[] = [];
    
    // Process each chroma vector
    for (let i = 0; i < chromaFeatures.length; i++) {
      const chroma = chromaFeatures[i];
      
      // Normalize chroma vector
      const maxValue = Math.max(...chroma);
      const normalizedChroma = chroma.map(value => value / maxValue);
      
      // Find best matching chord
      const { chordName, confidence } = this.findBestMatchingChord(normalizedChroma);
      
      // Calculate timing information
      const startTime = (i * hopSize) / this.sampleRate;
      const endTime = ((i + 1) * hopSize) / this.sampleRate;
      
      // Add to detected chords
      detectedChords.push({
        chord: chordName,
        startTime,
        endTime,
        confidence
      });
    }
    
    return detectedChords;
  }

  /**
   * Find the best matching chord for a chroma vector
   * @param chroma - The normalized chroma vector
   * @returns The best matching chord and confidence
   */
  private findBestMatchingChord(chroma: number[]): { chordName: string, confidence: number } {
    let bestCorrelation = -1;
    let bestChordType = '';
    let bestRoot = 0;
    
    // Try each possible root note
    for (let root = 0; root < 12; root++) {
      // Try each chord type
      for (const [chordType, template] of Object.entries(chordTemplates)) {
        // Rotate template to current root
        const rotatedTemplate = [...template.slice(12 - root), ...template.slice(0, 12 - root)];
        
        // Calculate correlation
        const correlation = this.calculateCorrelation(chroma, rotatedTemplate);
        
        // Update best match if this is better
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestChordType = chordType;
          bestRoot = root;
        }
      }
    }
    
    // Format chord name
    const rootName = noteNames[bestRoot];
    let chordName = rootName;
    
    // Add chord type suffix
    switch (bestChordType) {
      case 'major':
        // Major is the default, no suffix needed
        break;
      case 'minor':
        chordName += 'm';
        break;
      case 'dominant7':
        chordName += '7';
        break;
      case 'major7':
        chordName += 'maj7';
        break;
      case 'minor7':
        chordName += 'm7';
        break;
      case 'diminished':
        chordName += 'dim';
        break;
      case 'augmented':
        chordName += 'aug';
        break;
      case 'sus2':
        chordName += 'sus2';
        break;
      case 'sus4':
        chordName += 'sus4';
        break;
      default:
        break;
    }
    
    return {
      chordName,
      confidence: bestCorrelation
    };
  }

  /**
   * Calculate correlation between two vectors
   * @param a - First vector
   * @param b - Second vector
   * @returns Correlation coefficient
   */
  private calculateCorrelation(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let sumA = 0;
    let sumB = 0;
    let sumAB = 0;
    let sumASquared = 0;
    let sumBSquared = 0;
    
    for (let i = 0; i < a.length; i++) {
      sumA += a[i];
      sumB += b[i];
      sumAB += a[i] * b[i];
      sumASquared += a[i] * a[i];
      sumBSquared += b[i] * b[i];
    }
    
    const n = a.length;
    const numerator = n * sumAB - sumA * sumB;
    const denominator = Math.sqrt((n * sumASquared - sumA * sumA) * (n * sumBSquared - sumB * sumB));
    
    if (denominator === 0) return 0;
    
    return numerator / denominator;
  }

  /**
   * Post-process detected chords to smooth and filter short chords
   * @param chords - Array of detected chords
   * @param minDuration - Minimum duration for a chord in seconds
   * @returns Processed array of chords
   */
  private postProcessChords(chords: ChordWithTiming[], minDuration: number): ChordWithTiming[] {
    if (chords.length === 0) return [];
    
    // Smooth chords (merge adjacent frames with the same chord)
    const smoothedChords: ChordWithTiming[] = [];
    let currentChord = chords[0];
    
    for (let i = 1; i < chords.length; i++) {
      if (chords[i].chord === currentChord.chord) {
        // Same chord, extend end time
        currentChord.endTime = chords[i].endTime;
        // Update confidence (average)
        currentChord.confidence = (currentChord.confidence + chords[i].confidence) / 2;
      } else {
        // Different chord, add current to result and start new
        smoothedChords.push(currentChord);
        currentChord = chords[i];
      }
    }
    
    // Add the last chord
    smoothedChords.push(currentChord);
    
    // Filter out chords shorter than minDuration
    const filteredChords = smoothedChords.filter(
      chord => (chord.endTime - chord.startTime) >= minDuration
    );
    
    return filteredChords;
  }

  /**
   * Load audio from a file or URL
   * @param source - File object or URL string
   * @returns Promise resolving to AudioBuffer
   */
  async loadAudio(source: File | string): Promise<AudioBuffer> {
    // Initialize Tone.js context if needed
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    
    return new Promise(async (resolve, reject) => {
      try {
        let buffer: AudioBuffer;
        
        if (typeof source === 'string') {
          // Load from URL
          buffer = await Tone.Buffer.fromUrl(source);
        } else {
          // Load from File
          const arrayBuffer = await this.readFileAsArrayBuffer(source);
          buffer = await Tone.context.decodeAudioData(arrayBuffer);
        }
        
        resolve(buffer);
      } catch (error) {
        console.error('Error loading audio:', error);
        reject(error);
      }
    });
  }

  /**
   * Read a File as ArrayBuffer
   * @param file - The file to read
   * @returns Promise resolving to ArrayBuffer
   */
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          resolve(event.target.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
}

/**
 * Interface for chord with timing information
 */
export interface ChordWithTiming {
  chord: string;
  startTime: number;
  endTime: number;
  confidence: number;
}
