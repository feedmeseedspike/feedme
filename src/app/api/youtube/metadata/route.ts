// app/api/youtube/metadata/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeVideoId, fetchYouTubeMetadata } from '@/lib/youtube';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    const videoId = extractYouTubeVideoId(url);

    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    const metadata = await fetchYouTubeMetadata(videoId);

    if (!metadata) {
      return NextResponse.json(
        { error: 'Failed to fetch video metadata' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      videoId,
      metadata,
    });
  } catch (error: any) {
    console.error('YouTube metadata API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
