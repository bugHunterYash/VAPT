"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Sparkles, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

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

const findingFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  project_id: z.string().min(1, { message: "Project is required." }),
  severity: z.string(),
  category: z.string(),
  description: z.string().optional(),
  mitigation: z.string().optional(),
})

export default function CreateFindingPage() {
  const form = useForm<z.infer<typeof findingFormSchema>>({
    resolver: zodResolver(findingFormSchema),
    defaultValues: {
      title: "",
      project_id: "",
      severity: "Medium",
      category: "",
      description: "",
      mitigation: "",
    },
  })

  function onSubmit(values: z.infer<typeof findingFormSchema>) {
    console.log(values)
    // API call will go here
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-4">
          <Link href="/findings">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Add New Finding</h2>
            <p className="text-muted-foreground">
              Create a new vulnerability finding. AI assistance is available.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="secondary" 
            className="gap-2 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 hover:text-indigo-600 border-indigo-200"
            onClick={async (e) => {
              e.preventDefault();
              const title = form.getValues("title");
              const category = form.getValues("category");
              if (!title || !category) {
                toast.error("Please fill in Title and Category first.");
                return;
              }
              try {
                // Call FastAPI AI router
                const res = await fetch("http://localhost:8000/api/v1/ai/generate-finding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title, category })
                });
                if (res.ok) {
                  const data = await res.json();
                  form.setValue("description", data.description);
                  form.setValue("mitigation", data.mitigation);
                } else {
                  console.error("AI generation failed");
                  toast.error("AI generation failed. Ensure backend and Ollama are running.");
                }
              } catch (err) {
                console.error(err);
                toast.error("AI generation failed. Ensure backend and Ollama are running.");
              }
            }}
          >
            <Sparkles className="h-4 w-4" /> Auto-Generate (AI)
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} className="gap-2">
            <Save className="h-4 w-4" /> Save Finding
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core details about the vulnerability.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vulnerability Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Stored XSS in Profile Page" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Severity</FormLabel>
                        <FormControl>
                            <Input placeholder="High" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                            <Input placeholder="Cross-Site Scripting" {...field} />
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
        
        <Card>
          <CardHeader>
            <CardTitle>Details & AI Generation</CardTitle>
            <CardDescription>Click Auto-Generate to fill these using local AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
                  <textarea 
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                    placeholder="Vulnerability description will appear here..."
                    value={form.watch("description")}
                    onChange={e => form.setValue("description", e.target.value)}
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Mitigation</label>
                  <textarea 
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                    placeholder="Suggested mitigation will appear here..."
                    value={form.watch("mitigation")}
                    onChange={e => form.setValue("mitigation", e.target.value)}
                  />
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
