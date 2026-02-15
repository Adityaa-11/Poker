import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseServerAnon } from '@/lib/supabase/server'

// Add player to game (opt-in)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const { gameId } = await params

    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabaseServerAnon.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    let body: { buyIn?: number }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { buyIn } = body

    // Validate input
    if (typeof buyIn !== 'number' || buyIn <= 0) {
      return NextResponse.json({ error: 'Buy-in must be a positive number' }, { status: 400 })
    }

    if (buyIn > 10000) {
      return NextResponse.json({ error: 'Buy-in cannot exceed $10,000' }, { status: 400 })
    }

    // Validate game exists and is not completed
    const { data: game, error: gameError } = await supabaseServer
      .from('games')
      .select('id, is_completed, group_id')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (game.is_completed) {
      return NextResponse.json({ error: 'Cannot join completed game' }, { status: 400 })
    }

    // Verify user is a member of the game's group
    const { data: membership } = await supabaseServer
      .from('group_members')
      .select('id')
      .eq('group_id', game.group_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'You must be a member of this group' }, { status: 403 })
    }

    // Check if player is already in game
    const { data: existingPlayer } = await supabaseServer
      .from('game_players')
      .select('id')
      .eq('game_id', gameId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingPlayer) {
      return NextResponse.json({ error: 'Already joined this game' }, { status: 400 })
    }

    // Add player to game
    const { error: insertError } = await supabaseServer
      .from('game_players')
      .insert({
        game_id: gameId,
        user_id: user.id,
        buy_in: buyIn,
        cash_out: 0,
        profit: 0,
        rebuy_count: 0,
        rebuy_amount: 0,
        has_cashed_out: false,
      })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to join game' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Successfully joined game' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update player in game
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const { gameId } = await params

    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabaseServerAnon.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    let body: { buyIn?: number; cashOut?: number }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { buyIn, cashOut } = body

    // Validate input
    if (buyIn !== undefined && (typeof buyIn !== 'number' || buyIn <= 0)) {
      return NextResponse.json({ error: 'Buy-in must be a positive number' }, { status: 400 })
    }

    if (cashOut !== undefined && (typeof cashOut !== 'number' || cashOut < 0)) {
      return NextResponse.json({ error: 'Cash-out must be a non-negative number' }, { status: 400 })
    }

    // Build update object
    const updateData: Record<string, number | boolean> = {}
    if (buyIn !== undefined) updateData.buy_in = buyIn
    if (cashOut !== undefined) {
      updateData.cash_out = cashOut
      updateData.has_cashed_out = true

      // Fetch current player data to calculate profit
      const { data: player } = await supabaseServer
        .from('game_players')
        .select('buy_in, rebuy_amount')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .single()

      if (player) {
        const totalInvested = (player.buy_in || 0) + (player.rebuy_amount || 0)
        updateData.profit = cashOut - totalInvested
      }
    }

    const { error: updateError } = await supabaseServer
      .from('game_players')
      .update(updateData)
      .eq('game_id', gameId)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update player' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Player updated successfully' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Remove player from game (opt-out)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const { gameId } = await params

    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabaseServerAnon.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Validate game exists and is not completed
    const { data: game, error: gameError } = await supabaseServer
      .from('games')
      .select('id, is_completed')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (game.is_completed) {
      return NextResponse.json({ error: 'Cannot leave completed game' }, { status: 400 })
    }

    // Remove player from game
    const { error: deleteError } = await supabaseServer
      .from('game_players')
      .delete()
      .eq('game_id', gameId)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to leave game' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Successfully left game' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
