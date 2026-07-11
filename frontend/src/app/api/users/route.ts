import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt'
const key = new TextEncoder().encode(JWT_SECRET)

async function checkAdmin(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, key)
    return ['SUPER_ADMIN', 'ADMIN'].includes(payload.role as string)
  } catch (error) {
    return false
  }
}

export async function GET(request: Request) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const roleName = searchParams.get('role')

  try {
    const whereClause = roleName ? {
      role: {
        name: roleName
      }
    } : {}

    const users = await prisma.user.findMany({
      where: whereClause,
      include: { role: true },
      orderBy: { createdAt: 'desc' }
    })
    
    // map and remove password
    const safeUsers = users.map((user: any) => {
      const { password, ...rest } = user
      return rest
    })
    
    return NextResponse.json(safeUsers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, email, password, roleId, organizationId, isActive } = body

    if (!name || !email || !password || !roleId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId,
        organizationId,
        isActive: isActive ?? true
      },
      include: { role: true }
    })

    const { password: _, ...safeUser } = user
    return NextResponse.json(safeUser, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
