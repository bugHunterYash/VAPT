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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 })
  }

  const reportId = (await params).reportId

  try {
    const report = await prisma.reportHistory.findUnique({
      where: { id: reportId }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Delete file
    const filePath = path.join(process.cwd(), 'uploads', 'reports', report.filePath)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Delete record
    await prisma.reportHistory.delete({
      where: { id: reportId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete Error:', error)
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
  }
}
