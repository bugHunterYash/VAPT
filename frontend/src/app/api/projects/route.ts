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

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let whereClause = {}

  // Role-based filtering
  if (user.role === 'AUDITOR') {
    whereClause = { auditorId: user.id }
  } else if (user.role === 'REVIEWER') {
    whereClause = { reviewerId: user.id }
  }

  try {
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        auditor: true,
        reviewer: true,
        creator: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Map to remove sensitive user info
    const safeProjects = projects.map((p: any) => ({
      ...p,
      auditor: p.auditor ? { id: p.auditor.id, name: p.auditor.name, email: p.auditor.email } : null,
      reviewer: p.reviewer ? { id: p.reviewer.id, name: p.reviewer.name, email: p.reviewer.email } : null,
      creator: p.creator ? { id: p.creator.id, name: p.creator.name, email: p.creator.email } : null
    }))

    return NextResponse.json(safeProjects)
  } catch (error: any) {
    console.error('Fetch Projects Error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser(request)
  if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      name, organization, applicationName, assessmentType, priority,
      environment, targetUrl, targetIp, expectedStartDate, expectedEndDate,
      auditorId, reviewerId
    } = body

    if (!name || !organization || !assessmentType || !priority || !environment || !auditorId || !reviewerId || !expectedStartDate || !expectedEndDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        name,
        organization,
        applicationName: applicationName || '',
        assessmentType,
        priority,
        environment,
        targetUrl: targetUrl || '',
        targetIp: targetIp || null,
        expectedStartDate: new Date(expectedStartDate),
        expectedEndDate: new Date(expectedEndDate),
        auditorId,
        reviewerId,
        createdBy: user.id as string
      }
    })

    // Log Activity
    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        userId: user.id as string,
        action: 'Project created and team assigned.'
      }
    })

    // Create Notifications
    await prisma.notification.createMany({
      data: [
        {
          userId: auditorId,
          message: `You have been assigned as the Auditor for project: ${name}`
        },
        {
          userId: reviewerId,
          message: `You have been assigned as the Reviewer for project: ${name}`
        }
      ]
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    console.error('Create Project Error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
