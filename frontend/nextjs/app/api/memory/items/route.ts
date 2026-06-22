import { NextResponse } from 'next/server';

const backendUrl = process.env.NEXT_PUBLIC_GPTR_API_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.toString();
    const endpoint = query ? `${backendUrl}/api/memory/items?${query}` : `${backendUrl}/api/memory/items`;
    const response = await fetch(endpoint);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('GET /api/memory/items - Error proxying to backend:', error);
    return NextResponse.json({ error: 'Failed to connect to backend service' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${backendUrl}/api/memory/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('POST /api/memory/items - Error proxying to backend:', error);
    return NextResponse.json({ error: 'Failed to connect to backend service' }, { status: 500 });
  }
}
