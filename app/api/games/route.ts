import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerAnon } from '@/lib/supabase/server'
import { createGame, getGames, addPlayerToGame } from '@/lib/supabase/database'

// Get user's games
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

    // Get games
    const games = await getGames()
    
    return NextResponse.json({ games })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Create new game
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
    const { groupId, stakes, defaultBuyIn, bankPersonId } = body

    // Validate input
    if (!groupId || !stakes || !defaultBuyIn || !bankPersonId) {
      return NextResponse.json(
        { error: 'All fields are required' }, 
        { status: 400 }
      )
    }

    if (typeof defaultBuyIn !== 'number' || defaultBuyIn <= 0) {
      return NextResponse.json(
        { error: 'Default buy-in must be a positive number' }, 
        { status: 400 }
      )
    }

    if (defaultBuyIn > 10000) {
      return NextResponse.json(
        { error: 'Default buy-in cannot exceed $10,000' }, 
        { status: 400 }
      )
    }

    // Create game
    const game = await createGame(
      groupId,
      stakes.trim(),
      defaultBuyIn,
      bankPersonId
    )

    if (!game) {
      return NextResponse.json(
        { error: 'Failed to create game' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ game }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 