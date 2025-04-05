import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';
import { PassThrough } from 'stream';

// Ensure this route runs on the Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Ensure dynamic execution

export async function POST(req: NextRequest) {
  try {
    const { videoId } = await req.json();

    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid videoId' }, { status: 400 });
    }

    if (!ytdl.validateID(videoId)) {
      return NextResponse.json({ error: 'Invalid YouTube video ID' }, { status: 400 });
    }

    console.log(`Fetching info for video ID: ${videoId}`);
    const info = await ytdl.getInfo(videoId);
    console.log(`Successfully fetched info for: ${info.videoDetails.title}`);

    const audioFormat = ytdl.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    if (!audioFormat) {
      console.error('No suitable audio format found for video:', videoId);
      return NextResponse.json({ error: 'No suitable audio format found' }, { status: 404 });
    }

    console.log('Found audio format:', audioFormat.container, audioFormat.audioBitrate);

    // Create a PassThrough stream to pipe the audio data
    const passThrough = new PassThrough();

    // Start downloading the audio and pipe it to the PassThrough stream
    ytdl(videoId, { format: audioFormat }).pipe(passThrough);

    // Return the stream as the response
    // Note: Streaming directly might be complex depending on client handling.
    // For simplicity in this rebuild, let's return the format URL first.
    // A full streaming implementation would require more setup.
    // return new NextResponse(passThrough, {
    //   headers: {
    //     'Content-Type': `audio/${audioFormat.container || 'mpeg'}`,
    //     'Content-Disposition': `attachment; filename="audio.${audioFormat.container || 'mp3'}"`,
    //   },
    // });

    // --- Simplified approach for now: Return URL ---
    console.log(`Returning audio URL: ${audioFormat.url}`);
    return NextResponse.json({
      audioUrl: audioFormat.url,
      title: info.videoDetails.title,
      container: audioFormat.container || 'unknown',
    });
    // --- End Simplified approach ---

  } catch (error: any) {
    console.error('Error in /api/youtube-audio:', error);
    // Check for specific ytdl errors if needed
    if (error.message && error.message.includes('private video')) {
       return NextResponse.json({ error: 'Cannot process private videos.' }, { status: 403 });
    }
     if (error.message && error.message.includes('unavailable')) {
       return NextResponse.json({ error: 'Video is unavailable.' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to process YouTube video', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
