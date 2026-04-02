import { LRCLibResponse, Song } from '../types';
import { parseYouTubeTitle } from './utils';

// Şu an en aktif Piped API'leri
const PIPED_INSTANCES = [
  'https://pipedapi.smnz.de',
  'https://piped-api.garudalinux.org',
  'https://pipedapi.drgns.space',
  'https://piped-api.lunar.icu',
  'https://api-piped.mha.fi',
  'https://pipedapi.leptons.xyz'
];

const INVIDIOUS_INSTANCES = [
  'https://vid.puffyan.us',
  'https://invidious.fdn.fr',
  'https://invidious.perennialte.ch'
];

export async function searchYouTube(query: string): Promise<Song[]> {
  const YOUTUBE_API_KEY = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

  // 1. Try Official YouTube API if key exists
  if (YOUTUBE_API_KEY) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query
        )}&type=video&maxResults=20&key=${YOUTUBE_API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.items.map((item: any) => {
          const { artist, track } = parseYouTubeTitle(item.snippet.title);
          return {
            id: item.id.videoId,
            title: track || item.snippet.title,
            artist: artist || item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            duration: 0
          };
        });
      }
    } catch (e) {
      console.warn('YouTube API failed, falling back to alternatives');
    }
  }

  // 2. Try Piped API
  for (const instance of PIPED_INSTANCES) {
    try {
      const response = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&filter=videos`);
      if (!response.ok) continue;
      
      const data = await response.json();
      if (!data || !data.items || !Array.isArray(data.items)) continue;

      return data.items.map((item: any) => {
        const { artist, track } = parseYouTubeTitle(item.title);
        const videoId = item.url ? item.url.split('v=')[1] : item.id;
        
        return {
          id: videoId,
          title: track || item.title,
          artist: artist || item.uploaderName || 'Bilinmeyen Sanatçı',
          thumbnail: item.thumbnail,
          duration: item.duration || 0
        };
      });
    } catch (e) {
      console.warn(`Piped instance ${instance} failed.`);
      continue;
    }
  }

  // 3. Try Invidious API as last resort
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
      if (!response.ok) continue;
      
      const data = await response.json();
      if (!data || !Array.isArray(data)) continue;

      return data.map((item: any) => {
        const { artist, track } = parseYouTubeTitle(item.title);
        const thumbnail = item.videoThumbnails?.find((t: any) => t.quality === 'high')?.url || 
                         item.videoThumbnails?.[0]?.url || 
                         `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;
                         
        return {
          id: item.videoId,
          title: track || item.title,
          artist: artist || item.author || 'Bilinmeyen Sanatçı',
          thumbnail: thumbnail,
          duration: item.lengthSeconds || 0
        };
      });
    } catch (e) {
      console.warn(`Invidious instance ${instance} failed.`);
      continue;
    }
  }

  console.error('All search APIs failed');
  return [];
}

export async function getLyrics(artist: string, track: string): Promise<LRCLibResponse | null> {
  try {
    const res = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(track)}`);
    return res.ok ? await res.json() : null;
  } catch (e) {
    return null;
  }
}
