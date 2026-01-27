"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, UserPlus, ArrowLeft } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"

export default function JoinGroupPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = React.use(params)
  const [playerName, setPlayerName] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState("")
  const [remoteGroup, setRemoteGroup] = useState<{ id: string; name: string; inviteCode: string; memberCount: number } | null>(null)
  
  const { groups, currentUser, createNewPlayer, addMemberToGroup } = usePoker()
  const { user: authUser } = useAuth()
  const router = useRouter()
  
  const demo = useMemo(() => isDemoMode(), [])

  // In Supabase mode, the user may not be a member yet, so it won't appear in `groups`.
  // Fetch a public view via API.
  useEffect(() => {
    if (demo) return

    const run = async () => {
      try {
        const res = await fetch(`/api/join/${inviteCode}`)
        if (!res.ok) {
          setRemoteGroup(null)
          return
        }
        const json = (await res.json()) as { group?: { id: string; name: string; inviteCode: string; memberCount: number } }
        setRemoteGroup(json.group ?? null)
      } catch {
        setRemoteGroup(null)
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

      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        setError("Session expired. Please log in again.")
        return
      }

      const res = await fetch(`/api/join/${inviteCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        setError(json.error || "Failed to join group")
        return
      }

      router.push(`/groups/${group.id}`)
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsJoining(false)
    }
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
            <div className="text-sm text-red-500 text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={handleJoinAsNewPlayer} 
              disabled={isJoining || (demo && !currentUser && !playerName.trim()) || (!demo && !authUser)}
              className="w-full"
            >
              {isJoining ? (
                "Joining..."
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join {group.name}
                </>
              )}
            </Button>
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                Not now
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