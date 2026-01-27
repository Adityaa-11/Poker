"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { 
  Player, 
  Game, 
  Group, 
  Settlement, 
  PlayerBalance, 
  GameSummary,
  PlayerStatistics,
  GroupLeaderboard,
  PlayerAward
} from '@/lib/types'
import * as EnhancedDataManager from '@/lib/enhanced-data-manager'
import { updatePlayerStatistics, getPlayerStatisticsForGroup } from '@/lib/statistics-manager'
import { calculateGroupLeaderboard, generatePlayerAwards } from '@/lib/enhanced-award-calculator'

// Enhanced context type with error handling
interface EnhancedPokerContextType {
  // Data
  players: Player[]
  games: Game[]
  groups: Group[]
  settlements: Settlement[]
  currentUser: Player | null
  
  // Computed data
  statistics: PlayerStatistics[]
  leaderboards: { [groupId: string]: GroupLeaderboard }
  awards: { [playerId: string]: PlayerAward[] }
  
  // State
  loading: boolean
  error: string | null
  
  // Actions
  refreshData: () => void
  clearError: () => void
  
  // Player operations
  createNewPlayer: (name: string, email?: string) => { player: Player | null; error?: string }
  getPlayerById: (id: string) => Player
  
  // Game operations  
  createNewGame: (groupId: string, name: string, stakes: string, buyInAmount: number, bankPlayerId: string) => { game: Game | null; error?: string }
  getGameById: (id: string) => Game | null
  getGamesByGroupId: (groupId: string) => Game[]
  addPlayerToGame: (gameId: string, playerId: string, buyIn: number, rebuyCount?: number) => boolean
  updatePlayerInGame: (gameId: string, playerId: string, updates: any) => boolean
  completeGame: (gameId: string) => boolean
  getGameSummary: (gameId: string) => GameSummary | null
  
  // Group operations
  createNewGroup: (name: string, description: string) => { group: Group | null; error?: string }
  getGroupById: (id: string) => Group | null
  joinGroup: (inviteCode: string, playerId: string) => { group: Group | null; error?: string }
  
  // Settlement operations
  markSettlementPaid: (settlementId: string) => boolean
  getPlayerBalance: (playerId: string, groupId?: string) => PlayerBalance
  
  // Statistics and awards
  getPlayerStatistics: (playerId: string, groupId: string) => PlayerStatistics | null
  getGroupLeaderboard: (groupId: string) => GroupLeaderboard | null
  getPlayerAwards: (playerId: string, groupId: string) => PlayerAward[]
  
  // Utilities
  clearAllData: () => void
}

const EnhancedPokerContext = createContext<EnhancedPokerContextType | undefined>(undefined)

interface EnhancedPokerProviderProps {
  children: ReactNode
}

export const EnhancedPokerProvider = ({ children }: EnhancedPokerProviderProps) => {
  // Core data state
  const [players, setPlayers] = useState<Player[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [currentUser, setCurrentUser] = useState<Player | null>(null)
  
  // Computed data state
  const [statistics, setStatistics] = useState<PlayerStatistics[]>([])
  const [leaderboards, setLeaderboards] = useState<{ [groupId: string]: GroupLeaderboard }>({})
  const [awards, setAwards] = useState<{ [playerId: string]: PlayerAward[] }>({})
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Safe data refresh with error handling
  const refreshData = useCallback(() => {
    try {
      setLoading(true)
      setError(null)
      
      // Load core data
      const loadedPlayers = EnhancedDataManager.getPlayers()
      const loadedGames = EnhancedDataManager.getGames()
      const loadedGroups = EnhancedDataManager.getGroups()
      const loadedSettlements = EnhancedDataManager.getSettlements()
      
      setPlayers(loadedPlayers)
      setGames(loadedGames)
      setGroups(loadedGroups)
      setSettlements(loadedSettlements)
      
      // Load current user
      const currentUserId = EnhancedDataManager.getCurrentUser()
      if (currentUserId) {
        const user = EnhancedDataManager.getPlayerById(currentUserId)
        setCurrentUser(user)
      } else {
        setCurrentUser(null)
      }
      
      // Update statistics for all groups
      updatePlayerStatistics(loadedGames)
      const allStats = getPlayerStatisticsForGroup('')
      setStatistics(allStats)
      
      // Calculate leaderboards for each group
      const newLeaderboards: { [groupId: string]: GroupLeaderboard } = {}
      const newAwards: { [playerId: string]: PlayerAward[] } = {}
      
      loadedGroups.forEach(group => {
        const groupStats = allStats.filter(stat => stat.groupId === group.id)
        if (groupStats.length > 0) {
          const groupGames = loadedGames.filter(game => game.groupId === group.id)
          const leaderboard = calculateGroupLeaderboard(groupStats, groupGames)
          newLeaderboards[group.id] = leaderboard
          
          // Generate awards for each player in the group
          groupStats.forEach(stats => {
            const playerAwards = generatePlayerAwards(stats, leaderboard)
            if (playerAwards.length > 0) {
              newAwards[stats.playerId] = [
                ...(newAwards[stats.playerId] || []),
                ...playerAwards
              ]
            }
          })
        }
      })
      
      setLeaderboards(newLeaderboards)
      setAwards(newAwards)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(`Failed to load data: ${errorMessage}`)
      console.error('Data refresh error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initialize data on mount
  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Player operations with error handling
  const createNewPlayer = useCallback((name: string, email?: string) => {
    try {
      clearError()
      const player = EnhancedDataManager.createPlayer(name, email)
      
      if (player) {
        refreshData()
        return { player }
      } else {
        const errorMsg = 'Failed to create player. Name may already exist or be invalid.'
        setError(errorMsg)
        return { player: null, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = `Error creating player: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { player: null, error: errorMsg }
    }
  }, [refreshData, clearError])

  const getPlayerById = useCallback((id: string): Player => {
    return EnhancedDataManager.getPlayerById(id) || {
      id,
      name: 'Former Player',
      initials: 'FP',
      joinedAt: new Date().toISOString()
    }
  }, [])

  // Game operations
  const createNewGame = useCallback((
    groupId: string, 
    name: string, 
    stakes: string, 
    buyInAmount: number, 
    bankPlayerId: string
  ) => {
    try {
      clearError()
      const game = EnhancedDataManager.createGame(groupId, name, stakes, buyInAmount, bankPlayerId)
      
      if (game) {
        refreshData()
        return { game }
      } else {
        const errorMsg = 'Failed to create game. Please check all inputs.'
        setError(errorMsg)
        return { game: null, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = `Error creating game: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { game: null, error: errorMsg }
    }
  }, [refreshData, clearError])

  const getGameById = useCallback((id: string) => {
    return EnhancedDataManager.getGameById(id)
  }, [])

  const getGamesByGroupId = useCallback((groupId: string) => {
    return EnhancedDataManager.getGamesByGroupId(groupId)
  }, [])

  const addPlayerToGame = useCallback((gameId: string, playerId: string, buyIn: number, rebuyCount = 0) => {
    try {
      clearError()
      const success = EnhancedDataManager.addPlayerToGame(gameId, playerId, buyIn, rebuyCount)
      if (success) {
        refreshData()
      } else {
        setError('Failed to add player to game')
      }
      return success
    } catch (err) {
      const errorMsg = `Error adding player to game: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return false
    }
  }, [refreshData, clearError])

  const updatePlayerInGame = useCallback((gameId: string, playerId: string, updates: any) => {
    try {
      clearError()
      const success = EnhancedDataManager.updatePlayerInGame(gameId, playerId, updates)
      if (success) {
        refreshData()
      } else {
        setError('Failed to update player in game')
      }
      return success
    } catch (err) {
      const errorMsg = `Error updating player in game: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return false
    }
  }, [refreshData, clearError])

  const completeGame = useCallback((gameId: string) => {
    try {
      clearError()
      const success = EnhancedDataManager.completeGame(gameId)
      if (success) {
        refreshData()
      } else {
        setError('Failed to complete game')
      }
      return success
    } catch (err) {
      const errorMsg = `Error completing game: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return false
    }
  }, [refreshData, clearError])

  const getGameSummary = useCallback((gameId: string) => {
    return EnhancedDataManager.getGameSummary(gameId)
  }, [])

  // Group operations
  const createNewGroup = useCallback((name: string, description: string) => {
    try {
      clearError()
      if (!currentUser) {
        const errorMsg = 'Must be logged in to create a group'
        setError(errorMsg)
        return { group: null, error: errorMsg }
      }

      const group = EnhancedDataManager.createGroup(name, description, currentUser.id)
      
      if (group) {
        refreshData()
        return { group }
      } else {
        const errorMsg = 'Failed to create group. Please check inputs.'
        setError(errorMsg)
        return { group: null, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = `Error creating group: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { group: null, error: errorMsg }
    }
  }, [currentUser, refreshData, clearError])

  const getGroupById = useCallback((id: string) => {
    return EnhancedDataManager.getGroupById(id)
  }, [])

  const joinGroup = useCallback((inviteCode: string, playerId: string) => {
    try {
      clearError()
      const group = EnhancedDataManager.joinGroup(inviteCode, playerId)
      
      if (group) {
        refreshData()
        return { group }
      } else {
        const errorMsg = 'Invalid invite code or player not found'
        setError(errorMsg)
        return { group: null, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = `Error joining group: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { group: null, error: errorMsg }
    }
  }, [refreshData, clearError])

  // Settlement operations
  const markSettlementPaid = useCallback((settlementId: string) => {
    try {
      clearError()
      const success = EnhancedDataManager.markSettlementPaid(settlementId)
      if (success) {
        refreshData()
      } else {
        setError('Failed to mark settlement as paid')
      }
      return success
    } catch (err) {
      const errorMsg = `Error marking settlement: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return false
    }
  }, [refreshData, clearError])

  const getPlayerBalance = useCallback((playerId: string, groupId?: string) => {
    return EnhancedDataManager.getPlayerBalance(playerId, groupId)
  }, [])

  // Statistics and awards
  const getPlayerStatistics = useCallback((playerId: string, groupId: string) => {
    return statistics.find(stat => stat.playerId === playerId && stat.groupId === groupId) || null
  }, [statistics])

  const getGroupLeaderboard = useCallback((groupId: string) => {
    return leaderboards[groupId] || null
  }, [leaderboards])

  const getPlayerAwards = useCallback((playerId: string, groupId: string) => {
    const playerAwards = awards[playerId] || []
    return playerAwards.filter(award => award.groupId === groupId)
  }, [awards])

  // Utilities
  const clearAllData = useCallback(() => {
    try {
      EnhancedDataManager.clearAllData()
      refreshData()
    } catch (err) {
      const errorMsg = `Error clearing data: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
    }
  }, [refreshData])

  const value: EnhancedPokerContextType = {
    // Data
    players,
    games,
    groups,
    settlements,
    currentUser,
    
    // Computed data
    statistics,
    leaderboards,
    awards,
    
    // State
    loading,
    error,
    
    // Actions
    refreshData,
    clearError,
    
    // Player operations
    createNewPlayer,
    getPlayerById,
    
    // Game operations
    createNewGame,
    getGameById,
    getGamesByGroupId,
    addPlayerToGame,
    updatePlayerInGame,
    completeGame,
    getGameSummary,
    
    // Group operations
    createNewGroup,
    getGroupById,
    joinGroup,
    
    // Settlement operations
    markSettlementPaid,
    getPlayerBalance,
    
    // Statistics and awards
    getPlayerStatistics,
    getGroupLeaderboard,
    getPlayerAwards,
    
    // Utilities
    clearAllData
  }

  return (
    <EnhancedPokerContext.Provider value={value}>
      {children}
    </EnhancedPokerContext.Provider>
  )
}

export function useEnhancedPoker() {
  const context = useContext(EnhancedPokerContext)
  if (context === undefined) {
    throw new Error('useEnhancedPoker must be used within an EnhancedPokerProvider')
  }
  return context
} 