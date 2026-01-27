-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    initials TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    stakes TEXT NOT NULL,
    default_buy_in INTEGER NOT NULL,
    bank_person_id UUID REFERENCES users(id),
    is_completed BOOLEAN DEFAULT FALSE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_players table
CREATE TABLE IF NOT EXISTS game_players (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    buy_in INTEGER NOT NULL,
    cash_out INTEGER DEFAULT 0,
    profit INTEGER DEFAULT 0,
    -- Game flow metadata (opt-in / rebuys / cashout)
    opted_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rebuy_count INTEGER DEFAULT 0,
    rebuy_amount INTEGER DEFAULT 0,
    has_cashed_out BOOLEAN DEFAULT FALSE,
    cashed_out_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, user_id)
);

-- Ensure game flow columns exist (safe to re-run)
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS opted_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS rebuy_count INTEGER DEFAULT 0;
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS rebuy_amount INTEGER DEFAULT 0;
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS has_cashed_out BOOLEAN DEFAULT FALSE;
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS cashed_out_at TIMESTAMP WITH TIME ZONE;

-- Track honor-based per-player payment status (independent of settlements)
CREATE TABLE IF NOT EXISTS game_player_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, user_id)
);

-- Create settlements table
CREATE TABLE IF NOT EXISTS settlements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_games_group_id ON games(group_id);
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON game_players(user_id);
CREATE INDEX IF NOT EXISTS idx_game_player_payments_game_id ON game_player_payments(game_id);
CREATE INDEX IF NOT EXISTS idx_game_player_payments_user_id ON game_player_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_game_id ON settlements(game_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_user_id ON settlements(from_user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to_user_id ON settlements(to_user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_player_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can see all user profiles (needed for games/groups)
DO $$ BEGIN
  CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Group members can see group data
DO $$ BEGIN
  CREATE POLICY "Group members can view groups" ON groups FOR SELECT
  USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create groups" ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Group creators can update groups" ON groups FOR UPDATE
  USING (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Group membership policies
DO $$ BEGIN
  CREATE POLICY "Group members can view membership" ON group_members FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Group members can join groups" ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Game policies
DO $$ BEGIN
  CREATE POLICY "Group members can view games" ON games FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Group members can create games" ON games FOR INSERT
  WITH CHECK (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Group members can update games" ON games FOR UPDATE
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Game player policies
DO $$ BEGIN
  CREATE POLICY "Game participants can view game players" ON game_players FOR SELECT
  USING (game_id IN (SELECT id FROM games WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can join games" ON game_players FOR INSERT
  WITH CHECK (user_id = auth.uid() AND game_id IN (SELECT id FROM games WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Players can update own game data" ON game_players FOR UPDATE
  USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Honor-based payment status policies:
-- Any authenticated group member can view/update payments for games in their groups.
DO $$ BEGIN
  CREATE POLICY "Group members can view player payments" ON game_player_payments FOR SELECT
  USING (
    game_id IN (
      SELECT id
      FROM games
      WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Group members can upsert player payments" ON game_player_payments FOR INSERT
  WITH CHECK (
    game_id IN (
      SELECT id
      FROM games
      WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Group members can update player payments" ON game_player_payments FOR UPDATE
  USING (
    game_id IN (
      SELECT id
      FROM games
      WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Settlement policies
DO $$ BEGIN
  CREATE POLICY "Settlement participants can view settlements" ON settlements FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "System can create settlements" ON settlements FOR INSERT
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Settlement participants can update settlements" ON settlements FOR UPDATE
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
DROP TRIGGER IF EXISTS update_game_players_updated_at ON game_players;
DROP TRIGGER IF EXISTS update_game_player_payments_updated_at ON game_player_payments;
DROP TRIGGER IF EXISTS update_settlements_updated_at ON settlements;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_players_updated_at BEFORE UPDATE ON game_players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_player_payments_updated_at BEFORE UPDATE ON game_player_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON settlements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 