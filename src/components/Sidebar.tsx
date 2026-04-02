import React, { useState } from 'react';
import { Search as SearchIcon, Plus, Music, Trash2, Play, ChevronLeft, X } from 'lucide-react';
import { Song, Playlist } from '../types';
import { searchYouTube } from '../lib/api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaySong: (song: Song) => void;
  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
  currentSong?: Song;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onPlaySong, 
  playlists, 
  setPlaylists,
  currentSong 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'playlists'>('search');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchYouTube(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const createPlaylist = () => {
    const name = prompt('Playlist Name:');
    if (!name) return;
    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      icon: '🎵',
      songs: []
    };
    setPlaylists([...playlists, newPlaylist]);
  };

  const addToPlaylist = (song: Song, playlistId: string) => {
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId) {
        if (p.songs.find(s => s.id === song.id)) return p;
        return { ...p, songs: [...p.songs, song] };
      }
      return p;
    }));
  };

  const removeFromPlaylist = (songId: string, playlistId: string) => {
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, songs: p.songs.filter(s => s.id !== songId) };
      }
      return p;
    }));
  };

  const deletePlaylist = (id: string) => {
    if (confirm('Delete this playlist?')) {
      setPlaylists(playlists.filter(p => p.id !== id));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-full max-w-md bg-black/80 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <button 
                  onClick={onClose} 
                  className="flex items-center gap-2 text-white/50 hover:text-white transition-all group"
                >
                  <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="font-medium">Back</span>
                </button>
                <h2 className="text-xl font-bold text-white">Library</h2>
                <div className="w-10" /> {/* Spacer */}
              </div>

              <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6">
                <button 
                  onClick={() => setActiveTab('search')}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg transition-all text-sm font-medium",
                    activeTab === 'search' ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white"
                  )}
                >
                  Search
                </button>
                <button 
                  onClick={() => setActiveTab('playlists')}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg transition-all text-sm font-medium",
                    activeTab === 'playlists' ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white"
                  )}
                >
                  Playlists
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {activeTab === 'search' ? (
                  <div className="space-y-6">
                    <form onSubmit={handleSearch} className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search songs, artists..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                      />
                      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                    </form>

                    <div className="space-y-3">
                      {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-12 text-white/20">
                          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                          <p>Searching YouTube...</p>
                        </div>
                      ) : searchResults.map((song) => (
                        <div key={song.id} className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                          <div className="relative w-14 h-14 shrink-0">
                            <img src={song.thumbnail} alt={song.title} className="w-full h-full rounded-xl object-cover" />
                            <button 
                              onClick={() => onPlaySong(song)}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                            >
                              <Play size={20} fill="white" className="text-white" />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-semibold truncate">{song.title}</h4>
                            <p className="text-white/40 text-sm truncate">{song.artist}</p>
                          </div>
                          <div className="relative group/menu">
                            <button className="p-2 text-white/20 hover:text-white transition-colors">
                              <Plus size={24} />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl hidden group-hover/menu:block z-50 overflow-hidden">
                              <div className="px-4 py-2 text-xs font-bold text-white/30 uppercase tracking-wider border-b border-white/5">Add to Playlist</div>
                              {playlists.map(p => (
                                <button 
                                  key={p.id}
                                  onClick={() => addToPlaylist(song, p.id)}
                                  className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                                >
                                  {p.name}
                                </button>
                              ))}
                              {playlists.length === 0 && (
                                <div className="px-4 py-4 text-sm text-white/30 italic text-center">No playlists found</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <button 
                      onClick={createPlaylist}
                      className="w-full flex items-center justify-center gap-3 py-5 border-2 border-dashed border-white/5 rounded-3xl text-white/30 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all group"
                    >
                      <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                      <span className="font-semibold">Create New Playlist</span>
                    </button>

                    {playlists.map((playlist) => (
                      <div key={playlist.id} className="bg-white/5 rounded-3xl p-5 space-y-4 border border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">
                              {playlist.icon}
                            </div>
                            <div>
                              <h3 className="text-white font-bold">{playlist.name}</h3>
                              <p className="text-white/30 text-xs">{playlist.songs.length} songs</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => deletePlaylist(playlist.id)}
                            className="p-2 text-white/10 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {playlist.songs.map((song) => (
                            <div 
                              key={song.id} 
                              className={cn(
                                "group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all",
                                currentSong?.id === song.id && "bg-white/10"
                              )}
                            >
                              <div className="relative w-10 h-10 shrink-0">
                                <img src={song.thumbnail} alt="" className="w-full h-full rounded-lg object-cover" />
                                <button 
                                  onClick={() => onPlaySong(song)}
                                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                                >
                                  <Play size={14} fill="white" className="text-white" />
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white text-sm font-semibold truncate">{song.title}</h4>
                                <p className="text-white/40 text-xs truncate">{song.artist}</p>
                              </div>
                              <button 
                                onClick={() => removeFromPlaylist(song.id, playlist.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-white transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {playlist.songs.length === 0 && (
                            <div className="text-center py-4 text-white/10 text-sm italic">No songs added yet</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
