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

    const { action, comments } = body // action: 'Approve' | 'Reject'

    if (!action || !['Approve', 'Reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const newStatus = action === 'Approve' ? 'Approved' : 'Rejected'

    await prisma.$transaction(async (tx) => {
      // Update Project
      await tx.project.update({
        where: { id },
        data: { status: newStatus }
      })

      // Add ReviewComment if provided
      if (comments) {
        await tx.reviewComment.create({
          data: {
            projectId: id,
            reviewerId: user.id as string,
            category: 'General',
            content: comments
          }
        })
      }

      // Update the latest AssessmentSnapshot
      const latestSnapshot = await tx.assessmentSnapshot.findFirst({
        where: { projectId: id },
        orderBy: { submissionNumber: 'desc' }
      })

      if (latestSnapshot) {
        await tx.assessmentSnapshot.update({
          where: { id: latestSnapshot.id },
          data: { 
            status: newStatus,
            reviewerComments: comments || null
          }
        })
      }

      // Log Activity
      await tx.projectActivity.create({
        data: {
          projectId: id,
          userId: user.id as string,
          action: `Assessment ${newStatus} by Reviewer. ${comments ? 'Comments added.' : ''}`
        }
      })
    })

    return NextResponse.json({ success: true, message: `Project ${newStatus}` })
  } catch (error) {
    console.error('Error reviewing project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
