import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt'
const key = new TextEncoder().encode(JWT_SECRET)

async function getCurrentUser(request: Request) {
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        auditor: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        activities: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        checklists: {
          orderBy: { order: 'asc' }
        },
        assessmentSnapshots: {
          orderBy: { submissionNumber: 'desc' }
        }
      }
    })

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Authorization check
    if (user.role === 'AUDITOR' && project.auditorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (user.role === 'REVIEWER' && project.reviewerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(request)
  if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { auditorId, reviewerId } = body

    const existingProject = await prisma.project.findUnique({ where: { id } })
    if (!existingProject) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updateData: any = {}
    if (auditorId) updateData.auditorId = auditorId
    if (reviewerId) updateData.reviewerId = reviewerId

    const project = await prisma.project.update({
      where: { id },
      data: updateData
    })

    // Log Activity & Notify if changed
    if (auditorId && auditorId !== existingProject.auditorId) {
      await prisma.projectActivity.create({
        data: {
          projectId: id,
          userId: user.id as string,
          action: 'Auditor assignment changed.'
        }
      })
      await prisma.notification.create({
        data: {
          userId: auditorId,
          message: `You have been newly assigned as the Auditor for project: ${project.name}`
        }
      })
    }

    if (reviewerId && reviewerId !== existingProject.reviewerId) {
      await prisma.projectActivity.create({
        data: {
          projectId: id,
          userId: user.id as string,
          action: 'Reviewer assignment changed.'
        }
      })
      await prisma.notification.create({
        data: {
          userId: reviewerId,
          message: `You have been newly assigned as the Reviewer for project: ${project.name}`
        }
      })
    }

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { version, classification, assessmentStartDate, assessmentEndDate } = body

    const updateData: any = {}
    if (version !== undefined) updateData.version = version
    if (classification !== undefined) updateData.classification = classification
    if (assessmentStartDate !== undefined) updateData.assessmentStartDate = assessmentStartDate ? new Date(assessmentStartDate) : null
    if (assessmentEndDate !== undefined) updateData.assessmentEndDate = assessmentEndDate ? new Date(assessmentEndDate) : null

    const project = await prisma.project.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("PATCH error:", error)
    return NextResponse.json({ error: 'Failed to patch project' }, { status: 500 })
  }
}
