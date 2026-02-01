import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseServerAnon } from '@/lib/supabase/server'

// Get user's groups
export async function GET(request: NextRequest) {
  try {
    // Check that service role is available
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the token
    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabaseServerAnon.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Two-step query (reliable across clients)
    const { data: memberships, error: mErr } = await supabaseServer
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)

    if (mErr || !memberships) return NextResponse.json({ groups: [] })

    const groupIds = memberships.map(m => (m as any).group_id)
    if (groupIds.length === 0) return NextResponse.json({ groups: [] })

    const { data: groups2, error: g2Err } = await supabaseServer
      .from('groups')
      .select('id, name, invite_code, created_at')
      .in('id', groupIds)

    if (g2Err || !groups2) return NextResponse.json({ groups: [] })

    const groupMembers = await Promise.all(
      groups2.map(async g => {
        const { data: members } = await supabaseServer!
          .from('group_members')
          .select('user_id')
          .eq('group_id', (g as any).id)
        return {
          id: (g as any).id,
          name: (g as any).name,
          inviteCode: (g as any).invite_code,
          members: (members || []).map(m => (m as any).user_id),
          createdAt: (g as any).created_at,
        }
      })
    )

    return NextResponse.json({ groups: groupMembers })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Create new group
export async function POST(request: NextRequest) {
  try {
    // Check that service role is available
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the token
    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabaseServerAnon.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { name } = body

    // Validate input
    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' }, 
        { status: 400 }
      )
    }

    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: 'Group name must be between 2 and 50 characters' }, 
        { status: 400 }
      )
    }

    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

    // Create group with service role (bypasses RLS, but user is verified above)
    const { data: created, error: createError } = await supabaseServer
      .from('groups')
      .insert({
        name: name.trim(),
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError || !created) {
      return NextResponse.json(
        { error: 'Failed to create group' }, 
        { status: 500 }
      )
    }

    // Add creator as member
    await supabaseServer
      .from('group_members')
      .upsert({ group_id: created.id, user_id: user.id }, { onConflict: 'group_id,user_id' })

    const group = {
      id: created.id,
      name: created.name,
      inviteCode: created.invite_code,
      members: [user.id],
      createdAt: created.created_at,
    }

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 