"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Bell, Shield, Key, Building2, HardDrive, Smartphone, Monitor } from "lucide-react"

const sidebarNavItems = [
  { title: "Profile", icon: User, id: "profile" },
  { title: "Account & Security", icon: Key, id: "security" },
  { title: "Notifications", icon: Bell, id: "notifications" },
  { title: "Organization", icon: Building2, id: "organization" },
  { title: "Data & Storage", icon: HardDrive, id: "storage" },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Separator className="bg-border/50" />

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Settings Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-4 md:pb-0">
            {sidebarNavItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                            ${isActive 
                                ? "bg-primary/10 text-primary" 
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                            }
                        `}
                    >
                        <Icon className="h-4 w-4" />
                        {item.title}
                    </button>
                )
            })}
          </nav>
        </aside>

        {/* Settings Content */}
        <div className="flex-1 max-w-3xl flex flex-col gap-6">
            
            {activeTab === "profile" && (
                <>
                    <Card className="bg-card border-border/50 shadow-sm rounded-xl">
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>
                                Manage your public profile and avatar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6">
                                <Avatar className="h-20 w-20 ring-1 ring-border/50">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xl">JD</AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="bg-background shadow-sm border-border">Change avatar</Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">Remove</Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Recommended size: 400x400px</p>
                                </div>
                            </div>
                            
                            <Separator className="bg-border/50" />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">First name</label>
                                    <Input defaultValue="John" className="bg-background border-border shadow-sm focus-visible:ring-1 focus-visible:ring-primary" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Last name</label>
                                    <Input defaultValue="Doe" className="bg-background border-border shadow-sm focus-visible:ring-1 focus-visible:ring-primary" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Job Title</label>
                                <Input defaultValue="Senior Penetration Tester" className="bg-background border-border shadow-sm focus-visible:ring-1 focus-visible:ring-primary" />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-secondary/30 border-t border-border/50 py-4 px-6 flex justify-between items-center rounded-b-xl">
                            <span className="text-xs text-muted-foreground">Your profile is visible to other members of your organization.</span>
                            <Button>Save changes</Button>
                        </CardFooter>
                    </Card>
                </>
            )}

            {activeTab === "security" && (
                <>
                    <Card className="bg-card border-border/50 shadow-sm rounded-xl">
                        <CardHeader>
                            <CardTitle>Email Address</CardTitle>
                            <CardDescription>
                                The email address associated with your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                <Input defaultValue="john.doe@corpnet.com" readOnly className="bg-secondary/50 border-border text-muted-foreground focus-visible:ring-0 cursor-not-allowed" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border/50 shadow-sm rounded-xl">
                        <CardHeader>
                            <CardTitle>Two-Factor Authentication</CardTitle>
                            <CardDescription>
                                Add an extra layer of security to your account using an authenticator app.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-background/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                        <Smartphone className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Authenticator App</p>
                                        <p className="text-xs text-muted-foreground">Not configured</p>
                                    </div>
                                </div>
                                <Button variant="outline" className="shadow-sm border-border">Enable 2FA</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-destructive/20 shadow-sm rounded-xl">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>
                                Permanently delete your account and remove access to all organizations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 shadow-sm">Delete Account</Button>
                        </CardContent>
                    </Card>
                </>
            )}

            {activeTab === "notifications" && (
                <>
                    <Card className="bg-card border-border/50 shadow-sm rounded-xl">
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>
                                Choose what you want to be notified about and how.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <label className="text-sm font-medium">New Project Assigned</label>
                                        <p className="text-xs text-muted-foreground">Receive an email when you are assigned to a new assessment.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <Separator className="bg-border/50" />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <label className="text-sm font-medium">Review Requested</label>
                                        <p className="text-xs text-muted-foreground">Receive an email when a finding requires your review.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <Separator className="bg-border/50" />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <label className="text-sm font-medium">Weekly Digest</label>
                                        <p className="text-xs text-muted-foreground">A weekly summary of vulnerability trends across your organization.</p>
                                    </div>
                                    <Switch />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
      </div>
    </div>
  )
}
