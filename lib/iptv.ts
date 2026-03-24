/* Copyright Alen Pepa */
import { parse } from 'iptv-playlist-parser';
import { XMLParser } from 'fast-xml-parser';

export type EPGProgram = {
  id: string;
  start: string;
  stop: string;
  channel: string;
  title: { lang: string; value: string }[];
  desc: { lang: string; value: string }[];
  category: { lang: string; value: string }[];
  date: string;
  icon: string[];
  rating: { system: string; value: string }[];
  episodeNum?: { system: string; value: string }[];
  subTitle?: { lang: string; value: string }[];
  credits?: { role: string; name: string }[];
};

export type EPGData = {
  channels: { id: string; name: string[]; url: string[] }[];
  programs: EPGProgram[];
};

export const parseEPG = (xml: string): EPGData => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    isArray: (name, jpath, isLeafNode, isAttribute) => { 
      const alwaysArray = ['channel', 'programme', 'title', 'desc', 'category', 'icon', 'rating', 'episode-num', 'sub-title', 'actor', 'director', 'writer', 'adapter', 'producer', 'composer', 'editor', 'presenter', 'commentator', 'guest'];
      if(alwaysArray.indexOf(name) !== -1) return true;
      return false;
    }
  });

  const parsed = parser.parse(xml);
  const tv = parsed.tv || {};
  
  const channels = (tv.channel || []).map((c: any) => ({
    id: c['@_id'] || '',
    name: (c['display-name'] || []).map((dn: any) => typeof dn === 'object' ? dn['#text'] : dn),
    url: (c.url || []).map((u: any) => typeof u === 'object' ? u['#text'] : u)
  }));

  const parseLangText = (items: any[]) => {
    if (!items) return [];
    return items.map(item => {
      if (typeof item === 'object') {
        return { lang: item['@_lang'] || '', value: item['#text'] || '' };
      }
      return { lang: '', value: String(item) };
    });
  };

  const programs = (tv.programme || []).map((p: any) => {
    
    const parseDate = (dateStr: string) => {
      if (!dateStr) return '';
      const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/);
      if (match) {
        const [_, y, m, d, h, min, s, tz] = match;
        const tzStr = tz ? `${tz.slice(0,3)}:${tz.slice(3)}` : 'Z';
        return `${y}-${m}-${d}T${h}:${min}:${s}${tzStr}`;
      }
      return dateStr;
    };

    const credits: { role: string; name: string }[] = [];
    if (p.credits) {
      const c = p.credits;
      const roles = ['actor', 'director', 'writer', 'adapter', 'producer', 'composer', 'editor', 'presenter', 'commentator', 'guest'];
      for (const role of roles) {
        if (c[role]) {
          c[role].forEach((name: any) => {
            credits.push({ role, name: typeof name === 'object' ? name['#text'] : name });
          });
        }
      }
    }

    return {
      id: p['@_id'] || '',
      start: parseDate(p['@_start']),
      stop: parseDate(p['@_stop']),
      channel: p['@_channel'] || '',
      title: parseLangText(p.title),
      desc: parseLangText(p.desc),
      category: parseLangText(p.category),
      date: p.date || '',
      icon: (p.icon || []).map((i: any) => i['@_src'] || ''),
      rating: (p.rating || []).map((r: any) => ({
        system: r['@_system'] || '',
        value: typeof r.value === 'object' ? r.value['#text'] : r.value
      })),
      episodeNum: (p['episode-num'] || []).map((e: any) => ({
        system: e['@_system'] || '',
        value: typeof e === 'object' ? e['#text'] : e
      })),
      subTitle: parseLangText(p['sub-title']),
      credits
    };
  });

  return { channels, programs };
};
import axios from 'axios';

export interface Channel {
  name: string;
  tvg: {
    id: string;
    name: string;
    logo: string;
    url: string;
    rec: string;
    chno?: string;
  };
  group: {
    title: string;
  };
  http: {
    referrer: string;
    'user-agent': string;
  };
  url: string;
  raw: string;
}

export interface Playlist {
  items: Channel[];
}

export const parseM3U = (content: string): Playlist => {
  const result = parse(content);
  return result as Playlist;
};

export const fetchM3U = async (url: string, headers?: Record<string, string>): Promise<Playlist> => {
  // Use server-side proxy to avoid CORS and mixed content issues
  const proxyUrl = `/api/iptv-proxy?url=${encodeURIComponent(url)}`;
  
  const config = {
    responseType: 'text' as const,
    headers: {
      'User-Agent': headers?.['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  };
  
  try {
    const response = await axios.get(proxyUrl, config);
    const content = response.data;

    if (typeof content !== 'string') {
       throw new Error('Received invalid response format (not a string).');
    }

    // Check for common error signatures in the content
    if (content.includes('403 Forbidden') || content.includes('Access Denied') || content.includes('Error 884')) {
       throw new Error('Provider blocked the request (Access Denied/Forbidden).');
    }

    if (!content.trim().startsWith('#EXTM3U')) {
       // It might be a raw text without header, or HTML error page
       if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
          throw new Error('Received HTML instead of M3U playlist. The provider might be blocking the request.');
       }
       // Attempt to parse anyway, some lists are malformed
    }

    const playlist = parseM3U(content);
    if (!playlist.items || playlist.items.length === 0) {
       throw new Error('Playlist is empty or invalid.');
    }

    // Resolve relative URLs
    try {
      const baseUrl = new URL(url);
      playlist.items = playlist.items.map(item => {
        if (item.url && !item.url.startsWith('http') && !item.url.startsWith('rtmp') && !item.url.startsWith('acestream')) {
          try {
            item.url = new URL(item.url, baseUrl).toString();
          } catch (e) {
            // ignore
          }
        }
        return item;
      });
    } catch (e) {
      console.warn('Could not resolve relative URLs in M3U', e);
    }

    return playlist;
  } catch (error: any) {
    throw error;
  }
};

export interface XtreamLoginResponse {
  user_info: {
    username: string;
    password: string;
    message: string;
    auth: number;
    status: string;
    exp_date: string;
    is_trial: string;
    active_cons: string;
    created_at: string;
    max_connections: string;
    allowed_output_formats: string[];
  };
  server_info: {
    url: string;
    port: string;
    https_port: string;
    server_protocol: string;
    rtmp_port: string;
    timezone: string;
    timestamp_now: number;
    time_now: string;
    timezone_name: string;
  };
}

export const fetchEPG = async (url: string): Promise<EPGData> => {
  const config = {
    responseType: 'text' as const,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  };
  
  try {
    const response = await axios.get(url, config);
    const content = response.data;
    if (typeof content !== 'string') {
      throw new Error('Invalid EPG response format');
    }
    return parseEPG(content);
  } catch (error: any) {
    throw error;
  }
};

export const xtreamLogin = async (url: string, username: string, password: string): Promise<XtreamLoginResponse> => {
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const loginUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}`;
  const proxyUrl = `/api/iptv-proxy?url=${encodeURIComponent(loginUrl)}`;
  
  const response = await axios.get(proxyUrl, {
    headers: {
      'User-Agent': 'IPTV Smarters Pro',
    }
  });
  // The proxy might return the data directly or as a string
  return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
};

export const fetchXtreamData = async (url: string, username: string, password: string) => {
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  
  const fetchApi = async (action: string) => {
    const apiUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}&action=${action}`;
    const proxyUrl = `/api/iptv-proxy?url=${encodeURIComponent(apiUrl)}`;
    try {
      const response = await axios.get(proxyUrl, {
        headers: {
          'User-Agent': 'IPTV Smarters Pro',
        }
      });
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return data;
    } catch (e) {
      console.error(`Failed to fetch ${action}`, e);
      return [];
    }
  };

  // Fetch categories
  const [liveCats, vodCats, seriesCats] = await Promise.all([
    fetchApi('get_live_categories'),
    fetchApi('get_vod_categories'),
    fetchApi('get_series_categories')
  ]);

  const liveCatMap = new Map((Array.isArray(liveCats) ? liveCats : []).map((c: any) => [c.category_id, c.category_name]));
  const vodCatMap = new Map((Array.isArray(vodCats) ? vodCats : []).map((c: any) => [c.category_id, c.category_name]));
  const seriesCatMap = new Map((Array.isArray(seriesCats) ? seriesCats : []).map((c: any) => [c.category_id, c.category_name]));

  // Fetch streams
  const [liveStreams, vodStreams, seriesStreams] = await Promise.all([
    fetchApi('get_live_streams'),
    fetchApi('get_vod_streams'),
    fetchApi('get_series')
  ]);

  const mapToChannel = (item: any, type: 'live' | 'movie' | 'series', catMap: Map<string, string>): Channel => {
    let streamUrl = '';
    // Use the provided baseUrl for streams to avoid localhost/127.0.0.1 issues
    const streamBaseUrl = baseUrl;
    
    if (type === 'live') {
      streamUrl = `${streamBaseUrl}/live/${username}/${password}/${item.stream_id}.ts`;
    } else if (type === 'movie') {
      streamUrl = `${streamBaseUrl}/movie/${username}/${password}/${item.stream_id}.${item.container_extension || 'mp4'}`;
    } else if (type === 'series') {
      streamUrl = `XTREAM_SERIES:${item.series_id}`;
    }

    return {
      name: item.name,
      tvg: {
        id: item.epg_channel_id || '',
        name: item.name,
        logo: item.stream_icon || item.cover || '',
        url: '',
        rec: ''
      },
      group: {
        title: catMap.get(item.category_id) || 'Uncategorized'
      },
      http: {
        referrer: '',
        'user-agent': 'IPTV Smarters Pro'
      },
      url: streamUrl,
      raw: ''
    };
  };

  const live = Array.isArray(liveStreams) ? liveStreams.map(item => mapToChannel(item, 'live', liveCatMap)) : [];
  const movies = Array.isArray(vodStreams) ? vodStreams.map(item => mapToChannel(item, 'movie', vodCatMap)) : [];
  const series = Array.isArray(seriesStreams) ? seriesStreams.map(item => mapToChannel(item, 'series', seriesCatMap)) : [];

  return { live, movies, series };
};

export const categorizeChannels = (channels: Channel[]) => {
  const live: Channel[] = [];
  const movies: Channel[] = [];
  const series: Channel[] = [];

  channels.forEach(channel => {
    // Check for explicit stream type if available (some parsers might put it in raw or other fields, 
    // but iptv-playlist-parser puts extra attrs in http or we might need to parse raw line)
    // For now, use heuristics.
    
    const url = channel.url.toLowerCase();
    const group = channel.group?.title?.toLowerCase() || '';
    
    // Common VOD extensions
    const isVodFile = url.endsWith('.mp4') || url.endsWith('.mkv') || url.endsWith('.avi') || url.endsWith('.mov');
    
    // Common Series keywords in group
    const isSeriesGroup = group.includes('series') || group.includes('tv shows') || group.includes('seasons');
    const isMovieGroup = group.includes('movie') || group.includes('vod') || group.includes('cinema') || group.includes('film');

    if (isSeriesGroup) {
      series.push(channel);
    } else if (isMovieGroup || isVodFile) {
      movies.push(channel);
    } else {
      live.push(channel);
    }
  });

  return { live, movies, series };
};
