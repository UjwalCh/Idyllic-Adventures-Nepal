-- 4. ANALYTICS & REALTIME FIX
-- Run this to enable LIVE visitor tracking on your dashboard!

-- Enable Row Level Security
alter table public.website_events enable row level security;

-- Wipe old policies
drop policy if exists "Allow public to insert website_events" on public.website_events;

-- Allow visitors to send their location and page view data
create policy "Allow public to insert website_events"
on public.website_events for insert to anon with check (true);

-- Enable REALTIME (The "Live Switch")
-- This makes your dashboard update INSTANTLY when someone visits
alter publication supabase_realtime add table website_events;

-- Grant permissions to public
grant insert on table public.website_events to anon;

-- 5. ENQUIRY NOTIFICATION SETTINGS
-- These settings allow you to control email alerts from the Admin Panel.
-- Your email sending function (Edge Function) should now query 'site_settings':
--   - enquiry_notifications_enabled (true/false)
--   - enquiry_email (The destination address)
