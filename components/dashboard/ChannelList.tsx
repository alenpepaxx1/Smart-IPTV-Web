/* Copyright Alen Pepa */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Channel, EPGData } from '@/lib/iptv';
import { Search, Play, Star, Tv, LayoutGrid, List as ListIcon } from 'lucide-react';
import { getValidImageUrl } from '@/lib/utils';
import Image from 'next/image';

interface ChannelListProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  selectedChannel?: Channel | null;
  epgData?: EPGData | null;
}

export default function ChannelList({ channels, onSelectChannel, selectedChannel, epgData }: ChannelListProps) {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date().getTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getCurrentProgram = (channelId: string) => {
    if (!epgData) return null;
    const channelPrograms = epgData.programs.filter(p => p.channel === channelId);
    return channelPrograms.find(p => {
      const start = new Date(p.start).getTime();
      const stop = new Date(p.stop).getTime();
      return now >= start && now < stop;
    });
  };

  // Helper to get unique ID
  const getChannelId = (channel: Channel) => channel.url || channel.name;

  useEffect(() => {
    const saved = localStorage.getItem('iptv_favorites');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTimeout(() => setFavorites(parsed), 0);
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }

    const savedView = localStorage.getItem('iptv_view_mode');
    if (savedView === 'grid' || savedView === 'list') {
      setTimeout(() => setViewMode(savedView), 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('iptv_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('iptv_view_mode', viewMode);
  }, [viewMode]);

  // Extract unique groups
  const groups = useMemo(() => {
    const g = new Set(channels.map(c => c.group.title || 'Uncategorized'));
    return ['All', 'Favorites', ...Array.from(g).sort()];
  }, [channels]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    let filtered = channels;

    if (activeGroup === 'Favorites') {
      filtered = filtered.filter(c => favorites.includes(getChannelId(c)));
    } else if (activeGroup !== 'All') {
      filtered = filtered.filter(c => (c.group.title || 'Uncategorized') === activeGroup);
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(lowerSearch));
    }

    return filtered;
  }, [channels, activeGroup, search, favorites]);

  const toggleFavorite = (e: React.MouseEvent, channel: Channel) => {
    e.stopPropagation();
    const id = getChannelId(channel);
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-white/5 w-80 flex-shrink-0">
      {/* Search Header */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search channels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Groups (Horizontal Scroll) */}
      <div className="flex overflow-x-auto p-2 gap-2 border-b border-white/5 scrollbar-hide shrink-0">
        {groups.map(group => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeGroup === group
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Channel List */}
      <div className={`flex-1 overflow-y-auto p-2 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-2 content-start' : 'space-y-1'}`}>
        {filteredChannels.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-sm col-span-full">
            No channels found
          </div>
        ) : (
          filteredChannels.map((channel, idx) => {
            const currentProgram = getCurrentProgram(channel.tvg.id || channel.name);
            const isSelected = selectedChannel?.url === channel.url;
            const isFavorite = favorites.includes(getChannelId(channel));

            if (viewMode === 'grid') {
              return (
                <div
                  key={`${channel.name}-${idx}`}
                  onClick={() => onSelectChannel(channel)}
                  className={`group relative flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="relative w-16 h-16 rounded-lg bg-black/40 flex items-center justify-center mb-3 overflow-hidden border border-white/5 shadow-inner">
                    {getValidImageUrl(channel.tvg.logo) ? (
                      <Image 
                        src={getValidImageUrl(channel.tvg.logo)!} 
                        alt={channel.name} 
                        referrerPolicy="no-referrer"
                        fill
                        className="object-contain p-2" 
                        onError={(e) => (e.currentTarget.style.display = 'none')} 
                      />
                    ) : (
                      <Tv className="w-8 h-8 text-zinc-700" />
                    )}
                    
                    {isSelected && (
                      <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    )}
                  </div>

                  <div className="w-full text-center">
                    <h3 className={`text-xs font-semibold truncate px-1 ${isSelected ? 'text-indigo-300' : 'text-zinc-300 group-hover:text-white'}`}>
                      {channel.name}
                    </h3>
                    {currentProgram && (
                      <p className="text-[9px] text-indigo-400/80 truncate mt-1">
                        {currentProgram.title[0]?.value}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => toggleFavorite(e, channel)}
                    className={`absolute top-1.5 right-1.5 p-1 rounded-full transition-all ${
                      isFavorite
                        ? 'text-yellow-500 bg-yellow-500/10'
                        : 'text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    <Star className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={`${channel.name}-${idx}`}
                onClick={() => onSelectChannel(channel)}
                className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border border-indigo-500/30'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="relative w-10 h-10 rounded bg-black/40 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/5">
                  {getValidImageUrl(channel.tvg.logo) ? (
                    <Image 
                      src={getValidImageUrl(channel.tvg.logo)!} 
                      alt={channel.name} 
                      referrerPolicy="no-referrer"
                      fill
                      className="object-contain p-1" 
                      onError={(e) => (e.currentTarget.style.display = 'none')} 
                    />
                  ) : (
                    <Tv className="w-5 h-5 text-zinc-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-300' : 'text-zinc-300 group-hover:text-white'}`}>
                    {channel.name}
                  </h3>
                  <p className="text-xs text-zinc-500 truncate">
                    {channel.group.title || 'Uncategorized'}
                  </p>
                  {currentProgram && (
                    <p className="text-[10px] text-indigo-400 truncate mt-0.5">
                      {currentProgram.title[0]?.value}
                      {currentProgram.episodeNum?.[0]?.value && (
                        <span className="ml-1 opacity-70">(Ep: {currentProgram.episodeNum[0].value})</span>
                      )}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => toggleFavorite(e, channel)}
                  className={`p-1.5 rounded-full transition-colors ${
                    isFavorite
                      ? 'text-yellow-500 hover:bg-yellow-500/10'
                      : 'text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function TvIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
