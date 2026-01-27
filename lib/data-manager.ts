import { Player, Game, Group, Settlement, GamePlayer, PlayerBalance, GameSummary } from './types';

const STORAGE_KEYS = {
  PLAYERS: 'poker_players',
  GAMES: 'poker_games',
  GROUPS: 'poker_groups',
  SETTLEMENTS: 'poker_settlements',
  CURRENT_USER: 'poker_current_user',
};

// Utility functions
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateInviteCode = () => Math.random().toString(36).substr(2, 8).toUpperCase();

// Storage utilities
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// Player Management
export const createPlayer = (name: string, email?: string): Player => {
  const players = getPlayers();
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  const player: Player = {
    id: generateId(),
    name,
    initials,
    email,
  };
  
  players.push(player);
  setToStorage(STORAGE_KEYS.PLAYERS, players);
  
  // If this is the first player or no current user set, make this the current user
  const currentUserId = getCurrentUser();
  if (!currentUserId) {
    setCurrentUser(player.id);
  }
  
  return player;
};

export const getPlayers = (): Player[] => {
  return getFromStorage(STORAGE_KEYS.PLAYERS, []);
};

export const getPlayerById = (id: string): Player | null => {
  const players = getPlayers();
  return players.find(p => p.id === id) || null;
};

export const getCurrentUser = (): Player | null => {
  const userId = getFromStorage(STORAGE_KEYS.CURRENT_USER, null);
  return userId ? getPlayerById(userId) : null;
};

export const setCurrentUser = (playerId: string): void => {
  setToStorage(STORAGE_KEYS.CURRENT_USER, playerId);
};

// Group Management
export const createGroup = (name: string, description?: string): Group => {
  const groups = getGroups();
  const currentUser = getCurrentUser();
  
  const group: Group = {
    id: generateId(),
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: currentUser ? [currentUser.id] : [],
    inviteCode: generateInviteCode(),
  };
  
  groups.push(group);
  setToStorage(STORAGE_KEYS.GROUPS, groups);
  return group;
};

export const getGroups = (): Group[] => {
  return getFromStorage(STORAGE_KEYS.GROUPS, []);
};

export const getGroupById = (id: string): Group | null => {
  const groups = getGroups();
  return groups.find(g => g.id === id) || null;
};

export const addMemberToGroup = (groupId: string, playerId: string): boolean => {
  const groups = getGroups();
  const groupIndex = groups.findIndex(g => g.id === groupId);
  
  if (groupIndex === -1) return false;
  
  if (!groups[groupIndex].members.includes(playerId)) {
    groups[groupIndex].members.push(playerId);
    groups[groupIndex].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.GROUPS, groups);
  }
  
  return true;
};

// Game Management
export const createGame = (
  groupId: string,
  stakes: string,
  defaultBuyIn: number,
  bankPersonId: string
): Game => {
  const games = getGames();
  
  const game: Game = {
    id: generateId(),
    groupId,
    date: new Date().toISOString(),
    stakes,
    defaultBuyIn,
    bankPersonId,
    players: [],
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  games.push(game);
  setToStorage(STORAGE_KEYS.GAMES, games);
  return game;
};

export const getGames = (): Game[] => {
  return getFromStorage(STORAGE_KEYS.GAMES, []);
};

export const getGameById = (id: string): Game | null => {
  const games = getGames();
  return games.find(g => g.id === id) || null;
};

export const getGamesByGroupId = (groupId: string): Game[] => {
  const games = getGames();
  return games.filter(g => g.groupId === groupId);
};

export const addPlayerToGame = (gameId: string, playerId: string, buyIn?: number): boolean => {
  const games = getGames();
  const gameIndex = games.findIndex(g => g.id === gameId);
  
  if (gameIndex === -1) return false;
  
  const game = games[gameIndex];
  const existingPlayerIndex = game.players.findIndex(p => p.playerId === playerId);
  
  if (existingPlayerIndex === -1) {
    const gamePlayer: GamePlayer = {
      playerId,
      buyIn: buyIn || game.defaultBuyIn,
      cashOut: 0,
      profit: 0,
    };
    
    game.players.push(gamePlayer);
    game.updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.GAMES, games);
  }
  
  return true;
};

export const updatePlayerInGame = (
  gameId: string, 
  playerId: string, 
  updates: Partial<GamePlayer>
): boolean => {
  const games = getGames();
  const gameIndex = games.findIndex(g => g.id === gameId);
  
  if (gameIndex === -1) return false;
  
  const game = games[gameIndex];
  const playerIndex = game.players.findIndex(p => p.playerId === playerId);
  
  if (playerIndex === -1) return false;
  
  game.players[playerIndex] = { ...game.players[playerIndex], ...updates };
  game.players[playerIndex].profit = game.players[playerIndex].cashOut - game.players[playerIndex].buyIn;
  game.updatedAt = new Date().toISOString();
  
  setToStorage(STORAGE_KEYS.GAMES, games);
  return true;
};

export const removePlayerFromGame = (gameId: string, playerId: string): boolean => {
  const games = getGames();
  const gameIndex = games.findIndex(g => g.id === gameId);
  
  if (gameIndex === -1) return false;
  
  const game = games[gameIndex];
  
  // Don't allow removing players from completed games
  if (game.isCompleted) return false;
  
  const playerIndex = game.players.findIndex(p => p.playerId === playerId);
  if (playerIndex === -1) return false;
  
  // Remove the player from the game
  game.players.splice(playerIndex, 1);
  game.updatedAt = new Date().toISOString();
  setToStorage(STORAGE_KEYS.GAMES, games);
  
  return true;
};

// New game flow functions
export const optInToGame = (gameId: string, playerId: string, buyIn: number): boolean => {
  const games = getGames();
  const gameIndex = games.findIndex(g => g.id === gameId);
  
  if (gameIndex === -1) return false;
  
  const game = games[gameIndex];
  
  // Don't allow opting in to completed games
  if (game.isCompleted) return false;
  
  // Check if player is already in the game
  const existingPlayerIndex = game.players.findIndex(p => p.playerId === playerId);
  
  if (existingPlayerIndex !== -1) {
    // Update existing player
    game.players[existingPlayerIndex] = {
      ...game.players[existingPlayerIndex],
      buyIn,
      hasOptedIn: true,
      optedInAt: new Date().toISOString(),
      hasCashedOut: false,
      profit: 0 - buyIn // Initial profit is negative buy-in
    };
  } else {
    // Add new player
    game.players.push({
      playerId,
      buyIn,
      cashOut: 0,
      profit: 0 - buyIn,
      hasOptedIn: true,
      optedInAt: new Date().toISOString(),
      hasCashedOut: false,
      rebuys: 0,
      rebuyAmount: 0
    });
  }
  
  game.updatedAt = new Date().toISOString();
  setToStorage(STORAGE_KEYS.GAMES, games);
  return true;
};

export const addRebuyToGame = (gameId: string, playerId: string, rebuyAmount: number): boolean => {
  const games = getGames();
  const gameIndex = games.findIndex(g => g.id === gameId);
  
  if (gameIndex === -1) return false;
  
  const game = games[gameIndex];
  const playerIndex = game.players.findIndex(p => p.playerId === playerId);
  
  if (playerIndex === -1 || game.isCompleted) return false;
  
  const player = game.players[playerIndex];
  
  // Update player with rebuy
  game.players[playerIndex] = {
    ...player,
    rebuys: (player.rebuys || 0) + 1,
    rebuyAmount: (player.rebuyAmount || 0) + rebuyAmount,
    profit: player.cashOut - (player.buyIn + (player.rebuyAmount || 0) + rebuyAmount)
  };
  
  game.updatedAt = new Date().toISOString();
  setToStorage(STORAGE_KEYS.GAMES, games);
  return true;
};

export const cashOutFromGame = (gameId: string, playerId: string, cashOutAmount: number): boolean => {
  const games = getGames();
  const gameIndex = games.findIndex(g => g.id === gameId);
  
  if (gameIndex === -1) return false;
  
  const game = games[gameIndex];
  const playerIndex = game.players.findIndex(p => p.playerId === playerId);
  
  if (playerIndex === -1 || game.isCompleted) return false;
  
  const player = game.players[playerIndex];
  const totalInvested = player.buyIn + (player.rebuyAmount || 0);
  
  // Update player with cash out
  game.players[playerIndex] = {
    ...player,
    cashOut: cashOutAmount,
    profit: cashOutAmount - totalInvested,
    hasCashedOut: true,
    cashedOutAt: new Date().toISOString()
  };
  
  game.updatedAt = new Date().toISOString();
  
  // Check if all players have cashed out
  const activePlayers = game.players.filter(p => p.hasOptedIn && !p.hasCashedOut);
  if (activePlayers.length === 0 && game.players.length > 0) {
    // Auto-complete the game
    game.isCompleted = true;
    // Create settlements
    createSettlementsForGame(gameId);
  }
  
  setToStorage(STORAGE_KEYS.GAMES, games);
  return true;
};

export const completeGame = (gameId: string): boolean => {
  const games = getGames();
  const gameIndex = games.findIndex(g => g.id === gameId);
  
  if (gameIndex === -1) return false;
  
  games[gameIndex].isCompleted = true;
  games[gameIndex].updatedAt = new Date().toISOString();
  
  setToStorage(STORAGE_KEYS.GAMES, games);
  
  // Create settlements
  createSettlementsForGame(gameId);
  
  return true;
};

// Settlement Management
export const createSettlementsForGame = (gameId: string): Settlement[] => {
  const game = getGameById(gameId);
  if (!game) return [];
  
  const settlements: Settlement[] = [];
  const winners = game.players.filter(p => p.profit > 0);
  const losers = game.players.filter(p => p.profit < 0);
  
  // Simple settlement algorithm: each loser pays proportionally to each winner
  losers.forEach(loser => {
    const totalOwed = Math.abs(loser.profit);
    const totalWon = winners.reduce((sum, w) => sum + w.profit, 0);
    
    winners.forEach(winner => {
      const proportion = winner.profit / totalWon;
      const amount = Math.round(totalOwed * proportion * 100) / 100;
      
      if (amount > 0) {
        const settlement: Settlement = {
          id: generateId(),
          fromPlayerId: loser.playerId,
          toPlayerId: winner.playerId,
          amount,
          gameId,
          isPaid: false,
          createdAt: new Date().toISOString(),
        };
        
        settlements.push(settlement);
      }
    });
  });
  
  const existingSettlements = getSettlements();
  const allSettlements = [...existingSettlements, ...settlements];
  setToStorage(STORAGE_KEYS.SETTLEMENTS, allSettlements);
  
  return settlements;
};

export const getSettlements = (): Settlement[] => {
  return getFromStorage(STORAGE_KEYS.SETTLEMENTS, []);
};

export const markSettlementPaid = (settlementId: string): boolean => {
  const settlements = getSettlements();
  const settlementIndex = settlements.findIndex(s => s.id === settlementId);
  
  if (settlementIndex === -1) return false;
  
  settlements[settlementIndex].isPaid = true;
  settlements[settlementIndex].paidAt = new Date().toISOString();
  
  setToStorage(STORAGE_KEYS.SETTLEMENTS, settlements);
  return true;
};

export const toggleSettlementPayment = (settlementId: string): boolean => {
  const settlements = getSettlements();
  const settlementIndex = settlements.findIndex(s => s.id === settlementId);
  
  if (settlementIndex === -1) return false;
  
  const settlement = settlements[settlementIndex];
  
  if (settlement.isPaid) {
    // Mark as unpaid
    settlements[settlementIndex].isPaid = false;
    settlements[settlementIndex].paidAt = undefined;
    settlements[settlementIndex].status = 'pending';
  } else {
    // Mark as paid
    settlements[settlementIndex].isPaid = true;
    settlements[settlementIndex].paidAt = new Date().toISOString();
    settlements[settlementIndex].status = 'paid';
  }
  
  setToStorage(STORAGE_KEYS.SETTLEMENTS, settlements);
  return true;
};

// Player payment tracking (separate from settlements)
const STORAGE_KEYS_PAYMENTS = {
  PLAYER_PAYMENTS: 'poker_player_payments'
};

interface PlayerPayment {
  gameId: string
  playerId: string
  isPaid: boolean
  paidAt?: string
}

export const getPlayerPayments = (): PlayerPayment[] => {
  return getFromStorage(STORAGE_KEYS_PAYMENTS.PLAYER_PAYMENTS, []);
};

export const togglePlayerPayment = (gameId: string, playerId: string): boolean => {
  const payments = getPlayerPayments();
  const existingIndex = payments.findIndex(p => p.gameId === gameId && p.playerId === playerId);
  
  if (existingIndex !== -1) {
    // Toggle existing payment
    payments[existingIndex].isPaid = !payments[existingIndex].isPaid;
    payments[existingIndex].paidAt = payments[existingIndex].isPaid 
      ? new Date().toISOString() 
      : undefined;
  } else {
    // Create new payment record
    payments.push({
      gameId,
      playerId,
      isPaid: true,
      paidAt: new Date().toISOString()
    });
  }
  
  setToStorage(STORAGE_KEYS_PAYMENTS.PLAYER_PAYMENTS, payments);
  return true;
};

export const getPlayerPaymentStatus = (gameId: string, playerId: string): boolean => {
  const payments = getPlayerPayments();
  const payment = payments.find(p => p.gameId === gameId && p.playerId === playerId);
  return payment?.isPaid || false;
};

// Analytics and Calculations
export const calculatePlayerBalance = (playerId: string): PlayerBalance => {
  const games = getGames().filter(g => g.isCompleted);
  const settlements = getSettlements();
  
  let totalProfit = 0;
  
  // Calculate profit from completed games
  games.forEach(game => {
    const playerInGame = game.players.find(p => p.playerId === playerId);
    if (playerInGame) {
      totalProfit += playerInGame.profit;
    }
  });
  
  // Calculate amounts owed
  const owedByOthers = settlements
    .filter(s => s.toPlayerId === playerId && !s.isPaid)
    .reduce((sum, s) => sum + s.amount, 0);
    
  const owesToOthers = settlements
    .filter(s => s.fromPlayerId === playerId && !s.isPaid)
    .reduce((sum, s) => sum + s.amount, 0);
  
  return {
    playerId,
    groupId: '',
    totalProfit,
    totalLoss: Math.abs(Math.min(0, totalProfit)),
    owedByOthers,
    owesToOthers,
    netBalance: totalProfit, // This would be totalProfit + owedByOthers - owesToOthers in a real system
    gamesPlayed: games.filter(g => g.players.some(p => p.playerId === playerId)).length,
  };
};

export const calculateGameSummary = (gameId: string): GameSummary | null => {
  const game = getGameById(gameId);
  if (!game) return null;
  
  const totalBuyIn = game.players.reduce((sum, p) => sum + p.buyIn, 0);
  const totalCashOut = game.players.reduce((sum, p) => sum + p.cashOut, 0);
  
  let biggestWinner: { playerId: string; amount: number } | null = null;
  let biggestLoser: { playerId: string; amount: number } | null = null;
  
  game.players.forEach(player => {
    if (player.profit > 0 && (!biggestWinner || player.profit > biggestWinner.amount)) {
      biggestWinner = { playerId: player.playerId, amount: player.profit };
    }
    if (player.profit < 0 && (!biggestLoser || player.profit < biggestLoser.amount)) {
      biggestLoser = { playerId: player.playerId, amount: Math.abs(player.profit) };
    }
  });
  
  return {
    gameId,
    totalBuyIn,
    totalCashOut,
    isBalanced: Math.abs(totalBuyIn - totalCashOut) < 0.01,
    biggestWinner,
    biggestLoser,
    playerResults: game.players.map(player => ({
      playerId: player.playerId,
      buyIn: player.buyIn,
      cashOut: player.cashOut,
      profit: player.profit
    }))
  };
};

// Clear all data (useful for testing onboarding)
export const clearAllData = (): void => {
  if (typeof window === 'undefined') return;
  
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Initialize with sample data - only create sample players for existing users
export const initializeSampleData = (): void => {
  const currentUser = getCurrentUser();
  
  // Only initialize sample data if there's already a current user
  // This ensures new users see the onboarding screen
  if (currentUser) {
    const players = getPlayers();
    
    // Create sample players if they don't exist (but only if we have a current user)
    if (players.length <= 1) {
      createPlayer("Mike Smith");
      createPlayer("Sarah Lee");
      createPlayer("Alex Kim");
      createPlayer("Tom Wilson");
      
      // Create sample groups
      const fridayGroup = createGroup("Friday Night Poker", "Weekly poker with the crew");
      const sundayGroup = createGroup("Sunday Game", "Casual Sunday afternoon poker");
      
      // Add members to groups
      const allPlayers = getPlayers();
      allPlayers.forEach(player => {
        if (player.id !== currentUser.id) {
          addMemberToGroup(fridayGroup.id, player.id);
          if (player.name !== "Tom Wilson") {
            addMemberToGroup(sundayGroup.id, player.id);
          }
        }
      });
    }
  }
}; 