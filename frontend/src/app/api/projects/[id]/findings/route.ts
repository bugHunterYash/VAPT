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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    const {
      title, severity, checklistId, description, cvss,
      cwe, owasp, affectedUrls, poc, recommendation, evidenceUrls
    } = body

    if (!title || !severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Run in transaction to update ProjectChecklist if checklistId is provided
    const [finding, projectChecklist] = await prisma.$transaction(async (tx) => {
      const newFinding = await tx.finding.create({
        data: {
          projectId: id,
          reportedById: user.id as string,
          title,
          severity,
          checklistId,
          description,
          cvss,
          cwe,
          owasp,
          affectedUrls,
          poc,
          recommendation,
          evidenceUrls: evidenceUrls ? JSON.stringify(evidenceUrls) : null
        }
      })

      let updatedChecklist = null
      if (checklistId) {
        updatedChecklist = await tx.projectChecklist.update({
          where: { id: checklistId },
          data: { findingId: newFinding.id }
        })
      }

      // Log Activity
      await tx.projectActivity.create({
        data: {
          projectId: id,
          userId: user.id as string,
          action: `Created new finding: ${title}`
        }
      })

      return [newFinding, updatedChecklist]
    })

    return NextResponse.json(finding, { status: 201 })
  } catch (error) {
    console.error('Error creating finding:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    
    const findings = await prisma.finding.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(findings)
  } catch (error) {
    console.error('Error fetching findings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
