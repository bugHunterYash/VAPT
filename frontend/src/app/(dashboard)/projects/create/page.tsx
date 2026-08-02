"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCombobox } from "@/components/users/UserCombobox"

const projectFormSchema = z.object({
  poNumber: z.string().min(1, "PO number is required"),
  organization: z.string().min(2, "Organization is required"),
  applicationName: z.string().optional(),
  assessmentType: z.string().min(1, "Assessment type is required"),
  targetUrl: z.string().min(1, "Target URL is required"),
  targetIp: z.string().optional(),
  environment: z.string().min(1, "Environment is required"),
  priority: z.string().min(1, "Priority is required"),
  expectedStartDate: z.string().min(1, "Start date is required"),
  expectedEndDate: z.string().min(1, "End date is required"),
  auditorId: z.string().min(1, "Auditor must be assigned"),
  reviewerId: z.string().min(1, "Reviewer must be assigned"),
  bypassChecklist: z.boolean().default(false),
})

export default function CreateProjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setCurrentUser(data.user)
      })
  }, [])

  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      poNumber: "",
      organization: "",
      applicationName: "",
      assessmentType: "",
      targetUrl: "",
      targetIp: "",
      environment: "",
      priority: "",
      expectedStartDate: "",
      expectedEndDate: "",
      auditorId: "",
      reviewerId: "",
      bypassChecklist: false,
    },
  })

  async function onSubmit(values: z.infer<typeof projectFormSchema>) {
    setIsSubmitting(true)
    setError("")
    
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create project")
      }
      
      router.push("/projects")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-4">
          <Link href="/projects">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create Project</h2>
            <p className="text-muted-foreground">Start a new VAPT assessment project and assign a team.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            Create Project
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
          {error}
        </div>
      )}

      <Form {...form}>
        <form className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-8">
          
          <Card className="md:col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Basic information for the assessment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="poNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PO No.</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. PO-123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Organization</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="applicationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Payment Gateway" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assessmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Type</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                        >
                          <option value="">Select Type...</option>
                          <option value="Web API">Web API</option>
                          <option value="Web Application">Web Application</option>
                          <option value="Mobile Application">Mobile Application</option>
                          <option value="Internal Network">Internal Network</option>
                          <option value="External Network">External Network</option>
                          <option value="Cloud Security">Cloud Security</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="targetUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://api.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetIp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target IP (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="192.168.1.0/24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Environment</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                        >
                          <option value="">Select Environment...</option>
                          <option value="Production">Production</option>
                          <option value="Staging">Staging</option>
                          <option value="UAT">UAT</option>
                          <option value="Development">Development</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                        >
                          <option value="">Select Priority...</option>
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expectedStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expectedEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Team Assignment</CardTitle>
              <CardDescription>Assign roles for this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="auditorId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Assigned Auditor</FormLabel>
                    <FormControl>
                      <UserCombobox 
                        role="AUDITOR" 
                        value={field.value} 
                        onChange={field.onChange} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reviewerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Assigned Reviewer</FormLabel>
                    <FormControl>
                      <UserCombobox 
                        role="REVIEWER" 
                        value={field.value} 
                        onChange={field.onChange} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                <div className="pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="bypassChecklist"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Bypass Checklist
                          </FormLabel>
                          <FormDescription>
                            Skip the standard assessment checklist for urgent or exceptional tasks and allow the auditor to proceed directly to report creation.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

        </form>
      </Form>
    </div>
  )
}
