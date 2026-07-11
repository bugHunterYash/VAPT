import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const webChecklist = {
  name: 'Web Application Testing Master',
  assessmentType: 'Web Application',
  categories: [
    {
      name: 'Information Gathering',
      items: [
        { code: 'OTG-INFO-001', title: 'Conduct Search Engine Discovery and Reconnaissance for Information Leakage', description: 'Use search engines and reconnaissance to find sensitive info.', tools: 'Google Hacking, Shodan, FOCA' },
        { code: 'OTG-INFO-002', title: 'Fingerprint Web Server', description: 'Identify the web server and its version.', tools: 'Netcat, Nmap, WhatWeb' },
        { code: 'OTG-INFO-003', title: 'Review Webserver Metafiles for Information Leakage', description: 'Check robots.txt, sitemap.xml, security.txt.', tools: 'Curl, Wget, Browser' },
        { code: 'OTG-INFO-004', title: 'Enumerate Applications on Webserver', description: 'Identify other applications hosted on the same server.', tools: 'Nmap, DNS lookups' }
      ]
    },
    {
      name: 'Configuration and Deployment Management Testing',
      items: [
        { code: 'OTG-CONFIG-001', title: 'Test Network Infrastructure Configuration', description: 'Review network configurations and exposed ports.', tools: 'Nmap, Masscan' },
        { code: 'OTG-CONFIG-002', title: 'Test Application Platform Configuration', description: 'Review web server and application server configurations.', tools: 'Nikto' },
        { code: 'OTG-CONFIG-006', title: 'Test HTTP Methods', description: 'Identify supported HTTP methods and check for dangerous ones (PUT, DELETE).', tools: 'Curl, Burp Suite' }
      ]
    },
    {
      name: 'Identity Management Testing',
      items: [
        { code: 'OTG-IDENT-001', title: 'Test Role Definitions', description: 'Understand roles and access control hierarchies.', tools: 'Manual Analysis' },
        { code: 'OTG-IDENT-004', title: 'Test for Account Enumeration and Guessable User Account', description: 'Identify if usernames can be enumerated.', tools: 'Burp Suite, FFuf' }
      ]
    },
    {
      name: 'Authentication Testing',
      items: [
        { code: 'OTG-AUTHN-001', title: 'Test for Credentials Transported over an Unencrypted Channel', description: 'Ensure HTTPS is used for all auth traffic.', tools: 'Wireshark, Browser' },
        { code: 'OTG-AUTHN-002', title: 'Test for Default Credentials', description: 'Check for default vendor credentials.', tools: 'Hydra, Burp Intruder' },
        { code: 'OTG-AUTHN-003', title: 'Test for Weak Lock Out Mechanism', description: 'Attempt brute-force to check if account locks out.', tools: 'Burp Suite Intruder' }
      ]
    },
    {
      name: 'Authorization Testing',
      items: [
        { code: 'OTG-AUTHZ-001', title: 'Testing Directory Traversal/File Include', description: 'Test for LFI and directory traversal vulnerabilities.', tools: 'Burp Suite, dotdotpwn' },
        { code: 'OTG-AUTHZ-002', title: 'Testing for Bypassing Authorization Schema', description: 'Attempt to access endpoints restricted to higher roles.', tools: 'Authorize (Burp Plugin), Postman' },
        { code: 'OTG-AUTHZ-004', title: 'Testing for Insecure Direct Object References (IDOR)', description: 'Change IDs in parameters to access other users data.', tools: 'Burp Suite, Autorize' }
      ]
    },
    {
      name: 'Session Management Testing',
      items: [
        { code: 'OTG-SESS-001', title: 'Testing for Session Management Schema', description: 'Analyze session tokens for entropy and secure flags.', tools: 'Burp Sequencer' },
        { code: 'OTG-SESS-002', title: 'Testing for Cookies Attributes', description: 'Ensure Secure and HttpOnly flags are set.', tools: 'Browser DevTools, Burp Suite' }
      ]
    },
    {
      name: 'Input Validation Testing',
      items: [
        { code: 'OTG-INPVAL-001', title: 'Testing for Reflected Cross Site Scripting', description: 'Test reflected inputs for XSS execution.', tools: 'XSStrike, Burp Suite' },
        { code: 'OTG-INPVAL-002', title: 'Testing for Stored Cross Site Scripting', description: 'Test stored inputs for XSS execution.', tools: 'XSStrike, Burp Suite' },
        { code: 'OTG-INPVAL-005', title: 'Testing for SQL Injection', description: 'Test inputs for SQL injection vulnerabilities.', tools: 'SQLmap, Burp Suite' }
      ]
    }
  ]
}

async function main() {
  console.log('Seeding Checklist Templates...')

  // Clean up existing (optional, based on your needs)
  await prisma.checklistTemplate.deleteMany()

  let catOrder = 1
  for (const category of webChecklist.categories) {
    console.log(`Processing category: ${category.name}`)
    
    // Create template inside loop or fetch it (optimizing for single template here)
  }

  // Proper nested creation
  const template = await prisma.checklistTemplate.create({
    data: {
      name: webChecklist.name,
      assessmentType: webChecklist.assessmentType,
      categories: {
        create: webChecklist.categories.map((cat, i) => ({
          name: cat.name,
          order: i + 1,
          items: {
            create: cat.items.map((item, j) => ({
              code: item.code,
              title: item.title,
              description: item.description,
              tools: item.tools,
              order: j + 1
            }))
          }
        }))
      }
    }
  })

  console.log(`Successfully created Template: ${template.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
