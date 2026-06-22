import { NextResponse } from 'next/server';

const backendUrl = process.env.NEXT_PUBLIC_GPTR_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${backendUrl}/api/memory/settings`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('GET /api/memory/settings - Error proxying to backend:', error);
    return NextResponse.json({ error: 'Failed to connect to backend service' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${backendUrl}/api/memory/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('PUT /api/memory/settings - Error proxying to backend:', error);
    return NextResponse.json({ error: 'Failed to connect to backend service' }, { status: 500 });
  }
}
