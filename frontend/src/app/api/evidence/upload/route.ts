import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
    const backendRes = await fetch(`${backendUrl}/api/v1/evidence/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData // Let fetch automatically set the multipart boundary
    })

    if (!backendRes.ok) {
      const errorText = await backendRes.text()
      return NextResponse.json({ error: errorText }, { status: backendRes.status })
    }

    const data = await backendRes.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Evidence Upload Proxy Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
