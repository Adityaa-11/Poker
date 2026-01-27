import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerAnon } from '@/lib/supabase/server'
import { addPlayerToGame, removePlayerFromGame, updatePlayerInGame, getGameById } from '@/lib/supabase/database'

// Add player to game (opt-in)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
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

    const body = await request.json()
    const { buyIn } = body

    // Validate input
    if (typeof buyIn !== 'number' || buyIn <= 0) {
      return NextResponse.json(
        { error: 'Buy-in must be a positive number' }, 
        { status: 400 }
      )
    }

    if (buyIn > 10000) {
      return NextResponse.json(
        { error: 'Buy-in cannot exceed $10,000' }, 
        { status: 400 }
      )
    }

    // Validate game exists and is not completed
    const game = await getGameById(gameId)
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' }, 
        { status: 404 }
      )
    }

    if (game.isCompleted) {
      return NextResponse.json(
        { error: 'Cannot join completed game' }, 
        { status: 400 }
      )
    }

    // Check if player is already in game
    if (game.players.some(p => p.playerId === user.id)) {
      return NextResponse.json(
        { error: 'Already joined this game' }, 
        { status: 400 }
      )
    }

    // Add player to game
    const success = await addPlayerToGame(gameId, user.id, buyIn)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to join game' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Successfully joined game' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Update player in game
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
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

    const body = await request.json()
    const { buyIn, cashOut } = body

    // Validate input
    if (buyIn !== undefined && (typeof buyIn !== 'number' || buyIn <= 0)) {
      return NextResponse.json(
        { error: 'Buy-in must be a positive number' }, 
        { status: 400 }
      )
    }

    if (cashOut !== undefined && (typeof cashOut !== 'number' || cashOut < 0)) {
      return NextResponse.json(
        { error: 'Cash-out must be a non-negative number' }, 
        { status: 400 }
      )
    }

    // Update player in game
    const updates: { buyIn?: number; cashOut?: number } = {}
    if (buyIn !== undefined) updates.buyIn = buyIn
    if (cashOut !== undefined) updates.cashOut = cashOut

    const success = await updatePlayerInGame(gameId, user.id, updates)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update player' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Player updated successfully' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Remove player from game (opt-out)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
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

    // Validate game exists and is not completed
    const game = await getGameById(gameId)
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' }, 
        { status: 404 }
      )
    }

    if (game.isCompleted) {
      return NextResponse.json(
        { error: 'Cannot leave completed game' }, 
        { status: 400 }
      )
    }

    // Remove player from game
    const success = await removePlayerFromGame(gameId, user.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to leave game' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Successfully left game' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 