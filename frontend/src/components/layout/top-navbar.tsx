"use client"

import { Bell, Search, Sparkles, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AiAssistantPanel } from "@/components/ai/ai-panel"

export function TopNavbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-16 sm:border-b sm:bg-background sm:px-6">
      <div className="relative ml-auto flex-1 md:grow-0 w-full md:w-96">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Global search..."
          className="w-full rounded-lg bg-card border-border pl-8 md:w-[300px] lg:w-[400px] text-sm focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-9 w-9 border-border bg-card shadow-sm rounded-lg text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
        
        <AiAssistantPanel />

        <Button variant="default" className="h-9 gap-2 shadow-sm rounded-lg font-medium">
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline">Create</span>
        </Button>
      </div>
    </header>
  )
}
