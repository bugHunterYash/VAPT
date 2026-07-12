"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, FolderKanban, ShieldAlert, Users, Settings, Bug, BookOpen, Layers, CheckSquare, Activity, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"

const navItems = [
  { title: "Dashboard", href: "/dashboard", roles: ["SUPER_ADMIN", "ADMIN"] },
  { title: "Projects", href: "/projects", roles: ["SUPER_ADMIN", "ADMIN", "AUDITOR"] },
  { title: "Findings", href: "/findings", roles: ["SUPER_ADMIN", "ADMIN", "AUDITOR"] },
  { title: "Reports", href: "/reports", roles: ["SUPER_ADMIN", "ADMIN", "AUDITOR"] },
  { title: "Knowledge Base", href: "/kb", roles: ["SUPER_ADMIN", "ADMIN", "AUDITOR", "REVIEWER"] },
  { title: "Templates", href: "/templates", roles: ["SUPER_ADMIN", "ADMIN"] },
  { title: "Review Queue", href: "/review", roles: ["SUPER_ADMIN", "REVIEWER"] },
  { title: "Analytics", href: "/analytics", roles: ["SUPER_ADMIN", "ADMIN"] },
  { title: "User Management", href: "/admin/users", roles: ["SUPER_ADMIN", "ADMIN"] },
  { title: "Role Management", href: "/admin/roles", roles: ["SUPER_ADMIN", "ADMIN"] },
  { title: "Assessment Templates", href: "/admin/assessment-templates", roles: ["SUPER_ADMIN", "ADMIN"] },
]

const getIcon = (title: string) => {
  switch (title) {
    case "Dashboard": return LayoutDashboard
    case "Projects": return FolderKanban
    case "Findings": return Bug
    case "Reports": return Layers
    case "Knowledge Base": return BookOpen
    case "Templates": return ShieldAlert
    case "Review Queue": return CheckSquare
    case "Analytics": return Activity
    case "User Management": return Users
    case "Role Management": return ShieldAlert
    case "Assessment Templates": return FolderKanban
    default: return LayoutDashboard
  }
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user)
      })
      .catch(console.error)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const role = user?.role || ""

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
            const Icon = getIcon(item.title)
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
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-9 w-9 rounded-full shrink-0 bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-sm">
                    {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate">{user?.name || 'Loading...'}</p>
                    <p className="text-xs text-muted-foreground capitalize truncate">
                      {user ? `${user.role.replace('_', ' ')}` : ''}
                    </p>
                </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Link href="/settings" className="text-muted-foreground hover:text-primary transition-colors p-1">
                  <Settings className="h-4 w-4" />
              </Link>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <LogOut className="h-4 w-4" />
              </button>
            </div>
        </div>
      </div>
    </div>
  )
}
