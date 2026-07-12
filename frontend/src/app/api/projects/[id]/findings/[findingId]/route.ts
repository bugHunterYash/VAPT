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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string, findingId: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, findingId } = await params
    const body = await request.json()

    const {
      title, severity, cwe, owasp, affectedUrls,
      description, recommendation, evidences
    } = body

    if (!title || !severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const finding = await prisma.$transaction(async (tx) => {
      // Delete old evidences
      await tx.evidence.deleteMany({
        where: { findingId }
      })

      const updatedFinding = await tx.finding.update({
        where: { id: findingId, projectId: id },
        data: {
          title,
          severity,
          description,
          cwe,
          owasp,
          affectedUrls,
          recommendation,
          ...(evidences && Array.isArray(evidences) && evidences.length > 0 ? {
            evidences: {
              create: evidences.map((ev: any, index: number) => ({
                filePath: ev.filePath,
                caption: ev.caption || '',
                order: ev.order || index
              }))
            }
          } : {})
        }
      })

      await tx.projectActivity.create({
        data: {
          projectId: id,
          userId: user.id as string,
          action: `Updated finding: ${title}`
        }
      })

      return updatedFinding
    })

    return NextResponse.json(finding)
  } catch (error) {
    console.error('Error updating finding:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
