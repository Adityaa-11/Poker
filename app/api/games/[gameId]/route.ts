import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseServerAnon } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params
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

    // Get game and verify it's not completed
    const { data: game } = await supabaseServer
      .from('games')
      .select('id, group_id, is_completed')
      .eq('id', gameId)
      .single()

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (game.is_completed) {
      return NextResponse.json({ error: 'Cannot delete a completed game' }, { status: 400 })
    }

    // Verify user is in the group
    const { data: membership } = await supabaseServer
      .from('group_members')
      .select('group_id')
      .eq('group_id', game.group_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Delete player payments first
    await supabaseServer.from('game_player_payments').delete().eq('game_id', gameId)
    // Delete game players
    await supabaseServer.from('game_players').delete().eq('game_id', gameId)
    // Delete settlements
    await supabaseServer.from('settlements').delete().eq('game_id', gameId)
    // Delete the game
    const { error: deleteError } = await supabaseServer.from('games').delete().eq('id', gameId)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
