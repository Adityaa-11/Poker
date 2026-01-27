import React from 'react'
import { 
  Player, 
  Game, 
  Group, 
  Settlement, 
  PlayerBalance, 
  GameSummary,
  PlayerStatistics 
} from './types'
import { 
  validatePlayer, 
  validateGame, 
  validateGroup,
  generateUniqueId,
  generateSafeInitials,
  safeLocalStorageOperation,
  ValidationResult 
} from './data-validation'
import * as DataManager from './data-manager'

// Enhanced error handling
export class PokerDataError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'PokerDataError'
  }
}

// Safe player operations
export function createPlayerSafe(name: string, email?: string): { player: Player | null, errors: string[] } {
  const errors: string[] = []
  
  try {
    // Validate input
    const validation = validatePlayer({ name, email })
    if (!validation.isValid) {
      return { 
        player: null, 
        errors: validation.errors.map(e => e.message) 
      }
    }

    // Get existing data safely
    const existingPlayers = safeLocalStorageOperation(
      () => DataManager.getPlayers(),
      [],
      (error) => errors.push(`Failed to load existing players: ${error.message}`)
    )

    // Check for duplicate names (case-insensitive)
    const normalizedName = name.trim().toLowerCase()
    const duplicateName = existingPlayers.find(p => 
      p.name.toLowerCase() === normalizedName
    )
    
    if (duplicateName) {
      errors.push(`Player with name "${name}" already exists`)
      return { player: null, errors }
    }

    // Generate safe initials
    const existingInitials = new Set(existingPlayers.map(p => p.initials))
    const safeInitials = generateSafeInitials(name, existingInitials)

    // Generate unique ID
    const existingIds = new Set(existingPlayers.map(p => p.id))
    const uniqueId = generateUniqueId(existingIds, 'player_')

    // Create player
    const player: Player = {
      id: uniqueId,
      name: name.trim(),
      initials: safeInitials,
      email: email?.trim() || undefined,
      joinedAt: new Date().toISOString()
    }

    // Save safely
    const savedPlayer = safeLocalStorageOperation(
      () => DataManager.createPlayer(player.name, player.email),
      null,
      (error) => errors.push(`Failed to save player: ${error.message}`)
    )

    return { 
      player: savedPlayer, 
      errors: errors.length > 0 ? errors : [] 
    }

  } catch (error) {
    errors.push(`Unexpected error creating player: ${(error as Error).message}`)
    return { player: null, errors }
  }
}

// Safe game operations
export function createGameSafe(
  groupId: string,
  name: string,
  stakes: string,
  buyInAmount: number,
  bankPlayerId: string
): { game: Game | null, errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Get existing data
    const players = safeLocalStorageOperation(() => DataManager.getPlayers(), [])
    const groups = safeLocalStorageOperation(() => DataManager.getGroups(), [])
    const games = safeLocalStorageOperation(() => DataManager.getGames(), [])

    // Validate group exists
    const group = groups.find(g => g.id === groupId)
    if (!group) {
      errors.push('Group not found')
      return { game: null, errors, warnings }
    }

    // Validate bank player
    const bankPlayer = players.find(p => p.id === bankPlayerId)
    if (!bankPlayer) {
      errors.push('Bank player not found')
      return { game: null, errors, warnings }
    }

    // Check if bank player is member of group
    if (!group.members.includes(bankPlayerId)) {
      warnings.push('Bank player is not a member of this group')
    }

    // Create game object
    const gameData: Partial<Game> = {
      groupId,
      name: name.trim(),
      stakes: stakes.trim(),
      defaultBuyIn: buyInAmount,
      bankPersonId: bankPlayerId,
      date: new Date().toISOString(),
      status: 'active',
      players: []
    }

    // Validate game
    const validation = validateGame(gameData, players)
    if (!validation.isValid) {
      return { 
        game: null, 
        errors: validation.errors.map(e => e.message),
        warnings: validation.warnings.map(w => w.message)
      }
    }

    // Add warnings
    warnings.push(...validation.warnings.map(w => w.message))

    // Generate unique ID
    const existingIds = new Set(games.map(g => g.id))
    const uniqueId = generateUniqueId(existingIds, 'game_')

    const game: Game = {
      id: uniqueId,
      groupId,
      name: name.trim(),
      date: new Date().toISOString(),
      stakes: stakes.trim(),
      defaultBuyIn: buyInAmount,
      bankPersonId: bankPlayerId,
      players: [],
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Save safely by creating the game through existing API
    const savedGame = safeLocalStorageOperation(
      () => DataManager.createGame(groupId, stakes.trim(), buyInAmount, bankPlayerId),
      null,
      (error) => errors.push(`Failed to save game: ${error.message}`)
    )

    return { game: savedGame, errors, warnings }

  } catch (error) {
    errors.push(`Unexpected error creating game: ${(error as Error).message}`)
    return { game: null, errors, warnings }
  }
}

// Safe player lookup with fallback
export function getPlayerByIdSafe(playerId: string): Player {
  const players = safeLocalStorageOperation(
    () => DataManager.getPlayers(),
    []
  )

  const player = players.find(p => p.id === playerId)
  
  if (!player) {
    // Return a safe fallback player
    return {
      id: playerId,
      name: 'Former Player',
      initials: 'FP',
      joinedAt: new Date().toISOString()
    }
  }

  return player
}

// Safe game operations with validation
export function addPlayerToGameSafe(
  gameId: string,
  playerId: string,
  buyIn: number,
  rebuys: number = 0
): { success: boolean, errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const games = safeLocalStorageOperation(() => DataManager.getGames(), [])
    const players = safeLocalStorageOperation(() => DataManager.getPlayers(), [])
    
    const game = games.find(g => g.id === gameId)
    if (!game) {
      errors.push('Game not found')
      return { success: false, errors, warnings }
    }

    if (game.status === 'completed') {
      errors.push('Cannot add players to completed game')
      return { success: false, errors, warnings }
    }

    const player = players.find(p => p.id === playerId)
    if (!player) {
      errors.push('Player not found')
      return { success: false, errors, warnings }
    }

    // Check for duplicate player
    const existingPlayer = game.players.find(p => p.playerId === playerId)
    if (existingPlayer) {
      errors.push('Player already in this game')
      return { success: false, errors, warnings }
    }

    // Validate buy-in
    if (buyIn < 0) {
      errors.push('Buy-in cannot be negative')
      return { success: false, errors, warnings }
    }

    if (buyIn > 50000) {
      warnings.push(`Unusually high buy-in: $${buyIn}`)
    }

    if (rebuys < 0) {
      errors.push('Rebuy count cannot be negative')
      return { success: false, errors, warnings }
    }

    // Add player to game
    const gamePlayer = {
      playerId,
      buyIn,
      cashOut: 0,
      profit: 0,
      rebuys: rebuys || 0
    }

    game.players.push(gamePlayer)

    // Save safely using available API
    safeLocalStorageOperation(
      () => {
        // Use existing updatePlayerGame API if available, otherwise directly update 
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('poker_games', JSON.stringify(games))
        }
      },
      undefined,
      (error) => errors.push(`Failed to save game: ${error.message}`)
    )

    return { success: errors.length === 0, errors, warnings }

  } catch (error) {
    errors.push(`Unexpected error adding player to game: ${(error as Error).message}`)
    return { success: false, errors, warnings }
  }
}

// Safe game completion with validation
export function completeGameSafe(gameId: string): { success: boolean, errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const games = safeLocalStorageOperation(() => DataManager.getGames(), [])
    const game = games.find(g => g.id === gameId)
    
    if (!game) {
      errors.push('Game not found')
      return { success: false, errors, warnings }
    }

    if (game.status === 'completed') {
      warnings.push('Game is already completed')
      return { success: true, errors, warnings }
    }

    if (game.players.length === 0) {
      errors.push('Cannot complete game with no players')
      return { success: false, errors, warnings }
    }

    if (game.players.length === 1) {
      warnings.push('Completing game with only one player')
    }

    // Validate all players have cash-out values
    const playersWithoutCashOut = game.players.filter(p => p.cashOut === 0 && p.buyIn > 0)
    if (playersWithoutCashOut.length > 0) {
      warnings.push(`${playersWithoutCashOut.length} players have no cash-out amount set`)
    }

    // Check game balance
    const totalBuyIn = game.players.reduce((sum, p) => sum + p.buyIn, 0)
    const totalCashOut = game.players.reduce((sum, p) => sum + p.cashOut, 0)
    const difference = Math.abs(totalBuyIn - totalCashOut)
    
    if (difference > Math.max(1, totalBuyIn * 0.02)) { // 2% tolerance
      warnings.push(`Game is unbalanced by $${difference.toFixed(2)}`)
    }

    // Complete the game
    game.status = 'completed'

    // Save safely
    safeLocalStorageOperation(
      () => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('poker_games', JSON.stringify(games))
        }
      },
      undefined,
      (error) => errors.push(`Failed to save completed game: ${error.message}`)
    )

    // Generate settlements safely using complete game API
    if (errors.length === 0) {
      try {
        DataManager.completeGame(gameId)
      } catch (error) {
        warnings.push(`Failed to generate settlements: ${(error as Error).message}`)
      }
    }

    return { success: errors.length === 0, errors, warnings }

  } catch (error) {
    errors.push(`Unexpected error completing game: ${(error as Error).message}`)
    return { success: false, errors, warnings }
  }
}

// Safe statistics calculation with error handling
export function getPlayerStatisticsSafe(playerId: string, groupId: string): PlayerStatistics | null {
  try {
    const games = safeLocalStorageOperation(() => DataManager.getGames(), [])
    const playerGames = games.filter(game => 
      game.groupId === groupId && 
      game.status === 'completed' &&
      game.players.some(p => p.playerId === playerId)
    )

    if (playerGames.length === 0) {
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

    // Calculate statistics with safe math
    let totalProfit = 0
    let totalBuyIn = 0
    let totalCashOut = 0
    let totalRebuys = 0
    let winCount = 0
    let biggestWin = 0
    let biggestLoss = 0
    let mvpCount = 0

    const results: number[] = []
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    let profitLast30Days = 0
    let profitLast90Days = 0

    playerGames.forEach(game => {
      const gamePlayer = game.players.find(p => p.playerId === playerId)
      if (!gamePlayer) return

      const profit = gamePlayer.cashOut - gamePlayer.buyIn
      results.push(profit)
      
      totalProfit += profit
      totalBuyIn += gamePlayer.buyIn
      totalCashOut += gamePlayer.cashOut
      totalRebuys += gamePlayer.rebuys || 0

      if (profit > 0) winCount++
      if (profit > biggestWin) biggestWin = profit
      if (profit < biggestLoss) biggestLoss = profit

      if (gamePlayer.isMvp || game.mvpPlayerId === playerId) {
        mvpCount++
      }

      // Time-based calculations
      const gameDate = new Date(game.date)
      if (gameDate >= thirtyDaysAgo) profitLast30Days += profit
      if (gameDate >= ninetyDaysAgo) profitLast90Days += profit
    })

    // Safe calculations
    const totalGames = playerGames.length
    const winRate = totalGames > 0 ? Math.round((winCount / totalGames) * 100) : 0
    const avgProfit = totalGames > 0 ? totalProfit / totalGames : 0
    const avgBuyIn = totalGames > 0 ? totalBuyIn / totalGames : 0

    // Calculate consistency (lower variance = higher consistency)
    let consistencyScore = 50
    if (results.length >= 3) {
      const mean = results.reduce((sum, val) => sum + val, 0) / results.length
      const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length
      const stdDev = Math.sqrt(variance)
      consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / 10)))
    }

    // Calculate streaks
    let currentStreak = 0
    let longestWinStreak = 0
    let currentWinStreak = 0

    for (let i = results.length - 1; i >= 0; i--) {
      const profit = results[i]
      
      if (profit > 0) {
        currentWinStreak++
        if (currentWinStreak > longestWinStreak) {
          longestWinStreak = currentWinStreak
        }
        if (i === results.length - 1) {
          currentStreak = 1
        } else if (currentStreak > 0) {
          currentStreak++
        } else {
          break
        }
      } else {
        currentWinStreak = 0
        if (i === results.length - 1) {
          currentStreak = -1
        } else if (currentStreak < 0) {
          currentStreak--
        } else {
          break
        }
      }
    }

    return {
      playerId,
      groupId,
      gamesPlayed: totalGames,
      totalGames,
      totalProfit,
      totalLoss: Math.abs(Math.min(0, totalProfit)),
      netBalance: totalProfit,
      averageProfit: avgProfit,
      totalBuyIn,
      totalCashOut,
      winRate,
      avgProfit,
      avgBuyIn,
      biggestWin,
      biggestLoss,
      totalRebuys,
      consistencyScore: Math.round(consistencyScore),
      improvementScore: 0,
      riskScore: Math.round(Math.min(100, (totalRebuys / Math.max(1, totalGames)) * 50 + Math.min(50, avgBuyIn / 10))),
      currentStreak,
      profitLast30Days,
      profitLast90Days,
      mvpCount,
      longestWinStreak,
      lastGameDate: playerGames[playerGames.length - 1]?.date || new Date().toISOString()
    }

  } catch (error) {
    console.error('Error calculating player statistics:', error)
    return null
  }
}

// Error boundary wrapper for React components  
export function withErrorBoundary<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  FallbackComponent: React.ComponentType<{ error: Error }>
) {
  return (props: T) => {
    try {
      return React.createElement(Component, props)
    } catch (error) {
      return React.createElement(FallbackComponent, { error: error as Error })
    }
  }
} 