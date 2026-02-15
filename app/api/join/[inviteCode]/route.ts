import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseServerAnon } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const { inviteCode: rawInviteCode } = await params
    const normalizedCode = decodeURIComponent(rawInviteCode).toUpperCase().trim()

    const { data: group, error } = await supabaseServer
      .from('groups')
      .select('id, name, invite_code')
      .eq('invite_code', normalizedCode)
      .single()

    if (error || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const { count } = await supabaseServer
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id)

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        inviteCode: group.invite_code,
        memberCount: count ?? 0,
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const { inviteCode: rawInviteCode } = await params
    const normalizedCode = decodeURIComponent(rawInviteCode).toUpperCase().trim()

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Please log in to join this group' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: userError } = await supabaseServerAnon.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 })
    }

    const { data: group, error: groupError } = await supabaseServer
      .from('groups')
      .select('id, name, invite_code')
      .eq('invite_code', normalizedCode)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found. The invite link may be invalid.' }, { status: 404 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseServer
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({
        message: 'You are already a member of this group',
        group: { id: group.id, name: group.name, inviteCode: group.invite_code },
      })
    }

    const { error: upsertError } = await supabaseServer
      .from('group_members')
      .upsert({ group_id: group.id, user_id: user.id }, { onConflict: 'group_id,user_id' })

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to join group. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Successfully joined group',
      group: { id: group.id, name: group.name, inviteCode: group.invite_code },
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
