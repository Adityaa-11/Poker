import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseServerAnon } from '@/lib/supabase/server'

// Get user's games (server-side: use token + service role so we get games for user's groups only)
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabaseServerAnon.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: memberships, error: mErr } = await supabaseServer
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
    if (mErr || !memberships?.length) {
      return NextResponse.json({ games: [] })
    }

    const groupIds = memberships.map((m: { group_id: string }) => m.group_id)
    const { data: gamesRows, error: gErr } = await supabaseServer
      .from('games')
      .select('*, game_players(*)')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
    if (gErr || !gamesRows) {
      return NextResponse.json({ games: [] })
    }

    interface GamePlayerRow { user_id: string; buy_in: number; cash_out: number; profit: number; opted_in_at: string; rebuy_count: number; rebuy_amount: number; has_cashed_out: boolean; cashed_out_at: string | null }
    interface GameRow { id: string; group_id: string; stakes: string; default_buy_in: number; bank_person_id: string | null; is_completed: boolean; date: string; created_at: string; updated_at: string; started_at: string | null; ended_at: string | null; duration_seconds: number | null; game_players: GamePlayerRow[] }

    const games = (gamesRows as GameRow[]).map((game) => ({
      id: game.id,
      groupId: game.group_id,
      stakes: game.stakes,
      defaultBuyIn: game.default_buy_in,
      bankPersonId: game.bank_person_id,
      isCompleted: game.is_completed,
      date: game.date,
      players: (game.game_players || []).map((gp) => ({
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

    return NextResponse.json({ games })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create new game (server-side: verify user is in group, then insert with service role)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabaseServerAnon.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    let body: { groupId?: string; stakes?: string; defaultBuyIn?: number; bankPersonId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { groupId, stakes, defaultBuyIn, bankPersonId } = body

    if (!groupId || !stakes || defaultBuyIn == null || !bankPersonId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const defaultBuyInNum = Number(defaultBuyIn)
    if (Number.isNaN(defaultBuyInNum) || defaultBuyInNum <= 0) {
      return NextResponse.json(
        { error: 'Default buy-in must be a positive number' },
        { status: 400 }
      )
    }
    if (defaultBuyInNum > 10000) {
      return NextResponse.json(
        { error: 'Default buy-in cannot exceed $10,000' },
        { status: 400 }
      )
    }

    const { data: membership } = await supabaseServer
      .from('group_members')
      .select('group_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this group to create a game' },
        { status: 403 }
      )
    }

    const { data: created, error: createError } = await supabaseServer
      .from('games')
      .insert({
        group_id: groupId,
        stakes: String(stakes).trim(),
        default_buy_in: defaultBuyInNum,
        bank_person_id: bankPersonId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError || !created) {
      return NextResponse.json(
        { error: 'Failed to create game' },
        { status: 500 }
      )
    }

    const game = {
      id: created.id,
      groupId: created.group_id,
      stakes: created.stakes,
      defaultBuyIn: created.default_buy_in,
      bankPersonId: created.bank_person_id,
      isCompleted: created.is_completed,
      date: created.date,
      createdAt: created.created_at,
      players: [],
      updatedAt: created.updated_at,
      startTime: created.started_at || created.created_at,
    }
    return NextResponse.json({ game }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 