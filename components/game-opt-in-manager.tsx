"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, UserMinus, DollarSign, Users } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { Game, Player } from "@/lib/types"

interface GameOptInManagerProps {
  game: Game
}

export function GameOptInManager({ game }: GameOptInManagerProps) {
  const { getPlayerById, getGroupById, currentUser, addPlayerToGame, removePlayerFromGame } = usePoker()
  const [buyIn, setBuyIn] = useState(game.defaultBuyIn.toString())
  const [isJoining, setIsJoining] = useState(false)
  
  const group = getGroupById(game.groupId)
  const groupMembers = group?.members.map(id => getPlayerById(id)).filter((p): p is Player => p !== null) || []
  const playersInGame = game.players.map(gp => ({
    player: getPlayerById(gp.playerId),
    gamePlayer: gp
  })).filter(p => p.player !== null)
  
  const availableMembers = groupMembers.filter(member => 
    !game.players.some(gp => gp.playerId === member.id)
  )
  
  const currentUserInGame = game.players.find(gp => gp.playerId === currentUser?.id)
  const canJoin = currentUser && !currentUserInGame && availableMembers.some(m => m.id === currentUser.id)
  const canLeave = currentUserInGame && !game.isCompleted

  const handleOptIn = async () => {
    if (!currentUser || !canJoin) return
    
    setIsJoining(true)
    try {
      const success = await addPlayerToGame(game.id, currentUser.id, parseInt(buyIn))
      if (success) {
        setBuyIn(game.defaultBuyIn.toString())
      }
    } catch (error) {
      console.error('Failed to join game:', error)
    } finally {
      setIsJoining(false)
    }
  }

  const handleOptOut = () => {
    if (!currentUser || !currentUserInGame) return
    
    removePlayerFromGame(game.id, currentUser.id)
  }

  return (
    <div className="space-y-6">
      {/* Current Players */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Players in Game ({playersInGame.length})
          </CardTitle>
          <CardDescription>
            Players currently participating in this game
          </CardDescription>
        </CardHeader>
        <CardContent>
          {playersInGame.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No players have joined yet</p>
              <p className="text-sm">Be the first to opt in!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {playersInGame.map(({ player, gamePlayer }) => (
                <div key={player!.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{player!.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {player!.name} {player!.id === currentUser?.id && "(You)"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Buy-in: ${gamePlayer.buyIn}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {gamePlayer.cashOut > 0 ? (
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        Cash-out: ${gamePlayer.cashOut}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Playing
                      </Badge>
                    )}
                    {player!.id === currentUser?.id && canLeave && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOptOut}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Leave
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Opt In Section */}
      {canJoin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Join Game
            </CardTitle>
            <CardDescription>
              Enter your buy-in amount to join this poker game
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="buy-in">Your buy-in amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="buy-in"
                  type="number"
                  placeholder="200"
                  value={buyIn}
                  onChange={(e) => setBuyIn(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button 
              onClick={handleOptIn}
              disabled={isJoining || !buyIn || parseInt(buyIn) <= 0}
              className="w-full"
            >
              {isJoining ? "Joining..." : `Join with $${buyIn}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Available Members */}
      {availableMembers.length > 0 && availableMembers.length > (canJoin ? 1 : 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Available Members</CardTitle>
            <CardDescription>
              Group members who can still join this game
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableMembers.filter(member => member.id !== currentUser?.id).map(member => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member.name}</span>
                  <Badge variant="outline" className="ml-auto">
                    Available
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 