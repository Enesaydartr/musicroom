import React, { useEffect, useRef } from 'react';
import { Song } from '../types';

interface PlayerProps {
  song: Song;
  volume: number;
  onReady: (player: any) => void;
  onStateChange: (state: number) => void;
  onEnd: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    isYouTubeAPIReady: boolean;
  }
}

export const Player: React.FC<PlayerProps> = ({ song, volume, onReady, onStateChange, onEnd }) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isReadyRef = useRef(false);

  // Initialize player only once
  useEffect(() => {
    const createPlayer = () => {
      try {
        if (!window.YT || !window.YT.Player || !containerRef.current || playerRef.current) return;

        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: song.id,
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
            origin: window.location.origin,
            enablejsapi: 1,
            widget_referrer: window.location.href,
          },
          events: {
            onReady: (event: any) => {
              try {
                isReadyRef.current = true;
                if (event.target && typeof event.target.setVolume === 'function') {
                  event.target.setVolume(volume);
                }
                onReady(event.target);
              } catch (e) {
                console.debug('Player onReady error:', e);
              }
            },
            onStateChange: (event: any) => {
              try {
                onStateChange(event.data);
                if (event.data === (window.YT?.PlayerState?.ENDED || 0)) {
                  onEnd();
                }
              } catch (e) {
                console.debug('Player onStateChange error:', e);
              }
            },
            onError: (event: any) => {
              console.error('YouTube Player Error:', event.data);
            }
          },
        });
      } catch (error) {
        console.error('Failed to initialize YouTube Player:', error);
      }
    };

    if (window.isYouTubeAPIReady || (window.YT && window.YT.Player)) {
      createPlayer();
    } else {
      const handleApiReady = () => {
        createPlayer();
        window.removeEventListener('youtube-api-ready', handleApiReady);
      };
      window.addEventListener('youtube-api-ready', handleApiReady);
      
      return () => {
        window.removeEventListener('youtube-api-ready', handleApiReady);
        if (playerRef.current && playerRef.current.destroy) {
          playerRef.current.destroy();
          playerRef.current = null;
          isReadyRef.current = false;
        }
      };
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
        isReadyRef.current = false;
      }
    };
  }, []); // Empty dependency array to run only once

  // Handle song changes without recreating the player
  useEffect(() => {
    if (isReadyRef.current && playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(song.id);
    }
  }, [song.id]);

  useEffect(() => {
    if (isReadyRef.current && playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  return (
    <div className="w-full h-full overflow-hidden relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-full h-full transform scale-[1.4]"
        >
          {/* Wrapper div to prevent YT API from destroying our ref container */}
          <div id="yt-player-container">
            <div ref={containerRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
