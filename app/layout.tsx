/* Copyright Alen Pepa */
import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Smart Web IPTV Player',
  description: 'A powerful web-based IPTV player supporting M3U playlists and Xtream Codes API with a modern interface.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
