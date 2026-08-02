import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
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
  const { format, coverImage, thankYouImage } = body // 'DOCX' or 'EXCEL' or 'PDF'

  if (!['DOCX', 'EXCEL', 'PDF'].includes(format)) {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        auditor: true,
        reviewer: true,
        checklists: { orderBy: { order: 'asc' } },
        findings: {
          include: { evidences: { orderBy: { order: 'asc' } } },
          orderBy: { createdAt: 'desc' }
        },
        reportMeta: true,
        teamMembers: { orderBy: { order: 'asc' } }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Role-based authorization
    let isAuthorized = false;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      isAuthorized = true;
    } else if (user.role === 'AUDITOR' && project.auditorId === user.id) {
      isAuthorized = true;
    } else if (user.role === 'REVIEWER' && project.reviewerId === user.id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'You do not have permission to generate reports for this project.' }, { status: 403 })
    }

    // Status check
    if (project.status !== 'Approved' && project.bypassChecklist !== true) {
      return NextResponse.json({ error: 'Report generation is available only after reviewer approval or via checklist bypass.' }, { status: 403 })
    }

    // Send project data to backend
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
    let endpoint = '/api/v1/reports/docx'
    if (format === 'EXCEL') endpoint = '/api/v1/reports/excel'
    if (format === 'PDF') endpoint = '/api/v1/reports/pdf'
    
        const backendPayload = {
      ...project,
      coverImage,
      thankYouImage
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(backendPayload),
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const errData = await response.text()
      return NextResponse.json({ error: `Backend generation failed: ${errData}` }, { status: response.status })
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const cleanProjectName = project.name.replace(/[^a-z0-9]/gi, '_')
    let filename = '';
    let contentType = '';

    if (format === 'DOCX') {
      filename = `${cleanProjectName}_VAPT_Report.docx`
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (format === 'PDF') {
      filename = `${cleanProjectName}_VAPT_Report.pdf`
      contentType = 'application/pdf'
    } else {
      filename = `${cleanProjectName}_Vulnerability_Tracker.xlsx`
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error: any) {
    console.error('Export Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 })
  }
}
