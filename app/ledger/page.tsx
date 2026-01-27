"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Users, DollarSign, CheckCircle, AlertCircle } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { useAuth } from "@/contexts/auth-context"

export default function LedgerPage() {
  const { user: authUser } = useAuth()
  const { games, groups, getGroupById, getPlayerPaymentStatus } = usePoker()

  if (!authUser) return null

  // Get completed games that the user participated in
  const userGames = games.filter(game => 
    game.isCompleted && 
    game.players.some(p => p.playerId === authUser.id)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Check if a game is balanced (all players with non-zero profit have been marked as paid)
  const isGameBalanced = (gameId: string) => {
    const game = games.find(g => g.id === gameId)
    if (!game) return false
    
    // Check if all players with non-zero profit have been marked as paid
    const playersWithProfit = game.players.filter(p => p.profit !== 0)
    return playersWithProfit.every(p => getPlayerPaymentStatus(gameId, p.playerId))
  }

  // Filter games by balance status
  const allGames = userGames
  const unbalancedGames = userGames.filter(game => !isGameBalanced(game.id))
  const balancedGames = userGames.filter(game => isGameBalanced(game.id))

  // Game list component
  const GamesList = ({ games, emptyMessage }: { games: typeof userGames, emptyMessage: string }) => (
    <>
      {games.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground">
            {emptyMessage.includes('No') ? 'Complete some games to see them here' : 'All games are settled up!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map(game => {
            const group = getGroupById(game.groupId)
            const isBalanced = isGameBalanced(game.id)
            const userPlayer = game.players.find(p => p.playerId === authUser.id)
            const userProfit = userPlayer?.profit || 0

            return (
              <Link key={game.id} href={`/ledger/${game.id}`}>
                <Card className="cursor-pointer hover:bg-muted/30 transition-all duration-200 border-border/50 hover:border-primary/20 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{game.stakes} Game</h3>
                          <Badge 
                            variant={isBalanced ? "default" : "destructive"}
                            className={`flex items-center gap-1 ${
                              isBalanced 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {isBalanced ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {isBalanced ? "Balanced" : "Unbalanced"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(game.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {game.players.length} players
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {group?.name || 'Unknown Group'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          userProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {userProfit >= 0 ? '+' : ''}${userProfit.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Your result
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Game Ledger
          </h1>
          <p className="text-muted-foreground mt-1">Track payments for all your completed games</p>
        </div>
      </div>

      {/* Games List with Tabs */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Game Ledger
          </CardTitle>
          <CardDescription>
            Click on any game to view the payment ledger
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                All Games ({allGames.length})
              </TabsTrigger>
              <TabsTrigger value="unbalanced" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Unbalanced ({unbalancedGames.length})
              </TabsTrigger>
              <TabsTrigger value="balanced" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Balanced ({balancedGames.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              <GamesList games={allGames} emptyMessage="No Completed Games" />
            </TabsContent>
            
            <TabsContent value="unbalanced" className="mt-6">
              <GamesList games={unbalancedGames} emptyMessage="No Unbalanced Games" />
            </TabsContent>
            
            <TabsContent value="balanced" className="mt-6">
              <GamesList games={balancedGames} emptyMessage="No Balanced Games" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
