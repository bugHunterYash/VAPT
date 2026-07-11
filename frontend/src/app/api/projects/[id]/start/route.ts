import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get the project
    const project = await prisma.project.findUnique({
      where: { id }
    })
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if it already has checklists
    const existingChecklists = await prisma.projectChecklist.count({
      where: { projectId: id }
    })

    if (existingChecklists > 0) {
      return NextResponse.json({ error: 'Assessment already started for this project' }, { status: 400 })
    }

    // Find the template
    const template = await prisma.checklistTemplate.findUnique({
      where: { assessmentType: project.assessmentType },
      include: {
        categories: {
          include: {
            items: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: `No checklist template found for assessment type: ${project.assessmentType}` }, { status: 404 })
    }

    // Create the ProjectChecklist instances
    const checklistData = []
    
    for (const category of template.categories) {
      for (const item of category.items) {
        checklistData.push({
          projectId: id,
          categoryName: category.name,
          code: item.code,
          title: item.title,
          description: item.description,
          tools: item.tools,
          order: item.order
        })
      }
    }

    // Run in a transaction
    await prisma.$transaction([
      prisma.projectChecklist.createMany({
        data: checklistData
      }),
      prisma.project.update({
        where: { id },
        data: { status: 'Assessment In Progress' }
      }),
      prisma.projectActivity.create({
        data: {
          projectId: id,
          userId: project.auditorId, // Assuming auditor started it, though really we should get from JWT
          action: 'Started Assessment and instantiated checklist'
        }
      })
    ])

    return NextResponse.json({ success: true, message: 'Assessment started successfully' })
  } catch (error) {
    console.error('Error starting assessment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
