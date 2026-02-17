import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseServerAnon } from '@/lib/supabase/server'

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

    // Nullify bank_person_id references so user row can be deleted
    await supabaseServer
      .from('games')
      .update({ bank_person_id: null as unknown as string })
      .eq('bank_person_id', user.id)

    // Remove from all groups
    await supabaseServer
      .from('group_members')
      .delete()
      .eq('user_id', user.id)

    // Remove game player entries
    await supabaseServer
      .from('game_players')
      .delete()
      .eq('user_id', user.id)

    // Remove player payments
    await supabaseServer
      .from('game_player_payments')
      .delete()
      .eq('user_id', user.id)

    // Delete user record
    await supabaseServer
      .from('users')
      .delete()
      .eq('id', user.id)

    // Delete auth user
    const { error: deleteError } = await supabaseServer.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
