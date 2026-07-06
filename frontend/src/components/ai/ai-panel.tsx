"use client"

import { useState } from "react"
import { Sparkles, X, MessageSquare, ShieldAlert, FileText, CheckCircle2, Search, Zap } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const aiActions = [
  { icon: FileText, label: "Generate Executive Summary" },
  { icon: Sparkles, label: "Improve Description" },
  { icon: ShieldAlert, label: "Generate Mitigation" },
  { icon: Search, label: "Find Duplicate Finding" },
  { icon: CheckCircle2, label: "Review Report" },
  { icon: MessageSquare, label: "Explain CVSS" },
  { icon: Zap, label: "Suggest References" },
]

export function AiAssistantPanel({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
            <Button variant="outline" className="h-9 gap-2 border-border bg-card shadow-sm rounded-lg text-primary hover:bg-primary/10">
                <Sparkles className="h-4 w-4" />
                <span className="hidden md:inline">Ask AI</span>
            </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md border-border bg-card p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border/50 text-left">
            <div className="flex items-center gap-2 text-primary mb-1">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold tracking-wide">VMT AI Assistant</span>
            </div>
            <SheetTitle className="text-sm font-normal text-muted-foreground">
                Powered by local models. 100% offline and secure.
            </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <div>
                <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                    {aiActions.map((action, i) => (
                        <Button key={i} variant="outline" size="sm" className="bg-background border-border/50 hover:border-primary hover:bg-primary/5 text-xs justify-start h-8 px-2.5">
                            <action.icon className="h-3.5 w-3.5 mr-1.5 text-primary" />
                            {action.label}
                        </Button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 rounded-xl border border-border/50 bg-background/50 flex items-center justify-center p-6 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm">Select an action or ask a question below to analyze the current context.</p>
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-border/50 bg-background">
            <div className="relative">
                <Textarea 
                    placeholder="Ask AI about the current page..."
                    className="min-h-[80px] resize-none bg-card border-border pr-12 text-sm focus-visible:ring-1 focus-visible:ring-primary shadow-sm rounded-xl py-3"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button size="icon" className="absolute bottom-2 right-2 h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
