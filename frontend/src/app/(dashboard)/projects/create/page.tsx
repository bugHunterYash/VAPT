"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const projectFormSchema = z.object({
  name: z.string().min(2),
  organization_id: z.string(),
  application_url: z.string().url().optional(),
  assessment_type: z.string(),
  environment: z.string(),
})

export default function CreateProjectPage() {
  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      organization_id: "1",
      application_url: "",
      assessment_type: "Web API",
      environment: "Production",
    },
  })

  function onSubmit(values: z.infer<typeof projectFormSchema>) {
    console.log(values)
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
            <p className="text-muted-foreground">Start a new VAPT assessment project.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={form.handleSubmit(onSubmit)} className="gap-2">
            <Save className="h-4 w-4" /> Create
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Basic information for the assessment.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Q3 CorpNet Audit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="application_url"
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
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="assessment_type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assessment Type</FormLabel>
                        <FormControl>
                            <Input placeholder="Web, Mobile, Network" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="environment"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Environment</FormLabel>
                        <FormControl>
                            <Input placeholder="Staging, Prod" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
