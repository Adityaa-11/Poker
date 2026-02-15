"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Users, 
  DollarSign, 
  Clock, 
  Plus, 
  Check, 
  X,
  AlertCircle,
  TrendingUp
} from "lucide-react"
import { Game, Player } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { usePoker } from "@/contexts/poker-context"

interface GameOptInCardProps {
  game: Game
  group: { id: string; name: string; members: string[] }
  players: Player[]
  onOptIn: (gameId: string, buyIn: number) => void
  onAddRebuy: (gameId: string, rebuyAmount: number) => void
  onCashOut: (gameId: string, cashOutAmount: number) => void
}

export function GameOptInCard({ 
  game, 
  group, 
  players, 
  onOptIn, 
  onAddRebuy, 
  onCashOut 
}: GameOptInCardProps) {
  const { user: authUser } = useAuth()
  const [buyInAmount, setBuyInAmount] = useState(game.defaultBuyIn.toString())
  const [rebuyAmount, setRebuyAmount] = useState("")
  const [cashOutAmount, setCashOutAmount] = useState("")
  const [showOptIn, setShowOptIn] = useState(false)
  const [showRebuy, setShowRebuy] = useState(false)
  const [showCashOut, setShowCashOut] = useState(false)

  if (!authUser) return null

  // Check if current user has opted in
  const currentPlayerInGame = game.players.find(p => p.playerId === authUser.id)
  const hasOptedIn = currentPlayerInGame?.hasOptedIn || false
  const hasCashedOut = currentPlayerInGame?.hasCashedOut || false

  // Get participating players
  const participatingPlayers = game.players.filter(p => p.hasOptedIn && !p.hasCashedOut)
  const cashedOutPlayers = game.players.filter(p => p.hasCashedOut)

  // Calculate current investment for user
  const currentInvestment = currentPlayerInGame 
    ? currentPlayerInGame.buyIn + (currentPlayerInGame.rebuyAmount || 0)
    : 0

  const handleOptIn = () => {
    const amount = parseFloat(buyInAmount)
    if (amount > 0) {
      onOptIn(game.id, amount)
      setShowOptIn(false)
    }
  }

  const handleRebuy = () => {
    const amount = parseFloat(rebuyAmount)
    if (amount > 0) {
      onAddRebuy(game.id, amount)
      setRebuyAmount("")
      setShowRebuy(false)
    }
  }

  const handleCashOut = () => {
    const amount = parseFloat(cashOutAmount)
    if (amount >= 0) {
      onCashOut(game.id, amount)
      setCashOutAmount("")
      setShowCashOut(false)
    }
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>{game.stakes} Game</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {group.name}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(game.date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ${game.defaultBuyIn} buy-in
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Game Status */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-medium">Game Status</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {participatingPlayers.length} playing • {cashedOutPlayers.length} cashed out
          </div>
        </div>

        {/* Current Players */}
        {participatingPlayers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Players</Label>
            <div className="flex flex-wrap gap-2">
              {participatingPlayers.map(gamePlayer => {
                const player = players.find(p => p.id === gamePlayer.playerId)
                if (!player) return null
                
                return (
                  <div key={player.id} className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{player.initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{player.name}</span>
                    <Badge variant="outline" className="text-xs">
                      ${gamePlayer.buyIn + (gamePlayer.rebuyAmount || 0)}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* User Actions */}
        {!hasOptedIn && !hasCashedOut && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">You haven't joined this game yet</span>
            </div>
            
            {!showOptIn ? (
              <Button 
                onClick={() => setShowOptIn(true)}
                className="w-full"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Join Game
              </Button>
            ) : (
              <div className="space-y-3 p-4 border rounded-lg">
                <Label htmlFor="buyIn">Buy-in Amount</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="buyIn"
                      type="number"
                      min={1}
                      placeholder="0"
                      value={buyInAmount}
                      onChange={(e) => setBuyInAmount(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleOptIn} disabled={!buyInAmount || parseFloat(buyInAmount) <= 0}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setShowOptIn(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Suggested: ${game.defaultBuyIn}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Active Player Actions */}
        {hasOptedIn && !hasCashedOut && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  You're in the game!
                </span>
              </div>
              <Badge variant="outline" className="text-green-700 dark:text-green-300 border-green-300">
                ${currentInvestment} invested
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Add Rebuy */}
              {!showRebuy ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowRebuy(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Rebuy
                </Button>
              ) : (
                <div className="col-span-2 space-y-2 p-3 border rounded-lg">
                  <Label htmlFor="rebuy">Rebuy Amount</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="rebuy"
                        type="number"
                        min={1}
                        placeholder="0"
                        value={rebuyAmount}
                        onChange={(e) => setRebuyAmount(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button onClick={handleRebuy} disabled={!rebuyAmount || parseFloat(rebuyAmount) <= 0}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setShowRebuy(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Cash Out */}
              {!showCashOut ? (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowCashOut(true)}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Cash Out
                </Button>
              ) : (
                <div className="col-span-2 space-y-2 p-3 border rounded-lg">
                  <Label htmlFor="cashOut">Cash Out Amount</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cashOut"
                        type="number"
                        min={0}
                        placeholder="0"
                        value={cashOutAmount}
                        onChange={(e) => setCashOutAmount(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button onClick={handleCashOut} disabled={cashOutAmount === ""}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setShowCashOut(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You invested ${currentInvestment}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cashed Out Status */}
        {hasCashedOut && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                You've cashed out of this game
              </span>
            </div>
            {currentPlayerInGame && (
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                Final result: {currentPlayerInGame.profit >= 0 ? '+' : ''}${currentPlayerInGame.profit}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
