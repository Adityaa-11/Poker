import { 
  Player, 
  Game, 
  Group, 
  Settlement, 
  PlayerBalance, 
  GameSummary,
  GamePlayer 
} from './types'
import { 
  validatePlayer, 
  validateGame, 
  validateGroup,
  generateUniqueId,
  generateSafeInitials,
  safeLocalStorageOperation,
  safeDivide,
  safeAverage,
  ValidationResult 
} from './data-validation'

const STORAGE_KEYS = {
  PLAYERS: 'poker_players',
  GAMES: 'poker_games', 
  GROUPS: 'poker_groups',
  SETTLEMENTS: 'poker_settlements',
  CURRENT_USER: 'poker_current_user',
} as const

// Enhanced storage operations with error handling
const safeGetFromStorage = <T>(key: string, defaultValue: T): T => {
  return safeLocalStorageOperation(
    () => {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    },
    defaultValue
  )
}

const safeSetToStorage = <T>(key: string, value: T): boolean => {
  return safeLocalStorageOperation(
    () => {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    },
    false
  )
}

// Safe Player Operations
export function getPlayers(): Player[] {
  return safeGetFromStorage(STORAGE_KEYS.PLAYERS, [])
}

export function getPlayerById(id: string): Player | null {
  const players = getPlayers()
  const player = players.find(p => p.id === id)
  
  if (!player) {
    console.warn(`Player not found: ${id}`)
    return {
      id,
      name: 'Former Player',
      initials: 'FP',
      joinedAt: new Date().toISOString()
    }
  }
  
  return player
}

export function createPlayer(name: string, email?: string): Player | null {
  try {
    // Validate input
    const validation = validatePlayer({ name, email })
    if (!validation.isValid) {
      console.error('Player validation failed:', validation.errors)
      return null
    }

    const existingPlayers = getPlayers()
    
    // Check for duplicate names (case-insensitive)
    const normalizedName = name.trim().toLowerCase()
    const duplicateName = existingPlayers.find(p => 
      p.name.toLowerCase() === normalizedName
    )
    
    if (duplicateName) {
      console.error(`Player with name "${name}" already exists`)
      return null
    }

    // Generate safe initials
    const existingInitials = new Set(existingPlayers.map(p => p.initials))
    const safeInitials = generateSafeInitials(name, existingInitials)

    // Generate unique ID
    const existingIds = new Set(existingPlayers.map(p => p.id))
    const uniqueId = generateUniqueId(existingIds, 'player_')

    const player: Player = {
      id: uniqueId,
      name: name.trim(),
      initials: safeInitials,
      email: email?.trim() || undefined,
      joinedAt: new Date().toISOString()
    }

    // Save to storage
    const updatedPlayers = [...existingPlayers, player]
    const saved = safeSetToStorage(STORAGE_KEYS.PLAYERS, updatedPlayers)
    
    if (!saved) {
      console.error('Failed to save player to storage')
      return null
    }

    // Set as current user if first player
    const currentUser = getCurrentUser()
    if (!currentUser) {
      setCurrentUser(player.id)
    }

    return player

  } catch (error) {
    console.error('Error creating player:', error)
    return null
  }
}

// Safe Game Operations  
export function getGames(): Game[] {
  return safeGetFromStorage(STORAGE_KEYS.GAMES, [])
}

export function getGameById(id: string): Game | null {
  const games = getGames()
  return games.find(g => g.id === id) || null
}

export function getGamesByGroupId(groupId: string): Game[] {
  const games = getGames()
  return games.filter(g => g.groupId === groupId)
}

export function createGame(
  groupId: string,
  name: string, 
  stakes: string,
  buyInAmount: number,
  bankPlayerId: string
): Game | null {
  try {
    const players = getPlayers()
    const groups = getGroups()
    const games = getGames()

    // Validate group exists
    const group = groups.find(g => g.id === groupId)
    if (!group) {
      console.error('Group not found:', groupId)
      return null
    }

    // Validate bank player exists
    const bankPlayer = players.find(p => p.id === bankPlayerId)
    if (!bankPlayer) {
      console.error('Bank player not found:', bankPlayerId)
      return null
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
      console.error('Game validation failed:', validation.errors)
      return null
    }

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

    // Save to storage
    const updatedGames = [...games, game]
    const saved = safeSetToStorage(STORAGE_KEYS.GAMES, updatedGames)
    
    if (!saved) {
      console.error('Failed to save game to storage')
      return null
    }

    return game

  } catch (error) {
    console.error('Error creating game:', error)
    return null
  }
}

export function addPlayerToGame(
  gameId: string,
  playerId: string,
  buyIn: number,
  rebuys: number = 0
): boolean {
  try {
    const games = getGames()
    const gameIndex = games.findIndex(g => g.id === gameId)
    
    if (gameIndex === -1) {
      console.error('Game not found:', gameId)
      return false
    }

    const game = games[gameIndex]
    
    if (game.status === 'completed') {
      console.error('Cannot add players to completed game')
      return false
    }

    // Check for duplicate player
    const existingPlayer = game.players.find(p => p.playerId === playerId)
    if (existingPlayer) {
      console.error('Player already in game:', playerId)
      return false
    }

    // Validate inputs
    if (buyIn < 0) {
      console.error('Buy-in cannot be negative')
      return false
    }

    if (rebuys < 0) {
      console.error('Rebuy count cannot be negative')  
      return false
    }

    // Add player to game
    const gamePlayer: GamePlayer = {
      playerId,
      buyIn,
      cashOut: 0,
      profit: 0,
      rebuys: rebuys || 0
    }

    games[gameIndex].players.push(gamePlayer)

    // Save to storage
    return safeSetToStorage(STORAGE_KEYS.GAMES, games)

  } catch (error) {
    console.error('Error adding player to game:', error)
    return false
  }
}

export function updatePlayerInGame(
  gameId: string,
  playerId: string,
  updates: Partial<GamePlayer>
): boolean {
  try {
    const games = getGames()
    const gameIndex = games.findIndex(g => g.id === gameId)
    
    if (gameIndex === -1) {
      console.error('Game not found:', gameId)
      return false
    }

    const game = games[gameIndex]
    const playerIndex = game.players.findIndex(p => p.playerId === playerId)
    
    if (playerIndex === -1) {
      console.error('Player not found in game:', playerId)
      return false
    }

    // Validate updates
    if (updates.buyIn !== undefined && updates.buyIn < 0) {
      console.error('Buy-in cannot be negative')
      return false
    }

    if (updates.rebuys !== undefined && updates.rebuys < 0) {
      console.error('Rebuy count cannot be negative')
      return false
    }

    // Apply updates
    games[gameIndex].players[playerIndex] = {
      ...games[gameIndex].players[playerIndex],
      ...updates
    }

    // Save to storage
    return safeSetToStorage(STORAGE_KEYS.GAMES, games)

  } catch (error) {
    console.error('Error updating player in game:', error)
    return false
  }
}

export function completeGame(gameId: string): boolean {
  try {
    const games = getGames()
    const gameIndex = games.findIndex(g => g.id === gameId)
    
    if (gameIndex === -1) {
      console.error('Game not found:', gameId)
      return false
    }

    const game = games[gameIndex]
    
    if (game.status === 'completed') {
      console.warn('Game already completed:', gameId)
      return true
    }

    if (game.players.length === 0) {
      console.error('Cannot complete game with no players')
      return false
    }

    // Mark game as completed
    games[gameIndex].status = 'completed'

    // Save to storage
    const saved = safeSetToStorage(STORAGE_KEYS.GAMES, games)
    
    if (saved) {
      // Generate settlements
      generateSettlements(games[gameIndex])
    }

    return saved

  } catch (error) {
    console.error('Error completing game:', error)
    return false
  }
}

// Safe Group Operations
export function getGroups(): Group[] {
  return safeGetFromStorage(STORAGE_KEYS.GROUPS, [])
}

export function getGroupById(id: string): Group | null {
  const groups = getGroups()
  return groups.find(g => g.id === id) || null
}

export function createGroup(name: string, description: string, createdBy: string): Group | null {
  try {
    const players = getPlayers()
    const groups = getGroups()

    // Validate input
    const groupData: Partial<Group> = {
      name: name.trim(),
      description: description.trim(),
      createdBy,
      members: [createdBy]
    }

    const validation = validateGroup(groupData, players)
    if (!validation.isValid) {
      console.error('Group validation failed:', validation.errors)
      return null
    }

    // Generate unique ID and invite code
    const existingIds = new Set(groups.map(g => g.id))
    const existingInviteCodes = new Set(groups.map(g => g.inviteCode))
    
    const uniqueId = generateUniqueId(existingIds, 'group_')
    let inviteCode = generateUniqueId(existingInviteCodes).toUpperCase()
    
    // Ensure invite code is exactly 8 characters
    inviteCode = inviteCode.substring(0, 8).padEnd(8, '0')

    const group: Group = {
      id: uniqueId,
      name: name.trim(),
      description: description.trim(),
      createdBy,
      createdAt: new Date().toISOString(),
      members: [createdBy],
      inviteCode
    }

    // Save to storage
    const updatedGroups = [...groups, group]
    const saved = safeSetToStorage(STORAGE_KEYS.GROUPS, updatedGroups)
    
    if (!saved) {
      console.error('Failed to save group to storage')
      return null
    }

    return group

  } catch (error) {
    console.error('Error creating group:', error)
    return null
  }
}

export function joinGroup(inviteCode: string, playerId: string): Group | null {
  try {
    const groups = getGroups()
    const groupIndex = groups.findIndex(g => g.inviteCode === inviteCode.toUpperCase())
    
    if (groupIndex === -1) {
      console.error('Invalid invite code:', inviteCode)
      return null
    }

    const group = groups[groupIndex]
    
    // Check if already a member
    if (group.members.includes(playerId)) {
      console.warn('Player already a member:', playerId)
      return group
    }

    // Add player to group
    groups[groupIndex].members.push(playerId)

    // Save to storage
    const saved = safeSetToStorage(STORAGE_KEYS.GROUPS, groups)
    
    if (!saved) {
      console.error('Failed to save group membership')
      return null
    }

    return groups[groupIndex]

  } catch (error) {
    console.error('Error joining group:', error)
    return null
  }
}

// Safe Settlement Operations
export function getSettlements(): Settlement[] {
  return safeGetFromStorage(STORAGE_KEYS.SETTLEMENTS, [])
}

export function generateSettlements(game: Game): Settlement[] {
  try {
    if (game.status !== 'completed' || game.players.length === 0) {
      return []
    }

    const existingSettlements = getSettlements()
    const gameSettlements: Settlement[] = []

    // Calculate player balances
    const playerBalances = game.players.map(p => ({
      playerId: p.playerId,
      balance: p.cashOut - p.buyIn
    }))

    // Simple settlement algorithm - creditors pay debtors
    const creditors = playerBalances.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance)
    const debtors = playerBalances.filter(p => p.balance < 0).sort((a, b) => a.balance - b.balance)

    let debtorIndex = 0
    let creditorIndex = 0

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex]
      const creditor = creditors[creditorIndex]

      const amountOwed = Math.abs(debtor.balance)
      const amountToReceive = creditor.balance
      const settlementAmount = Math.min(amountOwed, amountToReceive)

      if (settlementAmount > 0.01) { // Ignore cents
        const existingIds = new Set([...existingSettlements, ...gameSettlements].map(s => s.id))
        
        const settlement: Settlement = {
          id: generateUniqueId(existingIds, 'settlement_'),
          fromPlayerId: debtor.playerId,
          toPlayerId: creditor.playerId,
          amount: Math.round(settlementAmount * 100) / 100, // Round to cents
          gameId: game.id,
          groupId: game.groupId,
          isPaid: false,
          status: 'pending',
          createdAt: new Date().toISOString()
        }

        gameSettlements.push(settlement)
      }

      // Update balances
      debtor.balance += settlementAmount
      creditor.balance -= settlementAmount

      // Move to next if balance is settled
      if (Math.abs(debtor.balance) < 0.01) debtorIndex++
      if (Math.abs(creditor.balance) < 0.01) creditorIndex++
    }

    // Save settlements
    const allSettlements = [...existingSettlements, ...gameSettlements]
    safeSetToStorage(STORAGE_KEYS.SETTLEMENTS, allSettlements)

    return gameSettlements

  } catch (error) {
    console.error('Error generating settlements:', error)
    return []
  }
}

export function markSettlementPaid(settlementId: string): boolean {
  try {
    const settlements = getSettlements()
    const settlementIndex = settlements.findIndex(s => s.id === settlementId)
    
    if (settlementIndex === -1) {
      console.error('Settlement not found:', settlementId)
      return false
    }

    settlements[settlementIndex].status = 'paid'
    
    return safeSetToStorage(STORAGE_KEYS.SETTLEMENTS, settlements)

  } catch (error) {
    console.error('Error marking settlement as paid:', error)
    return false
  }
}

// Safe Utility Functions
export function getCurrentUser(): string | null {
  return safeGetFromStorage(STORAGE_KEYS.CURRENT_USER, null)
}

export function setCurrentUser(playerId: string): boolean {
  return safeSetToStorage(STORAGE_KEYS.CURRENT_USER, playerId)
}

export function getGameSummary(gameId: string): GameSummary | null {
  try {
    const game = getGameById(gameId)
    if (!game) return null

    const totalBuyIn = game.players.reduce((sum, p) => sum + p.buyIn, 0)
    const totalCashOut = game.players.reduce((sum, p) => sum + p.cashOut, 0)
    const isBalanced = Math.abs(totalBuyIn - totalCashOut) < 0.01

    const playerResults = game.players.map(p => ({
      playerId: p.playerId,
      buyIn: p.buyIn,
      cashOut: p.cashOut,
      profit: p.cashOut - p.buyIn
    }))

    return {
      gameId: game.id,
      totalBuyIn,
      totalCashOut,
      isBalanced,
      playerResults
    }

  } catch (error) {
    console.error('Error getting game summary:', error)
    return null
  }
}

export function getPlayerBalance(playerId: string, groupId?: string): PlayerBalance {
  try {
    const games = getGames()
    const settlements = getSettlements()

    let relevantGames = games.filter(g => g.status === 'completed')
    if (groupId) {
      relevantGames = relevantGames.filter(g => g.groupId === groupId)
    }

    // Calculate total profit/loss from games
    let totalProfit = 0
    let totalLoss = 0
    let gamesPlayed = 0

    relevantGames.forEach(game => {
      const gamePlayer = game.players.find(p => p.playerId === playerId)
      if (gamePlayer) {
        const profit = gamePlayer.cashOut - gamePlayer.buyIn
        if (profit > 0) {
          totalProfit += profit
        } else {
          totalLoss += Math.abs(profit)
        }
        gamesPlayed++
      }
    })

    // Calculate settlement balances
    let relevantSettlements = settlements.filter(s => s.status === 'pending')
    if (groupId) {
      relevantSettlements = relevantSettlements.filter(s => s.groupId === groupId)
    }

    const owedByOthers = relevantSettlements
      .filter(s => s.toPlayerId === playerId)
      .reduce((sum, s) => sum + s.amount, 0)

    const owesToOthers = relevantSettlements
      .filter(s => s.fromPlayerId === playerId)
      .reduce((sum, s) => sum + s.amount, 0)

    return {
      playerId,
      groupId: groupId || '',
      totalProfit,
      totalLoss,
      netBalance: totalProfit - totalLoss + owedByOthers - owesToOthers,
      gamesPlayed,
      owedByOthers,
      owesToOthers
    }

  } catch (error) {
    console.error('Error calculating player balance:', error)
    return {
      playerId,
      groupId: groupId || '',
      totalProfit: 0,
      totalLoss: 0,
      netBalance: 0,
      gamesPlayed: 0,
      owedByOthers: 0,
      owesToOthers: 0
    }
  }
}

// Data cleanup and maintenance
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    safeLocalStorageOperation(
      () => localStorage.removeItem(key),
      undefined
    )
  })
}

export function initializeSampleData(): void {
  const currentUser = getCurrentUser()
  if (currentUser && getPlayers().length > 1) {
    // Only add sample data if we have a current user and multiple players
    // This prevents sample data from showing on fresh installs
    return
  }
  
  // Sample data initialization would go here if needed
} 