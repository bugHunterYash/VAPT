import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/lib/auth'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const user = await verifyAuth(request)
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.assessmentTemplate.findMany({
      include: {
        uploadedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyAuth(request)
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const assessmentType = formData.get('assessmentType') as string
    const version = formData.get('version') as string || 'v1.0'

    if (!file || !name || !assessmentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const safeAssessmentType = assessmentType.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const uploadDir = path.join(process.cwd(), 'storage', 'templates', safeAssessmentType)
    
    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true })
    
    const fileName = `${Date.now()}-${file.name}`
    const filePath = path.join(uploadDir, fileName)
    
    // Write file to disk
    await writeFile(filePath, buffer)
    
    // Deactivate previous active templates for this type
    await prisma.assessmentTemplate.updateMany({
      where: { assessmentType },
      data: { isActive: false }
    })

    // Create new template record
    const template = await prisma.assessmentTemplate.create({
      data: {
        name,
        assessmentType,
        version,
        filePath,
        isActive: true,
        uploadedById: user.id
      },
      include: {
        uploadedBy: { select: { name: true } }
      }
    })

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('Failed to upload template:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
