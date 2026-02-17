"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, DollarSign, CheckCircle, Trash2, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { usePoker } from "@/contexts/poker-context"
import { GameOptInManager } from "@/components/game-opt-in-manager"
import { GameEndManager } from "@/components/game-end-manager"
import { GameTimer } from "@/components/game-timer"
import { supabase } from "@/lib/supabase/client"

export default function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = React.use(params)
  const router = useRouter()
  const { getGameById, getGroupById, getPlayerById, completeGame, getGameSummary, settlements, toggleSettlementPayment, refreshData, hasInitiallyLoaded } = usePoker()
  const [showEndGame, setShowEndGame] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingSettlement, setTogglingSettlement] = useState<string | null>(null)
  
  const game = getGameById(gameId)
  
  if (!game) {
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
          <h1 className="text-2xl font-bold">Game not found</h1>
          <p className="text-muted-foreground">The game you&apos;re looking for doesn&apos;t exist.</p>
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
  const gameSettlements = settlements.filter(s => s.gameId === game.id)

  const handleShowEndGame = () => {
    setShowEndGame(true)
  }

  const handleGameCompleted = () => {
    setShowEndGame(false)
  }

  const handleDeleteGame = async () => {
    if (!confirm("Are you sure you want to cancel this game? This cannot be undone.")) return
    setDeleting(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) return

      const res = await fetch(`/api/games/${gameId}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        refreshData()
        router.push(group ? `/groups/${group.id}` : "/")
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleSettlement = async (settlementId: string) => {
    setTogglingSettlement(settlementId)
    try {
      await toggleSettlementPayment(settlementId)
    } finally {
      setTogglingSettlement(null)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={group ? `/groups/${group.id}` : "/"}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Game Details</h1>
        </div>
        {!game.isCompleted && (
          <Button variant="destructive" size="sm" onClick={handleDeleteGame} disabled={deleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "Cancelling..." : "Cancel Game"}
          </Button>
        )}
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
            {/* Game Timer */}
            <GameTimer
              startTime={game.startTime}
              endTime={game.endTime}
              duration={game.duration}
              isCompleted={game.isCompleted}
            />

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
                            <div>
                              <span className={settlement.isPaid ? "line-through text-muted-foreground" : ""}>
                                {fromPlayer?.name} owes {toPlayer?.name}
                              </span>
                              {settlement.isPaid && (
                                <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 text-xs">Paid</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">${settlement.amount.toFixed(2)}</span>
                            <Button
                              variant={settlement.isPaid ? "default" : "outline"}
                              size="sm"
                              disabled={togglingSettlement === settlement.id}
                              onClick={() => handleToggleSettlement(settlement.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {settlement.isPaid ? "Paid" : "Mark Paid"}
                            </Button>
                          </div>
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
