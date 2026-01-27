"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Star, Trophy } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { Game, GamePlayer } from "@/lib/types"

interface MvpSelectorProps {
  game: Game
  onMvpSelected: (mvpId: string) => void
}

export function MvpSelector({ game, onMvpSelected }: MvpSelectorProps) {
  const [selectedMvp, setSelectedMvp] = useState<string>("")
  const [open, setOpen] = useState(false)
  const { getPlayerById } = usePoker()

  const handleSelectMvp = () => {
    if (selectedMvp) {
      onMvpSelected(selectedMvp)
      setOpen(false)
    }
  }

  const handleSkip = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Star className="mr-2 h-4 w-4" />
          Select MVP
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Select MVP of the Night
          </DialogTitle>
          <DialogDescription>
            Choose the player who performed best this session
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={selectedMvp} onValueChange={setSelectedMvp}>
            {game.players
              .map(gamePlayer => ({
                ...gamePlayer,
                player: getPlayerById(gamePlayer.playerId),
                profit: gamePlayer.profit
              }))
              .sort((a, b) => b.profit - a.profit)
              .map((gamePlayer, index) => (
                <div key={gamePlayer.playerId} className="flex items-center space-x-2">
                  <RadioGroupItem value={gamePlayer.playerId} id={gamePlayer.playerId} />
                  <Label 
                    htmlFor={gamePlayer.playerId} 
                    className="flex-1 flex items-center justify-between cursor-pointer p-2 rounded hover:bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <span>{gamePlayer.player?.name}</span>
                      {index === 0 && <Badge variant="secondary" className="text-xs">Suggested</Badge>}
                    </div>
                    <div className={`font-mono text-sm ${gamePlayer.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gamePlayer.profit >= 0 ? '+' : ''}${gamePlayer.profit}
                    </div>
                  </Label>
                </div>
              ))}
          </RadioGroup>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSelectMvp} 
              disabled={!selectedMvp}
              className="flex-1"
            >
              Select MVP
            </Button>
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 