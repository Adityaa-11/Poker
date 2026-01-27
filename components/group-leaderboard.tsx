"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Trophy, TrendingUp, Target, Award, Crown, Zap, Shield, Star } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { Player, Game, GamePlayer } from "@/lib/types"

interface GroupLeaderboardProps {
  groupId: string
}

interface PlayerStats {
  player: Player
  gamesPlayed: number
  totalBuyIn: number
  totalCashOut: number
  netWinnings: number
  winRate: number
  avgBuyIn: number
  avgProfit: number
  biggestWin: number
  biggestLoss: number
  mvpCount: number
  consistency: number // Lower variance = more consistent
}

interface Award {
  id: string
  name: string
  icon: React.ComponentType<any>
  color: string
  description: string
  playerId: string
}

export function GroupLeaderboard({ groupId }: GroupLeaderboardProps) {
  const { getGamesByGroupId, getPlayerById, getGroupById } = usePoker()
  
  const group = getGroupById(groupId)
  const games = getGamesByGroupId(groupId).filter(game => game.isCompleted)
  
  if (!group) {
    return <div>Group not found</div>
  }

  // Calculate player statistics
  const playerStats: PlayerStats[] = group.members.map(memberId => {
    const player = getPlayerById(memberId)
    if (!player) return null

    const playerGames = games.filter(game => 
      game.players.some(p => p.playerId === memberId)
    )

    const playerGameData = playerGames.map(game => 
      game.players.find(p => p.playerId === memberId)
    ).filter((p): p is GamePlayer => p !== undefined)

    const totalBuyIn = playerGameData.reduce((sum, p) => sum + p.buyIn, 0)
    const totalCashOut = playerGameData.reduce((sum, p) => sum + p.cashOut, 0)
    const netWinnings = totalCashOut - totalBuyIn
    const winningGames = playerGameData.filter(p => p.profit > 0).length
    const winRate = playerGames.length > 0 ? (winningGames / playerGames.length) * 100 : 0
    
    const profits = playerGameData.map(p => p.profit)
    const avgProfit = profits.length > 0 ? profits.reduce((sum, p) => sum + p, 0) / profits.length : 0
    const biggestWin = profits.length > 0 ? Math.max(...profits) : 0
    const biggestLoss = profits.length > 0 ? Math.min(...profits) : 0
    
    // Calculate consistency (lower standard deviation = more consistent)
    const variance = profits.length > 1 
      ? profits.reduce((sum, p) => sum + Math.pow(p - avgProfit, 2), 0) / profits.length
      : 0
    const consistency = Math.sqrt(variance)

    return {
      player,
      gamesPlayed: playerGames.length,
      totalBuyIn,
      totalCashOut,
      netWinnings,
      winRate,
      avgBuyIn: playerGames.length > 0 ? totalBuyIn / playerGames.length : 0,
      avgProfit,
      biggestWin,
      biggestLoss,
      mvpCount: 0, // Will be calculated separately if we track MVPs
      consistency
    }
  }).filter((stats): stats is PlayerStats => stats !== null)

  // Sort by net winnings for leaderboard
  const sortedStats = [...playerStats].sort((a, b) => b.netWinnings - a.netWinnings)

  // Calculate awards
  const awards: Award[] = []
  
  if (playerStats.length > 0) {
    // Money Winner (Highest net winnings)
    const topEarner = sortedStats[0]
    if (topEarner.netWinnings > 0) {
      awards.push({
        id: 'money-winner',
        name: 'Money Winner',
        icon: Crown,
        color: 'text-yellow-500',
        description: `Highest net winnings: $${topEarner.netWinnings.toFixed(2)}`,
        playerId: topEarner.player.id
      })
    }

    // High Roller (Highest average buy-in)
    const highRoller = [...playerStats].sort((a, b) => b.avgBuyIn - a.avgBuyIn)[0]
    if (highRoller.avgBuyIn > 0) {
      awards.push({
        id: 'high-roller',
        name: 'High Roller',
        icon: Star,
        color: 'text-purple-500',
        description: `Highest avg buy-in: $${highRoller.avgBuyIn.toFixed(2)}`,
        playerId: highRoller.player.id
      })
    }

    // Consistency King (Most consistent performer)
    const consistentPlayers = playerStats.filter(p => p.gamesPlayed >= 3)
    if (consistentPlayers.length > 0) {
      const mostConsistent = [...consistentPlayers].sort((a, b) => a.consistency - b.consistency)[0]
      awards.push({
        id: 'consistency-king',
        name: 'Consistency King',
        icon: Shield,
        color: 'text-blue-500',
        description: `Most consistent performance`,
        playerId: mostConsistent.player.id
      })
    }

    // Big Winner (Biggest single win)
    const bigWinner = [...playerStats].sort((a, b) => b.biggestWin - a.biggestWin)[0]
    if (bigWinner.biggestWin > 0) {
      awards.push({
        id: 'big-winner',
        name: 'Big Winner',
        icon: Zap,
        color: 'text-green-500',
        description: `Biggest win: $${bigWinner.biggestWin.toFixed(2)}`,
        playerId: bigWinner.player.id
      })
    }

    // Most Active (Most games played)
    const mostActive = [...playerStats].sort((a, b) => b.gamesPlayed - a.gamesPlayed)[0]
    if (mostActive.gamesPlayed > 0) {
      awards.push({
        id: 'most-active',
        name: 'Most Active',
        icon: Target,
        color: 'text-orange-500',
        description: `${mostActive.gamesPlayed} games played`,
        playerId: mostActive.player.id
      })
    }

    // Hot Streak (Best win rate with minimum 3 games)
    const eligiblePlayers = playerStats.filter(p => p.gamesPlayed >= 3)
    if (eligiblePlayers.length > 0) {
      const hotStreak = [...eligiblePlayers].sort((a, b) => b.winRate - a.winRate)[0]
      awards.push({
        id: 'hot-streak',
        name: 'Hot Streak',
        icon: TrendingUp,
        color: 'text-red-500',
        description: `${hotStreak.winRate.toFixed(1)}% win rate`,
        playerId: hotStreak.player.id
      })
    }
  }

  if (games.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Group Leaderboard
          </CardTitle>
          <CardDescription>
            Play some games to see leaderboard and awards!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center space-y-2">
              <Trophy className="h-12 w-12 mx-auto opacity-50" />
              <p>No completed games yet</p>
              <p className="text-sm">Start playing to see statistics and awards</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Awards Section */}
      {awards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Group Awards
            </CardTitle>
            <CardDescription>
              Recognition for outstanding performances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {awards.map((award) => {
                const awardPlayer = getPlayerById(award.playerId)
                const IconComponent = award.icon
                return (
                  <div key={award.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                    <div className={`p-2 rounded-full bg-muted ${award.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{award.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {awardPlayer?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {award.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Player Rankings
          </CardTitle>
          <CardDescription>
            Based on net winnings from {games.length} completed game{games.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedStats.map((stats, index) => {
              const playerAwards = awards.filter(a => a.playerId === stats.player.id)
              return (
                <div key={stats.player.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <Avatar>
                      <AvatarFallback>{stats.player.initials}</AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{stats.player.name}</h3>
                      {playerAwards.slice(0, 2).map((award) => {
                        const IconComponent = award.icon
                        return (
                          <Badge key={award.id} variant="secondary" className="text-xs">
                            <IconComponent className="h-3 w-3 mr-1" />
                            {award.name}
                          </Badge>
                        )
                      })}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Net Winnings</p>
                        <p className={`font-medium ${
                          stats.netWinnings >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${stats.netWinnings.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Games</p>
                        <p className="font-medium">{stats.gamesPlayed}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Win Rate</p>
                        <p className="font-medium">{stats.winRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Profit</p>
                        <p className={`font-medium ${
                          stats.avgProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${stats.avgProfit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {stats.gamesPlayed > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Performance</span>
                          <span>{stats.winRate.toFixed(1)}% wins</span>
                        </div>
                        <Progress value={stats.winRate} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 