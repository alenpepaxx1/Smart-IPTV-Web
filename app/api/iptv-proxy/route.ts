/* Copyright Alen Pepa */
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    const response = await axios.get(url, {
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      }),
      timeout: 15000
    });

    return new NextResponse(response.data, {
      headers: {
        'Content-Type': response.headers['content-type'] || 'text/plain',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error: any) {
    console.error(`[IPTV Proxy] Error fetching ${url}:`, error.message);
    return NextResponse.json({ 
      error: `Failed to fetch IPTV data: ${error.message}`,
      details: error.response?.data 
    }, { status: error.response?.status || 500 });
  }
}
