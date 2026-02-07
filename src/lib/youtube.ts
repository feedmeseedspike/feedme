// lib/youtube.ts
// YouTube API utilities for fetching video metadata

interface YouTubeVideoMetadata {
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
    /youtube\.com\/live\/([^&\s?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetch YouTube video metadata using YouTube Data API v3
 * Requires NEXT_PUBLIC_YOUTUBE_API_KEY in environment variables
 */
export async function fetchYouTubeMetadata(
  videoId: string
): Promise<YouTubeVideoMetadata | null> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn('YouTube API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    const statistics = video.statistics;

    return {
      title: snippet.title,
      description: snippet.description,
      channelTitle: snippet.channelTitle,
      channelId: snippet.channelId,
      thumbnailUrl:
        snippet.thumbnails.maxres?.url ||
        snippet.thumbnails.high?.url ||
        snippet.thumbnails.medium?.url ||
        snippet.thumbnails.default?.url,
      duration: contentDetails.duration,
      viewCount: statistics.viewCount,
      publishedAt: snippet.publishedAt,
    };
  } catch (error) {
    console.error('Failed to fetch YouTube metadata:', error);
    return null;
  }
}

/**
 * Get YouTube embed URL from video ID
 */
export function getYouTubeEmbedUrl(videoId: string, autoplay = false): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    ...(autoplay && { autoplay: '1' }),
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'maxres' = 'maxres'
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

/**
 * Parse ISO 8601 duration to human-readable format
 */
export function parseYouTubeDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) return '0:00';

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format view count to human-readable format
 */
export function formatViewCount(count: string | number): string {
  const num = typeof count === 'string' ? parseInt(count) : count;

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }

  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }

  return num.toString();
}
