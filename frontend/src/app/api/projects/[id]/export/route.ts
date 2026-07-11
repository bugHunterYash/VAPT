import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ReportService } from '@/services/reports/ReportService'
import { prisma } from '@/lib/prisma'

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = (await params).id
  const body = await request.json()
  const { format } = body // 'PDF', 'DOCX', or 'EXCEL'

  if (!['PDF', 'DOCX', 'EXCEL'].includes(format)) {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.status !== 'Approved') {
      return NextResponse.json({ error: 'Report generation is available only after reviewer approval.' }, { status: 403 })
    }

    const reportHistory = await ReportService.generateReport(projectId, user.id as string, format as 'PDF' | 'DOCX' | 'EXCEL')

    return NextResponse.json(reportHistory)
  } catch (error: any) {
    console.error('Export Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 })
  }
}
