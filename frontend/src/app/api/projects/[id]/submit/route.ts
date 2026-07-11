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
    
    // Check checklist validation
    const checklists = await prisma.projectChecklist.findMany({
      where: { projectId: id }
    })

    if (checklists.length === 0) {
      return NextResponse.json({ error: 'No checklist items found.' }, { status: 400 })
    }

    const uncompleted = checklists.filter(c => c.result === 'Not Started')
    if (uncompleted.length > 0) {
      return NextResponse.json({ error: `Cannot submit. ${uncompleted.length} items have no result.` }, { status: 400 })
    }

    const issuesWithoutFindings = checklists.filter(c => c.result === 'Issues' && !c.findingId)
    if (issuesWithoutFindings.length > 0) {
      return NextResponse.json({ error: `Cannot submit. ${issuesWithoutFindings.length} issues have no findings attached.` }, { status: 400 })
    }

    // Get previous snapshots to determine submission number
    const previousSnapshots = await prisma.assessmentSnapshot.count({
      where: { projectId: id }
    })
    const submissionNumber = previousSnapshots + 1

    // Fetch findings for the snapshot
    const findings = await prisma.finding.findMany({
      where: { projectId: id }
    })

    // Submit Assessment
    await prisma.$transaction([
      prisma.assessmentSnapshot.create({
        data: {
          projectId: id,
          submissionNumber,
          status: 'Pending Review',
          checklistData: JSON.stringify(checklists),
          findingsData: JSON.stringify(findings),
        }
      }),
      prisma.project.update({
        where: { id },
        data: { status: 'Pending Review' }
      }),
      prisma.projectActivity.create({
        data: {
          projectId: id,
          userId: user.id as string,
          action: `Assessment submitted for review (Submission #${submissionNumber}).`
        }
      })
    ])

    return NextResponse.json({ success: true, message: 'Assessment submitted successfully' })
  } catch (error) {
    console.error('Error submitting assessment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
