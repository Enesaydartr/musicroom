import React, { useEffect, useRef } from 'react';
import { Song } from '../types';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  onReady: (player: any) => void;
  onStateChange: (state: number) => void;
  onEnd: () => void;
}

declare global {
  interface Window {
    YT: any;
    isYouTubeAPIReady: boolean;
  }
}

export const Player: React.FC<PlayerProps> = ({ currentSong, isPlaying, volume, onReady, onStateChange, onEnd }) => {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const initPlayer = () => {
      if (window.YT && window.YT.Player && currentSong?.id) {
        if (playerRef.current) {
          playerRef.current.loadVideoById(currentSong.id);
        } else {
          playerRef.current = new window.YT.Player('youtube-player', {
            videoId: currentSong.id,
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              rel: 0,
              modestbranding: 1,
              origin: window.location.origin
            },
            events: {
              onReady: (event: any) => {
                if (isPlaying) event.target.playVideo();
                event.target.setVolume(volume);
                onReady(event.target);
              },
              onStateChange: (event: any) => {
                onStateChange(event.data);
                if (event.data === (window.YT?.PlayerState?.ENDED || 0)) {
                  onEnd();
                }
              }
            }
          });
        }
      }
    };

    if (window.isYouTubeAPIReady) {
      initPlayer();
    } else {
      window.addEventListener('youtube-api-ready', initPlayer);
    }

    return () => window.removeEventListener('youtube-api-ready', initPlayer);
  }, [currentSong]);

  useEffect(() => {
    if (playerRef.current && playerRef.current.getPlayerState) {
      isPlaying ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none bg-black -z-10">
      {/* YouTube Logolarını Gizlemek İçin Scale Yapıyoruz */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] scale-110">
        <div id="youtube-player" className="w-full h-full"></div>
      </div>
      {/* Karartma Katmanı */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
    </div>
  );
};
