import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string, itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const body = await request.json()

    // Validate body
    const { result, remark, findingId } = body

    const updateData: any = {}
    if (result !== undefined) updateData.result = result
    if (remark !== undefined) updateData.remark = remark
    if (findingId !== undefined) updateData.findingId = findingId

    const updated = await prisma.projectChecklist.update({
      where: { 
        id: itemId,
        projectId: id // Extra safety to ensure it belongs to this project
      },
      data: updateData
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating checklist item:', error)
    return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 })
  }
}
