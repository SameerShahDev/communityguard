-- Add admin role check to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set the first user (or a specific email) as admin if needed
-- UPDATE users SET is_admin = TRUE WHERE email = 'YOUR_EMAIL@example.com';
