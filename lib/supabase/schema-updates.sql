-- Additional tables needed for complete feature parity

-- Add missing columns to existing tables
ALTER TABLE groups ADD COLUMN IF NOT EXISTS description TEXT;

-- Add game session tracking columns to game_players
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS has_opted_in BOOLEAN DEFAULT FALSE;
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS opted_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS has_cashed_out BOOLEAN DEFAULT FALSE;
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS cashed_out_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS rebuys INTEGER DEFAULT 0;
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS rebuy_amount INTEGER DEFAULT 0;

-- Create player_statistics table
CREATE TABLE IF NOT EXISTS player_statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    total_games INTEGER DEFAULT 0,
    total_buy_in INTEGER DEFAULT 0,
    total_cash_out INTEGER DEFAULT 0,
    total_profit INTEGER DEFAULT 0,
    total_rebuys INTEGER DEFAULT 0,
    biggest_win INTEGER DEFAULT 0,
    biggest_loss INTEGER DEFAULT 0,
    avg_profit DECIMAL(10,2) DEFAULT 0,
    avg_buy_in DECIMAL(10,2) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    consistency_score DECIMAL(5,2) DEFAULT 0,
    risk_score DECIMAL(5,2) DEFAULT 0,
    mvp_count INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_win_streak INTEGER DEFAULT 0,
    longest_loss_streak INTEGER DEFAULT 0,
    profit_last_30_days INTEGER DEFAULT 0,
    profit_last_90_days INTEGER DEFAULT 0,
    games_last_30_days INTEGER DEFAULT 0,
    last_game_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, group_id)
);

-- Create player_awards table
CREATE TABLE IF NOT EXISTS player_awards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    award_type TEXT NOT NULL,
    award_name TEXT NOT NULL,
    award_description TEXT,
    date_awarded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_payments table (individual payment tracking)
CREATE TABLE IF NOT EXISTS player_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, player_id)
);

-- Create invite_tokens table (for tracking unique invite links)
CREATE TABLE IF NOT EXISTS invite_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    used_by UUID REFERENCES users(id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_statistics_player_id ON player_statistics(player_id);
CREATE INDEX IF NOT EXISTS idx_player_statistics_group_id ON player_statistics(group_id);
CREATE INDEX IF NOT EXISTS idx_player_awards_player_id ON player_awards(player_id);
CREATE INDEX IF NOT EXISTS idx_player_awards_group_id ON player_awards(group_id);
CREATE INDEX IF NOT EXISTS idx_player_payments_game_id ON player_payments(game_id);
CREATE INDEX IF NOT EXISTS idx_player_payments_player_id ON player_payments(player_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_group_id ON invite_tokens(group_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);

-- Enable RLS on new tables
ALTER TABLE player_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for player_statistics
CREATE POLICY "Group members can view statistics" ON player_statistics FOR SELECT 
USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

CREATE POLICY "System can manage statistics" ON player_statistics FOR ALL 
USING (true);

-- RLS Policies for player_awards
CREATE POLICY "Group members can view awards" ON player_awards FOR SELECT 
USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

CREATE POLICY "System can manage awards" ON player_awards FOR ALL 
USING (true);

-- RLS Policies for player_payments
CREATE POLICY "Game participants can view payments" ON player_payments FOR SELECT 
USING (game_id IN (SELECT id FROM games WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())));

CREATE POLICY "Game participants can manage payments" ON player_payments FOR ALL 
USING (game_id IN (SELECT id FROM games WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())));

-- RLS Policies for invite_tokens
CREATE POLICY "Group members can view invite tokens" ON invite_tokens FOR SELECT 
USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

CREATE POLICY "Group members can create invite tokens" ON invite_tokens FOR INSERT 
WITH CHECK (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()) AND created_by = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_player_statistics_updated_at BEFORE UPDATE ON player_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_payments_updated_at BEFORE UPDATE ON player_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add functions for common operations
CREATE OR REPLACE FUNCTION calculate_player_statistics(p_player_id UUID, p_group_id UUID)
RETURNS void AS $$
DECLARE
    stats_record RECORD;
BEGIN
    -- Calculate statistics from game_players data
    SELECT 
        COUNT(*) as total_games,
        COALESCE(SUM(buy_in + COALESCE(rebuy_amount, 0)), 0) as total_buy_in,
        COALESCE(SUM(cash_out), 0) as total_cash_out,
        COALESCE(SUM(profit), 0) as total_profit,
        COALESCE(SUM(rebuys), 0) as total_rebuys,
        COALESCE(MAX(profit), 0) as biggest_win,
        COALESCE(MIN(profit), 0) as biggest_loss,
        COALESCE(AVG(profit), 0) as avg_profit,
        COALESCE(AVG(buy_in), 0) as avg_buy_in,
        COALESCE(COUNT(*) FILTER (WHERE profit > 0) * 100.0 / NULLIF(COUNT(*), 0), 0) as win_rate
    INTO stats_record
    FROM game_players gp
    JOIN games g ON gp.game_id = g.id
    WHERE gp.user_id = p_player_id 
    AND g.group_id = p_group_id 
    AND g.is_completed = true;
    
    -- Upsert statistics
    INSERT INTO player_statistics (
        player_id, group_id, total_games, total_buy_in, total_cash_out, 
        total_profit, total_rebuys, biggest_win, biggest_loss, 
        avg_profit, avg_buy_in, win_rate
    ) VALUES (
        p_player_id, p_group_id, stats_record.total_games, stats_record.total_buy_in,
        stats_record.total_cash_out, stats_record.total_profit, stats_record.total_rebuys,
        stats_record.biggest_win, stats_record.biggest_loss, stats_record.avg_profit,
        stats_record.avg_buy_in, stats_record.win_rate
    )
    ON CONFLICT (player_id, group_id) 
    DO UPDATE SET
        total_games = EXCLUDED.total_games,
        total_buy_in = EXCLUDED.total_buy_in,
        total_cash_out = EXCLUDED.total_cash_out,
        total_profit = EXCLUDED.total_profit,
        total_rebuys = EXCLUDED.total_rebuys,
        biggest_win = EXCLUDED.biggest_win,
        biggest_loss = EXCLUDED.biggest_loss,
        avg_profit = EXCLUDED.avg_profit,
        avg_buy_in = EXCLUDED.avg_buy_in,
        win_rate = EXCLUDED.win_rate,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
