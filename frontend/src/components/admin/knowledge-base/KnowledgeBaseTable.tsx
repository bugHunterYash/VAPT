"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Trash2, Edit, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { AddKnowledgeBaseModal } from "./AddKnowledgeBaseModal"

export function KnowledgeBaseTable() {
  const [findings, setFindings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  useEffect(() => {
    fetchFindings()
  }, [])

  const fetchFindings = async (searchQuery = "") => {
    setLoading(true)
    try {
      const url = searchQuery ? `/api/knowledge-base?search=${encodeURIComponent(searchQuery)}` : '/api/knowledge-base'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setFindings(data)
      } else {
        toast.error("Failed to fetch knowledge base")
      }
    } catch (error) {
      toast.error("Error fetching knowledge base")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vulnerability?")) return

    try {
      const res = await fetch(`/api/knowledge-base/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Finding deleted")
        fetchFindings(search)
      } else {
        toast.error("Failed to delete finding")
      }
    } catch (error) {
      toast.error("Error deleting finding")
    }
  }

  return (
    <>
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vulnerabilities..."
                className="pl-9 bg-background"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  fetchFindings(e.target.value)
                }}
              />
            </div>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Finding
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : findings.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No vulnerabilities found. Add some standard findings to the Knowledge Base.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>CVSS</TableHead>
                  <TableHead>CWE / OWASP</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {findings.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{f.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        f.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        f.severity === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                        f.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }>
                        {f.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{f.cvss || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="text-xs">{f.cwe || "No CWE"}</div>
                      <div className="text-xs text-muted-foreground/70">{f.owasp || "No OWASP"}</div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toast.info("Edit not implemented in phase 1")}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(f.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddKnowledgeBaseModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => fetchFindings(search)} 
      />
    </>
  )
}
