-- PokerPals RLS Policies
-- Run these in your Supabase SQL editor

-- 1. Users table policies
-- Allow users to read all user profiles (needed for games/groups)
CREATE POLICY "Users can read all profiles" ON users
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own profile (for OAuth signup)
CREATE POLICY "Users can insert their own profile" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- 2. Groups table policies
-- Allow authenticated users to read groups they're members of
CREATE POLICY "Users can read groups they belong to" ON groups
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    created_by = auth.uid() OR 
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);

-- Allow authenticated users to create groups
CREATE POLICY "Authenticated users can create groups" ON groups
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

-- Allow group creators to update their groups
CREATE POLICY "Group creators can update their groups" ON groups
FOR UPDATE USING (created_by = auth.uid());

-- 3. Group members table policies
-- Allow users to read group memberships for groups they belong to
CREATE POLICY "Users can read group memberships" ON group_members
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    user_id = auth.uid() OR
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);

-- Allow users to join groups (insert membership)
CREATE POLICY "Users can join groups" ON group_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Allow users to leave groups (delete their own membership)
CREATE POLICY "Users can leave groups" ON group_members
FOR DELETE USING (user_id = auth.uid());

-- 4. Games table policies
-- Allow users to read games in groups they belong to
CREATE POLICY "Users can read games in their groups" ON games
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);

-- Allow group members to create games
CREATE POLICY "Group members can create games" ON games
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);

-- Allow bank person to update game
CREATE POLICY "Bank person can update games" ON games
FOR UPDATE USING (bank_person_id = auth.uid());

-- 5. Game players table policies
-- Allow users to read game players for games they can see
CREATE POLICY "Users can read game players" ON game_players
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  game_id IN (
    SELECT g.id FROM games g
    JOIN group_members gm ON g.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

-- Allow users to join games in their groups
CREATE POLICY "Users can join games" ON game_players
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  user_id = auth.uid() AND
  game_id IN (
    SELECT g.id FROM games g
    JOIN group_members gm ON g.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

-- Allow users to update their own game participation
CREATE POLICY "Users can update their game participation" ON game_players
FOR UPDATE USING (user_id = auth.uid());

-- Allow users to leave games
CREATE POLICY "Users can leave games" ON game_players
FOR DELETE USING (user_id = auth.uid());

-- 6. Settlements table policies
-- Allow users to read settlements involving them
CREATE POLICY "Users can read their settlements" ON settlements
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  (from_user_id = auth.uid() OR to_user_id = auth.uid())
);

-- Allow the system to create settlements (via service role)
CREATE POLICY "System can create settlements" ON settlements
FOR INSERT WITH CHECK (true);

-- Allow users to mark their settlements as paid
CREATE POLICY "Users can mark settlements paid" ON settlements
FOR UPDATE USING (
  (from_user_id = auth.uid() OR to_user_id = auth.uid()) AND
  NOT is_paid -- Can only update unpaid settlements
);

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
