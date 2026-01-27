import { PlayerStatistics, Game, GamePlayer, PlayerAward } from './types'
import { calculateConsistencyScore } from './award-calculator'

const STORAGE_KEY = 'poker_player_statistics'

export function getPlayerStatistics(): PlayerStatistics[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export function setPlayerStatistics(statistics: PlayerStatistics[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(statistics))
}

export function updatePlayerStatistics(games: Game[]): void {
  const statistics: { [key: string]: PlayerStatistics } = {}

  // Initialize or get existing statistics
  const existing = getPlayerStatistics()
  existing.forEach(stats => {
    statistics[`${stats.playerId}-${stats.groupId}`] = stats
  })

  // Process all completed games
  const completedGames = games.filter(game => game.status === 'completed')
  
  completedGames.forEach(game => {
    game.players.forEach(gamePlayer => {
      const key = `${gamePlayer.playerId}-${game.groupId}`
      
      if (!statistics[key]) {
        statistics[key] = initializePlayerStatistics(gamePlayer.playerId, game.groupId)
      }

      const stats = statistics[key]
      const profit = gamePlayer.cashOut - gamePlayer.buyIn

      // Update basic statistics
      stats.totalGames++
      stats.totalBuyIn += gamePlayer.buyIn
      stats.totalCashOut = (stats.totalCashOut || 0) + gamePlayer.cashOut
      stats.totalProfit += profit
      stats.totalRebuys += gamePlayer.rebuys || 0

      // Track biggest wins/losses
      if (profit > stats.biggestWin) {
        stats.biggestWin = profit
      }
      if (profit < stats.biggestLoss) {
        stats.biggestLoss = profit
      }

      // Update averages
      stats.avgProfit = stats.totalProfit / stats.totalGames
      stats.avgBuyIn = stats.totalBuyIn / stats.totalGames

      // Count MVP awards
      if (gamePlayer.isMvp || game.mvpPlayerId === gamePlayer.playerId) {
        stats.mvpCount = (stats.mvpCount || 0) + 1
      }

      // Update last game date
      if (game.date > (stats.lastGameDate || '')) {
        stats.lastGameDate = game.date
      }
    })
  })

  // Calculate derived statistics
  Object.values(statistics).forEach(stats => {
    calculateDerivedStatistics(stats, completedGames)
  })

  setPlayerStatistics(Object.values(statistics))
}

function initializePlayerStatistics(playerId: string, groupId: string): PlayerStatistics {
  return {
    playerId,
    groupId,
    gamesPlayed: 0,
    totalGames: 0,
    totalProfit: 0,
    totalLoss: 0,
    netBalance: 0,
    averageProfit: 0,
    totalBuyIn: 0,
    totalCashOut: 0,
    winRate: 0,
    avgProfit: 0,
    avgBuyIn: 0,
    biggestWin: 0,
    biggestLoss: 0,
    totalRebuys: 0,
    consistencyScore: 50,
    improvementScore: 0,
    riskScore: 0,
    currentStreak: 0,
    profitLast30Days: 0,
    profitLast90Days: 0,
    mvpCount: 0,
    longestWinStreak: 0,
    lastGameDate: new Date().toISOString()
  }
}

function calculateDerivedStatistics(stats: PlayerStatistics, allGames: Game[]): void {
  // Get all games for this player in this group
  const playerGames = allGames.filter(game => 
    game.groupId === stats.groupId && 
    game.players.some(p => p.playerId === stats.playerId)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (playerGames.length === 0) return

  const gameResults: number[] = []
  let winCount = 0
  let currentStreak = 0
  let longestWinStreak = 0
  let currentWinStreak = 0

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  
  let profitLast30Days = 0
  let profitLast90Days = 0

  // Process games chronologically
  playerGames.forEach((game, index) => {
    const gamePlayer = game.players.find(p => p.playerId === stats.playerId)
    if (!gamePlayer) return

    const profit = gamePlayer.cashOut - gamePlayer.buyIn
    gameResults.push(profit)

    const gameDate = new Date(game.date)

    // Count wins
    if (profit > 0) {
      winCount++
      currentWinStreak++
      if (currentWinStreak > longestWinStreak) {
        longestWinStreak = currentWinStreak
      }
    } else {
      currentWinStreak = 0
    }

    // Calculate current streak (wins or losses)
    if (index === 0) {
      currentStreak = profit > 0 ? 1 : -1
    } else {
      const prevGame = playerGames[index - 1]
      const prevPlayer = prevGame.players.find(p => p.playerId === stats.playerId)
      const prevProfit = prevPlayer ? prevPlayer.cashOut - prevPlayer.buyIn : 0

      if ((profit > 0 && prevProfit > 0) || (profit <= 0 && prevProfit <= 0)) {
        currentStreak = profit > 0 ? Math.abs(currentStreak) + 1 : currentStreak - 1
      } else {
        currentStreak = profit > 0 ? 1 : -1
      }
    }

    // Calculate time-based profits
    if (gameDate >= thirtyDaysAgo) {
      profitLast30Days += profit
    }
    if (gameDate >= ninetyDaysAgo) {
      profitLast90Days += profit
    }
  })

  // Update calculated statistics
  stats.winRate = stats.totalGames > 0 ? Math.round((winCount / stats.totalGames) * 100) : 0
  stats.currentStreak = currentStreak
  stats.longestWinStreak = longestWinStreak
  stats.profitLast30Days = profitLast30Days
  stats.profitLast90Days = profitLast90Days
  stats.consistencyScore = calculateConsistencyScore(gameResults)
  
  // Calculate risk score based on behavior patterns
  stats.riskScore = calculateRiskScore(stats)
}

function calculateRiskScore(stats: PlayerStatistics): number {
  if (stats.totalGames === 0) return 0

  // High buy-ins relative to average (assuming $100 is standard)
  const avgBuyInFactor = Math.min(2, stats.avgBuyIn / 100)

  // Rebuy frequency
  const rebuyFactor = stats.totalRebuys > 0 ? Math.min(2, stats.totalRebuys / stats.totalGames) : 0

  // Variance in results (high swings = high risk)
  const range = Math.abs(stats.biggestWin - stats.biggestLoss)
  const varianceFactor = Math.min(2, range / 1000)

  // Low consistency = higher risk
  const consistencyFactor = (100 - stats.consistencyScore) / 100

  const riskScore = (avgBuyInFactor * 0.3) + (rebuyFactor * 0.4) + (varianceFactor * 0.2) + (consistencyFactor * 0.1)

  return Math.round(Math.min(100, riskScore * 100))
}

export function getPlayerStatisticsForGroup(groupId: string): PlayerStatistics[] {
  return getPlayerStatistics().filter(stats => stats.groupId === groupId)
}

export function getPlayerStatisticsById(playerId: string, groupId: string): PlayerStatistics | null {
  const allStats = getPlayerStatistics()
  return allStats.find(stats => stats.playerId === playerId && stats.groupId === groupId) || null
}

export function clearPlayerStatistics(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
} 