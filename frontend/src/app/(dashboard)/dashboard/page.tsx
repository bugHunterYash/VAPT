export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back to VMT. Here is your overview.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow transition-all hover:shadow-md">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Projects</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-primary">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card text-card-foreground shadow transition-all hover:shadow-md">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Pending Reviews</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-amber-500">4</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow transition-all hover:shadow-md">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Critical Findings</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-destructive">18</div>
            <p className="text-xs text-muted-foreground">Across 3 projects</p>
          </div>
        </div>
      </div>
    </div>
  )
}
