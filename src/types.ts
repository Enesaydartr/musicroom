export interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number;
}

export interface Playlist {
  id: string;
  name: string;
  icon: string;
  songs: Song[];
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface LRCLibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string;
}
