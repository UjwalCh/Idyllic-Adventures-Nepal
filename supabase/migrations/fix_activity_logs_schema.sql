-- 🏔️ Idyllic Adventures Nepal: Fix Admin Activity Logs Schema
-- Run this in Supabase SQL Editor to enable detailed log views

ALTER TABLE admin_activity_logs ADD COLUMN IF NOT EXISTS previous_data JSONB;
ALTER TABLE admin_activity_logs ADD COLUMN IF NOT EXISTS new_data JSONB;

-- Update RLS if needed
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
