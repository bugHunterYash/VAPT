import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/lib/auth'

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    if (body.isActive) {
      // First, get the template to find its assessment type
      const template = await prisma.assessmentTemplate.findUnique({
        where: { id }
      })
      
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      
      // Deactivate all others of this type
      await prisma.assessmentTemplate.updateMany({
        where: { assessmentType: template.assessmentType },
        data: { isActive: false }
      })
    }

    const updatedTemplate = await prisma.assessmentTemplate.update({
      where: { id },
      data: { isActive: body.isActive },
      include: { uploadedBy: { select: { name: true } } }
    })

    return NextResponse.json({ template: updatedTemplate })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.assessmentTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
