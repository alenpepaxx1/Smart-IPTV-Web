/* Copyright Alen Pepa */
import React, { useState, useEffect } from 'react';
import { Channel, EPGData } from '@/lib/iptv';
import { X, Play, Info, Tv, Hash, Link as LinkIcon, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getValidImageUrl } from '@/lib/utils';
import Image from 'next/image';

interface ChannelDetailsModalProps {
  channel: Channel | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (channel: Channel) => void;
  epgData?: EPGData | null;
}

export default function ChannelDetailsModal({ channel, isOpen, onClose, onPlay, epgData }: ChannelDetailsModalProps) {
  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(new Date().getTime()), 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const channelPrograms = React.useMemo(() => {
    if (!epgData || !channel) return [];
    const channelId = channel.tvg.id || channel.name;
    const programs = epgData.programs.filter(p => p.channel === channelId);
    return programs.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [epgData, channel]);

  const currentProgramIndex = React.useMemo(() => {
    return channelPrograms.findIndex(p => {
      const start = new Date(p.start).getTime();
      const stop = new Date(p.stop).getTime();
      return now >= start && now < stop;
    });
  }, [channelPrograms, now]);

  const upcomingPrograms = currentProgramIndex !== -1 
    ? channelPrograms.slice(currentProgramIndex, currentProgramIndex + 5)
    : channelPrograms.filter(p => new Date(p.start).getTime() > now).slice(0, 5);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  return (
    <AnimatePresence>
      {isOpen && channel && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Background with Blur */}
            <div className="absolute inset-0 h-32 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none" />

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pt-12">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column: Logo & Actions */}
                <div className="flex-shrink-0 flex flex-col items-center space-y-4">
                  <div className="relative w-32 h-32 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center p-4 shadow-lg overflow-hidden">
                    {getValidImageUrl(channel.tvg.logo) ? (
                      <Image 
                        src={getValidImageUrl(channel.tvg.logo)!} 
                        alt={channel.name} 
                        referrerPolicy="no-referrer"
                        fill
                        className="object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={`text-4xl font-bold text-zinc-700 ${getValidImageUrl(channel.tvg.logo) ? 'hidden' : ''}`}>
                      {channel.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      onPlay(channel);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Watch Now
                  </button>
                </div>

                {/* Right Column: Details */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{channel.name}</h2>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <span className="px-2 py-0.5 bg-white/10 rounded text-white/80">
                        {channel.group?.title || 'Uncategorized'}
                      </span>
                      {channel.tvg.id && (
                        <>
                          <span>•</span>
                          <span>ID: {channel.tvg.id}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4 text-indigo-400" />
                        Channel Information
                      </h3>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex items-start gap-3">
                          <Tv className="w-4 h-4 text-zinc-500 mt-0.5" />
                          <div>
                            <span className="block text-zinc-500 text-xs">Stream URL</span>
                            <span className="text-zinc-300 break-all font-mono text-xs opacity-70">
                              {channel.url}
                            </span>
                          </div>
                        </div>
                        {channel.tvg.rec && (
                          <div className="flex items-start gap-3">
                            <Calendar className="w-4 h-4 text-zinc-500 mt-0.5" />
                            <div>
                              <span className="block text-zinc-500 text-xs">Catchup Days</span>
                              <span className="text-zinc-300">{channel.tvg.rec}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* EPG Data */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        Program Guide
                      </h3>
                      {upcomingPrograms.length > 0 ? (
                        <div className="space-y-3">
                          {upcomingPrograms.map((program, idx) => {
                            const isCurrent = idx === 0 && currentProgramIndex !== -1;
                            return (
                              <div key={idx} className={`flex gap-3 p-2 rounded-lg ${isCurrent ? 'bg-indigo-500/10 border border-indigo-500/20' : ''}`}>
                                <div className="text-xs text-zinc-400 font-mono whitespace-nowrap pt-0.5">
                                  {formatTime(program.start)}
                                </div>
                                <div>
                                  <div className={`text-sm font-medium ${isCurrent ? 'text-indigo-300' : 'text-zinc-200'}`}>
                                    {program.title[0]?.value}
                                    {program.episodeNum?.[0]?.value && (
                                      <span className="ml-2 text-xs text-indigo-400/70 font-mono">
                                        (Ep: {program.episodeNum[0].value})
                                      </span>
                                    )}
                                  </div>
                                  {program.desc?.[0]?.value && (
                                    <div className="text-xs text-zinc-500 mt-1 line-clamp-2">
                                      {program.desc[0].value}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-zinc-500 text-sm">
                          <p>No EPG data available for this channel.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
