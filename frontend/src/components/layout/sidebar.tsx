"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FolderKanban, ShieldAlert, Users, Settings, Bug, BookOpen, Layers, CheckSquare, Activity } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin", "auditor", "reviewer", "client"] },
  { title: "Projects", href: "/projects", icon: FolderKanban, roles: ["super_admin", "admin", "auditor", "reviewer", "client"] },
  { title: "Findings", href: "/findings", icon: Bug, roles: ["super_admin", "admin", "auditor", "reviewer", "client"] },
  { title: "Reports", href: "/reports", icon: Layers, roles: ["super_admin", "admin", "auditor", "reviewer", "client"] },
  { title: "Knowledge Base", href: "/kb", icon: BookOpen, roles: ["super_admin", "admin", "auditor", "reviewer"] },
  { title: "Templates", href: "/templates", icon: ShieldAlert, roles: ["super_admin", "admin"] },
  { title: "Review Queue", href: "/review", icon: CheckSquare, roles: ["super_admin", "admin", "reviewer"] },
  { title: "Analytics", href: "/analytics", icon: Activity, roles: ["super_admin", "admin"] },
  { title: "Administration", href: "/users", icon: Users, roles: ["super_admin", "admin"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const role = user?.role || "admin"

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(role)
  )

  return (
    <div className="flex h-full w-[260px] flex-col border-r bg-card/50 shadow-sm">
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-wide">
          <div className="bg-primary text-primary-foreground p-1 rounded-md">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <span className="text-lg">VMT</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-6">
        <div className="px-4 mb-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Menu</div>
        <nav className="grid gap-1 px-3">
          {filteredNavItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-foreground",
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-border/50 bg-background/50">
        <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-sm">
                    {user?.full_name?.charAt(0) || 'D'}
                </div>
                <div>
                    <p className="text-sm font-semibold">{user?.full_name || 'Demo User'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{role.replace('_', ' ')} • Org</p>
                </div>
            </div>
            <Link href="/settings" className="text-muted-foreground hover:text-primary transition-colors">
                <Settings className="h-4 w-4" />
            </Link>
        </div>
        <div className="px-2">
            <select 
              className="w-full text-xs p-2 rounded-md border border-input bg-card text-muted-foreground focus:ring-1 focus:ring-primary outline-none cursor-pointer"
              value={role}
              onChange={(e) => useAuthStore.setState({ user: { id: 1, email: 'demo@vmt.com', full_name: 'Demo User', role: e.target.value } as any })}
            >
              <option value="super_admin">Super Admin View</option>
              <option value="admin">Admin View</option>
              <option value="auditor">Auditor View</option>
              <option value="reviewer">Reviewer View</option>
              <option value="client">Client View</option>
            </select>
        </div>
      </div>
    </div>
  )
}
