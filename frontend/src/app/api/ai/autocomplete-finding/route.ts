import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { vulnerabilityName } = await req.json();

    if (!vulnerabilityName) {
      return NextResponse.json({ error: 'vulnerabilityName is required' }, { status: 400 });
    }
    
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${backendUrl}/api/v1/ai/generate-finding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ short_input: vulnerabilityName }),
    });

    if (!response.ok) {
      const errData = await response.text();
      let errorDetail = errData;
      try {
        const parsed = JSON.parse(errData);
        errorDetail = parsed.detail || errData;
      } catch (e) {}
      return NextResponse.json({ error: errorDetail }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error calling AI backend:', error);
    return NextResponse.json({ error: error.message || 'Failed to autocomplete finding' }, { status: 500 });
  }
}
