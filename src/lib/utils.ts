import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseLRC(lrc: string): { time: number; text: string }[] {
  const lines = lrc.split('\n');
  const result: { time: number; text: string }[] = [];
  const timeRegex = /\[(\d+):(\d+\.\d+)\]/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseFloat(match[2]);
      const time = minutes * 60 + seconds;
      const text = line.replace(timeRegex, '').trim();
      if (text) {
        result.push({ time, text });
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function parseYouTubeTitle(title: string): { artist: string; track: string } {
  // Common patterns: "Artist - Title", "Artist: Title", "Title by Artist"
  let artist = 'Unknown Artist';
  let track = title;

  if (title.includes(' - ')) {
    [artist, track] = title.split(' - ').map(s => s.trim());
  } else if (title.includes(': ')) {
    [artist, track] = title.split(': ').map(s => s.trim());
  }

  // Clean up common suffixes
  track = track.replace(/\(Official Video\)/gi, '')
               .replace(/\[Official Video\]/gi, '')
               .replace(/\(Official Audio\)/gi, '')
               .replace(/\(Lyrics\)/gi, '')
               .replace(/\[Lyrics\]/gi, '')
               .trim();

  return { artist, track };
}
