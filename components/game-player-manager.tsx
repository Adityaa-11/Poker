"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Edit, Check, X } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { Game, Player } from "@/lib/types"

interface GamePlayerManagerProps {
  game: Game
}

export function GamePlayerManager({ game }: GamePlayerManagerProps) {
  const { players, getPlayerById, addPlayerToGame, updatePlayerInGame, currentUser, groups } = usePoker()
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ buyIn: 0, cashOut: 0 })

  const group = groups.find(g => g.id === game.groupId)
  const availablePlayers = players.filter(p => 
    group?.members.includes(p.id) && 
    !game.players.some(gp => gp.playerId === p.id)
  )

  const handleAddPlayer = () => {
    if (selectedPlayerId) {
      addPlayerToGame(game.id, selectedPlayerId)
      setSelectedPlayerId("")
      setShowAddPlayer(false)
    }
  }

  const startEditing = (playerId: string) => {
    const gamePlayer = game.players.find(p => p.playerId === playerId)
    if (gamePlayer) {
      setEditValues({ buyIn: gamePlayer.buyIn, cashOut: gamePlayer.cashOut })
      setEditingPlayer(playerId)
    }
  }

  const saveEdit = () => {
    if (editingPlayer) {
      updatePlayerInGame(game.id, editingPlayer, editValues)
      setEditingPlayer(null)
    }
  }

  const cancelEdit = () => {
    setEditingPlayer(null)
    setEditValues({ buyIn: 0, cashOut: 0 })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Players</CardTitle>
        {!game.isCompleted && (
          <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Player to Game</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Player</Label>
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a player" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlayers.map(player => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.id === currentUser?.id ? "You" : player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddPlayer} disabled={!selectedPlayerId}>
                  Add Player
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {game.players.map(gamePlayer => {
            const player = getPlayerById(gamePlayer.playerId)
            if (!player) return null

            const isEditing = editingPlayer === player.id
            const displayName = player.id === currentUser?.id ? "You" : player.name

            return (
              <div key={player.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{player.initials}</AvatarFallback>
                  </Avatar>
                  <div className="font-medium">{displayName}</div>
                </div>
                
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Buy-in:</Label>
                      <Input
                        type="number"
                        value={editValues.buyIn}
                        onChange={(e) => setEditValues({...editValues, buyIn: Number(e.target.value)})}
                        className="w-20 h-8"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Cash-out:</Label>
                      <Input
                        type="number"
                        value={editValues.cashOut}
                        onChange={(e) => setEditValues({...editValues, cashOut: Number(e.target.value)})}
                        className="w-20 h-8"
                      />
                    </div>
                    <Button size="sm" variant="ghost" onClick={saveEdit}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="grid grid-cols-3 gap-4 text-right">
                      <div>
                        <div className="text-xs text-muted-foreground">Buy-in</div>
                        <div className="font-medium">${gamePlayer.buyIn}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Cash-out</div>
                        <div className="font-medium">${gamePlayer.cashOut}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Profit</div>
                        <div className={`font-medium ${gamePlayer.profit > 0 ? "text-green-500" : gamePlayer.profit < 0 ? "text-red-500" : ""}`}>
                          {gamePlayer.profit > 0 ? "+" : ""}${gamePlayer.profit}
                        </div>
                      </div>
                    </div>
                    {!game.isCompleted && (
                      <Button size="sm" variant="ghost" onClick={() => startEditing(player.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          
          {game.players.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No players added yet</p>
              <p className="text-sm">Add players to start tracking the game</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 