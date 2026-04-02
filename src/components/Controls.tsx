import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Maximize2, 
  Menu,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Song } from '../types';
import { cn, formatTime } from '../lib/utils';

interface ControlsProps {
  isVisible: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleRepeat: () => void;
  isRepeating: boolean;
  onToggleFullscreen: () => void;
  onOpenSidebar: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  currentSong?: Song;
  volume: number;
  onVolumeChange: (v: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isVisible,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleRepeat,
  isRepeating,
  onToggleFullscreen,
  onOpenSidebar,
  currentTime,
  duration,
  onSeek,
  currentSong,
  volume,
  onVolumeChange
}) => {
  const [isMuted, setIsMuted] = React.useState(false);
  const prevVolume = React.useRef(volume);

  const toggleMute = () => {
    if (isMuted) {
      onVolumeChange(prevVolume.current);
      setIsMuted(false);
    } else {
      prevVolume.current = volume;
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 transition-all duration-500 transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
      )}
    >
      <div className="max-w-5xl mx-auto px-6 pb-10">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          {/* Progress Bar */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-xs font-medium text-white/50 w-10">{formatTime(currentTime)}</span>
            <div 
              className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = x / rect.width;
                onSeek(percent * duration);
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-white/50 w-10">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between">
            {/* Song Info */}
            <div className="flex items-center gap-4 w-1/3">
              <button 
                onClick={onOpenSidebar}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all"
              >
                <Menu size={20} />
              </button>
              {currentSong && (
                <div className="hidden md:block min-w-0">
                  <h3 className="text-white font-bold truncate">{currentSong.title}</h3>
                  <p className="text-white/50 text-sm truncate">{currentSong.artist}</p>
                </div>
              )}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-6">
              <button 
                onClick={onToggleRepeat}
                className={cn(
                  "p-2 transition-colors",
                  isRepeating ? "text-white" : "text-white/30 hover:text-white"
                )}
              >
                <Repeat size={20} />
              </button>
              <button onClick={onPrev} className="text-white/50 hover:text-white transition-colors">
                <SkipBack size={28} fill="currentColor" />
              </button>
              <button 
                onClick={onTogglePlay}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" className="ml-1" />}
              </button>
              <button onClick={onNext} className="text-white/50 hover:text-white transition-colors">
                <SkipForward size={28} fill="currentColor" />
              </button>
              <button onClick={onToggleFullscreen} className="text-white/30 hover:text-white transition-colors">
                <Maximize2 size={20} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center justify-end gap-3 w-1/3">
              <button onClick={toggleMute} className="text-white/50 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volume}
                onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
