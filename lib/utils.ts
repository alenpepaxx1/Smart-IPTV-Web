/* Copyright Alen Pepa */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getValidImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  
  try {
    // Fix common typos like ghttp://
    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('ghttp://')) {
      cleanUrl = cleanUrl.replace('ghttp://', 'http://');
    } else if (cleanUrl.startsWith('//')) {
      cleanUrl = `https:${cleanUrl}`;
    }
    
    const parsed = new URL(cleanUrl);

    // Handle known broken/404 images to prevent upstream errors
    if (cleanUrl.includes('tugapt.com/picons/arabflag.png')) {
      return null;
    }

    // next/image only supports http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    // Use proxy for domains that rate-limit Next.js image optimizer (like wikimedia)
    if (parsed.hostname.includes('wikimedia.org')) {
      return `/api/proxy-image?url=${encodeURIComponent(cleanUrl)}`;
    }

    return parsed.toString();
  } catch (e) {
    return null;
  }
}
