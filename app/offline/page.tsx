"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-8 w-8 text-slate-600" />
          </div>
          <CardTitle className="text-slate-900">You're Offline</CardTitle>
          <CardDescription>
            No internet connection detected. Some features may not be available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-slate-600">
            Don't worry! You can still:
          </div>
          
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              View your cached poker games
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Check group information
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Review settlement history
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-slate-500">Create new content (when online)</span>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>

          <div className="text-xs text-slate-500 pt-4">
            Your data will sync automatically when you're back online.
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 