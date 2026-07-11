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

        <div className="rounded-xl border bg-card text-card-foreground shadow transition-all hover:shadow-md col-span-full lg:col-span-2">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
            <h3 className="tracking-tight text-sm font-medium">Recent Activity</h3>
          </div>
          <div className="p-4 pt-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center text-muted-foreground gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Recently Assigned Projects
              </li>
              <li className="flex items-center text-muted-foreground gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div> Recently Approved Reports
              </li>
              <li className="flex items-center text-muted-foreground gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div> Recently Created Users
              </li>
              <li className="flex items-center text-muted-foreground gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div> Recently Completed Reviews
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
