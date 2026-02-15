"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { CheckCircle, DollarSign, Calculator, AlertTriangle } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { Game } from "@/lib/types"

interface GameEndManagerProps {
  game: Game
  onGameCompleted: () => void
}

export function GameEndManager({ game, onGameCompleted }: GameEndManagerProps) {
  const { getPlayerById, updatePlayerInGame, completeGame } = usePoker()
  const [cashOuts, setCashOuts] = useState<Record<string, string>>({})
  const [isCompleting, setIsCompleting] = useState(false)
  
  // Get all players in the game
  const playersInGame = game.players.map(gp => ({
    player: getPlayerById(gp.playerId),
    gamePlayer: gp
  })).filter(p => p.player !== null)

  const handleCashOutChange = (playerId: string, value: string) => {
    setCashOuts(prev => ({
      ...prev,
      [playerId]: value
    }))
  }

  const calculateTotals = () => {
    // Total money in = initial buy-in + all rebuys
    const totalBuyIn = game.players.reduce((sum, gp) => sum + gp.buyIn + (gp.rebuyAmount || 0), 0)
    const totalCashOut = Object.entries(cashOuts).reduce((sum, [, cashOut]) => {
      const amount = parseFloat(cashOut) || 0
      return sum + amount
    }, 0)
    const difference = totalCashOut - totalBuyIn
    const isBalanced = Math.abs(difference) < 0.01

    return { totalBuyIn, totalCashOut, difference, isBalanced }
  }

  const { totalBuyIn, totalCashOut, difference, isBalanced } = calculateTotals()

  const canComplete = () => {
    // Check that all players have entered their cash-out amounts
    const allCashOutsEntered = game.players.every(gp => {
      const cashOut = cashOuts[gp.playerId]
      return cashOut && parseFloat(cashOut) >= 0
    })
    
    return allCashOutsEntered && isBalanced
  }

  const handleCompleteGame = async () => {
    if (!canComplete()) return

    setIsCompleting(true)
    try {
      // Update all player cash-outs — await each so they're committed before completing
      for (const gamePlayer of game.players) {
        const cashOut = parseFloat(cashOuts[gamePlayer.playerId]) || 0
        await updatePlayerInGame(game.id, gamePlayer.playerId, { cashOut })
      }

      // Now complete the game (generates settlements from committed cash-outs)
      await completeGame(game.id)
      onGameCompleted()
    } catch (error) {
      console.error('Failed to complete game:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          End Game - Enter Final Cash-outs
        </CardTitle>
        <CardDescription>
          All players must enter their final cash-out amounts to complete the game
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Player Cash-out Inputs */}
        <div className="space-y-4">
          {playersInGame.map(({ player, gamePlayer }) => (
            <div key={player!.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <Avatar>
                <AvatarFallback>{player!.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{player!.name}</p>
                <p className="text-sm text-muted-foreground">
                  Buy-in: ${gamePlayer.buyIn}{gamePlayer.rebuyAmount ? ` + $${gamePlayer.rebuyAmount} rebuy` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`cashout-${player!.id}`} className="sr-only">
                  {player!.name} cash-out
                </Label>
                <div className="relative w-32">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={`cashout-${player!.id}`}
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={cashOuts[player!.id] || ''}
                    onChange={(e) => handleCashOutChange(player!.id, e.target.value)}
                    className="pl-10"
                  />
                </div>
                {cashOuts[player!.id] && (() => {
                  const totalIn = gamePlayer.buyIn + (gamePlayer.rebuyAmount || 0)
                  const diff = parseFloat(cashOuts[player!.id]) - totalIn
                  return (
                    <Badge 
                      variant="outline" 
                      className={
                        diff >= 0 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {diff >= 0 ? '+' : ''}${diff.toFixed(2)}
                    </Badge>
                  )
                })()}
              </div>
            </div>
          ))}
        </div>

        {/* Totals Summary */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5" />
              <h3 className="font-semibold">Game Totals</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-muted-foreground">Total Buy-ins</div>
                <div className="font-medium">${totalBuyIn.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Total Cash-outs</div>
                <div className="font-medium">${totalCashOut.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Difference</div>
                <div className={`font-medium ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  {difference >= 0 ? '+' : ''}${difference.toFixed(2)}
                </div>
              </div>
            </div>
            
            {!isBalanced && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Game is not balanced. Total cash-outs must equal total buy-ins to complete the game.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complete Game Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              className="w-full" 
              disabled={!canComplete()}
              size="lg"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Complete Game & Generate Settlements
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Game?</AlertDialogTitle>
              <AlertDialogDescription>
                This will finalize all cash-outs and automatically generate settlements between players. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleCompleteGame}
                disabled={isCompleting}
              >
                {isCompleting ? "Completing..." : "Complete Game"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {!canComplete() && (
          <div className="text-sm text-muted-foreground text-center">
            {!game.players.every(gp => cashOuts[gp.playerId] && parseFloat(cashOuts[gp.playerId]) >= 0) 
              ? "All players must enter their cash-out amounts" 
              : "Game must be balanced to complete"
            }
          </div>
        )}
      </CardContent>
    </Card>
  )
} 