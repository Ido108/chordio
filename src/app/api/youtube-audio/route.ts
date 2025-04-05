import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'edge';
export const preferredRegion = ['iad1']; // Use the region closest to your users

/**
 * API route to extract audio from YouTube videos
 * @param req - The incoming request
 * @returns Response with audio data or error
 */
export default async function handler(req: NextRequest) {
  try {
    // Get video ID from query parameters
    const videoId = req.nextUrl.searchParams.get('videoId');
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing videoId parameter' },
        { status: 400 }
      );
    }
    
    // Validate video ID
    if (!ytdl.validateID(videoId)) {
      return NextResponse.json(
        { error: 'Invalid YouTube video ID' },
        { status: 400 }
      );
    }
    
    // Get video info
    const videoInfo = await ytdl.getInfo(videoId);
    
    // Get audio-only format with highest quality
    const audioFormat = ytdl.chooseFormat(videoInfo.formats, { 
      quality: 'highestaudio',
      filter: 'audioonly'
    });
    
    if (!audioFormat) {
      return NextResponse.json(
        { error: 'No suitable audio format found' },
        { status: 404 }
      );
    }
    
    // Create a temporary file path
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `${videoId}.mp3`);
    
    // Download the audio
    const audioStream = ytdl(videoId, { format: audioFormat });
    const fileWriteStream = fs.createWriteStream(tempFilePath);
    
    await pipeline(audioStream, fileWriteStream);
    
    // Read the file and return it
    const audioBuffer = fs.readFileSync(tempFilePath);
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    // Return the audio data
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${videoInfo.videoDetails.title}.mp3"`,
      },
    });
  } catch (error) {
    console.error('Error processing YouTube video:', error);
    
    return NextResponse.json(
      { error: 'Failed to process YouTube video' },
      { status: 500 }
    );
  }
}
