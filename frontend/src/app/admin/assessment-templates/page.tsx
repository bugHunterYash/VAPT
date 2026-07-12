import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AssessmentTemplatesTable } from "@/components/admin/templates/AssessmentTemplatesTable"
import { verifyAuth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AssessmentTemplatesPage() {
  const user = await verifyAuth()

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    redirect('/dashboard')
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessment Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage the master Excel templates used for report generation across different assessment types.
          </p>
        </div>

        <AssessmentTemplatesTable />
      </div>
    </DashboardLayout>
  )
}
