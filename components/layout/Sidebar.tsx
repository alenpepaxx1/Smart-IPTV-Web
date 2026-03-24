/* Copyright Alen Pepa */
import React, { useEffect } from 'react';
import { Home, Tv, Film, Video, Heart, Settings, LogOut, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ isOpen, onClose, activeTab, onTabChange, onLogout }: SidebarProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'live', label: 'Live TV', icon: Tv },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'series', label: 'Series', icon: Video },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // "Encrypted" footer protection
  useEffect(() => {
    const _0x1a2b = 'QnVpbGQgYnkgQWxlbiBQZXBhIERldg=='; // Base64 encoded signature: "Build by Alen Pepa Dev"
    const _0x3c4d = 'sys-integrity';
    
    const _0x5e6f = () => {
      const el = document.getElementById(_0x3c4d);
      if (el) {
        const decoded = atob(_0x1a2b);
        if (el.innerText !== decoded) {
          el.innerText = decoded;
        }
        // Enforce visibility
        if (el.style.display === 'none') el.style.display = 'block';
        if (el.style.visibility === 'hidden') el.style.visibility = 'visible';
        if (el.style.opacity === '0') el.style.opacity = '0.5';
      }
    };

    // Initial set
    _0x5e6f();

    // Watch for tampering
    const observer = new MutationObserver(() => _0x5e6f());
    const el = document.getElementById(_0x3c4d);
    
    if (el) {
      observer.observe(el, { 
        characterData: true, 
        childList: true, 
        subtree: true, 
        attributes: true 
      });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:relative z-50 h-full w-72 bg-zinc-950 border-r border-white/5 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Tv className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              StreamFlow
            </h1>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-white transition-colors'}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 mb-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
          
          <div 
            id="sys-integrity" 
            className="text-center text-[10px] text-zinc-700 font-mono select-none opacity-50 pt-2"
          >
            {/* Protected content injected by effect */}
          </div>
        </div>
      </aside>
    </>
  );
}
