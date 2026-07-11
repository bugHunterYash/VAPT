import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt'
const key = new TextEncoder().encode(JWT_SECRET)

async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key)
    return payload
  } catch (error) {
    return null
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reportId = (await params).reportId

  try {
    const report = await prisma.reportHistory.findUnique({
      where: { id: reportId }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const filePath = path.join(process.cwd(), 'uploads', 'reports', report.filePath)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    
    // Determine content type
    let contentType = 'application/octet-stream'
    if (report.format === 'PDF') contentType = 'application/pdf'
    if (report.format === 'DOCX') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if (report.format === 'EXCEL') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${report.filePath}"`,
      },
    })
  } catch (error: any) {
    console.error('Download Error:', error)
    return NextResponse.json({ error: 'Failed to download report' }, { status: 500 })
  }
}
