import { supabase } from './client'
import { Database } from './types'
import { Player, Game, Group, Settlement, GamePlayer } from '@/lib/types'

type Tables = Database['public']['Tables']
type GamePlayerRow = Tables['game_players']['Row']

// User/Player operations
export async function getCurrentUser(): Promise<Player | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    name: data.name,
    initials: data.initials,
    email: data.email || undefined,
  }
}

export async function createUser(user: { id: string; email: string; name: string }): Promise<Player | null> {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase()
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email,
      name: user.name,
      initials,
    })
    .select()
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    initials: data.initials,
  }
}

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')

  if (error || !data) return []

  return data.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    initials: user.initials,
  }))
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    initials: data.initials,
  }
}

// Group operations
export async function getGroups(): Promise<Group[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members!inner(user_id)
    `)
    .eq('group_members.user_id', user.id)

  if (error || !data) return []

  return Promise.all(data.map(async (group) => {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', group.id)

    return {
      id: group.id,
      name: group.name,
      description: group.description || undefined,
      inviteCode: group.invite_code,
      members: members?.map(m => m.user_id) || [],
      createdAt: group.created_at,
    }
  }))
}

export async function getGroupById(id: string): Promise<Group | null> {
  const { data: group, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !group) return null

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', id)

  return {
    id: group.id,
    name: group.name,
    description: group.description || undefined,
    inviteCode: group.invite_code,
    members: members?.map(m => m.user_id) || [],
    createdAt: group.created_at,
  }
}

export async function createGroup(name: string): Promise<Group | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name,
      invite_code: inviteCode,
      created_by: user.id,
    })
    .select()
    .single()

  if (error || !group) return null

  // Add creator as member
  await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
    })

  return {
    id: group.id,
    name: group.name,
    description: group.description || undefined,
    inviteCode: group.invite_code,
    members: [user.id],
    createdAt: group.created_at,
  }
}

export async function addMemberToGroup(groupId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: userId,
    })

  return !error
}

export async function getGroupByInviteCode(inviteCode: string): Promise<Group | null> {
  const { data: group, error } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode)
    .single()

  if (error || !group) return null

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', group.id)

  return {
    id: group.id,
    name: group.name,
    description: group.description || undefined,
    inviteCode: group.invite_code,
    members: members?.map(m => m.user_id) || [],
    createdAt: group.created_at,
  }
}

// Game operations
export async function getGames(): Promise<Game[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      game_players(*)
    `)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(game => ({
    id: game.id,
    groupId: game.group_id,
    stakes: game.stakes,
    defaultBuyIn: game.default_buy_in,
    bankPersonId: game.bank_person_id,
    isCompleted: game.is_completed,
    date: game.date,
    players: (game.game_players || []).map((gp: GamePlayerRow) => ({
      playerId: gp.user_id,
      buyIn: gp.buy_in,
      cashOut: gp.cash_out,
      profit: gp.profit,
      hasOptedIn: true,
      optedInAt: gp.opted_in_at,
      rebuys: gp.rebuy_count,
      rebuyAmount: gp.rebuy_amount,
      hasCashedOut: gp.has_cashed_out,
      cashedOutAt: gp.cashed_out_at || undefined,
    })),
    createdAt: game.created_at,
    updatedAt: game.updated_at,
    startTime: game.started_at || game.created_at,
    endTime: game.ended_at || undefined,
    duration: game.duration_seconds || undefined,
  }))
}

export async function getGameById(id: string): Promise<Game | null> {
  const { data: game, error } = await supabase
    .from('games')
    .select(`
      *,
      game_players(*)
    `)
    .eq('id', id)
    .single()

  if (error || !game) return null

  return {
    id: game.id,
    groupId: game.group_id,
    stakes: game.stakes,
    defaultBuyIn: game.default_buy_in,
    bankPersonId: game.bank_person_id,
    isCompleted: game.is_completed,
    date: game.date,
    createdAt: game.created_at,
    players: (game.game_players || []).map((gp: GamePlayerRow) => ({
      playerId: gp.user_id,
      buyIn: gp.buy_in,
      cashOut: gp.cash_out,
      profit: gp.profit,
      hasOptedIn: true,
      optedInAt: gp.opted_in_at,
      rebuys: gp.rebuy_count,
      rebuyAmount: gp.rebuy_amount,
      hasCashedOut: gp.has_cashed_out,
      cashedOutAt: gp.cashed_out_at || undefined,
    })),
    updatedAt: game.updated_at,
    startTime: game.started_at || game.created_at,
    endTime: game.ended_at || undefined,
    duration: game.duration_seconds || undefined,
  }
}

export async function createGame(
  groupId: string, 
  stakes: string, 
  defaultBuyIn: number, 
  bankPersonId: string
): Promise<Game | null> {
  const { data: game, error } = await supabase
    .from('games')
    .insert({
      group_id: groupId,
      stakes,
      default_buy_in: defaultBuyIn,
      bank_person_id: bankPersonId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error || !game) return null

  return {
    id: game.id,
    groupId: game.group_id,
    stakes: game.stakes,
    defaultBuyIn: game.default_buy_in,
    bankPersonId: game.bank_person_id,
    isCompleted: game.is_completed,
    date: game.date,
    createdAt: game.created_at,
    players: [],
    updatedAt: game.updated_at,
    startTime: game.started_at || game.created_at,
  }
}

// Game player operations
export async function addPlayerToGame(gameId: string, userId: string, buyIn: number): Promise<boolean> {
  const { error } = await supabase
    .from('game_players')
    .insert({
      game_id: gameId,
      user_id: userId,
      buy_in: buyIn,
    })

  return !error
}

// Game flow helpers (opt-in, rebuys, cashout, auto-complete)
export async function optInToGame(gameId: string, userId: string, buyIn: number): Promise<boolean> {
  // Upsert makes this idempotent (re-joining updates buy-in).
  const { error } = await supabase
    .from('game_players')
    .upsert(
      {
        game_id: gameId,
        user_id: userId,
        buy_in: buyIn,
        cash_out: 0,
        profit: 0 - buyIn,
        rebuy_count: 0,
        rebuy_amount: 0,
        has_cashed_out: false,
        opted_in_at: new Date().toISOString(),
        cashed_out_at: null,
      } as any,
      { onConflict: 'game_id,user_id' }
    )

  return !error
}

export async function addRebuyToGame(gameId: string, userId: string, rebuyAmount: number): Promise<boolean> {
  const { data: row, error: readError } = await supabase
    .from('game_players')
    .select('buy_in, cash_out, rebuy_count, rebuy_amount')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .single()

  if (readError || !row) return false

  const nextRebuyCount = (row as any).rebuy_count + 1
  const nextRebuyAmount = (row as any).rebuy_amount + rebuyAmount
  const totalInvested = row.buy_in + nextRebuyAmount
  const nextProfit = (row as any).cash_out - totalInvested

  const { error: updateError } = await supabase
    .from('game_players')
    .update({
      rebuy_count: nextRebuyCount,
      rebuy_amount: nextRebuyAmount,
      profit: nextProfit,
    } as any)
    .eq('game_id', gameId)
    .eq('user_id', userId)

  return !updateError
}

export async function cashOutFromGame(gameId: string, userId: string, cashOutAmount: number): Promise<boolean> {
  const { data: row, error: readError } = await supabase
    .from('game_players')
    .select('buy_in, rebuy_amount')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .single()

  if (readError || !row) return false

  const totalInvested = row.buy_in + (row as any).rebuy_amount
  const profit = cashOutAmount - totalInvested

  const { error: updateError } = await supabase
    .from('game_players')
    .update({
      cash_out: cashOutAmount,
      profit,
      has_cashed_out: true,
      cashed_out_at: new Date().toISOString(),
    } as any)
    .eq('game_id', gameId)
    .eq('user_id', userId)

  if (updateError) return false

  // Auto-complete when all opted-in players have cashed out.
  const { count: notCashedOutCount, error: countError } = await supabase
    .from('game_players')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .eq('has_cashed_out', false)

  if (!countError && (notCashedOutCount ?? 0) === 0) {
    await completeGame(gameId)
  }

  return true
}

export async function updatePlayerInGame(
  gameId: string, 
  userId: string, 
  updates: { buyIn?: number; cashOut?: number }
): Promise<boolean> {
  const updateData: Record<string, number | boolean | string | null> = {}
  
  if (updates.buyIn !== undefined) updateData.buy_in = updates.buyIn
  if (updates.cashOut !== undefined) {
    updateData.cash_out = updates.cashOut
    // Calculate profit when updating cash out (include rebuy_amount)
    const { data: player } = await supabase
      .from('game_players')
      .select('buy_in, rebuy_amount')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .single()
    
    if (player) {
      const totalInvested = player.buy_in + ((player as any).rebuy_amount || 0)
      updateData.profit = updates.cashOut - totalInvested
    }
  }

  const { error } = await supabase
    .from('game_players')
    .update(updateData)
    .eq('game_id', gameId)
    .eq('user_id', userId)

  return !error
}

export async function removePlayerFromGame(gameId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('game_players')
    .delete()
    .eq('game_id', gameId)
    .eq('user_id', userId)

  return !error
}

export async function completeGame(gameId: string): Promise<boolean> {
  // Fetch the game to compute duration
  const { data: gameRow } = await supabase
    .from('games')
    .select('started_at')
    .eq('id', gameId)
    .single()

  const now = new Date().toISOString()
  const durationSeconds = gameRow?.started_at
    ? Math.round((new Date(now).getTime() - new Date(gameRow.started_at).getTime()) / 1000)
    : null

  const { error } = await supabase
    .from('games')
    .update({
      is_completed: true,
      ended_at: now,
      duration_seconds: durationSeconds,
    })
    .eq('id', gameId)

  if (error) return false

  // Generate settlements
  await generateSettlementsForGame(gameId)
  return true
}

export async function deleteGame(gameId: string): Promise<boolean> {
  // Delete game players first (foreign key)
  await supabase.from('game_players').delete().eq('game_id', gameId)
  // Delete any settlements
  await supabase.from('settlements').delete().eq('game_id', gameId)
  // Delete the game
  const { error } = await supabase.from('games').delete().eq('id', gameId)
  return !error
}

// Honor-based per-player payments (gameId + playerId)
export async function getPlayerPaymentStatus(gameId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('game_player_payments')
    .select('is_paid')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return false
  return data?.is_paid || false
}

export async function togglePlayerPayment(gameId: string, userId: string): Promise<boolean> {
  const { data: existing, error: readError } = await supabase
    .from('game_player_payments')
    .select('id, is_paid')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .maybeSingle()

  if (readError) return false

  const nextIsPaid = !(existing?.is_paid || false)
  const nextPaidAt = nextIsPaid ? new Date().toISOString() : null

  const { error: upsertError } = await supabase
    .from('game_player_payments')
    .upsert(
      {
        ...(existing?.id ? { id: existing.id } : {}),
        game_id: gameId,
        user_id: userId,
        is_paid: nextIsPaid,
        paid_at: nextPaidAt,
      } as any,
      { onConflict: 'game_id,user_id' }
    )

  return !upsertError
}

// Settlement operations
export async function getSettlements(): Promise<Settlement[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)

  if (error || !data) return []

  return data.map(settlement => ({
    id: settlement.id,
    gameId: settlement.game_id,
    fromPlayerId: settlement.from_user_id,
    toPlayerId: settlement.to_user_id,
    amount: settlement.amount,
    isPaid: settlement.is_paid,
    createdAt: settlement.created_at,
  }))
}

export async function markSettlementPaid(settlementId: string): Promise<boolean> {
  const { error } = await supabase
    .from('settlements')
    .update({ is_paid: true })
    .eq('id', settlementId)

  return !error
}

export async function toggleSettlementPayment(settlementId: string): Promise<boolean> {
  const { data: existing, error: readError } = await supabase
    .from('settlements')
    .select('is_paid')
    .eq('id', settlementId)
    .single()

  if (readError || !existing) return false

  const next = !existing.is_paid
  const { error: updateError } = await supabase
    .from('settlements')
    .update({ is_paid: next })
    .eq('id', settlementId)

  return !updateError
}

export interface GamePlayerPaymentRow {
  gameId: string
  playerId: string
  isPaid: boolean
  paidAt?: string
}

export async function getPlayerPayments(): Promise<GamePlayerPaymentRow[]> {
  const { data, error } = await supabase
    .from('game_player_payments')
    .select('game_id, user_id, is_paid, paid_at')

  if (error || !data) return []

  return (data as any[]).map(row => ({
    gameId: row.game_id,
    playerId: row.user_id,
    isPaid: row.is_paid,
    paidAt: row.paid_at || undefined,
  }))
}

async function generateSettlementsForGame(gameId: string): Promise<void> {
  const game = await getGameById(gameId)
  if (!game) return

  // Calculate who owes whom
  const balances: Record<string, number> = {}
  
  game.players.forEach(player => {
    balances[player.playerId] = player.profit
  })

  // Generate settlements using a simple algorithm
  const creditors = Object.entries(balances).filter(([_, amount]) => amount > 0)
  const debtors = Object.entries(balances).filter(([_, amount]) => amount < 0)

  for (const [debtorId, debtAmount] of debtors) {
    let remainingDebt = Math.abs(debtAmount)
    
    for (const [creditorId, creditAmount] of creditors) {
      if (remainingDebt <= 0) break
      if (creditAmount <= 0) continue

      const settlementAmount = Math.min(remainingDebt, creditAmount)
      
      // Create settlement record
      await supabase
        .from('settlements')
        .insert({
          game_id: gameId,
          from_user_id: debtorId,
          to_user_id: creditorId,
          amount: settlementAmount,
        })

      remainingDebt -= settlementAmount
      // Update creditor's remaining credit
      creditors[creditors.findIndex(([id]) => id === creditorId)][1] -= settlementAmount
    }
  }
}

// Group management
export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  return !error
}

export async function updateGroup(groupId: string, updates: { name?: string; description?: string }): Promise<boolean> {
  const updateData: Record<string, string> = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description

  const { error } = await supabase
    .from('groups')
    .update(updateData)
    .eq('id', groupId)

  return !error
} 