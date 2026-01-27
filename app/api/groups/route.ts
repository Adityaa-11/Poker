import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerAnon } from '@/lib/supabase/server'
import { createGroup, getGroups, addMemberToGroup } from '@/lib/supabase/database'

// Get user's groups
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

    // Get user's groups
    const groups = await getGroups()
    
    return NextResponse.json({ groups })
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

    // Create group
    const group = await createGroup(name.trim())

    if (!group) {
      return NextResponse.json(
        { error: 'Failed to create group' }, 
        { status: 500 }
      )
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