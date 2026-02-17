"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { GameTimer } from "@/components/game-timer"

export function GameHistoryCard() {
  const { games, currentUser, getGroupById } = usePoker()
  
  // Get recent completed games
  const recentGames = games
    .filter(game => game.isCompleted && game.players.some(p => p.playerId === currentUser?.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Recent Games
        </CardTitle>
        <CardDescription>Your poker game history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentGames.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No completed games yet</p>
              <p className="text-sm text-muted-foreground/70">Start a new game to see your history here</p>
            </div>
          ) : (
            recentGames.map(game => {
              const group = getGroupById(game.groupId)
              const currentPlayerInGame = game.players.find(p => p.playerId === currentUser?.id)
              const profit = currentPlayerInGame?.profit || 0
              
              return (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <div className="flex items-start justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{group?.name}</h3>
                        <Badge variant="secondary" className="text-xs">{game.stakes}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <CalendarDays className="mr-1 h-3 w-3" />
                          {new Date(game.date).toLocaleDateString()}
                        </span>
                        {game.duration && (
                          <GameTimer startTime={game.startTime} duration={game.duration} isCompleted compact />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Players:</span> {game.players.length}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`text-xl font-bold ${profit > 0 ? "text-green-500" : profit < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                        {profit > 0 ? "+" : ""}${Math.abs(profit).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Buy-in: ${currentPlayerInGame?.buyIn || game.defaultBuyIn}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
