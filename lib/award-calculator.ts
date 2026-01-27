import { PlayerStatistics, PlayerAward, Game, GamePlayer, GroupLeaderboard } from './types'

// Award calculation constants
const AWARD_WEIGHTS = {
  PROFIT_WEIGHT: 0.4,
  WIN_RATE_WEIGHT: 0.3,
  CONSISTENCY_WEIGHT: 0.2,
  PARTICIPATION_WEIGHT: 0.1
}

const IMPROVEMENT_LOOKBACK_DAYS = 60 // Compare last 60 days vs previous period

export function calculateOverallScore(stats: PlayerStatistics): number {
  // Normalize profit (cap at reasonable values to prevent outliers)
  const normalizedProfit = Math.max(-1000, Math.min(1000, stats.averageProfit)) / 1000

  // Win rate as decimal
  const winRate = stats.winRate / 100

  // Consistency bonus: lower variance is better (calculated from other stats)
  const consistencyScore = stats.gamesPlayed < 3 ? 50 : Math.min(100, (stats.winRate + (stats.netBalance > 0 ? 75 : 25)) / 2)
  const consistencyBonus = consistencyScore / 100

  // Participation bonus: more games = more reliable stats
  const participationBonus = Math.min(1, stats.gamesPlayed / 20) // Max bonus at 20 games

  const score = 
    (normalizedProfit * AWARD_WEIGHTS.PROFIT_WEIGHT) +
    (winRate * AWARD_WEIGHTS.WIN_RATE_WEIGHT) +
    (consistencyBonus * AWARD_WEIGHTS.CONSISTENCY_WEIGHT) +
    (participationBonus * AWARD_WEIGHTS.PARTICIPATION_WEIGHT)

  return Math.round(score * 1000) // Scale to 0-1000
}

export function calculateRiskScore(stats: PlayerStatistics): number {
  if (stats.gamesPlayed === 0) return 0

  // High buy-ins relative to average
  const avgBuyInFactor = stats.avgBuyIn > 100 ? Math.min(2, stats.avgBuyIn / 100) : stats.avgBuyIn / 100

  // Rebuy frequency
  const rebuyFactor = stats.totalRebuys > 0 ? Math.min(2, stats.totalRebuys / stats.gamesPlayed) : 0

  // Variance in results (high swings = high risk)
  const varianceFactor = Math.abs(stats.biggestWin - stats.biggestLoss) / 1000

  // Low consistency = higher risk
  const consistencyFactor = (100 - (stats.gamesPlayed < 3 ? 50 : Math.min(100, (stats.winRate + (stats.netBalance > 0 ? 75 : 25)) / 2))) / 100

  const riskScore = (avgBuyInFactor * 0.3) + (rebuyFactor * 0.4) + (varianceFactor * 0.2) + (consistencyFactor * 0.1)

  return Math.round(Math.min(100, riskScore * 100))
}

export function calculateConsistencyScore(gameResults: number[]): number {
  if (gameResults.length < 3) return 50 // Default for insufficient data

  const mean = gameResults.reduce((sum, result) => sum + result, 0) / gameResults.length
  const variance = gameResults.reduce((sum, result) => sum + Math.pow(result - mean, 2), 0) / gameResults.length
  const standardDeviation = Math.sqrt(variance)

  // Lower standard deviation = higher consistency
  // Normalize to 0-100 scale (assuming max std dev of 500)
  const consistencyScore = Math.max(0, 100 - (standardDeviation / 5))

  return Math.round(consistencyScore)
}

export function calculateImprovementScore(stats: PlayerStatistics, recentProfit: number, previousProfit: number): number {
  if (previousProfit === 0) {
    // If no previous data, base on recent performance vs group average
    return recentProfit > 0 ? 75 : 25
  }

  // Calculate percentage improvement
  const improvementPercent = ((recentProfit - previousProfit) / Math.abs(previousProfit)) * 100

  // Normalize to 0-100 scale
  const improvementScore = 50 + (improvementPercent / 2) // ±50% improvement = full scale

  return Math.round(Math.max(0, Math.min(100, improvementScore)))
}

export function selectMvpOfNight(gameResults: Array<{ playerId: string; profit: number; buyIn: number }>): string | null {
  if (gameResults.length === 0) return null

  // MVP criteria: highest profit with consideration for buy-in ratio
  let bestScore = -Infinity
  let mvpId = null

  for (const result of gameResults) {
    if (result.profit <= 0) continue // Must have positive profit

    // Score based on profit and efficiency (profit per dollar invested)
    const profitRatio = result.buyIn > 0 ? result.profit / result.buyIn : 0
    const score = result.profit + (profitRatio * 50) // Bonus for efficiency

    if (score > bestScore) {
      bestScore = score
      mvpId = result.playerId
    }
  }

  return mvpId
}

export function calculateGroupLeaderboard(
  playerStats: PlayerStatistics[],
  recentGames: Game[]
): GroupLeaderboard {
  if (playerStats.length === 0) {
    return {
      groupId: '',
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

  const groupId = playerStats[0].groupId

  // Calculate overall scores and rankings
  const rankings = playerStats
    .map(stats => ({
      playerId: stats.playerId,
      score: calculateOverallScore(stats)
    }))
    .sort((a, b) => b.score - a.score)

  // Find award winners
  const overallMvp = rankings[0]?.playerId || ''
  
  const mostImproved = playerStats
    .filter(stats => stats.gamesPlayed >= 5) // Minimum games required
    .sort((a, b) => (b.profitLast30Days - b.profitLast90Days) - (a.profitLast30Days - a.profitLast90Days))[0]?.playerId || ''

  const riskTaker = playerStats
    .sort((a, b) => b.riskScore - a.riskScore)[0]?.playerId || ''

  const mostConsistent = playerStats
    .filter(stats => stats.gamesPlayed >= 5)
    .sort((a, b) => b.consistencyScore - a.consistencyScore)[0]?.playerId || ''

  const comebackKing = playerStats
    .filter(stats => stats.biggestLoss < -100) // Must have had significant losses
    .sort((a, b) => (b.totalProfit + Math.abs(b.biggestLoss)) - (a.totalProfit + Math.abs(a.biggestLoss)))[0]?.playerId || ''

  const highRoller = playerStats
    .sort((a, b) => b.avgBuyIn - a.avgBuyIn)[0]?.playerId || ''

  // Find current streak leader
  const currentStreak = playerStats
    .filter(stats => stats.currentStreak !== 0)
    .sort((a, b) => Math.abs(b.currentStreak) - Math.abs(a.currentStreak))[0]

  const streakInfo = currentStreak ? {
    playerId: currentStreak.playerId,
    streakType: currentStreak.currentStreak > 0 ? 'win' as const : 'loss' as const,
    count: Math.abs(currentStreak.currentStreak)
  } : { playerId: '', streakType: 'win' as const, count: 0 }

  // Top 5 earners
  const topEarners = playerStats
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 5)
    .map(stats => ({ playerId: stats.playerId, amount: stats.totalProfit }))

  return {
    groupId,
    players: playerStats,
    lastUpdated: new Date().toISOString(),
    overallMvp,
    mostImproved,
    riskTaker,
    mostConsistent,
    comebackKing,
    highRoller,
    currentStreak: streakInfo,
    topEarners,
    rankings
  }
}

export function generatePlayerAwards(
  stats: PlayerStatistics,
  leaderboard: GroupLeaderboard,
  gameResults?: Array<{ gameId: string; profit: number; date: string }>
): PlayerAward[] {
  const awards: PlayerAward[] = []
  const now = new Date().toISOString()

  // Overall MVP
  if (leaderboard.overallMvp === stats.playerId) {
    awards.push({
      id: `${stats.playerId}-mvp-overall`,
      playerId: stats.playerId,
      groupId: stats.groupId,
      type: 'mvp_overall',
      title: '🏆 Overall MVP',
      description: `Top performer with ${stats.totalProfit > 0 ? '+' : ''}$${stats.totalProfit} profit and ${stats.winRate}% win rate`,
      dateAwarded: now,
      value: stats.totalProfit
    })
  }

  // Most Improved
  if (leaderboard.mostImproved === stats.playerId) {
    const improvement = stats.profitLast30Days - stats.profitLast90Days
    awards.push({
      id: `${stats.playerId}-most-improved`,
      playerId: stats.playerId,
      groupId: stats.groupId,
      type: 'most_improved',
      title: '📈 Most Improved',
      description: `${improvement > 0 ? '+' : ''}$${improvement} improvement in recent games`,
      dateAwarded: now,
      value: improvement
    })
  }

  // Risk Taker
  if (leaderboard.riskTaker === stats.playerId) {
    awards.push({
      id: `${stats.playerId}-risk-taker`,
      playerId: stats.playerId,
      groupId: stats.groupId,
      type: 'risk_taker',
      title: '🎲 Risk Taker',
      description: `Biggest swings with $${stats.avgBuyIn} average buy-in and ${stats.totalRebuys} rebuys`,
      dateAwarded: now,
      value: stats.riskScore
    })
  }

  // Most Consistent
  if (leaderboard.mostConsistent === stats.playerId) {
    awards.push({
      id: `${stats.playerId}-consistent`,
      playerId: stats.playerId,
      groupId: stats.groupId,
      type: 'most_consistent',
      title: '⚡ Most Consistent',
      description: `${(stats.gamesPlayed < 3 ? 50 : Math.min(100, (stats.winRate + (stats.netBalance > 0 ? 75 : 25)) / 2))}% consistency score across ${stats.gamesPlayed} games`,
      dateAwarded: now,
      value: (stats.gamesPlayed < 3 ? 50 : Math.min(100, (stats.winRate + (stats.netBalance > 0 ? 75 : 25)) / 2))
    })
  }

  // Comeback King
  if (leaderboard.comebackKing === stats.playerId) {
    awards.push({
      id: `${stats.playerId}-comeback-king`,
      playerId: stats.playerId,
      groupId: stats.groupId,
      type: 'comeback_king',
      title: '👑 Comeback King',
      description: `Recovered from $${Math.abs(stats.biggestLoss)} loss to achieve $${stats.totalProfit} total profit`,
      dateAwarded: now,
      value: Math.abs(stats.biggestLoss)
    })
  }

  // High Roller
  if (leaderboard.highRoller === stats.playerId) {
    awards.push({
      id: `${stats.playerId}-high-roller`,
      playerId: stats.playerId,
      groupId: stats.groupId,
      type: 'high_roller',
      title: '💎 High Roller',
      description: `$${stats.avgBuyIn} average buy-in - plays big and bold`,
      dateAwarded: now,
      value: stats.avgBuyIn
    })
  }

  return awards
} 