"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, DollarSign, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { usePoker } from "@/contexts/poker-context"
import { GameOptInManager } from "@/components/game-opt-in-manager"
import { GameEndManager } from "@/components/game-end-manager"

export default function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = React.use(params)
  const { getGameById, getGroupById, getPlayerById, completeGame, getGameSummary, settlements } = usePoker()
  const [showEndGame, setShowEndGame] = useState(false)
  
  const game = getGameById(gameId)
  
  if (!game) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Game not found</h1>
          <p className="text-muted-foreground">The game you're looking for doesn't exist.</p>
          <Link href="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const group = getGroupById(game.groupId)
  const bankPerson = getPlayerById(game.bankPersonId)
  const gameSummary = getGameSummary(game.id)
  const gameSettlements = settlements.filter(s => s.gameId === game.id && !s.isPaid)

  const handleShowEndGame = () => {
    setShowEndGame(true)
  }

  const handleGameCompleted = () => {
    setShowEndGame(false)
    // Game is now completed, component will re-render with new state
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-2">
        <Link href={group ? `/groups/${group.id}` : "/"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Game Details</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{group?.name}</CardTitle>
              <CardDescription>{new Date(game.date).toLocaleDateString()}</CardDescription>
            </div>
            {!game.isCompleted && game.players.length > 0 && (
              <Button onClick={handleShowEndGame}>
                <CheckCircle className="mr-2 h-4 w-4" />
                End Game
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Game Type</div>
                <div className="font-medium">{game.stakes}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Suggested Buy-in</div>
                <div className="font-medium">${game.defaultBuyIn}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Bank Person</div>
                <div className="font-medium">{bankPerson?.name}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-medium flex items-center">
                  {game.isCompleted ? (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                      Completed
                    </Badge>
                  ) : gameSummary?.isBalanced ? (
                    <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100">
                      Balanced
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-700 hover:bg-red-100">
                      Unbalanced
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {!game.isCompleted && !showEndGame && (
              <GameOptInManager game={game} />
            )}

            {!game.isCompleted && showEndGame && (
              <GameEndManager game={game} onGameCompleted={handleGameCompleted} />
            )}

            {game.isCompleted && gameSettlements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Settlements</CardTitle>
                  <CardDescription>Required payments from this game</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {gameSettlements.map(settlement => {
                      const fromPlayer = getPlayerById(settlement.fromPlayerId)
                      const toPlayer = getPlayerById(settlement.toPlayerId)
                      
                      return (
                        <div key={settlement.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>{fromPlayer?.name} should pay {toPlayer?.name}</div>
                          </div>
                          <div className="font-medium">${settlement.amount.toFixed(2)}</div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
