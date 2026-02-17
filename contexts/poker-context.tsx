"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { isDemoMode } from '@/lib/demo-data'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { 
  Player, 
  Game, 
  Group, 
  Settlement, 
  PlayerBalance,
  GameSummary 
} from '@/lib/types';
import * as Local from '@/lib/data-manager'
import * as Supa from '@/lib/supabase/database'

interface PokerContextType {
  // Data
  currentUser: Player | null;
  players: Player[];
  games: Game[];
  groups: Group[];
  settlements: Settlement[];
  
  // Actions
  createNewPlayer: (name: string, email?: string) => Player;
  createNewGroup: (name: string, description?: string) => Promise<Group | null>;
  createNewGame: (groupId: string, stakes: string, defaultBuyIn: number, bankPersonId: string) => Promise<Game | null>;
  addPlayerToGame: (gameId: string, playerId: string, buyIn?: number) => Promise<boolean>;
  updatePlayerInGame: (gameId: string, playerId: string, updates: { buyIn?: number; cashOut?: number }) => Promise<boolean>;
  removePlayerFromGame: (gameId: string, playerId: string) => Promise<boolean>;
  completeGame: (gameId: string) => Promise<boolean>;
  markSettlementPaid: (settlementId: string) => Promise<boolean>;
  toggleSettlementPayment: (settlementId: string) => Promise<boolean>;
  togglePlayerPayment: (gameId: string, playerId: string) => Promise<boolean>;
  getPlayerPaymentStatus: (gameId: string, playerId: string) => boolean;
  optInToGame: (gameId: string, playerId: string, buyIn: number) => Promise<boolean>;
  addRebuyToGame: (gameId: string, playerId: string, rebuyAmount: number) => Promise<boolean>;
  cashOutFromGame: (gameId: string, playerId: string, cashOutAmount: number) => Promise<boolean>;
  addMemberToGroup: (groupId: string, playerId: string) => Promise<boolean>;
  
  // Computed data
  getPlayerBalance: (playerId: string) => PlayerBalance;
  getGameSummary: (gameId: string) => GameSummary | null;
  getGamesByGroupId: (groupId: string) => Game[];
  getPlayerById: (id: string) => Player | null;
  getGroupById: (id: string) => Group | null;
  getGameById: (id: string) => Game | null;
  
  // UI state
  refreshData: () => void;
  clearAllData: () => void;
}

const PokerContext = createContext<PokerContextType | undefined>(undefined);

export const usePoker = (): PokerContextType => {
  const context = useContext(PokerContext);
  if (!context) {
    throw new Error('usePoker must be used within a PokerProvider');
  }
  return context;
};

interface PokerProviderProps {
  children: ReactNode;
}

export const PokerProvider = ({ children }: PokerProviderProps) => {
  const { user: authUser } = useAuth()
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [payments, setPayments] = useState<Supa.GamePlayerPaymentRow[]>([])

  const isLocalMode = useCallback(() => isDemoMode(), [])

  const paymentMap = useMemo(() => {
    const map = new Map<string, boolean>()
    payments.forEach(p => map.set(`${p.gameId}:${p.playerId}`, p.isPaid))
    return map
  }, [payments])

  const refreshSupabase = useCallback(async () => {
    if (!authUser) {
      setCurrentUser(null)
      setPlayers([])
      setGames([])
      setGroups([])
      setSettlements([])
      setPayments([])
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token

    const loadedGroups = token
      ? await (async () => {
          const res = await fetch('/api/groups', {
            headers: { authorization: `Bearer ${token}` },
          })
          if (!res.ok) return [] as Group[]
          const json = (await res.json()) as { groups?: Group[] }
          return json.groups || []
        })()
      : await Supa.getGroups()

    const [loadedPlayers, loadedGroupsFromApi, loadedGames, loadedSettlements, loadedPayments] =
      await Promise.all([
        Supa.getPlayers(),
        Promise.resolve(loadedGroups),
        Supa.getGames(),
        Supa.getSettlements(),
        Supa.getPlayerPayments(),
      ])

    setCurrentUser(authUser)
    setPlayers(loadedPlayers)
    setGroups(loadedGroupsFromApi)
    setGames(loadedGames)
    setSettlements(loadedSettlements)
    setPayments(loadedPayments)
  }, [authUser])

  const refreshData = useCallback(() => {
    if (isLocalMode()) {
      setCurrentUser(Local.getCurrentUser())
      setPlayers(Local.getPlayers())
      setGames(Local.getGames())
      setGroups(Local.getGroups())
      setSettlements(Local.getSettlements())
      setPayments([])
      return
    }

    void refreshSupabase()
  }, [isLocalMode, refreshSupabase])

  useEffect(() => {
    // IMPORTANT:
    // - Never seed sample data in production.
    // - Only seed in development, and only when storage is empty.
    const demo = isDemoMode()
    const hasAnyData =
      !!localStorage.getItem('poker_players') ||
      !!localStorage.getItem('poker_groups') ||
      !!localStorage.getItem('poker_games')

    if (process.env.NODE_ENV === 'development' && !demo && !hasAnyData) {
      Local.initializeSampleData()
    }
    
    refreshData();
    
    // Listen for demo data loaded event
    const handleDemoDataLoaded = () => {
      refreshData();
    };
    
    window.addEventListener('demoDataLoaded', handleDemoDataLoaded);
    
    return () => {
      window.removeEventListener('demoDataLoaded', handleDemoDataLoaded);
    };
  }, [refreshData]);

  // Keep Supabase-backed data in sync with auth state changes.
  useEffect(() => {
    if (!isLocalMode()) {
      refreshData()
    }
  }, [authUser?.id, isLocalMode, refreshData])

  const createNewPlayer = (name: string, email?: string): Player => {
    if (!isLocalMode()) {
      // In Supabase mode, "players" are authenticated users.
      // Profile creation happens during auth flow; return the current user.
      if (!authUser) {
        throw new Error('Must be authenticated to create a player')
      }
      return authUser
    }

    const player = Local.createPlayer(name, email);
    refreshData();
    return player;
  };

  const createNewGroup = async (name: string, description?: string): Promise<Group | null> => {
    if (isLocalMode()) {
      const group = Local.createGroup(name, description)
      refreshData()
      return group
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) return null

    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    })

    if (!res.ok) return null
    const json = (await res.json()) as { group?: Group }
    refreshData()
    return json.group ?? null
  }

  const createNewGame = (
    groupId: string, 
    stakes: string, 
    defaultBuyIn: number, 
    bankPersonId: string
  ): Promise<Game | null> => {
    if (isLocalMode()) {
      const game = Local.createGame(groupId, stakes, defaultBuyIn, bankPersonId)
      refreshData()
      return Promise.resolve(game)
    }

    return (async () => {
      const game = await Supa.createGame(groupId, stakes, defaultBuyIn, bankPersonId)
      refreshData()
      return game
    })()
  }

  const handleAddPlayerToGame = async (gameId: string, playerId: string, buyIn?: number): Promise<boolean> => {
    if (isLocalMode()) {
      const result = Local.addPlayerToGame(gameId, playerId, buyIn);
      if (result) refreshData();
      return result;
    }

    const result = await Supa.addPlayerToGame(gameId, playerId, buyIn ?? 0)
    refreshData()
    return result
  };

  const handleUpdatePlayerInGame = async (
    gameId: string, 
    playerId: string, 
    updates: { buyIn?: number; cashOut?: number }
  ): Promise<boolean> => {
    if (isLocalMode()) {
      const result = Local.updatePlayerInGame(gameId, playerId, updates);
      if (result) refreshData();
      return result;
    }

    const result = await Supa.updatePlayerInGame(gameId, playerId, updates)
    refreshData()
    return result
  };

  const handleCompleteGame = async (gameId: string): Promise<boolean> => {
    if (isLocalMode()) {
      const result = Local.completeGame(gameId);
      if (result) refreshData();
      return result;
    }

    const result = await Supa.completeGame(gameId)
    refreshData()
    return result
  };

  const handleMarkSettlementPaid = async (settlementId: string): Promise<boolean> => {
    if (isLocalMode()) {
      const result = Local.markSettlementPaid(settlementId);
      if (result) refreshData();
      return result;
    }

    const result = await Supa.markSettlementPaid(settlementId)
    refreshData()
    return result
  };

  const handleToggleSettlementPayment = async (settlementId: string): Promise<boolean> => {
    if (isLocalMode()) {
      const result = Local.toggleSettlementPayment(settlementId);
      if (result) refreshData();
      return result;
    }

    const result = await Supa.toggleSettlementPayment(settlementId)
    refreshData()
    return result
  };

  const handleTogglePlayerPayment = async (gameId: string, playerId: string): Promise<boolean> => {
    if (isLocalMode()) {
      const result = Local.togglePlayerPayment(gameId, playerId);
      if (result) refreshData();
      return result;
    }

    const result = await Supa.togglePlayerPayment(gameId, playerId)
    refreshData()
    return result
  };

  const handleOptInToGame = async (gameId: string, playerId: string, buyIn: number): Promise<boolean> => {
    if (isLocalMode()) {
      const result = Local.optInToGame(gameId, playerId, buyIn);
      if (result) refreshData();
      return result;
    }

    const result = await Supa.optInToGame(gameId, playerId, buyIn)
    refreshData()
    return result
  };

  const handleAddRebuyToGame = async (gameId: string, playerId: string, rebuyAmount: number): Promise<boolean> => {
    if (isLocalMode()) {
      const result = Local.addRebuyToGame(gameId, playerId, rebuyAmount);
      if (result) refreshData();
      return result;
    }

    const result = await Supa.addRebuyToGame(gameId, playerId, rebuyAmount)
    refreshData()
    return result
  };

  const handleCashOutFromGame = async (gameId: string, playerId: string, cashOutAmount: number): Promise<boolean> => {
    if (isLocalMode()) {
      const result = Local.cashOutFromGame(gameId, playerId, cashOutAmount);
      if (result) refreshData();
      return result;
    }

    const result = await Supa.cashOutFromGame(gameId, playerId, cashOutAmount)
    refreshData()
    return result
  };

  const handleAddMemberToGroup = async (groupId: string, playerId: string): Promise<boolean> => {
    if (isLocalMode()) {
      const result = Local.addMemberToGroup(groupId, playerId);
      if (result) refreshData();
      return result;
    }

    const result = await Supa.addMemberToGroup(groupId, playerId)
    refreshData()
    return result
  };

  const handleRemovePlayerFromGame = async (gameId: string, playerId: string): Promise<boolean> => {
    if (isLocalMode()) {
      const result = Local.removePlayerFromGame(gameId, playerId);
      if (result) refreshData();
      return result;
    }

    const result = await Supa.removePlayerFromGame(gameId, playerId)
    refreshData()
    return result
  };

  const getPlayerBalance = useCallback((playerId: string): PlayerBalance => {
    const completedGames = games.filter(g => g.isCompleted)
    let totalProfit = 0

    completedGames.forEach(game => {
      const playerInGame = game.players.find(p => p.playerId === playerId)
      if (playerInGame) totalProfit += playerInGame.profit
    })

    const owedByOthers = settlements
      .filter(s => s.toPlayerId === playerId && !s.isPaid)
      .reduce((sum, s) => sum + s.amount, 0)

    const owesToOthers = settlements
      .filter(s => s.fromPlayerId === playerId && !s.isPaid)
      .reduce((sum, s) => sum + s.amount, 0)

    // Net balance = totalProfit is the accounting truth, but we also show
    // outstanding (unpaid) amounts for UX clarity.
    return {
      playerId,
      groupId: '',
      totalProfit,
      totalLoss: Math.abs(Math.min(0, totalProfit)),
      owedByOthers,
      owesToOthers,
      netBalance: totalProfit,
      gamesPlayed: completedGames.filter(g => g.players.some(p => p.playerId === playerId)).length,
    }
  }, [games, settlements])

  const getGameSummary = useCallback((gameId: string): GameSummary | null => {
    const game = games.find(g => g.id === gameId) || null
    if (!game) return null

    const totalBuyIn = game.players.reduce((sum, p) => sum + p.buyIn + (p.rebuyAmount || 0), 0)
    const totalCashOut = game.players.reduce((sum, p) => sum + p.cashOut, 0)

    let biggestWinner: { playerId: string; amount: number } | null = null
    let biggestLoser: { playerId: string; amount: number } | null = null

    game.players.forEach(player => {
      if (player.profit > 0 && (!biggestWinner || player.profit > biggestWinner.amount)) {
        biggestWinner = { playerId: player.playerId, amount: player.profit }
      }
      if (player.profit < 0 && (!biggestLoser || player.profit < biggestLoser.amount)) {
        biggestLoser = { playerId: player.playerId, amount: Math.abs(player.profit) }
      }
    })

    return {
      gameId,
      totalBuyIn,
      totalCashOut,
      isBalanced: Math.abs(totalBuyIn - totalCashOut) < 0.01,
      biggestWinner,
      biggestLoser,
      playerResults: game.players.map(player => ({
        playerId: player.playerId,
        buyIn: player.buyIn + (player.rebuyAmount || 0),
        cashOut: player.cashOut,
        profit: player.profit,
      })),
    }
  }, [games])

  const getGamesByGroupId = useCallback((groupId: string) => games.filter(g => g.groupId === groupId), [games])
  const getPlayerById = useCallback((id: string) => players.find(p => p.id === id) || null, [players])
  const getGroupById = useCallback((id: string) => groups.find(g => g.id === id) || null, [groups])
  const getGameById = useCallback((id: string) => games.find(g => g.id === id) || null, [games])

  const getPlayerPaymentStatus = useCallback((gameId: string, playerId: string): boolean => {
    if (isLocalMode()) return Local.getPlayerPaymentStatus(gameId, playerId)
    return paymentMap.get(`${gameId}:${playerId}`) || false
  }, [isLocalMode, paymentMap])

  const value: PokerContextType = {
    // Data
    currentUser,
    players,
    games,
    groups,
    settlements,
    
    // Actions
    createNewPlayer,
    createNewGroup,
    createNewGame,
    addPlayerToGame: handleAddPlayerToGame,
    updatePlayerInGame: handleUpdatePlayerInGame,
    removePlayerFromGame: handleRemovePlayerFromGame,
    completeGame: handleCompleteGame,
    markSettlementPaid: handleMarkSettlementPaid,
    toggleSettlementPayment: handleToggleSettlementPayment,
    togglePlayerPayment: handleTogglePlayerPayment,
    getPlayerPaymentStatus,
    optInToGame: handleOptInToGame,
    addRebuyToGame: handleAddRebuyToGame,
    cashOutFromGame: handleCashOutFromGame,
    addMemberToGroup: handleAddMemberToGroup,
    
    // Computed data
    getPlayerBalance,
    getGameSummary,
    getGamesByGroupId,
    getPlayerById,
    getGroupById,
    getGameById,
    
    // UI state
    refreshData,
    clearAllData: () => {
      if (isLocalMode()) {
        Local.clearAllData();
        refreshData();
      }
    },
  };

  return (
    <PokerContext.Provider value={value}>
      {children}
    </PokerContext.Provider>
  );
}; 