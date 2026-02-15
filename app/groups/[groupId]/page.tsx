"use client"

import Link from "next/link"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Users, Calendar, Copy, Share2, Check } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { InviteLinkCard } from "@/components/invite-link-card"
import { GroupLeaderboard } from "@/components/group-leaderboard"
import { GameOptInCard } from "@/components/game-opt-in-card"

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const { 
    getGroupById, 
    getGamesByGroupId, 
    getPlayerById, 
    currentUser, 
    players,
    optInToGame,
    addRebuyToGame,
    cashOutFromGame
  } = usePoker()
  
  const group = getGroupById(groupId)
  
  if (!group) {
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground">Created {new Date(group.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

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
                          <p className="text-sm text-muted-foreground">
                            {new Date(game.date).toLocaleDateString()} • ${game.defaultBuyIn} buy-in
                          </p>
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
