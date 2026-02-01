import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseServerAnon } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  // Check that service role is available
  if (!supabaseServer) {
    console.error('[JOIN API] GET: Service role not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const { inviteCode: rawInviteCode } = await params
  // Normalize: uppercase, trim whitespace, and decode any URL encoding
  const normalizedCode = decodeURIComponent(rawInviteCode).toUpperCase().trim()
  
  console.log('[JOIN API] GET: Raw invite code:', rawInviteCode)
  console.log('[JOIN API] GET: Normalized invite code:', normalizedCode)
  console.log('[JOIN API] GET: Code length:', normalizedCode.length)

  const { data: group, error } = await supabaseServer
    .from('groups')
    .select('id, name, invite_code')
    .eq('invite_code', normalizedCode)
    .single()

  if (error) {
    console.error('[JOIN API] GET: Database error:', error.code, error.message)
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }
  
  if (!group) {
    console.log('[JOIN API] GET: No group found for code:', normalizedCode)
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  console.log('[JOIN API] GET: Found group:', group.id, group.name, 'with stored code:', group.invite_code)

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
  // Check that service role is available
  if (!supabaseServer) {
    console.error('[JOIN API] POST: Service role not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const { inviteCode: rawInviteCode } = await params
  // Normalize: uppercase, trim whitespace, and decode any URL encoding
  const normalizedCode = decodeURIComponent(rawInviteCode).toUpperCase().trim()
  
  console.log('[JOIN API] POST: Raw invite code:', rawInviteCode)
  console.log('[JOIN API] POST: Normalized invite code:', normalizedCode)
  console.log('[JOIN API] POST: Code length:', normalizedCode.length)

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[JOIN API] POST: Missing or invalid auth header')
    return NextResponse.json({ error: 'Please log in to join this group' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: userError } = await supabaseServerAnon.auth.getUser(token)

  if (userError) {
    console.error('[JOIN API] POST: Token validation error:', userError.message)
    return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 })
  }
  
  if (!user) {
    console.log('[JOIN API] POST: No user found for token')
    return NextResponse.json({ error: 'Please log in to join this group' }, { status: 401 })
  }

  console.log('[JOIN API] POST: User authenticated:', user.id, user.email)

  // First, let's see ALL groups to debug
  const { data: allGroups } = await supabaseServer
    .from('groups')
    .select('id, name, invite_code')
  
  console.log('[JOIN API] POST: All groups in DB:', allGroups?.map(g => ({ id: g.id, code: g.invite_code })))

  const { data: group, error: groupError } = await supabaseServer
    .from('groups')
    .select('id, name, invite_code')
    .eq('invite_code', normalizedCode)
    .single()

  if (groupError) {
    console.error('[JOIN API] POST: Database error:', groupError.code, groupError.message, groupError.details)
    // Check if it's a "no rows" error vs actual error
    if (groupError.code === 'PGRST116') {
      return NextResponse.json({ 
        error: `Group not found. Code "${normalizedCode}" doesn't match any group.`,
        debug: { searchedCode: normalizedCode, availableCodes: allGroups?.map(g => g.invite_code) }
      }, { status: 404 })
    }
    return NextResponse.json({ error: 'Database error. Please try again.' }, { status: 500 })
  }
  
  if (!group) {
    console.log('[JOIN API] POST: No group found for code:', normalizedCode)
    return NextResponse.json({ error: 'Group not found. The invite link may be invalid.' }, { status: 404 })
  }

  console.log('[JOIN API] POST: Found group:', group.id, group.name, 'with code:', group.invite_code)

  // Check if user is already a member
  const { data: existingMember } = await supabaseServer
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    console.log('[JOIN API] POST: User already a member')
    return NextResponse.json({
      message: 'You are already a member of this group',
      group: { id: group.id, name: group.name, inviteCode: group.invite_code },
    })
  }

  const { error: upsertError } = await supabaseServer
    .from('group_members')
    .upsert({ group_id: group.id, user_id: user.id }, { onConflict: 'group_id,user_id' })

  if (upsertError) {
    console.error('[JOIN API] POST: Failed to add member:', upsertError.message)
    return NextResponse.json({ error: 'Failed to join group. Please try again.' }, { status: 500 })
  }

  console.log('[JOIN API] POST: Successfully added user to group')

  return NextResponse.json({
    message: 'Successfully joined group',
    group: { id: group.id, name: group.name, inviteCode: group.invite_code },
  })
}

