import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const format = searchParams.get('format')
    const status = searchParams.get('status')
    const query = searchParams.get('query')

    const whereClause: any = {}

    if (projectId) whereClause.projectId = projectId
    if (format) whereClause.format = format
    if (status) whereClause.status = status

    if (query) {
      whereClause.project = {
        name: { contains: query }
      }
    }

    // Role-based filtering:
    // If not admin/super_admin, maybe only show reports for projects they are assigned to
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      whereClause.project = {
        ...whereClause.project,
        OR: [
          { auditorId: user.id },
          { reviewerId: user.id },
          { createdBy: user.id }
        ]
      }
    }

    const reports = await prisma.reportHistory.findMany({
      where: whereClause,
      include: {
        project: { select: { name: true, organization: true } },
        generatedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ reports })
  } catch (error: any) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
