import { LRCLibResponse, Song } from '../types';
import { parseYouTubeTitle } from './utils';

const PIPED_INSTANCES = [
  'https://piped-api.lunar.icu',
  'https://api.piped.victr.me',
  'https://pipedapi.leptons.xyz'
];

export async function searchYouTube(query: string): Promise<Song[]> {
  const YOUTUBE_API_KEY = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

  try {
    if (YOUTUBE_API_KEY) {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query
        )}&type=video&maxResults=20&key=${YOUTUBE_API_KEY}`
      );
      if (!response.ok) throw new Error('YouTube API failed');
      const data = await response.json();
      return data.items.map((item: any) => {
        const { artist, track } = parseYouTubeTitle(item.snippet.title);
        return {
          id: item.id.videoId,
          title: track || item.snippet.title,
          artist: artist || item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          duration: '0:00'
        };
      });
    }

    // Fallback to Piped API with multiple instances
    for (const instance of PIPED_INSTANCES) {
      try {
        const response = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&filter=videos`);
        if (!response.ok) continue;
        const data = await response.json();
        
        if (!data.items || !Array.isArray(data.items)) continue;

        return data.items.map((item: any) => {
          const { artist, track } = parseYouTubeTitle(item.title);
          const videoId = item.url?.split('v=')[1] || item.id;
          
          return {
            id: videoId,
            title: track || item.title,
            artist: artist || item.uploaderName || 'Unknown Artist',
            thumbnail: item.thumbnail,
            duration: item.duration
          };
        });
      } catch (e) {
        console.debug(`Piped instance ${instance} failed:`, e);
        continue;
      }
    }
    
    throw new Error('All Piped instances failed');
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
}

export async function getLyrics(artist: string, track: string): Promise<LRCLibResponse | null> {
  try {
    const response = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(track)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('LRCLIB error:', error);
    return null;
  }
}
