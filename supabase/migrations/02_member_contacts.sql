-- Update churn_scores to include member contact info for Resend
ALTER TABLE churn_scores ADD COLUMN IF NOT EXISTS member_email TEXT;
ALTER TABLE churn_scores ADD COLUMN IF NOT EXISTS member_name TEXT;

-- Let's also add some mock data for testing if the user wants
-- UPDATE churn_scores SET member_email = 'test@example.com', member_name = 'Test User' WHERE risk_level IN ('HIGH', 'CRITICAL');
