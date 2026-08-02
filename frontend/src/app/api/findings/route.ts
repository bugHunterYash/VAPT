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

const severityRank: Record<string, number> = {
  "Critical": 5,
  "High": 4,
  "Medium": 3,
  "Low": 2,
  "Info": 1,
  "Informative": 1
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const severities = searchParams.getAll('severity')
  const statuses = searchParams.getAll('status')
  const projectId = searchParams.get('projectId')
  
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  let projectCondition: any = {}

  if (user.role === 'AUDITOR') {
    projectCondition = { auditorId: user.id as string }
  } else if (user.role === 'REVIEWER') {
    projectCondition = { reviewerId: user.id as string }
  }

  if (projectId) {
    projectCondition.id = projectId
  }

  let whereClause: any = {}
  
  if (Object.keys(projectCondition).length > 0) {
    whereClause.project = projectCondition
  }

  if (severities.length > 0) {
    whereClause.severity = { in: severities }
  }

  if (statuses.length > 0) {
    whereClause.status = { in: statuses }
  }

  if (search.trim() !== '') {
    const searchTrimmed = search.trim()
    whereClause.OR = [
      { title: { contains: searchTrimmed } },
      { cwe: { contains: searchTrimmed } },
      { owasp: { contains: searchTrimmed } },
      { project: { name: { contains: searchTrimmed } } }
    ]
  }

  try {
    const allFindings = await prisma.finding.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true } },
        evidences: true
      }
    })

    // Custom sorting in memory to handle Severity ranks and Case-Insensitive Name
    let sortedFindings = [...allFindings]
    
    sortedFindings.sort((a, b) => {
      let valA: any = a[sortBy as keyof typeof a]
      let valB: any = b[sortBy as keyof typeof b]

      if (sortBy === 'severity') {
        valA = severityRank[a.severity] || 0
        valB = severityRank[b.severity] || 0
      } else if (sortBy === 'title' || sortBy === 'name') {
        valA = a.title?.toLowerCase() || ''
        valB = b.title?.toLowerCase() || ''
      } else if (sortBy === 'createdAt') {
        valA = new Date(a.createdAt).getTime()
        valB = new Date(b.createdAt).getTime()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    const total = sortedFindings.length
    const totalPages = Math.ceil(total / pageSize)
    
    const paginated = sortedFindings.slice((page - 1) * pageSize, page * pageSize)

    return NextResponse.json({
      items: paginated,
      total,
      page,
      pageSize,
      totalPages
    })
  } catch (error: any) {
    console.error('Fetch Findings Error:', error)
    return NextResponse.json({ error: 'Failed to fetch findings' }, { status: 500 })
  }
}
