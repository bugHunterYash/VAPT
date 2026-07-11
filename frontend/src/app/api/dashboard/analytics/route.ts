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

  const { searchParams } = new URL(request.url)
  const timePeriod = searchParams.get('timePeriod') || 'This Month'
  const auditorId = searchParams.get('auditorId') || 'all'

  // Calculate start date based on time period
  const now = new Date()
  let startDate = new Date()
  let endDate = new Date(now)

  if (timePeriod === 'Custom Date Range') {
    const startStr = searchParams.get('startDate')
    const endStr = searchParams.get('endDate')
    if (startStr && endStr) {
      startDate = new Date(startStr)
      endDate = new Date(endStr)
    } else {
      // fallback if params missing
      startDate = new Date(now.getFullYear(), 0, 1)
    }
  } else {
    switch (timePeriod) {
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'Last Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        break
      case 'Last 3 Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case 'Last 6 Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        break
      case 'This Year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }
  }

  // Base query clauses
  const projectWhere: any = {
    createdAt: { gte: startDate, lte: endDate }
  }
  const findingWhere: any = {
    createdAt: { gte: startDate, lte: endDate }
  }

  // If auditor is selected, or if the current user is an auditor and can only see their stuff
  if (auditorId !== 'all') {
    projectWhere.auditorId = auditorId
    findingWhere.reportedById = auditorId
  }
  
  if (user.role === 'AUDITOR' && auditorId === 'all') {
     projectWhere.auditorId = user.id
     findingWhere.reportedById = user.id
  }

  try {
    const projects = await prisma.project.findMany({ 
      where: projectWhere,
      include: {
        checklists: { select: { id: true, result: true } }
      }
    })
    const findings = await prisma.finding.findMany({ where: findingWhere })

    // Aggregations
    const assigned = projects.filter(p => p.status === 'Assigned').length
    const inProgress = projects.filter(p => p.status === 'In Progress').length
    const completed = projects.filter(p => p.status === 'Completed' || p.status === 'Approved').length
    const pendingReview = projects.filter(p => p.status === 'Pending Review').length

    // Average Completion Time & Progress
    const completedProjects = projects.filter(p => p.status === 'Completed' || p.status === 'Approved')
    let averageCompletionTime = 0
    if (completedProjects.length > 0) {
      const totalMs = completedProjects.reduce((acc, p) => acc + (p.updatedAt.getTime() - p.createdAt.getTime()), 0)
      const avgMs = totalMs / completedProjects.length
      averageCompletionTime = Math.round(avgMs / (1000 * 60 * 60 * 24)) // in days
    }
    
    // Average progress across all in-progress projects
    const inProgressProjects = projects.filter(p => p.status === 'In Progress' || p.status === 'Pending Review')
    let totalProgressPercent = 0
    inProgressProjects.forEach(p => {
        if (p.checklists && p.checklists.length > 0) {
            const done = p.checklists.filter(c => c.result !== 'Not Started').length
            totalProgressPercent += (done / p.checklists.length) * 100
        }
    })
    const averageProgress = inProgressProjects.length > 0 ? Math.round(totalProgressPercent / inProgressProjects.length) : 0

    // Findings by severity
    const critical = findings.filter(f => f.severity === 'Critical').length
    const high = findings.filter(f => f.severity === 'High').length
    const medium = findings.filter(f => f.severity === 'Medium').length
    const low = findings.filter(f => f.severity === 'Low').length
    const informative = findings.filter(f => f.severity === 'Informative').length

    // Monthly Trend
    const trendMap = new Map<string, { month: string, projects: number, findings: number, sortKey: string }>()
    
    // Generate buckets for the selected range
    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const monthLabel = currentDate.toLocaleString('default', { month: 'short' }) + ' ' + currentDate.getFullYear().toString().substring(2)
      const sortKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth()).padStart(2, '0')}`
      if (!trendMap.has(sortKey)) {
        trendMap.set(sortKey, { month: monthLabel, projects: 0, findings: 0, sortKey })
      }
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    projects.forEach(p => {
      const sortKey = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth()).padStart(2, '0')}`
      if (trendMap.has(sortKey)) {
        trendMap.get(sortKey)!.projects += 1
      }
    })

    findings.forEach(f => {
      const sortKey = `${f.createdAt.getFullYear()}-${String(f.createdAt.getMonth()).padStart(2, '0')}`
      if (trendMap.has(sortKey)) {
        trendMap.get(sortKey)!.findings += 1
      }
    })

    const monthlyTrend = Array.from(trendMap.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey, ...rest }) => rest)

    return NextResponse.json({
      projects: {
        assigned,
        inProgress,
        completed,
        pendingReview,
        averageCompletionDays: averageCompletionTime,
        averageProgress
      },
      findings: {
        total: findings.length,
        critical,
        high,
        medium,
        low,
        informative
      },
      trend: monthlyTrend
    })
  } catch (error) {
    console.error('Analytics Error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
