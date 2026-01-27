import { PlayerStatistics, PlayerAward, Game, GamePlayer, GroupLeaderboard } from './types'
import { safeDivide, safeAverage, safePercentage } from './data-validation'

// Award calculation constants with failsafe values
const AWARD_WEIGHTS = {
  PROFIT_WEIGHT: 0.4,
  WIN_RATE_WEIGHT: 0.3,
  CONSISTENCY_WEIGHT: 0.2,
  PARTICIPATION_WEIGHT: 0.1
} as const

const MINIMUM_GAMES_FOR_AWARDS = {
  OVERALL_MVP: 3,
  MOST_IMPROVED: 5,
  MOST_CONSISTENT: 5,
  COMEBACK_KING: 3,
  RISK_TAKER: 2,
  HIGH_ROLLER: 2
} as const

// Safe award calculation with edge case handling
export function calculateOverallScore(stats: PlayerStatistics): number {
  if (!stats || stats.totalGames === 0) return 0

  // Normalize profit with safety bounds
  const maxProfit = 2000 // Reasonable maximum for normalization
  const normalizedProfit = Math.max(-1, Math.min(1, stats.avgProfit / maxProfit))

  // Win rate as decimal with safety check
  const winRate = safePercentage(stats.winRate, 100) / 100

  // Consistency bonus with safety check
  const consistencyBonus = safePercentage(stats.consistencyScore, 100) / 100

  // Participation bonus with logarithmic scaling to prevent dominance
  const participationBonus = Math.min(1, Math.log(stats.totalGames + 1) / Math.log(21)) // Max at 20 games

  const score = 
    (normalizedProfit * AWARD_WEIGHTS.PROFIT_WEIGHT) +
    (winRate * AWARD_WEIGHTS.WIN_RATE_WEIGHT) +
    (consistencyBonus * AWARD_WEIGHTS.CONSISTENCY_WEIGHT) +
    (participationBonus * AWARD_WEIGHTS.PARTICIPATION_WEIGHT)

  return Math.round(Math.max(0, score * 1000)) // Ensure non-negative
}

export function calculateRiskScore(stats: PlayerStatistics): number {
  if (!stats || stats.totalGames === 0) return 0

  // High buy-ins relative to standard ($100 baseline)
  const avgBuyInFactor = Math.min(2, safeDivide(stats.avgBuyIn, 100, 0))

  // Rebuy frequency with safety
  const rebuyFactor = safeDivide(stats.totalRebuys, stats.totalGames, 0)
  const normalizedRebuyFactor = Math.min(2, rebuyFactor)

  // Variance in results (high swings = high risk)
  const swingRange = Math.abs(stats.biggestWin - stats.biggestLoss)
  const varianceFactor = Math.min(2, swingRange / 1000)

  // Low consistency = higher risk
  const consistencyFactor = safeDivide(100 - stats.consistencyScore, 100, 0)

  const riskScore = (avgBuyInFactor * 0.3) + (normalizedRebuyFactor * 0.4) + (varianceFactor * 0.2) + (consistencyFactor * 0.1)

  return Math.round(Math.min(100, Math.max(0, riskScore * 100)))
}

export function calculateConsistencyScore(gameResults: number[]): number {
  if (!gameResults || gameResults.length < 2) return 50 // Default for insufficient data

  // Filter out invalid results
  const validResults = gameResults.filter(result => Number.isFinite(result))
  if (validResults.length < 2) return 50

  const mean = safeAverage(validResults)
  
  // Calculate variance safely
  const variance = validResults.reduce((sum, result) => {
    const diff = result - mean
    return sum + (diff * diff)
  }, 0) / validResults.length

  const standardDeviation = Math.sqrt(variance)

  // Normalize to 0-100 scale with reasonable bounds
  // Higher standard deviation = lower consistency
  const maxStdDev = 500 // Reasonable maximum for normalization
  const consistencyScore = Math.max(0, 100 - (standardDeviation / maxStdDev * 100))

  return Math.round(Math.min(100, consistencyScore))
}

export function calculateImprovementScore(stats: PlayerStatistics): number {
  if (!stats || stats.totalGames < MINIMUM_GAMES_FOR_AWARDS.MOST_IMPROVED) return 0

  const recentProfit = stats.profitLast30Days
  const olderProfit = stats.profitLast90Days - stats.profitLast30Days

  // Handle case where there's no older data
  if (Math.abs(olderProfit) < 0.01) {
    // Base on recent performance vs overall average
    const avgProfit = safeDivide(stats.totalProfit, stats.totalGames, 0)
    return recentProfit > avgProfit ? 75 : 25
  }

  // Calculate percentage improvement with safety
  const baseline = Math.abs(olderProfit) || 1 // Prevent divide by zero
  const improvementPercent = ((recentProfit - olderProfit) / baseline) * 100

  // Normalize to 0-100 scale with bounds
  const improvementScore = 50 + Math.max(-50, Math.min(50, improvementPercent / 2))

  return Math.round(Math.max(0, Math.min(100, improvementScore)))
}

export function selectMvpOfNight(gameResults: Array<{ playerId: string; profit: number; buyIn: number }>): string | null {
  if (!gameResults || gameResults.length === 0) return null

  // Filter players with positive profit
  const eligiblePlayers = gameResults.filter(result => 
    result.profit > 0 && Number.isFinite(result.profit) && Number.isFinite(result.buyIn)
  )

  if (eligiblePlayers.length === 0) {
    // If no one made profit, pick least loss
    const leastLoss = gameResults
      .filter(result => Number.isFinite(result.profit))
      .sort((a, b) => b.profit - a.profit)[0]
    
    return leastLoss?.playerId || null
  }

  // Calculate MVP score: profit + efficiency bonus
  let bestScore = -Infinity
  let mvpId: string | null = null
  const ties: string[] = []

  eligiblePlayers.forEach(result => {
    // Efficiency: profit per dollar invested
    const profitRatio = safeDivide(result.profit, result.buyIn, 0)
    
    // Combined score with efficiency bonus (max 50 points)
    const efficiencyBonus = Math.min(50, profitRatio * 100)
    const score = result.profit + efficiencyBonus

    if (score > bestScore) {
      bestScore = score
      mvpId = result.playerId
      ties.length = 0 // Clear previous ties
    } else if (Math.abs(score - bestScore) < 0.01) {
      // Handle ties
      if (!ties.includes(result.playerId)) {
        ties.push(result.playerId)
      }
      if (mvpId && !ties.includes(mvpId)) {
        ties.push(mvpId)
      }
    }
  })

  // If there are ties, prefer the one with higher raw profit
  if (ties.length > 1) {
    const tiedResults = eligiblePlayers.filter(result => ties.includes(result.playerId))
    const winner = tiedResults.sort((a, b) => b.profit - a.profit)[0]
    return winner.playerId
  }

  return mvpId
}

export function calculateGroupLeaderboard(
  playerStats: PlayerStatistics[],
  recentGames: Game[]
): GroupLeaderboard {
  // Validate inputs
  if (!playerStats || playerStats.length === 0) {
    return createEmptyLeaderboard('')
  }

  const groupId = playerStats[0]?.groupId || ''

  // Filter players with minimum data
  const qualifiedStats = playerStats.filter(stats => 
    stats && stats.totalGames >= 1 && Number.isFinite(stats.totalProfit)
  )

  if (qualifiedStats.length === 0) {
    return createEmptyLeaderboard(groupId)
  }

  // Calculate rankings with tie handling
  const rankings = qualifiedStats
    .map(stats => ({
      playerId: stats.playerId,
      rank: 0,
      overallScore: calculateOverallScore(stats),
      totalProfit: stats.totalProfit,
      winRate: stats.winRate,
      gamesPlayed: stats.totalGames
    }))
    .sort((a, b) => {
      // Primary sort: overall score
      if (Math.abs(a.overallScore - b.overallScore) > 0.1) {
        return b.overallScore - a.overallScore
      }
      // Tie breaker 1: total profit
      if (Math.abs(a.totalProfit - b.totalProfit) > 0.01) {
        return b.totalProfit - a.totalProfit
      }
      // Tie breaker 2: win rate
      if (Math.abs(a.winRate - b.winRate) > 0.1) {
        return b.winRate - a.winRate
      }
      // Final tie breaker: games played (more games = higher rank)
      return b.gamesPlayed - a.gamesPlayed
    })
    .map((player, index) => ({ playerId: player.playerId, score: player.overallScore }))

  // Find award winners with minimum qualification checks
  const overallMvp = rankings[0]?.playerId || ''
  
  const mostImproved = findMostImproved(qualifiedStats)
  const riskTaker = findRiskTaker(qualifiedStats)  
  const mostConsistent = findMostConsistent(qualifiedStats)
  const comebackKing = findComebackKing(qualifiedStats)
  const highRoller = findHighRoller(qualifiedStats)

  // Find current streak leader
  const currentStreak = findStreakLeader(qualifiedStats)

  // Top 5 earners
  const topEarners = qualifiedStats
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 5)
    .map(stats => ({ playerId: stats.playerId, amount: stats.totalProfit }))

  return {
    groupId,
    players: qualifiedStats,
    lastUpdated: new Date().toISOString(),
    overallMvp,
    mostImproved,
    riskTaker,
    mostConsistent,
    comebackKing,
    highRoller,
    currentStreak,
    topEarners,
    rankings
  }
}

// Helper functions for award selection with tie handling
function findMostImproved(stats: PlayerStatistics[]): string {
  const eligible = stats.filter(s => s.totalGames >= MINIMUM_GAMES_FOR_AWARDS.MOST_IMPROVED)
  if (eligible.length === 0) return ''

  const improvements = eligible.map(s => ({
    playerId: s.playerId,
    score: calculateImprovementScore(s)
  }))

  return findWinnerWithTieBreaker(improvements, (a, b) => {
    const statA = eligible.find(s => s.playerId === a.playerId)!
    const statB = eligible.find(s => s.playerId === b.playerId)!
    return statB.profitLast30Days - statA.profitLast30Days
  })
}

function findRiskTaker(stats: PlayerStatistics[]): string {
  const eligible = stats.filter(s => s.totalGames >= MINIMUM_GAMES_FOR_AWARDS.RISK_TAKER)
  if (eligible.length === 0) return ''

  const riskScores = eligible.map(s => ({
    playerId: s.playerId,
    score: s.riskScore
  }))

  return findWinnerWithTieBreaker(riskScores, (a, b) => {
    const statA = eligible.find(s => s.playerId === a.playerId)!
    const statB = eligible.find(s => s.playerId === b.playerId)!
    return statB.avgBuyIn - statA.avgBuyIn // Higher buy-in wins tie
  })
}

function findMostConsistent(stats: PlayerStatistics[]): string {
  const eligible = stats.filter(s => s.totalGames >= MINIMUM_GAMES_FOR_AWARDS.MOST_CONSISTENT)
  if (eligible.length === 0) return ''

  const consistencyScores = eligible.map(s => ({
    playerId: s.playerId,
    score: s.consistencyScore
  }))

  return findWinnerWithTieBreaker(consistencyScores, (a, b) => {
    const statA = eligible.find(s => s.playerId === a.playerId)!
    const statB = eligible.find(s => s.playerId === b.playerId)!
    return statB.totalGames - statA.totalGames // More games wins tie
  })
}

function findComebackKing(stats: PlayerStatistics[]): string {
  const eligible = stats.filter(s => 
    s.totalGames >= MINIMUM_GAMES_FOR_AWARDS.COMEBACK_KING && 
    s.biggestLoss < -50 // Must have had significant losses
  )
  if (eligible.length === 0) return ''

  const comebackScores = eligible.map(s => {
    const recoveryAmount = s.totalProfit + Math.abs(s.biggestLoss)
    return {
      playerId: s.playerId,
      score: recoveryAmount
    }
  })

  return findWinnerWithTieBreaker(comebackScores, (a, b) => {
    const statA = eligible.find(s => s.playerId === a.playerId)!
    const statB = eligible.find(s => s.playerId === b.playerId)!
    return Math.abs(statB.biggestLoss) - Math.abs(statA.biggestLoss) // Bigger loss wins tie
  })
}

function findHighRoller(stats: PlayerStatistics[]): string {
  const eligible = stats.filter(s => s.totalGames >= MINIMUM_GAMES_FOR_AWARDS.HIGH_ROLLER)
  if (eligible.length === 0) return ''

  const buyInScores = eligible.map(s => ({
    playerId: s.playerId,
    score: s.avgBuyIn
  }))

  return findWinnerWithTieBreaker(buyInScores, (a, b) => {
    const statA = eligible.find(s => s.playerId === a.playerId)!
    const statB = eligible.find(s => s.playerId === b.playerId)!
    return statB.totalBuyIn - statA.totalBuyIn // Higher total buy-in wins tie
  })
}

function findStreakLeader(stats: PlayerStatistics[]): { playerId: string; streakType: 'win' | 'loss'; count: number } {
  const defaultStreak = { playerId: '', streakType: 'win' as const, count: 0 }
  
  const streaks = stats
    .filter(s => s.currentStreak !== 0)
    .map(s => ({
      playerId: s.playerId,
      streakType: s.currentStreak > 0 ? 'win' as const : 'loss' as const,
      count: Math.abs(s.currentStreak)
    }))

  if (streaks.length === 0) return defaultStreak

  // Sort by streak length, prefer win streaks in ties
  streaks.sort((a, b) => {
    if (a.count !== b.count) return b.count - a.count
    return a.streakType === 'win' ? -1 : 1
  })

  return streaks[0]
}

// Utility function to handle ties in award selection
function findWinnerWithTieBreaker<T extends { playerId: string; score: number }>(
  candidates: T[],
  tieBreaker: (a: T, b: T) => number
): string {
  if (candidates.length === 0) return ''

  candidates.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.01) {
      return tieBreaker(a, b)
    }
    return b.score - a.score
  })

  return candidates[0].playerId
}

function createEmptyLeaderboard(groupId: string): GroupLeaderboard {
  return {
    groupId,
    players: [],
    lastUpdated: new Date().toISOString(),
    overallMvp: '',
    mostImproved: '',
    riskTaker: '',
    mostConsistent: '',
    comebackKing: '',
    highRoller: '',
    currentStreak: { playerId: '', streakType: 'win', count: 0 },
    topEarners: [],
    rankings: []
  }
}

export function generatePlayerAwards(
  stats: PlayerStatistics,
  leaderboard: GroupLeaderboard
): PlayerAward[] {
  if (!stats || !leaderboard) return []

  const awards: PlayerAward[] = []
  const now = new Date().toISOString()

  // Only generate awards if player meets minimum requirements
  const awardChecks = [
    {
      condition: leaderboard.overallMvp === stats.playerId && stats.totalGames >= MINIMUM_GAMES_FOR_AWARDS.OVERALL_MVP,
      award: {
        id: `${stats.playerId}-mvp-overall`,
        playerId: stats.playerId,
        groupId: stats.groupId,
        type: 'mvp_overall' as const,
        title: '🏆 Overall MVP',
        description: `Top performer with ${stats.totalProfit > 0 ? '+' : ''}$${Math.round(stats.totalProfit)} profit and ${stats.winRate}% win rate`,
        dateAwarded: now,
        value: Math.round(stats.totalProfit)
      }
    },
    {
      condition: leaderboard.mostImproved === stats.playerId,
      award: {
        id: `${stats.playerId}-most-improved`,
        playerId: stats.playerId,
        groupId: stats.groupId,
        type: 'most_improved' as const,
        title: '📈 Most Improved',
        description: `Outstanding recent improvement with ${stats.profitLast30Days > 0 ? '+' : ''}$${Math.round(stats.profitLast30Days)} in last 30 days`,
        dateAwarded: now,
        value: Math.round(stats.profitLast30Days)
      }
    },
    {
      condition: leaderboard.riskTaker === stats.playerId,
      award: {
        id: `${stats.playerId}-risk-taker`,
        playerId: stats.playerId,
        groupId: stats.groupId,
        type: 'risk_taker' as const,
        title: '🎲 Risk Taker',
        description: `Biggest swings with $${Math.round(stats.avgBuyIn)} average buy-in and ${stats.totalRebuys} rebuys`,
        dateAwarded: now,
        value: stats.riskScore
      }
    },
    {
      condition: leaderboard.mostConsistent === stats.playerId,
      award: {
        id: `${stats.playerId}-consistent`,
        playerId: stats.playerId,
        groupId: stats.groupId,
        type: 'most_consistent' as const,
        title: '⚡ Most Consistent',
        description: `${stats.consistencyScore}% consistency score across ${stats.totalGames} games`,
        dateAwarded: now,
        value: stats.consistencyScore
      }
    },
    {
      condition: leaderboard.comebackKing === stats.playerId,
      award: {
        id: `${stats.playerId}-comeback-king`,
        playerId: stats.playerId,
        groupId: stats.groupId,
        type: 'comeback_king' as const,
        title: '👑 Comeback King',
        description: `Amazing recovery from $${Math.abs(Math.round(stats.biggestLoss))} loss to achieve $${Math.round(stats.totalProfit)} total profit`,
        dateAwarded: now,
        value: Math.abs(Math.round(stats.biggestLoss))
      }
    },
    {
      condition: leaderboard.highRoller === stats.playerId,
      award: {
        id: `${stats.playerId}-high-roller`,
        playerId: stats.playerId,
        groupId: stats.groupId,
        type: 'high_roller' as const,
        title: '💎 High Roller',
        description: `$${Math.round(stats.avgBuyIn)} average buy-in - plays big and bold`,
        dateAwarded: now,
        value: Math.round(stats.avgBuyIn)
      }
    }
  ]

  // Add qualifying awards
  awardChecks.forEach(check => {
    if (check.condition) {
      awards.push(check.award)
    }
  })

  return awards
} 