/* Copyright Alen Pepa */
declare module 'epg-parser' {
  export interface EPGChannel {
    id: string;
    name: { value: string; lang?: string }[];
    icon?: { src: string }[];
    url?: { value: string }[];
  }

  export interface EPGProgram {
    id: string;
    start: string;
    stop: string;
    channel: string;
    title: { value: string; lang?: string }[];
    desc?: { value: string; lang?: string }[];
    category?: { value: string; lang?: string }[];
    date?: string;
    icon?: { src: string }[];
    rating?: { system: string; value: string }[];
    episodeNum?: { system: string; value: string }[];
  }

  export interface EPGData {
    channels: EPGChannel[];
    programs: EPGProgram[];
  }

  export default function parse(xml: string): EPGData;
}
