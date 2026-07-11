import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Can access everything.' },
    { name: 'ADMIN', description: 'Can manage projects. Can create users. Can assign work. Cannot manage system settings.' },
    { name: 'AUDITOR', description: 'Can only access assigned projects. Can create findings. Cannot manage users.' },
    { name: 'REVIEWER', description: 'Can only review submitted reports.' },
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    })
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } })
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
  const auditorRole = await prisma.role.findUnique({ where: { name: 'AUDITOR' } })
  const reviewerRole = await prisma.role.findUnique({ where: { name: 'REVIEWER' } })

  if (!superAdminRole || !adminRole || !auditorRole || !reviewerRole) {
    throw new Error('Roles not created properly')
  }

  const defaultPassword = await bcrypt.hash('123456', 10)

  const users = [
    {
      email: 'admin@gmail.com',
      name: 'Super Admin',
      password: defaultPassword,
      roleId: superAdminRole.id,
    },
    {
      email: 'manager@gmail.com',
      name: 'Admin',
      password: defaultPassword,
      roleId: adminRole.id,
    },
    {
      email: 'auditor@gmail.com',
      name: 'Auditor',
      password: defaultPassword,
      roleId: auditorRole.id,
    },
    {
      email: 'reviewer@gmail.com',
      name: 'Reviewer',
      password: defaultPassword,
      roleId: reviewerRole.id,
    },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    })
  }

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
