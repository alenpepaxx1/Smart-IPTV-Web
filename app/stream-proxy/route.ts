/* Copyright Alen Pepa */
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return new Response('Missing URL', { status: 400 });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'IPTV Smarters Pro',
      },
    });

    if (!response.ok) {
      return new Response(`Error fetching stream: ${response.statusText}`, { status: response.status });
    }

    // Pipe the body directly
    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'video/mp2t',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Stream proxy error:', error);
    return new Response('Error fetching stream', { status: 500 });
  }
}
