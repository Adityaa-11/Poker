export interface Player {
  id: string
  name: string
  initials: string
  email?: string
  joinedAt?: string
}

export interface GamePlayer {
  playerId: string
  buyIn: number
  cashOut: number
  profit: number
  // Game participation status
  hasOptedIn?: boolean
  optedInAt?: string
  hasCashedOut?: boolean
  cashedOutAt?: string
  // Additional player game properties
  rebuys?: number
  rebuyAmount?: number
  totalInvested?: number
  finalStack?: number
  position?: number
  eliminatedBy?: string
  eliminatedAt?: string
  handsPlayed?: number
  biggestPot?: number
  bestHand?: string
  bluffsWon?: number
  showdowns?: number
  showdownWins?: number
  vpip?: number
  pfr?: number
  aggression?: number
  tightness?: number
  notes?: string
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible'
  confidence?: number
  fatigue?: number
  focus?: number
  tilt?: boolean
  alcohol?: boolean
  food?: string[]
  breaks?: number
  timeAway?: number
  netResult?: number
  hourlyRate?: number
  bb100?: number
  roi?: number
  isMvp?: boolean
}

export interface Game {
  id: string
  groupId: string
  date: string
  stakes: string
  defaultBuyIn: number
  bankPersonId: string
  players: GamePlayer[]
  isCompleted: boolean
  createdAt: string
  updatedAt: string
  // Additional game properties
  name?: string
  description?: string
  location?: string
  duration?: number
  startTime?: string
  endTime?: string
  maxPlayers?: number
  minPlayers?: number
  gameType?: string
  blindStructure?: string
  buyInRange?: { min: number; max: number }
  rebuyAllowed?: boolean
  maxRebuys?: number
  rebuyAmount?: number
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled'
  weather?: string
  notes?: string
  photos?: string[]
  tags?: string[]
  season?: string
  tournament?: boolean
  prizePool?: number
  entryFee?: number
  rakePercentage?: number
  dealerTips?: number
  expenses?: number
  venue?: string
  hostId?: string
  mvpPlayerId?: string
}

export interface Group {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt?: string
  createdBy?: string
  members: string[]
  inviteCode: string
}

export interface Settlement {
  id: string
  fromPlayerId: string
  toPlayerId: string
  amount: number
  gameId: string
  groupId?: string
  isPaid: boolean
  status?: 'pending' | 'paid' | 'cancelled'
  createdAt: string
  paidAt?: string
  method?: string
  notes?: string
}

export interface PlayerBalance {
  playerId: string
  groupId: string
  totalProfit: number
  totalLoss: number
  netBalance: number
  gamesPlayed: number
  owedByOthers: number
  owesToOthers: number
}

export interface GameSummary {
  gameId: string
  totalBuyIn: number
  totalCashOut: number
  isBalanced: boolean
  biggestWinner?: { playerId: string; amount: number } | null
  biggestLoser?: { playerId: string; amount: number } | null
  playerResults: {
    playerId: string
    buyIn: number
    cashOut: number
    profit: number
  }[]
}

export interface PlayerStatistics {
  playerId: string
  groupId: string
  gamesPlayed: number
  totalGames: number
  totalProfit: number
  totalLoss: number
  netBalance: number
  averageProfit: number
  avgProfit: number
  winRate: number
  biggestWin: number
  biggestLoss: number
  avgBuyIn: number
  totalBuyIn: number
  totalRebuys: number
  consistencyScore: number
  improvementScore: number
  riskScore: number
  currentStreak: number
  profitLast30Days: number
  profitLast90Days: number
  overallScore?: number
  rank?: number
  // Additional properties that might be used
  winCount?: number
  lossCount?: number
  breakEvenCount?: number
  longestWinStreak?: number
  longestLossStreak?: number
  totalCashOut?: number
  totalSessions?: number
  averageSessionLength?: number
  favoriteStakes?: string
  bestMonth?: string
  worstMonth?: string
  monthlyStats?: { [month: string]: number }
  yearlyStats?: { [year: string]: number }
  recentForm?: number[]
  volatility?: number
  sharpeRatio?: number
  maxDrawdown?: number
  recoveryFactor?: number
  mvpCount?: number
  socialScore?: number
  bestStreak?: number
  worstStreak?: number
  handsPlayed?: number
  showdownPercentage?: number
  bluffSuccess?: number
  aggression?: number
  tightness?: number
  luckyFactor?: number
  skillRating?: number
  experiencePoints?: number
  achievements?: string[]
  badges?: string[]
  notes?: string
  mood?: string
  confidence?: number
  fatigue?: number
  tiltFactor?: number
  lastGameDate?: string
}

export interface GroupLeaderboard {
  groupId: string
  players: PlayerStatistics[]
  lastUpdated: string
  overallMvp: string
  mostImproved: string
  riskTaker: string
  mostConsistent: string
  comebackKing: string
  highRoller: string
  luckiest?: string
  biggestWinner?: { playerId: string; amount: number } | null
  biggestLoser?: { playerId: string; amount: number } | null
  currentStreak: { playerId: string; streakType: 'win' | 'loss'; count: number }
  topEarners: { playerId: string; amount: number }[]
  rankings: { playerId: string; score: number }[]
  // Additional leaderboard properties
  mostGames?: string
  bestWinRate?: string
  biggestSwing?: string
  mostVolatile?: string
  bestRecovery?: string
  hotStreak?: string
  coldStreak?: string
  bestMonth?: { playerId: string; month: string; profit: number }
  worstMonth?: { playerId: string; month: string; profit: number }
  seasonStats?: { [season: string]: any }
  trends?: { [playerId: string]: 'up' | 'down' | 'stable' }
  predictions?: { [playerId: string]: number }
}

export interface PlayerAward {
  id: string
  playerId: string
  groupId: string
  type: 'biggest_winner' | 'biggest_loser' | 'most_consistent' | 'luckiest' | 'most_games' | 'overall_mvp' | 'most_improved' | 'risk_taker' | 'comeback_king' | 'high_roller' | 'mvp_overall' | 'mvp_most_improved' | 'mvp_risk_taker' | 'mvp_consistent' | 'mvp_comeback' | 'mvp_high_roller'
  awardType?: string
  title: string
  description: string
  value: number
  condition?: boolean
  dateAwarded: string
} 