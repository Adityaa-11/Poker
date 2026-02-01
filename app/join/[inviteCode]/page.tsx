"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, UserPlus, ArrowLeft, LogIn, Loader2 } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"

export default function JoinGroupPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode: rawInviteCode } = React.use(params)
  // Normalize the invite code to avoid case/encoding issues
  const inviteCode = decodeURIComponent(rawInviteCode).toUpperCase().trim()
  
  const [playerName, setPlayerName] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [isLoadingGroup, setIsLoadingGroup] = useState(true)
  const [error, setError] = useState("")
  const [remoteGroup, setRemoteGroup] = useState<{ id: string; name: string; inviteCode: string; memberCount: number } | null>(null)
  
  const { groups, currentUser, createNewPlayer, addMemberToGroup } = usePoker()
  const { user: authUser, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const demo = useMemo(() => isDemoMode(), [])
  
  // Debug logging
  useEffect(() => {
    console.log('[JOIN PAGE] Raw invite code from URL:', rawInviteCode)
    console.log('[JOIN PAGE] Normalized invite code:', inviteCode)
  }, [rawInviteCode, inviteCode])

  // In Supabase mode, the user may not be a member yet, so it won't appear in `groups`.
  // Fetch a public view via API.
  useEffect(() => {
    if (demo) {
      setIsLoadingGroup(false)
      return
    }

    const run = async () => {
      setIsLoadingGroup(true)
      console.log('[JOIN PAGE] Fetching group info for code:', inviteCode)
      try {
        const res = await fetch(`/api/join/${encodeURIComponent(inviteCode)}`)
        console.log('[JOIN PAGE] GET response status:', res.status)
        if (!res.ok) {
          const errorJson = await res.json().catch(() => ({}))
          console.error('[JOIN PAGE] GET error:', errorJson)
          setRemoteGroup(null)
          return
        }
        const json = (await res.json()) as { group?: { id: string; name: string; inviteCode: string; memberCount: number } }
        console.log('[JOIN PAGE] GET success, group:', json.group)
        setRemoteGroup(json.group ?? null)
      } catch (err) {
        console.error('[JOIN PAGE] GET exception:', err)
        setRemoteGroup(null)
      } finally {
        setIsLoadingGroup(false)
      }
    }

    run()
  }, [demo, inviteCode])

  // Find the group depending on mode
  const group = demo
    ? groups.find(g => g.inviteCode.toLowerCase() === inviteCode.toLowerCase())
    : remoteGroup
  
  // Check if current user is already a member
  const isCurrentUserMember = demo
    ? (currentUser && group ? (group as any).members.includes(currentUser.id) : false)
    : (!!authUser && !!currentUser && !!group && (groups.find(g => g.id === group.id)?.members.includes(currentUser.id) ?? false))
  
  useEffect(() => {
    if (currentUser && playerName === "") {
      setPlayerName(currentUser.name)
    }
  }, [currentUser, playerName])

  const handleJoinAsNewPlayer = async () => {
    setIsJoining(true)
    setError("")

    try {
      if (!group) {
        setError("Invalid invite link")
        return
      }

      if (demo) {
        if (!playerName.trim()) {
          setError("Please enter your name")
          return
        }

        const player = createNewPlayer(playerName.trim())
        const success = addMemberToGroup(group.id, player.id)
        if (success) {
          router.push(`/groups/${group.id}`)
        } else {
          setError("Failed to join group")
        }
        return
      }

      // Supabase mode: require authentication, then join via API.
      if (!authUser) {
        setError("Please log in to join this group")
        return
      }

      // Get fresh session - important after recent login
      const { data, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        setError("Session error. Please try refreshing the page.")
        return
      }
      
      const token = data.session?.access_token
      if (!token) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError || !refreshData.session?.access_token) {
          setError("Session expired. Please log in again.")
          return
        }
        // Use the refreshed token
        const freshToken = refreshData.session.access_token
        
        console.log('[JOIN PAGE] POST (refreshed token) to code:', inviteCode)
        const res = await fetch(`/api/join/${encodeURIComponent(inviteCode)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${freshToken}`,
          },
        })

        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string }
          setError(json.error || "Failed to join group")
          return
        }

        router.push(`/groups/${group.id}`)
        return
      }

      console.log('[JOIN PAGE] POST to code:', inviteCode)
      const res = await fetch(`/api/join/${encodeURIComponent(inviteCode)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
      })
      
      console.log('[JOIN PAGE] POST response status:', res.status)

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string; debug?: any }
        console.error('[JOIN PAGE] POST error:', json)
        setError(json.error || "Failed to join group")
        return
      }

      const successJson = await res.json().catch(() => ({}))
      console.log('[JOIN PAGE] POST success:', successJson)
      router.push(`/groups/${group.id}`)
    } catch (err) {
      console.error('[JOIN PAGE] Join error:', err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsJoining(false)
    }
  }

  // Show loading state while fetching group info
  if (isLoadingGroup || authLoading) {
    return (
      <div className="container mx-auto py-6 max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Join Group</h1>
        </div>
        
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading group information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="container mx-auto py-6 max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Join Group</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Invalid Invite</CardTitle>
            <CardDescription className="text-center">
              This invitation link is not valid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isCurrentUserMember) {
    return (
      <div className="container mx-auto py-6 max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Join Group</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Already a Member!</CardTitle>
            <CardDescription className="text-center">
              You're already part of {group.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Link href={`/groups/${group.id}`}>
              <Button className="w-full">View Group</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-md">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Join Group</h1>
      </div>
      
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>{group.name}</CardTitle>
          <CardDescription>
            Join this poker group to track games together
          </CardDescription>
          <div className="text-sm text-muted-foreground mt-2">
            {demo ? (group as any).members.length : (group as any).memberCount} member{(demo ? (group as any).members.length : (group as any).memberCount) !== 1 ? 's' : ''}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {demo && !currentUser && (
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-500 text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
              {error}
            </div>
          )}
          
          {/* Show login prompt if not authenticated in Supabase mode */}
          {!demo && !authUser && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 mb-2">
                <LogIn className="h-4 w-4" />
                <span className="font-medium">Login Required</span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                You need to log in or create an account to join this group.
              </p>
              <Link href="/">
                <Button className="w-full" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Go to Login
                </Button>
              </Link>
            </div>
          )}
          
          <div className="space-y-2">
            {(demo || authUser) && (
              <Button 
                onClick={handleJoinAsNewPlayer} 
                disabled={isJoining || (demo && !currentUser && !playerName.trim())}
                className="w-full"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join {group.name}
                  </>
                )}
              </Button>
            )}
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                {!demo && !authUser ? "Cancel" : "Not now"}
              </Button>
            </Link>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            By joining, you'll be able to participate in poker games and track your winnings with this group.
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 