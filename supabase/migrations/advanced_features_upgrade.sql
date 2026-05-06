-- 🏔️ Idyllic Adventures Nepal: Advanced Admin Features Migration

-- 1. Support for Notice Expiry
ALTER TABLE notices ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Support for Gallery Videos and Watermarking Metadata
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS is_video BOOLEAN DEFAULT false;
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS is_watermarked BOOLEAN DEFAULT false;

-- 3. Ensure site_settings has enough entries for system/security
-- We use upsert to avoid duplicates but ensure defaults exist
INSERT INTO site_settings (key, value)
VALUES 
    ('maintenance_mode', 'false'),
    ('spam_sensitivity', 'medium'),
    ('backup_last_run', NOW()::text)
ON CONFLICT (key) DO NOTHING;

-- 4. Inquiries Status Constraint (Ensure sync with UI)
-- Check if constraint exists first (optional but good practice)
-- ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS status_check;
-- ALTER TABLE inquiries ADD CONSTRAINT status_check CHECK (status IN ('new', 'in_progress', 'closed'));
