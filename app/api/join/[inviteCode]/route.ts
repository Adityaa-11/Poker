import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseServerAnon } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await params

  const { data: group, error } = await supabaseServer
    .from('groups')
    .select('id, name, invite_code')
    .eq('invite_code', inviteCode.toUpperCase())
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
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await params

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: userError } = await supabaseServerAnon.auth.getUser(token)

  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { data: group, error: groupError } = await supabaseServer
    .from('groups')
    .select('id, name, invite_code')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (groupError || !group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  const { error: upsertError } = await supabaseServer
    .from('group_members')
    .upsert({ group_id: group.id, user_id: user.id }, { onConflict: 'group_id,user_id' })

  if (upsertError) {
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Successfully joined group',
    group: { id: group.id, name: group.name, inviteCode: group.invite_code },
  })
}

