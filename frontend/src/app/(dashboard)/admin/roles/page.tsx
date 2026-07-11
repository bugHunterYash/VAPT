'use client'

import { useEffect, useState } from 'react'
import { Shield, Users } from 'lucide-react'

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/roles')
      .then(res => res.json())
      .then(setRoles)
      .catch(console.error)
  }, [])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">View system roles and their associated permissions.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {roles.map(role => (
          <div key={role.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">{role.name.replace('_', ' ')}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6 h-20">
                {role.description}
              </p>
            </div>
            
            <div className="flex items-center gap-2 pt-4 border-t border-border mt-auto">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{role._count?.users || 0} Users</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
