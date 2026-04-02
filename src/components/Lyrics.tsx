import React, { useState, useEffect, useRef } from 'react';
import { LyricLine } from '../types';
import { cn } from '../lib/utils';

interface LyricsProps {
  lyrics: LyricLine[];
  currentTime: number;
  isVisible: boolean;
}

export const Lyrics: React.FC<LyricsProps> = ({ lyrics, currentTime, isVisible }) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const index = lyrics.findIndex((line, i) => {
      const nextLine = lyrics[i + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });
    setActiveIndex(index);
  }, [currentTime, lyrics]);

  useEffect(() => {
    if (activeIndex !== -1 && containerRef.current) {
      const activeElement = containerRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeIndex]);

  if (!lyrics.length) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 z-10",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Glassmorphism Background Layer */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      
      <div 
        ref={containerRef}
        className="max-w-4xl w-full h-[70vh] overflow-hidden flex flex-col items-center justify-start px-8 mask-fade relative z-20"
      >
        {lyrics.map((line, index) => (
          <div
            key={index}
            className={cn(
              "text-3xl md:text-5xl font-bold text-center transition-all duration-500 my-6 leading-tight tracking-tight",
              index === activeIndex 
                ? "text-white scale-110 opacity-100 blur-0 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
                : "text-white/20 scale-95 opacity-30 blur-[2px]"
            )}
          >
            {line.text}
          </div>
        ))}
      </div>
      <style>{`
        .mask-fade {
          mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
        }
      `}</style>
    </div>
  );
};
