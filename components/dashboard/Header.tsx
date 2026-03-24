/* Copyright Alen Pepa */
import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, X, Calendar, Wifi, UserCircle, Copy, Check, Clock, Shield, PlayCircle, LogOut, Settings, Server, Globe } from 'lucide-react';

interface UserInfo {
  username?: string;
  password?: string;
  exp_date?: string; // timestamp or string
  active_cons?: string;
  max_connections?: string;
  created_at?: string;
  status?: string;
  is_trial?: string;
  allowed_output_formats?: string[];
  server_info?: {
    url?: string;
    port?: string;
    https_port?: string;
    server_protocol?: string;
    rtmp_port?: string;
    timezone?: string;
    timestamp_now?: number;
    time_now?: string;
    timezone_name?: string;
  };
}

interface HeaderProps {
  onSearch: (query: string) => void;
  toggleSidebar: () => void;
  userInfo?: UserInfo | null;
  onLogout?: () => void;
  onTabChange?: (tab: string) => void;
  onBack?: () => void;
  searchQuery?: string;
  activeTab?: string;
}

export default function Header({ onSearch, toggleSidebar, userInfo, onLogout, onTabChange, onBack, searchQuery = '', activeTab }: HeaderProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (timestamp?: string) => {
    if (!timestamp || timestamp === 'null') return 'Unlimited / Never';
    const ts = parseInt(timestamp);
    if (isNaN(ts)) return timestamp;
    const date = new Date(ts * 1000);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Calculate connection percentage
  const activeCons = parseInt(userInfo?.active_cons || '0');
  const maxCons = parseInt(userInfo?.max_connections || '0');
  const consPercent = maxCons > 0 ? Math.min(100, (activeCons / maxCons) * 100) : 0;

  // Calculate expiration percentage
  const getExpPercent = () => {
    if (!userInfo?.created_at || !userInfo?.exp_date || userInfo.exp_date === 'null') return 0;
    const created = parseInt(userInfo.created_at) * 1000;
    const exp = parseInt(userInfo.exp_date) * 1000;
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    
    if (now >= exp) return 100;
    if (now <= created) return 0;
    
    const total = exp - created;
    const elapsed = now - created;
    return Math.min(100, (elapsed / total) * 100);
  };

  const expPercent = getExpPercent();

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(localSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchQuery, onSearch]);

  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
      {/* Mobile Search Overlay */}
      {showMobileSearch ? (
        <div className="absolute inset-0 bg-zinc-950 z-50 flex items-center px-4 gap-4 animate-in fade-in slide-in-from-top-2">
          <Search className="w-5 h-5 text-zinc-500" />
          <input 
            type="text"
            autoFocus
            placeholder="Search channels..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-white placeholder-zinc-500 focus:outline-none text-base"
          />
          <button 
            onClick={() => {
              setShowMobileSearch(false);
              setLocalSearchQuery('');
              onSearch('');
            }}
            className="p-2 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-1">
            <button 
              onClick={() => onBack ? onBack() : onTabChange?.('home')}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            
            <button 
              onClick={() => setShowMobileSearch(true)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Center Title */}
          {activeTab === 'live' && (
            <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <h1 className="text-sm font-bold text-white leading-tight tracking-wide">Free-TV</h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-0.5">TV Channels</p>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Search */}
            <div className="relative max-w-xs w-full hidden lg:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                ref={searchInputRef}
                type="text"
                value={localSearchQuery}
                placeholder="Search..."
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-10 pr-10 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-1 border-l border-white/10 pl-4 ml-2">
              <button 
                onClick={toggleSidebar}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
              </button>
              
              <div className="hidden md:flex items-center gap-1">
                <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"/></svg>
                </button>
                <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/></svg>
                </button>
                <button 
                  onClick={onLogout}
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
