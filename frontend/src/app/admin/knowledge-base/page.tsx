import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { KnowledgeBaseTable } from "@/components/admin/knowledge-base/KnowledgeBaseTable"
import { verifyAuth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function KnowledgeBasePage() {
  const user = await verifyAuth()

  // For this prototype, any admin-like role can view
  if (!user || (user.role !== 'Admin' && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    redirect('/dashboard')
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vulnerability Knowledge Base</h1>
          <p className="text-muted-foreground mt-2">
            Curated library of standard vulnerabilities. The AI Engine uses these definitions to ensure consistent, non-hallucinated report generation.
          </p>
        </div>

        <KnowledgeBaseTable />
      </div>
    </DashboardLayout>
  )
}
