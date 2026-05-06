-- 🏔️ Idyllic Adventures Nepal: Fix Logs and Spam System
-- This migration corrects the nested table definitions and ensures all systems are robust.

-- 1. Ensure 'inquiries' has correct structure and new 'is_spam' flag
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT false;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS client_ip TEXT;

-- 2. Create 'site_settings' (if nested bug prevented it)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Create 'spam_config' properly
CREATE TABLE IF NOT EXISTS public.spam_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    blocked_keywords TEXT[] NOT NULL DEFAULT '{}',
    max_urls_allowed INTEGER NOT NULL DEFAULT 3,
    check_url_limit BOOLEAN NOT NULL DEFAULT true,
    check_disposable_emails BOOLEAN NOT NULL DEFAULT true,
    use_honeypot BOOLEAN NOT NULL DEFAULT true,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create 'submission_logs' properly
CREATE TABLE IF NOT EXISTS public.submission_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
    flagged BOOLEAN NOT NULL DEFAULT false,
    spam_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS submission_logs_ip_created ON public.submission_logs(ip_address, created_at);
CREATE INDEX IF NOT EXISTS submission_logs_flagged ON public.submission_logs(flagged);

-- 5. Create 'admin_logs' (Audit Trail)
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL, -- create, update, delete, toggle
    entity_type TEXT NOT NULL, -- treks, notices, journal, etc.
    entity_id TEXT NOT NULL,
    details TEXT,
    previous_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create 'admin_activity_logs' (User Activity)
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    previous_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS Policies
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spam_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Site Settings Policies
DROP POLICY IF EXISTS "Public read site settings" ON public.site_settings;
CREATE POLICY "Public read site settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write site settings" ON public.site_settings;
CREATE POLICY "Admin write site settings" ON public.site_settings FOR ALL TO authenticated USING (true);

-- Spam Config Policies
DROP POLICY IF EXISTS "Public read spam config" ON public.spam_config;
CREATE POLICY "Public read spam config" ON public.spam_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write spam config" ON public.spam_config;
CREATE POLICY "Admin write spam config" ON public.spam_config FOR ALL TO authenticated USING (true);

-- Submission Logs Policies
DROP POLICY IF EXISTS "Admin read submission logs" ON public.submission_logs;
CREATE POLICY "Admin read submission logs" ON public.submission_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public insert submission logs" ON public.submission_logs;
CREATE POLICY "Public insert submission logs" ON public.submission_logs FOR INSERT WITH CHECK (true);

-- Admin Logs Policies
DROP POLICY IF EXISTS "Admins can view logs" ON public.admin_logs;
CREATE POLICY "Admins can view logs" ON public.admin_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert logs" ON public.admin_logs;
CREATE POLICY "Admins can insert logs" ON public.admin_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Admin Activity Logs Policies
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can view activity logs" ON public.admin_activity_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can insert activity logs" ON public.admin_activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 8. Default Data
INSERT INTO public.spam_config (name, blocked_keywords, max_urls_allowed)
VALUES ('default', ARRAY['viagra', 'casino', 'poker', 'bitcoin', 'crypto', 'forex', 'loan', 'weight loss', 'discount drugs', 'adult', 'porn', 'free money'], 3)
ON CONFLICT (name) DO NOTHING;

-- Ensure some base settings exist for the Engine
INSERT INTO public.site_settings (key, value)
VALUES 
    ('maintenance_mode', 'false'),
    ('spam_sensitivity', 'medium'),
    ('enquiry_notifications_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
