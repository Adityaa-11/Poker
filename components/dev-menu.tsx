"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Settings, RotateCcw, User, Database, LogOut } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"

export function DevMenu() {
  const [open, setOpen] = useState(false)
  const { clearAllData, currentUser } = usePoker()
  const { user: authUser, signOut } = useAuth()
  
  const handleClearData = () => {
    if (confirm("This will clear all your data and show the onboarding screen. Are you sure?")) {
      clearAllData()
      setOpen(false)
    }
  }

  const handleClearAuth = async () => {
    if (confirm("This will sign you out and clear all authentication state. Are you sure?")) {
      await signOut()
      // Also clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      setOpen(false)
      window.location.reload()
    }
  }

  // Only show in development or if specifically needed
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 right-4 z-50 opacity-50 hover:opacity-100"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Developer Menu</DialogTitle>
          <DialogDescription>
            Testing and development utilities
          </DialogDescription>
        </DialogHeader>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Current User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Poker Context: {currentUser ? `${currentUser.name} (${currentUser.id})` : "No user"}
            </p>
            <p className="text-sm text-muted-foreground">
              Auth Context: {authUser ? `${authUser.name} (${authUser.id})` : "No user"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Authentication
            </CardTitle>
            <CardDescription>
              Clear authentication state and sign out
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleClearAuth}
              variant="outline"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Clear Auth & Sign Out
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Management
            </CardTitle>
            <CardDescription>
              Reset app data to test onboarding flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleClearData}
              variant="destructive"
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear All Data & Reset
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
} 