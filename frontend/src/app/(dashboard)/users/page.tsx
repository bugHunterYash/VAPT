import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const users = [
  { id: 1, name: "Alice Admin", email: "alice@vmt.local", role: "Super Admin" },
  { id: 2, name: "Bob Auditor", email: "bob@vmt.local", role: "Auditor" },
  { id: 3, name: "Charlie Reviewer", email: "charlie@vmt.local", role: "Reviewer" },
]

export default function UsersPage() {
  return (
    <div className="flex h-full flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage platform users and access controls.</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map(u => (
          <Card key={u.id}>
            <CardHeader>
              <CardTitle>{u.name}</CardTitle>
              <CardDescription>{u.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge>{u.role}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
