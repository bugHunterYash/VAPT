import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fetching projects...')
  const projects = await prisma.project.findMany({
    include: { checklists: true }
  })

  console.log(`Found ${projects.length} projects.`)

  const template = await prisma.checklistTemplate.findFirst({
    where: { assessmentType: 'Web Application' },
    include: { categories: { include: { items: true } } }
  })

  if (!template) {
    console.error('Template not found!')
    process.exit(1)
  }

  const allTemplateItems = template.categories.flatMap(c => 
    c.items.map(item => ({ categoryName: c.name, ...item }))
  )
  console.log(`Template has ${allTemplateItems.length} items.`)

  for (const project of projects) {
    const existingCodes = new Set(project.checklists.map(c => c.code))
    
    const missingItems = allTemplateItems.filter(t => !existingCodes.has(t.code))
    
    if (missingItems.length > 0) {
      console.log(`Project ${project.name} is missing ${missingItems.length} items. Injecting...`)
      
      const insertData = missingItems.map(item => ({
        projectId: project.id,
        categoryName: item.categoryName,
        code: item.code,
        title: item.title,
        description: item.description,
        tools: item.tools,
        order: item.order,
        result: 'Not Started'
      }))

      await prisma.projectChecklist.createMany({
        data: insertData
      })
      console.log(`Successfully synced ${missingItems.length} items for project ${project.name}`)
    } else {
      console.log(`Project ${project.name} is already up to date.`)
    }
  }

  console.log('Sync complete!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
