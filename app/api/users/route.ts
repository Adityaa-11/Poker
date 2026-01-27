import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseServerAnon } from '@/lib/supabase/server'

// Get all users (with proper authentication)
export async function GET(request: NextRequest) {
  try {
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

    const { data, error: usersError } = await supabaseServer
      .from('users')
      .select('*')

    if (usersError || !data) {
      return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
    }

    const players = data.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email || undefined,
      initials: u.initials,
    }))
    
    return NextResponse.json({ players })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Create new user
export async function POST(request: NextRequest) {
  try {
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
    const { name, email } = body as { name?: string; email?: string }

    // Validate input
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' }, 
        { status: 400 }
      )
    }

    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 50 characters' }, 
        { status: 400 }
      )
    }

    // For some OAuth providers (e.g. GitHub), email can be missing/private.
    // We still need a non-null email due to schema constraints, so we generate a placeholder.
    const normalizedEmail = (email || '').toLowerCase().trim()
    const effectiveEmail =
      normalizedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ? normalizedEmail
        : `${user.id}@oauth.local`

    const trimmedName = name.trim()
    const initials = trimmedName
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 3)

    // Upsert user profile using service role (bypasses RLS)
    const { data: created, error: createError } = await supabaseServer
      .from('users')
      .upsert(
        {
          id: user.id,
          email: effectiveEmail,
          name: trimmedName,
          initials,
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (createError || !created) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    const player = {
      id: created.id,
      name: created.name,
      email: created.email || undefined,
      initials: created.initials,
    }

    return NextResponse.json({ player }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
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
        { error: 'Name is required' }, 
        { status: 400 }
      )
    }

    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 50 characters' }, 
        { status: 400 }
      )
    }

    // Update user profile
    const { error: updateError } = await supabaseServerAnon
      .from('users')
      .update({ name: name.trim() })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 