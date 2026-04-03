-- Core Tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  stripe_id TEXT,
  pro_days_left INT DEFAULT 0,
  referral_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  discord_server_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_activity (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  discord_id TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (community_id, discord_id)
);

CREATE TABLE IF NOT EXISTS churn_scores (
  member_id TEXT NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  risk_level TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (member_id, community_id)
);

-- Referral System
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_paid BOOLEAN DEFAULT FALSE,
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gift_codes (
  code TEXT PRIMARY KEY,
  uses_left INT DEFAULT 0,
  created_by_admin BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Admin Controls
CREATE TABLE IF NOT EXISTS admin_settings (
  id INT PRIMARY KEY DEFAULT 1,
  referral_active BOOLEAN DEFAULT TRUE,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  pro_price INT DEFAULT 3500,
  enterprise_price INT DEFAULT 12000
);

-- Insert default admin settings
INSERT INTO admin_settings (id, referral_active, maintenance_mode, pro_price, enterprise_price)
VALUES (1, TRUE, FALSE, 3500, 12000)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS manual_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  days_added INT NOT NULL,
  reason TEXT,
  added_by_admin BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
