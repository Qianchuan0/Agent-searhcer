import { NextResponse } from 'next/server';

const backendUrl = process.env.NEXT_PUBLIC_GPTR_API_URL || 'http://localhost:8000';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const response = await fetch(`${backendUrl}/api/memory/items/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`PATCH /api/memory/items/${params.id} - Error proxying to backend:`, error);
    return NextResponse.json({ error: 'Failed to connect to backend service' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${backendUrl}/api/memory/items/${params.id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`DELETE /api/memory/items/${params.id} - Error proxying to backend:`, error);
    return NextResponse.json({ error: 'Failed to connect to backend service' }, { status: 500 });
  }
}
