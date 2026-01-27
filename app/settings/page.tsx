"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Shield, 
  Database, 
  HelpCircle, 
  LogOut,
  Download,
  Upload,
  Trash2,
  Moon,
  Sun,
  Smartphone,
  Globe,
  CreditCard,
  Star,
  MessageSquare,
  Bug,
  Info
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { usePoker } from "@/contexts/poker-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { isDemoMode } from "@/lib/demo-data"
import { supabase } from "@/lib/supabase/client"

export default function SettingsPage() {
  const { user: authUser, signOut, refreshUser } = useAuth()
  const { currentUser, clearAllData } = usePoker()
  const [activeTab, setActiveTab] = useState("profile")
  const [displayName, setDisplayName] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    setDisplayName(currentUser?.name || authUser?.name || "")
  }, [authUser?.name, currentUser?.name])

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await signOut()
    }
  }

  const handleClearData = () => {
    if (confirm("This will permanently delete all your data. This action cannot be undone. Are you sure?")) {
      clearAllData()
    }
  }

  const handleExportData = () => {
    // TODO: Implement data export
    alert("Data export feature coming soon!")
  }

  const handleImportData = () => {
    // TODO: Implement data import
    alert("Data import feature coming soon!")
  }

  const handleSaveProfile = async () => {
    if (isDemoMode()) return
    setProfileError(null)

    const nextName = displayName.trim()
    if (nextName.length < 2) {
      setProfileError("Display name must be at least 2 characters.")
      return
    }

    try {
      setSavingProfile(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        setProfileError("Not authenticated. Please sign out and sign back in.")
        return
      }

      const res = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: nextName }),
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null
        setProfileError(json?.error || "Failed to save changes.")
        return
      }

      await refreshUser()
    } catch {
      setProfileError("Failed to save changes.")
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="support" className="hidden lg:flex">Support</TabsTrigger>
          <TabsTrigger value="about" className="hidden lg:flex">About</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture & Basic Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-lg">
                    {currentUser?.initials || authUser?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {currentUser?.name || authUser?.name || "User"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {authUser?.email || "No email"}
                  </p>
                  {isDemoMode() && (
                    <Badge variant="secondary" className="text-xs">
                      🎮 Demo Account
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Edit Profile Form */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isDemoMode()}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="Enter your email"
                    defaultValue={authUser?.email || ""}
                    disabled={isDemoMode()}
                  />
                </div>
                {profileError && (
                  <p className="text-sm text-destructive">{profileError}</p>
                )}
                <Button disabled={isDemoMode() || savingProfile} onClick={handleSaveProfile}>
                  {isDemoMode()
                    ? "Demo Mode - Changes Disabled"
                    : savingProfile
                      ? "Saving..."
                      : "Save Changes"}
                </Button>
              </div>

              <Separator />

              {/* Theme Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Appearance</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred theme
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Game Invitations</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone invites you to a game
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Reminders for outstanding payments
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Game Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Real-time updates during active games
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Summary</Label>
                    <p className="text-sm text-muted-foreground">
                      Weekly summary of your poker activity
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable push notifications on mobile devices
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Manage your privacy settings and account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your profile and stats
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Game History Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Show your game history to group members
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Analytics Tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve the app with anonymous usage data
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Account Security</h4>
                <Button variant="outline" className="w-full" disabled={isDemoMode()}>
                  Change Password
                </Button>
                <Button variant="outline" className="w-full" disabled={isDemoMode()}>
                  Enable Two-Factor Authentication
                </Button>
                <Button variant="outline" className="w-full" disabled={isDemoMode()}>
                  Download Account Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Import, export, and manage your poker data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleExportData}
                  disabled={isDemoMode()}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export All Data
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleImportData}
                  disabled={isDemoMode()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={handleClearData}
                  disabled={isDemoMode()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDemoMode() ? "Demo Mode - Cannot Clear Data" : "Clear All Data"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Help & Support
              </CardTitle>
              <CardDescription>
                Get help and contact support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Bug className="mr-2 h-4 w-4" />
                Report a Bug
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Star className="mr-2 h-4 w-4" />
                Rate the App
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Globe className="mr-2 h-4 w-4" />
                Visit Website
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                About PokerPals
              </CardTitle>
              <CardDescription>
                App information and legal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm"><strong>Version:</strong> 1.0.0</p>
                <p className="text-sm"><strong>Build:</strong> 2024.1.0</p>
                <p className="text-sm"><strong>Last Updated:</strong> January 2024</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                  Privacy Policy
                </Button>
                <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                  Terms of Service
                </Button>
                <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                  Open Source Licenses
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sign Out Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
