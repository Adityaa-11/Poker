"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePoker } from "@/contexts/poker-context"
import { useAuth } from "@/contexts/auth-context"
import { isDemoMode, debugDemoData, loadDemoData } from "@/lib/demo-data"
import Link from "next/link"

export default function DebugPage() {
  // Block access in production
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold">Page not available</h1>
        <p className="mt-2 text-muted-foreground">This page is only available in development mode.</p>
        <Link href="/">
          <Button className="mt-6">Back to Home</Button>
        </Link>
      </div>
    )
  }

  return <DebugContent />
}

function DebugContent() {
  const { currentUser, players, games, groups, settlements } = usePoker()
  const { user: authUser } = useAuth()

  const handleReloadDemoData = () => {
    loadDemoData()
    window.location.reload()
  }

  const handleDebugData = () => {
    debugDemoData()
  }

  const handleClearStorage = () => {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Debug Information</h1>
      
      <div className="grid gap-6">
        {/* Demo Mode Status */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Mode Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Is Demo Mode:</strong> {isDemoMode() ? 'Yes' : 'No'}</p>
              <p><strong>Auth User:</strong> {authUser ? `${authUser.name} (${authUser.id})` : 'None'}</p>
              <p><strong>Current User:</strong> {currentUser ? `${currentUser.name} (${currentUser.id})` : 'None'}</p>
              <p><strong>LocalStorage Current User:</strong> {typeof window !== 'undefined' ? localStorage.getItem('poker_current_user') || 'None' : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Data Counts */}
        <Card>
          <CardHeader>
            <CardTitle>Data Counts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">{players.length}</div>
                <div className="text-sm text-muted-foreground">Players</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">{groups.length}</div>
                <div className="text-sm text-muted-foreground">Groups</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">{games.length}</div>
                <div className="text-sm text-muted-foreground">Games</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">{settlements.length}</div>
                <div className="text-sm text-muted-foreground">Settlements</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Data */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">First Group:</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(groups[0], null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold">First Game:</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(games[0], null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold">First Settlement:</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(settlements[0], null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleDebugData}>
                Log Debug Data to Console
              </Button>
              <Button onClick={handleReloadDemoData} variant="outline">
                Reload Demo Data
              </Button>
              <Button onClick={handleClearStorage} variant="destructive">
                Clear All Storage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
