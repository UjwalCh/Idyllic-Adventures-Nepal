-- 🏔️ Idyllic Adventures Nepal: Admin Panel Upgrade Migration

-- 1. Update 'treks' table for Drag-and-Drop
ALTER TABLE treks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Update 'journal_entries' for SEO
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- 3. Update 'notices' for Targeted Pages
ALTER TABLE notices ADD COLUMN IF NOT EXISTS target_page TEXT DEFAULT 'all';

-- 4. Update 'gallery_images' for Albums
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS album_name TEXT DEFAULT 'General';

-- 5. Update 'inquiries' for Internal CRM Notes
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 6. Create 'admin_logs' table for Audit Trail (System Level)
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type TEXT NOT NULL, -- create, update, delete, toggle
    entity_type TEXT NOT NULL, -- treks, notices, journal, etc.
    entity_id TEXT NOT NULL,
    details TEXT,
    previous_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create 'admin_activity_logs' table for User Activity tracking
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view logs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view logs') THEN
        CREATE POLICY "Admins can view logs" ON admin_logs FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert logs') THEN
        CREATE POLICY "Admins can insert logs" ON admin_logs FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view activity logs') THEN
        CREATE POLICY "Admins can view activity logs" ON admin_activity_logs FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert activity logs') THEN
        CREATE POLICY "Admins can insert activity logs" ON admin_activity_logs FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
END $$;

-- Ensure correct sort_order for existing treks
UPDATE treks SET sort_order = 0 WHERE sort_order IS NULL;
