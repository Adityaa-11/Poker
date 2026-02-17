"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Share2, Users, Settings, Play } from "lucide-react"
import { GameHistoryCard } from "@/components/game-history-card"
import { BalanceSummary } from "@/components/balance-summary"
import { CreateGameButton } from "@/components/create-game-button"
import { CreateGroupDialog } from "@/components/create-group-dialog"
import { HelpGuide } from "@/components/help-guide"
import { ThemeToggle } from "@/components/theme-toggle"
import { GameTimer } from "@/components/game-timer"
import { usePoker } from "@/contexts/poker-context"

export default function Dashboard() {
  const { groups, games, currentUser, getPlayerBalance, getGroupById } = usePoker()
  
  const currentUserBalance = currentUser ? getPlayerBalance(currentUser.id) : null
  const activeGames = games.filter(g => !g.isCompleted)

  return (
    <div className="container mx-auto py-6 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            PokerPals
          </h1>
          <p className="text-muted-foreground mt-1">Welcome back, {currentUser?.name || 'Player'}!</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HelpGuide />
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Games Section */}
      {activeGames.length > 0 && (
        <Card className="border-green-500/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-500" />
              Active Games ({activeGames.length})
            </CardTitle>
            <CardDescription>Games currently in progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeGames.map(game => {
              const group = getGroupById(game.groupId)
              return (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{game.stakes} Game</h3>
                        <Badge variant="secondary">{group?.name}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{game.players.length} players</span>
                        <span>${game.defaultBuyIn} buy-in</span>
                      </div>
                    </div>
                    <GameTimer startTime={game.startTime} isCompleted={false} compact />
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Your Groups
            </CardTitle>
            <CardDescription>Manage your poker groups and games</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groups.length > 0 ? (
              groups.map(group => (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <Card className="cursor-pointer hover:bg-muted/30 transition-all duration-200 border-border/50 hover:border-primary/20 hover:shadow-md">
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">{group.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Users className="h-3 w-3" />
                            {group.members.length} members • Created {new Date(group.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0">
                          <Share2 className="h-4 w-4 mr-2" />
                          Invite
                        </Button>
                      </div>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                      <div className="flex items-center justify-between w-full">
                        <div className="text-sm text-muted-foreground">
                          Your balance: 
                          <span className={`font-semibold ml-1 ${currentUserBalance && currentUserBalance.netBalance > 0 ? "text-green-500" : currentUserBalance && currentUserBalance.netBalance < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                            {currentUserBalance ? (currentUserBalance.netBalance > 0 ? "+" : "") + "$" + Math.abs(currentUserBalance.netBalance).toFixed(2) : "$0.00"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Tap to view
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No groups yet</p>
                <p className="text-sm text-muted-foreground/70 mb-6">Create your first poker group to get started</p>
              </div>
            )}

            <CreateGroupDialog />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <BalanceSummary />
          <CreateGameButton />
        </div>
      </div>

      <GameHistoryCard />
    </div>
  )
}
