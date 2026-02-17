"use client"

import Link from "next/link"
import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users, Calendar, Play, LogOut, Pencil, X } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { InviteLinkCard } from "@/components/invite-link-card"
import { GroupLeaderboard } from "@/components/group-leaderboard"
import { GameOptInCard } from "@/components/game-opt-in-card"
import { GameTimer } from "@/components/game-timer"
import { supabase } from "@/lib/supabase/client"

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const router = useRouter()
  const { 
    getGroupById, 
    getGamesByGroupId, 
    getPlayerById, 
    currentUser, 
    players,
    optInToGame,
    addRebuyToGame,
    cashOutFromGame,
    refreshData,
    hasInitiallyLoaded
  } = usePoker()

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [leaving, setLeaving] = useState(false)
  
  const group = getGroupById(groupId)
  
  if (!group) {
    // Still loading initial data -- show a loading skeleton instead of "not found"
    if (!hasInitiallyLoaded) {
      return (
        <div className="container mx-auto py-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
            <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-32 rounded-lg bg-muted animate-pulse" />
            <div className="h-24 rounded-lg bg-muted animate-pulse" />
            <div className="h-24 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      )
    }

    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Group not found</h1>
          <p className="text-muted-foreground">The group you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
          <Link href="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const games = getGamesByGroupId(groupId)
  const activeGames = games.filter(game => !game.isCompleted)
  const completedGames = games.filter(game => game.isCompleted)
  const members = group.members.map(memberId => getPlayerById(memberId)).filter((member): member is NonNullable<typeof member> => member !== null)

  const handleOptIn = (gameId: string, buyIn: number) => {
    if (currentUser) {
      optInToGame(gameId, currentUser.id, buyIn)
    }
  }

  const handleAddRebuy = (gameId: string, rebuyAmount: number) => {
    if (currentUser) {
      addRebuyToGame(gameId, currentUser.id, rebuyAmount)
    }
  }

  const handleCashOut = (gameId: string, cashOutAmount: number) => {
    if (currentUser) {
      cashOutFromGame(gameId, currentUser.id, cashOutAmount)
    }
  }

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group? You can rejoin later with an invite link.")) return
    setLeaving(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) return

      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        refreshData()
        router.push("/")
      } else {
        const json = await res.json().catch(() => null) as { error?: string } | null
        alert(json?.error || "Failed to leave group")
      }
    } catch {
      alert("Failed to leave group")
    } finally {
      setLeaving(false)
    }
  }

  const handleOpenEdit = () => {
    setEditName(group.name)
    setEditDescription(group.description ?? "")
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) return

      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, description: editDescription }),
      })

      if (res.ok) {
        refreshData()
        setShowEditDialog(false)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-muted-foreground">Created {new Date(group.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <Link href={`/games/new?groupId=${groupId}`}>
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Start Game
          </Button>
        </Link>
      </div>

      {/* Edit Group Dialog */}
      {showEditDialog && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Edit Group</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowEditDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input id="group-name" value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-desc">Description (optional)</Label>
              <Input id="group-desc" value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Add a description..." />
            </div>
            <Button onClick={handleSaveEdit} disabled={saving || !editName.trim()}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="invite">Invite</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Active Games */}
          {activeGames.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Active Games</h2>
              {activeGames.map(game => (
                <GameOptInCard
                  key={game.id}
                  game={game}
                  group={group}
                  players={players}
                  onOptIn={handleOptIn}
                  onAddRebuy={handleAddRebuy}
                  onCashOut={handleCashOut}
                />
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.name} {member.id === currentUser?.id && "(You)"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Member since {new Date(group.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {games.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No games yet</p>
                  <p className="text-sm">Create your first game to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {games.slice(0, 5).map((game) => (
                    <Link key={game.id} href={`/games/${game.id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{game.stakes} Game</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{new Date(game.date).toLocaleDateString()} - ${game.defaultBuyIn} buy-in</span>
                            {game.isCompleted && game.duration && (
                              <GameTimer startTime={game.startTime} duration={game.duration} isCompleted compact />
                            )}
                          </div>
                        </div>
                        <Badge variant={game.isCompleted ? 'default' : 'secondary'}>
                          {game.isCompleted ? 'Completed' : 'Active'}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leave Group */}
          <Card className="border-destructive/20">
            <CardContent className="pt-6">
              <Button variant="destructive" className="w-full" onClick={handleLeaveGroup} disabled={leaving}>
                <LogOut className="mr-2 h-4 w-4" />
                {leaving ? "Leaving..." : "Leave Group"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <GroupLeaderboard groupId={groupId} />
        </TabsContent>

        <TabsContent value="games" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Games</h2>
            <Link href={`/games/new?groupId=${groupId}`}>
              <Button>New Game</Button>
            </Link>
          </div>

          {games.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">No games yet</p>
                <p className="text-sm text-muted-foreground mb-4">Create your first game to get started!</p>
                <Link href={`/games/new?groupId=${groupId}`}>
                  <Button>Create Game</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{game.stakes} Game</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{new Date(game.date).toLocaleDateString()}</span>
                            <span>{game.stakes}</span>
                            <span>${game.defaultBuyIn} buy-in</span>
                            <span>{game.players.length} players</span>
                            {game.isCompleted && game.duration && (
                              <GameTimer startTime={game.startTime} duration={game.duration} isCompleted compact />
                            )}
                          </div>
                        </div>
                        <Badge variant={game.isCompleted ? 'default' : 'secondary'}>
                          {game.isCompleted ? 'Completed' : 'Active'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invite" className="space-y-6">
          <InviteLinkCard group={group} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
