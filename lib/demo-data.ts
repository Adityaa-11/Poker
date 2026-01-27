import { Player, Game, Group, Settlement } from './types'

// Anchor demo "today" so the dataset stays current to Jan 2026,
// even if you load demo mode later.
const DEMO_NOW = new Date('2026-01-25T12:00:00.000Z')

// Demo user type with password for authentication
export interface DemoUser extends Player {
  password: string
}

// Demo user credentials for testing
export const DEMO_USERS = {
  TEST: {
    id: 'demo-test-000',
    name: 'Demo Tester',
    initials: 'DT',
    email: 'test@pokerpals.com',
    password: '123',
    joinedAt: '2025-01-01T10:00:00Z'
  },
  ALICE: {
    id: 'demo-alice-001',
    name: 'Alice Johnson',
    initials: 'AJ',
    email: 'alice@pokerpals.com',
    password: 'alice123',
    joinedAt: '2025-01-15T10:00:00Z'
  },
  BOB: {
    id: 'demo-bob-002',
    name: 'Bob Smith',
    initials: 'BS',
    email: 'bob@pokerpals.com',
    password: 'bob123',
    joinedAt: '2025-01-16T10:00:00Z'
  },
  CHARLIE: {
    id: 'demo-charlie-003',
    name: 'Charlie Davis',
    initials: 'CD',
    email: 'charlie@pokerpals.com',
    password: 'charlie123',
    joinedAt: '2025-01-17T10:00:00Z'
  },
  DIANA: {
    id: 'demo-diana-004',
    name: 'Diana Wilson',
    initials: 'DW',
    email: 'diana@pokerpals.com',
    password: 'diana123',
    joinedAt: '2025-01-18T10:00:00Z'
  }
}

// Main demo user (backwards compatibility)
export const DEMO_USER: DemoUser = DEMO_USERS.TEST

// Demo players for realistic games
export const DEMO_PLAYERS: Player[] = [
  DEMO_USERS.TEST,
  DEMO_USERS.ALICE,
  DEMO_USERS.BOB,
  DEMO_USERS.CHARLIE,
  DEMO_USERS.DIANA,
  { id: 'player-alice', name: 'Alice Johnson', initials: 'AJ', email: 'alice@demo.com', joinedAt: '2025-01-10T10:00:00Z' },
  { id: 'player-bob', name: 'Bob Smith', initials: 'BS', email: 'bob@demo.com', joinedAt: '2025-01-12T10:00:00Z' },
  { id: 'player-charlie', name: 'Charlie Brown', initials: 'CB', email: 'charlie@demo.com', joinedAt: '2025-01-14T10:00:00Z' },
  { id: 'player-diana', name: 'Diana Prince', initials: 'DP', email: 'diana@demo.com', joinedAt: '2025-01-16T10:00:00Z' },
  { id: 'player-eve', name: 'Eve Wilson', initials: 'EW', email: 'eve@demo.com', joinedAt: '2025-01-18T10:00:00Z' },
  { id: 'player-frank', name: 'Frank Miller', initials: 'FM', email: 'frank@demo.com', joinedAt: '2025-01-20T10:00:00Z' },
  { id: 'player-grace', name: 'Grace Lee', initials: 'GL', email: 'grace@demo.com', joinedAt: '2025-01-22T10:00:00Z' },
  { id: 'player-henry', name: 'Henry Davis', initials: 'HD', email: 'henry@demo.com', joinedAt: '2025-01-24T10:00:00Z' },
]

// Demo groups
export const DEMO_GROUPS: Group[] = [
  {
    id: 'group-friday-night',
    name: 'Friday Night Poker',
    description: 'Weekly Friday night games with the crew',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
    createdBy: DEMO_USERS.ALICE.id,
    members: [
      DEMO_USERS.TEST.id,
      DEMO_USERS.ALICE.id,
      DEMO_USERS.BOB.id,
      DEMO_USERS.CHARLIE.id,
      DEMO_USERS.DIANA.id,
      'player-alice',
      'player-bob',
      'player-charlie',
      'player-diana'
    ],
    inviteCode: 'FRIDAY123'
  },
  {
    id: 'group-high-stakes',
    name: 'High Stakes Club',
    description: 'For serious players only - higher buy-ins',
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
    createdBy: DEMO_USERS.ALICE.id,
    members: [
      DEMO_USERS.TEST.id,
      DEMO_USERS.ALICE.id,
      DEMO_USERS.DIANA.id,
      'player-alice',
      'player-eve',
      'player-frank',
      'player-grace'
    ],
    inviteCode: 'HIGHSTAKES'
  },
  {
    id: 'group-casual',
    name: 'Casual Sunday Games',
    description: 'Relaxed Sunday afternoon poker',
    createdAt: '2025-02-15T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z',
    createdBy: DEMO_USERS.BOB.id,
    members: [
      DEMO_USERS.TEST.id,
      DEMO_USERS.BOB.id,
      DEMO_USERS.CHARLIE.id,
      'player-bob',
      'player-charlie',
      'player-henry',
      'player-diana'
    ],
    inviteCode: 'SUNDAY456'
  }
]

// Generate realistic game data leading up to Jan 2026
export const generateDemoGames = (baseDate: Date = DEMO_NOW, currentUserId: string = DEMO_USER.id): Game[] => {
  const games: Game[] = []
  const now = new Date(baseDate)
  
  // Generate games for the past ~400 days (covers 2025 + Jan 2026)
  for (let i = 0; i < 400; i++) {
    const gameDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
    
    // Skip some days randomly (not every day has a game)
    if (Math.random() < 0.6) continue
    
    // Determine which group (Friday Night games are more frequent)
    let groupId: string
    let stakes: string
    let defaultBuyIn: number
    let playerPool: string[]
    
    const dayOfWeek = gameDate.getDay()
    if (dayOfWeek === 5 && Math.random() < 0.8) { // Friday
      groupId = 'group-friday-night'
      stakes = '$1/$2 NLHE'
      defaultBuyIn = 200
      playerPool = DEMO_GROUPS[0].members
    } else if (dayOfWeek === 0 && Math.random() < 0.6) { // Sunday
      groupId = 'group-casual'
      stakes = '$0.50/$1 NLHE'
      defaultBuyIn = 100
      playerPool = DEMO_GROUPS[2].members
    } else if (Math.random() < 0.3) { // High stakes (less frequent)
      groupId = 'group-high-stakes'
      stakes = '$2/$5 NLHE'
      defaultBuyIn = 500
      playerPool = DEMO_GROUPS[1].members
    } else {
      continue
    }
    
    // Select 4-7 players randomly
    const numPlayers = Math.floor(Math.random() * 4) + 4
    const selectedPlayers = playerPool
      .sort(() => Math.random() - 0.5)
      .slice(0, numPlayers)
    
    // Ensure the active demo user is always included
    if (!selectedPlayers.includes(currentUserId)) {
      selectedPlayers[0] = currentUserId
    }
    
    // Generate game results
    const players = selectedPlayers.map(playerId => {
      const buyIn = defaultBuyIn + (Math.random() - 0.5) * 100 // ±$50 variation
      
      // Generate realistic cash out (some win, some lose)
      let cashOut: number
      const winChance = playerId === currentUserId ? 0.55 : 0.45 // Active demo user has slight edge
      
      if (Math.random() < winChance) {
        // Winner: 110% to 250% of buy-in
        cashOut = buyIn * (1.1 + Math.random() * 1.4)
      } else {
        // Loser: 0% to 90% of buy-in
        cashOut = buyIn * (Math.random() * 0.9)
      }
      
      return {
        playerId,
        buyIn: Math.round(buyIn),
        cashOut: Math.round(cashOut),
        profit: Math.round(cashOut - buyIn)
      }
    })
    
    const game: Game = {
      id: `game-${gameDate.getTime()}`,
      groupId,
      date: gameDate.toISOString(),
      stakes,
      defaultBuyIn,
      bankPersonId: selectedPlayers[0],
      players,
      isCompleted: true,
      createdAt: gameDate.toISOString(),
      updatedAt: gameDate.toISOString()
    }
    
    games.push(game)
  }
  
  return games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Generate settlements based on games
export const generateDemoSettlements = (games: Game[]): Settlement[] => {
  const settlements: Settlement[] = []
  
  games.forEach(game => {
    const winners = game.players.filter(p => p.profit > 0)
    const losers = game.players.filter(p => p.profit < 0)
    
    // Create settlements between winners and losers
    losers.forEach((loser, index) => {
      if (winners[index % winners.length]) {
        const winner = winners[index % winners.length]
        const amount = Math.abs(loser.profit)
        
        const isPaid = Math.random() < 0.5 // 50% are paid (more unpaid settlements to see)
        
        const settlement: Settlement = {
          id: `settlement-${game.id}-${loser.playerId}-${winner.playerId}`,
          fromPlayerId: loser.playerId,
          toPlayerId: winner.playerId,
          amount,
          gameId: game.id,
          groupId: game.groupId,
          isPaid,
          status: isPaid ? 'paid' : 'pending',
          createdAt: game.date,
          paidAt: isPaid ? new Date(new Date(game.date).getTime() + 24 * 60 * 60 * 1000).toISOString() : undefined
        }
        
        settlements.push(settlement)
      }
    })
  })
  
  return settlements
}

// Function to load all demo data
export const loadDemoData = (currentUser: DemoUser = DEMO_USER) => {
  const games = generateDemoGames(DEMO_NOW, currentUser.id)
  const settlements = generateDemoSettlements(games)
  
  // Store in localStorage using the correct keys that data-manager expects
  localStorage.setItem('poker_players', JSON.stringify(DEMO_PLAYERS))
  localStorage.setItem('poker_groups', JSON.stringify(DEMO_GROUPS))
  localStorage.setItem('poker_games', JSON.stringify(games))
  localStorage.setItem('poker_settlements', JSON.stringify(settlements))
  localStorage.setItem('poker_current_user', currentUser.id) // Store the specific user's ID
  
  console.log('🎮 Demo data loaded!')
  console.log(`📊 Generated ${games.length} games`)
  console.log(`💰 Generated ${settlements.length} settlements`)
  console.log(`👥 ${DEMO_GROUPS.length} groups with ${DEMO_PLAYERS.length} players`)
  console.log(`🎯 Current user: ${currentUser.name} (${currentUser.id})`)
  console.log('🔍 Sample game:', games[0])
  console.log('🔍 User games:', games.filter(g => g.players.some(p => p.playerId === currentUser.id)).length)
}

// Function to clear demo data
export const clearDemoData = () => {
  localStorage.removeItem('poker_players')
  localStorage.removeItem('poker_groups')
  localStorage.removeItem('poker_games')
  localStorage.removeItem('poker_settlements')
  localStorage.removeItem('poker_current_user')
  
  console.log('🧹 Demo data cleared!')
}

// Check if demo mode is active
export const isDemoMode = (): boolean => {
  const currentUserId = localStorage.getItem('poker_current_user')
  if (!currentUserId) return false
  
  // Check if current user is any of the demo users
  const demoUserIds = Object.values(DEMO_USERS).map(user => user.id)
  return demoUserIds.includes(currentUserId)
}

// Debug function to check localStorage
export const debugDemoData = () => {
  console.log('🔍 Debug Demo Data:')
  console.log('poker_current_user:', localStorage.getItem('poker_current_user'))
  console.log('poker_players:', JSON.parse(localStorage.getItem('poker_players') || '[]').length, 'players')
  console.log('poker_groups:', JSON.parse(localStorage.getItem('poker_groups') || '[]').length, 'groups')
  console.log('poker_games:', JSON.parse(localStorage.getItem('poker_games') || '[]').length, 'games')
  console.log('poker_settlements:', JSON.parse(localStorage.getItem('poker_settlements') || '[]').length, 'settlements')
  
  const games = JSON.parse(localStorage.getItem('poker_games') || '[]') as Game[]
  const completedGames = games.filter((g: Game) => g.isCompleted)
  const userGames = games.filter((g: Game) => g.players.some(p => p.playerId === DEMO_USER.id))
  
  console.log('Completed games:', completedGames.length)
  console.log('User games:', userGames.length)
  console.log('Sample game:', games[0])
}

// Demo login function
export const demoLogin = (user?: DemoUser): boolean => {
  const currentUser = user || DEMO_USER
  loadDemoData(currentUser)
  
  // Debug the loaded data
  setTimeout(() => {
    debugDemoData()
  }, 100)
  
  // Dispatch a custom event to notify contexts to refresh
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('demoDataLoaded'))
    // Make debug function available globally
    ;(window as any).debugDemoData = debugDemoData
  }
  
  return true
}
