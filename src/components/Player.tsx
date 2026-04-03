import React from 'react';
import YouTube from 'react-youtube';
import { Song } from '../types';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  onReady: (player: any) => void;
  onStateChange: (state: number) => void;
  onEnd: () => void;
}

export const Player: React.FC<PlayerProps> = ({ 
  currentSong, 
  isPlaying, 
  volume, 
  onReady, 
  onStateChange, 
  onEnd 
}) => {
  const playerRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  React.useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  if (!currentSong) return null;

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      rel: 0,
      iv_load_policy: 3,
      disablekb: 1,
      modestbranding: 1,
      showinfo: 0,
      // ELECTRON (SİYAH EKRAN) HATASINI ÇÖZEN SATIR
      origin: 'https://www.youtube.com'
    },
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none bg-black -z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%]">
        <div className="w-full h-full transform scale-[1.5]">
          <YouTube
            videoId={currentSong.id}
            opts={opts}
            onReady={(event) => {
              playerRef.current = event.target;
              onReady(event.target);
            }}
            onStateChange={(event) => onStateChange(event.data)}
            onEnd={onEnd}
            className="w-full h-full"
            iframeClassName="w-full h-full"
          />
        </div>
      </div>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
    </div>
  );
};