import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from './components/Player';
import { Song, Playlist, LyricLine } from './types';
import { getLyrics } from './lib/api';
import { parseLRC, cn } from './lib/utils';
import { Lyrics } from './components/Lyrics';
import { Controls } from './components/Controls';
import { Sidebar } from './components/Sidebar';
import { Music, Search } from 'lucide-react';

export default function App() {
  const [currentSong, setCurrentSong] = useState<Song | undefined>();
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('lyrical_playlists');
    return saved ? JSON.parse(saved) : [];
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [volume, setVolume] = useState(80);
  const [player, setPlayer] = useState<any>(null);
  const [isPlayerBuffering, setIsPlayerBuffering] = useState(false);
  const [isAPIReady, setIsAPIReady] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check YouTube API readiness
  useEffect(() => {
    if ((window as any).isYouTubeAPIReady) {
      setIsAPIReady(true);
    } else {
      const handleReady = () => setIsAPIReady(true);
      window.addEventListener('youtube-api-ready', handleReady);
      return () => window.removeEventListener('youtube-api-ready', handleReady);
    }
  }, []);

  // Persist playlists
  useEffect(() => {
    localStorage.setItem('lyrical_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Hide controls after inactivity
  const resetControlsTimeout = useCallback(() => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setIsControlsVisible(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    window.addEventListener('mousemove', resetControlsTimeout);
    window.addEventListener('click', resetControlsTimeout);
    return () => {
      window.removeEventListener('mousemove', resetControlsTimeout);
      window.removeEventListener('click', resetControlsTimeout);
    };
  }, [resetControlsTimeout]);

  // Fetch lyrics when song changes
  useEffect(() => {
    if (currentSong) {
      setLyrics([]);
      getLyrics(currentSong.artist, currentSong.title).then(res => {
        if (res?.syncedLyrics) {
          setLyrics(parseLRC(res.syncedLyrics));
        }
      });
    }
  }, [currentSong]);

  // Update current time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && player && typeof player.getCurrentTime === 'function') {
      interval = setInterval(() => {
        try {
          setCurrentTime(player.getCurrentTime());
        } catch (e) {
          console.debug('Player not ready for getCurrentTime');
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, player]);

  const onPlayerReady = (playerInstance: any) => {
    setPlayer(playerInstance);
    try {
      playerInstance.setVolume(volume);
      playerInstance.playVideo();
    } catch (e) {
      console.debug('Player not ready for volume/play');
    }
  };

  const onPlayerStateChange = (state: number) => {
    // Update playing state
    setIsPlaying(state === 1); // 1 is PLAYING
    
    if (state === 1 && player && typeof player.getDuration === 'function') {
      try {
        setDuration(player.getDuration());
        setIsPlayerBuffering(false);
      } catch (e) {
        console.debug('Player not ready for getDuration');
      }
    } else if (state === 3) {
      // 3: BUFFERING
      setIsPlayerBuffering(true);
    } else if (state === -1 || state === 5) {
      // -1: UNSTARTED, 5: CUED
      setIsPlayerBuffering(false); // Don't hide the player, let the user see the thumbnail or click play
      // Try to nudge it to play if it's cued or unstarted
      if (player && typeof player.playVideo === 'function') {
        try {
          player.playVideo();
        } catch (e) {
          console.debug('Player not ready for playVideo in state change');
        }
      }
    }
  };

  // Fallback to hide loading screen if it takes too long
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (currentSong && isPlayerBuffering) {
      timeout = setTimeout(() => {
        setIsPlayerBuffering(false);
      }, 8000); // 8 second fallback
    }
    return () => clearTimeout(timeout);
  }, [currentSong, isPlayerBuffering]);

  // Ensure player plays when song changes
  useEffect(() => {
    if (player && currentSong) {
      player.playVideo();
    }
  }, [currentSong, player]);

  const onPlayerEnd = () => {
    if (isRepeating && player) {
      player.seekTo(0);
      player.playVideo();
    } else {
      handleNext();
    }
  };

  const handlePlaySong = (song: Song) => {
    setIsPlayerBuffering(true);
    setCurrentSong(song);
    setIsSidebarOpen(false);
    setIsPlaying(true);
  };

  const handleNext = () => {
    // Find current song in playlists and play next
    for (const playlist of playlists) {
      const index = playlist.songs.findIndex(s => s.id === currentSong?.id);
      if (index !== -1 && index < playlist.songs.length - 1) {
        handlePlaySong(playlist.songs[index + 1]);
        return;
      }
    }
  };

  const handlePrev = () => {
    for (const playlist of playlists) {
      const index = playlist.songs.findIndex(s => s.id === currentSong?.id);
      if (index !== -1 && index > 0) {
        handlePlaySong(playlist.songs[index - 1]);
        return;
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none">
      {/* Background Video */}
      <div className={cn(
        "absolute inset-0 z-0 transition-opacity duration-1000",
        isPlayerBuffering ? "opacity-0" : "opacity-100"
      )}>
        {currentSong ? (
          <Player
            song={currentSong}
            volume={volume}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            onEnd={onPlayerEnd}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
            {!isAPIReady && currentSong ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-white/40 text-xs tracking-widest uppercase animate-pulse">Initializing API</p>
              </div>
            ) : (
              <>
                <Music size={120} strokeWidth={1} className="mb-6 animate-pulse" />
                <p className="text-xl font-light tracking-widest uppercase">Select a song to start</p>
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white border border-white/10 transition-all flex items-center gap-3 group pointer-events-auto"
                >
                  <Search size={20} className="group-hover:scale-110 transition-transform" />
                  <span>Search Library</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Loading/Buffering Overlay */}
      <AnimatePresence>
        {currentSong && isPlayerBuffering && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-1 flex items-center justify-center bg-black"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white/40 text-xs tracking-widest uppercase animate-pulse">Loading Stream</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for interaction when controls are hidden */}
      <div 
        className="absolute inset-0 z-5 cursor-none" 
        onClick={() => setIsControlsVisible(true)}
      />

      {/* Lyrics Overlay */}
      <Lyrics 
        lyrics={lyrics} 
        currentTime={currentTime} 
        isVisible={!isSidebarOpen} 
      />

      {/* Controls Overlay */}
      <Controls
        isVisible={isControlsVisible}
        isPlaying={isPlaying}
        onTogglePlay={() => {
          if (player) {
            isPlaying ? player.pauseVideo() : player.playVideo();
          }
        }}
        onNext={handleNext}
        onPrev={handlePrev}
        onToggleRepeat={() => setIsRepeating(!isRepeating)}
        isRepeating={isRepeating}
        onToggleFullscreen={toggleFullscreen}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        currentTime={currentTime}
        duration={duration}
        onSeek={(time) => {
          if (player) {
            player.seekTo(time);
          }
        }}
        currentSong={currentSong}
        volume={volume}
        onVolumeChange={(v) => {
          setVolume(v);
          if (player && typeof player.setVolume === 'function') {
            player.setVolume(v);
          }
        }}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onPlaySong={handlePlaySong}
        playlists={playlists}
        setPlaylists={setPlaylists}
        currentSong={currentSong}
      />

      {/* Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-radial-vignette" />

      <style>{`
        .bg-radial-vignette {
          background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
