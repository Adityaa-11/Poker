import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseServerAnon } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const { groupId } = await params

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

    // Validate group exists using service role
    const { data: group, error: groupError } = await supabaseServer
      .from('groups')
      .select('id, name, invite_code, created_at')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseServer
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json(
        { error: 'Already a member of this group' },
        { status: 400 }
      )
    }

    // Add user to group using service role
    const { error: upsertError } = await supabaseServer
      .from('group_members')
      .upsert({ group_id: groupId, user_id: user.id }, { onConflict: 'group_id,user_id' })

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
    }

    // Get updated member list
    const { data: members } = await supabaseServer
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)

    return NextResponse.json({
      message: 'Successfully joined group',
      group: {
        id: group.id,
        name: group.name,
        inviteCode: group.invite_code,
        members: (members || []).map((m: { user_id: string }) => m.user_id),
        createdAt: group.created_at,
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
