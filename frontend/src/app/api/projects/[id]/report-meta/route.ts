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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = (await params).id
  const body = await request.json()

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
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
      return NextResponse.json({ error: 'You do not have permission to modify report metadata for this project.' }, { status: 403 })
    }

    const {
      reportTitle,
      documentDate,
      preparedBy,
      approvedBy,
      reviewedBy,
      releasedBy,
      organization,
      certInEmpanelment,
      appUsername,
      appPassword,
      includeCredentials,
      teamMembers // array
    } = body

    // Transaction to update report meta and team members
    await prisma.$transaction(async (tx) => {
      await tx.projectReportMeta.upsert({
        where: { projectId },
        update: {
          reportTitle,
          documentDate: documentDate ? new Date(documentDate) : null,
          preparedBy,
          approvedBy,
          reviewedBy,
          releasedBy,
          organization,
          certInEmpanelment,
          appUsername,
          appPassword,
          includeCredentials: !!includeCredentials
        },
        create: {
          projectId,
          reportTitle,
          documentDate: documentDate ? new Date(documentDate) : null,
          preparedBy,
          approvedBy,
          reviewedBy,
          releasedBy,
          organization,
          certInEmpanelment,
          appUsername,
          appPassword,
          includeCredentials: !!includeCredentials
        }
      })

      if (teamMembers && Array.isArray(teamMembers)) {
        await tx.teamMember.deleteMany({
          where: { projectId }
        })

        if (teamMembers.length > 0) {
          await tx.teamMember.createMany({
            data: teamMembers.map((m: any, index: number) => ({
              projectId,
              name: m.name,
              designation: m.designation,
              email: m.email,
              qualifications: m.qualifications,
              order: index
            }))
          })
        }
      }
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error: any) {
    console.error('Save Report Meta Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save metadata' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = (await params).id
  
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        reportMeta: true,
        teamMembers: { orderBy: { order: 'asc' } }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({
      reportMeta: project.reportMeta || {},
      teamMembers: project.teamMembers || []
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
