"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, Users, DollarSign, CheckCircle, AlertCircle } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { useAuth } from "@/contexts/auth-context"

interface PlayerLedgerEntry {
  playerId: string
  playerName: string
  playerInitials: string
  buyIn: number
  cashOut: number
  profit: number
  totalInvested: number
  isPaid: boolean
}

export default function GameLedgerPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const { user: authUser } = useAuth()
  const { 
    games, 
    groups, 
    getGroupById, 
    getPlayerById, 
    togglePlayerPayment,
    getPlayerPaymentStatus,
    hasInitiallyLoaded
  } = usePoker()

  const [ledgerEntries, setLedgerEntries] = useState<PlayerLedgerEntry[]>([])

  const game = games.find(g => g.id === gameId)
  const group = game ? getGroupById(game.groupId) : null

  useEffect(() => {
    if (!game || !authUser) return

    // Create ledger entries for all players
    const entries: PlayerLedgerEntry[] = game.players.map(gamePlayer => {
      const player = getPlayerById(gamePlayer.playerId)
      const totalInvested = gamePlayer.buyIn + (gamePlayer.rebuyAmount || 0)
      
      // Get individual payment status for this player
      const isPaid = getPlayerPaymentStatus(gameId, gamePlayer.playerId)

      return {
        playerId: gamePlayer.playerId,
        playerName: player?.name || 'Unknown Player',
        playerInitials: player?.initials || '??',
        buyIn: gamePlayer.buyIn,
        cashOut: gamePlayer.cashOut,
        profit: gamePlayer.profit,
        totalInvested,
        isPaid
      }
    })

    // Sort: unpaid first, then paid
    const sortedEntries = entries.sort((a, b) => {
      if (a.isPaid === b.isPaid) {
        // If same payment status, sort by profit (biggest loss first for unpaid)
        return a.isPaid ? b.profit - a.profit : a.profit - b.profit
      }
      return a.isPaid ? 1 : -1 // Unpaid first
    })

    setLedgerEntries(sortedEntries)
  }, [game, gameId, authUser, getPlayerById, getPlayerPaymentStatus])

  const handlePaymentToggle = (entry: PlayerLedgerEntry) => {
    togglePlayerPayment(gameId, entry.playerId)
  }

  if (!game || !group) {
    if (!hasInitiallyLoaded) {
      return (
        <div className="container mx-auto py-6 px-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
            <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-32 rounded-lg bg-muted animate-pulse" />
            <div className="h-24 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      )
    }

    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Game Not Found</h1>
          <Link href="/ledger">
            <Button className="mt-4">Back to Ledger</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isGameBalanced = ledgerEntries.every(entry => entry.isPaid || entry.profit === 0)
  const unpaidCount = ledgerEntries.filter(entry => !entry.isPaid && entry.profit !== 0).length

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/ledger">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Game Ledger
          </h1>
          <p className="text-muted-foreground mt-1">
            {game.stakes} • {group.name} • {new Date(game.date).toLocaleDateString()}
          </p>
        </div>
        <Badge 
          variant={isGameBalanced ? "default" : "destructive"}
          className={`flex items-center gap-1 text-sm ${
            isGameBalanced 
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {isGameBalanced ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {isGameBalanced ? "Balanced" : `${unpaidCount} Unpaid`}
        </Badge>
      </div>

      {/* Game Summary */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Game Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{game.players.length}</div>
              <div className="text-sm text-muted-foreground">Players</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">${game.defaultBuyIn}</div>
              <div className="text-sm text-muted-foreground">Buy-in</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">
                ${ledgerEntries.reduce((sum, entry) => sum + entry.totalInvested, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Pot</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">
                ${ledgerEntries.reduce((sum, entry) => sum + entry.cashOut, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Paid</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Ledger */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Player Results
          </CardTitle>
          <CardDescription>
            Click the circle next to each player to mark their payment as received
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ledgerEntries.map((entry, index) => (
              <div
                key={entry.playerId}
                className={`
                  flex items-center justify-between p-4 border rounded-lg transition-all duration-300
                  ${entry.isPaid ? 'bg-muted/20 opacity-75' : 'hover:bg-muted/30'}
                  ${!entry.isPaid && entry.profit !== 0 ? 'border-l-4 border-l-primary' : ''}
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Spotify-style Payment Toggle */}
                  {entry.profit !== 0 && (
                    <button
                      onClick={() => handlePaymentToggle(entry)}
                      className={`
                        w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                        ${entry.isPaid 
                          ? 'bg-green-500 border-green-500 text-white hover:bg-green-600' 
                          : 'border-muted-foreground hover:border-primary hover:scale-110'
                        }
                      `}
                    >
                      {entry.isPaid && (
                        <svg 
                          className="w-3 h-3" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      )}
                    </button>
                  )}
                  
                  {/* Player Info */}
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{entry.playerInitials}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-semibold">{entry.playerName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Bought in: ${entry.totalInvested} • Cashed out: ${entry.cashOut}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    entry.profit >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {entry.profit >= 0 ? '+' : ''}${entry.profit.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.profit > 0 ? 'Won' : entry.profit < 0 ? 'Lost' : 'Break Even'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Balance Status */}
          {isGameBalanced && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">All payments received! This game is now balanced.</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
