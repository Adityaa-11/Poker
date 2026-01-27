import { Player, Game, GamePlayer, Group, Settlement } from './types'

// Validation error types
export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

// Player validation
export function validatePlayer(player: Partial<Player>): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Required fields
  if (!player.name?.trim()) {
    errors.push({ field: 'name', message: 'Player name is required', severity: 'error' })
  } else if (player.name.trim().length > 50) {
    errors.push({ field: 'name', message: 'Player name must be 50 characters or less', severity: 'error' })
  } else if (player.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Player name must be at least 2 characters', severity: 'error' })
  }

  // Email validation (optional but if provided must be valid)
  if (player.email && player.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(player.email.trim())) {
      errors.push({ field: 'email', message: 'Invalid email format', severity: 'error' })
    }
  }

  // Generate safe initials
  if (player.name?.trim()) {
    const words = player.name.trim().split(/\s+/)
    const generatedInitials = words.slice(0, 2).map(word => word[0]?.toUpperCase() || '').join('')
    if (!generatedInitials) {
      errors.push({ field: 'initials', message: 'Unable to generate initials from name', severity: 'error' })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Game validation
export function validateGame(game: Partial<Game>, players: Player[]): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Required fields
  if (!game.stakes?.trim()) {
    errors.push({ field: 'stakes', message: 'Game stakes are required', severity: 'error' })
  }

  if (!game.groupId?.trim()) {
    errors.push({ field: 'groupId', message: 'Group ID is required', severity: 'error' })
  }

  if (!game.date) {
    errors.push({ field: 'date', message: 'Game date is required', severity: 'error' })
  } else {
    const gameDate = new Date(game.date)
    const now = new Date()
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    
    if (gameDate > oneYearFromNow) {
      warnings.push({ field: 'date', message: 'Game date is more than a year in the future', severity: 'warning' })
    }
  }

  // Buy-in amount validation
  if (game.defaultBuyIn !== undefined) {
    if (game.defaultBuyIn < 0) {
      errors.push({ field: 'defaultBuyIn', message: 'Buy-in amount cannot be negative', severity: 'error' })
    } else if (game.defaultBuyIn > 10000) {
      warnings.push({ field: 'defaultBuyIn', message: 'Buy-in amount is unusually high ($10,000+)', severity: 'warning' })
    }
  }

  // Bank player validation
  if (game.bankPersonId) {
    const bankPlayer = players.find(p => p.id === game.bankPersonId)
    if (!bankPlayer) {
      errors.push({ field: 'bankPersonId', message: 'Bank player not found', severity: 'error' })
    }
  }

  // Game players validation
  if (game.players && game.players.length > 0) {
    const playerIds = new Set<string>()
    let totalBuyIn = 0
    let totalCashOut = 0

    game.players.forEach((gamePlayer, index) => {
      // Check for duplicate players
      if (playerIds.has(gamePlayer.playerId)) {
        errors.push({ 
          field: `players[${index}]`, 
          message: `Duplicate player: ${gamePlayer.playerId}`, 
          severity: 'error' 
        })
      }
      playerIds.add(gamePlayer.playerId)

      // Validate player exists
      const player = players.find(p => p.id === gamePlayer.playerId)
      if (!player) {
        errors.push({ 
          field: `players[${index}]`, 
          message: `Player not found: ${gamePlayer.playerId}`, 
          severity: 'error' 
        })
      }

      // Buy-in validation
      if (gamePlayer.buyIn < 0) {
        errors.push({ 
          field: `players[${index}].buyIn`, 
          message: 'Buy-in cannot be negative', 
          severity: 'error' 
        })
      } else if (gamePlayer.buyIn > 50000) {
        warnings.push({ 
          field: `players[${index}].buyIn`, 
          message: `Unusually high buy-in: $${gamePlayer.buyIn}`, 
          severity: 'warning' 
        })
      }

      // Cash-out validation
      if (gamePlayer.cashOut < -1000) {
        warnings.push({ 
          field: `players[${index}].cashOut`, 
          message: `Player owes significant money: $${Math.abs(gamePlayer.cashOut)}`, 
          severity: 'warning' 
        })
      } else if (gamePlayer.cashOut > 100000) {
        warnings.push({ 
          field: `players[${index}].cashOut`, 
          message: `Unusually high cash-out: $${gamePlayer.cashOut}`, 
          severity: 'warning' 
        })
      }

      // Skip rebuy validation as GamePlayer doesn't have rebuyCount property

      totalBuyIn += gamePlayer.buyIn
      totalCashOut += gamePlayer.cashOut
    })

    // Game balance validation
    if (game.isCompleted) {
      const difference = Math.abs(totalBuyIn - totalCashOut)
      const tolerance = Math.max(1, totalBuyIn * 0.01) // 1% tolerance or $1 minimum

      if (difference > tolerance) {
        warnings.push({ 
          field: 'balance', 
          message: `Game is unbalanced by $${difference.toFixed(2)}. This might be due to tips/rake.`, 
          severity: 'warning' 
        })
      }
    }

    // Single player warning
    if (game.players.length === 1) {
      warnings.push({ 
        field: 'players', 
        message: 'Game has only one player', 
        severity: 'warning' 
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Group validation
export function validateGroup(group: Partial<Group>, players: Player[]): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Required fields
  if (!group.name?.trim()) {
    errors.push({ field: 'name', message: 'Group name is required', severity: 'error' })
  } else if (group.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Group name must be 100 characters or less', severity: 'error' })
  }

  if (!group.description?.trim()) {
    warnings.push({ field: 'description', message: 'Group description is recommended', severity: 'warning' })
  } else if (group.description.trim().length > 500) {
    errors.push({ field: 'description', message: 'Group description must be 500 characters or less', severity: 'error' })
  }

  // Creator validation
  if (group.createdBy) {
    const creator = players.find(p => p.id === group.createdBy)
    if (!creator) {
      errors.push({ field: 'createdBy', message: 'Group creator not found', severity: 'error' })
    }
  }

  // Members validation
  if (group.members && group.members.length > 0) {
    const memberIds = new Set<string>()
    
    group.members.forEach((memberId, index) => {
      // Check for duplicate members
      if (memberIds.has(memberId)) {
        errors.push({ 
          field: `members[${index}]`, 
          message: `Duplicate member: ${memberId}`, 
          severity: 'error' 
        })
      }
      memberIds.add(memberId)

      // Validate member exists
      const member = players.find(p => p.id === memberId)
      if (!member) {
        warnings.push({ 
          field: `members[${index}]`, 
          message: `Member not found: ${memberId}`, 
          severity: 'warning' 
        })
      }
    })

    // Large group warning
    if (group.members.length > 50) {
      warnings.push({ 
        field: 'members', 
        message: `Large group with ${group.members.length} members may impact performance`, 
        severity: 'warning' 
      })
    }
  }

  // Invite code validation
  if (group.inviteCode) {
    if (group.inviteCode.length < 6) {
      errors.push({ field: 'inviteCode', message: 'Invite code must be at least 6 characters', severity: 'error' })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Financial validation helpers
export function validateFinancialData(amount: number, field: string): ValidationError[] {
  const errors: ValidationError[] = []

  if (!Number.isFinite(amount)) {
    errors.push({ field, message: 'Amount must be a valid number', severity: 'error' })
  } else if (Math.abs(amount) > 1000000) {
    errors.push({ field, message: 'Amount exceeds reasonable limits ($1M)', severity: 'error' })
  }

  return errors
}

// Safe mathematical operations
export function safeDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return defaultValue
  }
  return numerator / denominator
}

export function safeAverage(values: number[]): number {
  if (!values || values.length === 0) return 0
  const validValues = values.filter(v => Number.isFinite(v))
  if (validValues.length === 0) return 0
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length
}

export function safePercentage(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total === 0) return 0
  return Math.min(100, Math.max(0, (part / total) * 100))
}

// Generate unique ID with collision detection
export function generateUniqueId(existingIds: Set<string>, prefix: string = ''): string {
  let attempts = 0
  const maxAttempts = 100

  while (attempts < maxAttempts) {
    const id = prefix + Math.random().toString(36).substr(2, 9)
    if (!existingIds.has(id)) {
      return id
    }
    attempts++
  }

  // Fallback: use timestamp + random
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

// Safe initials generation with collision handling
export function generateSafeInitials(name: string, existingInitials: Set<string>): string {
  if (!name?.trim()) return '??'

  const words = name.trim().split(/\s+/)
  let initials = words.slice(0, 2).map(word => word[0]?.toUpperCase() || '').join('')
  
  if (!initials) return '??'

  // Handle collisions by adding numbers
  if (!existingInitials.has(initials)) {
    return initials
  }

  for (let i = 2; i <= 99; i++) {
    const numbered = `${initials}${i}`
    if (!existingInitials.has(numbered)) {
      return numbered
    }
  }

  // Final fallback
  return initials + Math.random().toString(36).substr(2, 2).toUpperCase()
}

// Local storage safety wrapper
export function safeLocalStorageOperation<T>(
  operation: () => T,
  fallback: T,
  errorCallback?: (error: Error) => void
): T {
  try {
    if (typeof window === 'undefined') return fallback
    return operation()
  } catch (error) {
    console.error('LocalStorage operation failed:', error)
    errorCallback?.(error as Error)
    return fallback
  }
} 