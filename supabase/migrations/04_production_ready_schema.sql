-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id), -- Linked to Supabase Auth
  email TEXT UNIQUE NOT NULL,
  discord_id TEXT UNIQUE,
  pro_days_left INT DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Communities Table
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guild_id TEXT UNIQUE NOT NULL,
  guild_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Member Activity Table
CREATE TABLE IF NOT EXISTS member_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id TEXT NOT NULL REFERENCES communities(guild_id) ON DELETE CASCADE,
  discord_id TEXT NOT NULL,
  username TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(guild_id, discord_id)
);

-- 4. Churn Risk Logic & Table
DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('ACTIVE', 'SILENT', 'HIGH_RISK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS churn_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES member_activity(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  risk_level risk_level DEFAULT 'ACTIVE',
  member_email TEXT, -- Added previously for recovery
  member_name TEXT, -- Added previously for recovery
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Admin Settings
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Basic)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Admin only for settings, User for their own data)
CREATE POLICY "Users can see their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can see their own communities" ON communities FOR SELECT USING (auth.uid() = user_id);
