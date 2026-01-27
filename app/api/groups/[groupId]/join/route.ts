import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerAnon } from '@/lib/supabase/server'
import { addMemberToGroup, getGroupById } from '@/lib/supabase/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params
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

    // Validate group exists
    const group = await getGroupById(groupId)
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' }, 
        { status: 404 }
      )
    }

    // Check if user is already a member
    if (group.members.includes(user.id)) {
      return NextResponse.json(
        { error: 'Already a member of this group' }, 
        { status: 400 }
      )
    }

    // Add user to group
    const success = await addMemberToGroup(groupId, user.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to join group' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Successfully joined group',
      group: { ...group, members: [...group.members, user.id] }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 