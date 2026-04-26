-- Add RLS policies for new tables

alter table public.site_settings enable row level security;
alter table public.spam_config enable row level security;
alter table public.submission_logs enable row level security;

drop policy if exists "Public read site settings" on public.site_settings;
create policy "Public read site settings"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin write site settings" on public.site_settings;
create policy "Admin write site settings"
  on public.site_settings
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  );

drop policy if exists "Public read spam config" on public.spam_config;
create policy "Public read spam config"
  on public.spam_config
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin write spam config" on public.spam_config;
create policy "Admin write spam config"
  on public.spam_config
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  );

drop policy if exists "Admin read submission logs" on public.submission_logs;
create policy "Admin read submission logs"
  on public.submission_logs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  );

drop policy if exists "Public insert submission logs" on public.submission_logs;
create policy "Public insert submission logs"
  on public.submission_logs
  for insert
  to anon, authenticated
  with check (true);

-- Insert default site settings if not exists
INSERT INTO public.site_settings (key, value, description) VALUES
  ('location', 'Pokhara, Nepal', 'Company location'),
  ('phone_1', '+977 1234567890', 'Primary phone number'),
  ('phone_2', '+977 9876543210', 'Secondary phone number'),
  ('email_main', 'chapagaiujwal@gmail.com', 'Main email'),
  ('email_booking', 'chapagaiujwal@gmail.com', 'Booking email'),
  ('whatsapp_number', '+977 9876543210', 'WhatsApp number'),
  ('nav_brand_name', 'Idyllic Adventures', 'Navigation brand title'),
  ('nav_brand_tagline', 'Explore Nepal', 'Navigation subtitle'),
  ('home_hero_badge', 'Explore the Himalayas', 'Homepage hero badge'),
  ('home_hero_title_line1', 'Discover Your', 'Homepage hero title line 1'),
  ('home_hero_title_line2', 'Idyllic Adventure', 'Homepage hero title line 2'),
  ('home_hero_description', 'Trek through the world''s highest mountains with a dedicated local trek leader. Create memories that last a lifetime in the majestic landscapes of Nepal.', 'Homepage hero description'),
  ('home_featured_title', 'Featured Treks', 'Homepage featured section title'),
  ('home_featured_subtitle', 'Handpicked adventures for the ultimate Himalayan experience', 'Homepage featured section subtitle'),
  ('home_cta_title', 'Ready for Your Next Adventure?', 'Homepage bottom CTA title'),
  ('home_cta_description', 'Contact me today to start planning your unforgettable journey through the Himalayas. I will personally help you every step of the way.', 'Homepage bottom CTA description'),
  ('home_cta_button_label', 'Get in Touch', 'Homepage bottom CTA button label'),
  ('about_hero_title', 'About Idyllic Adventures', 'About page hero title'),
  ('about_hero_description', 'A personal trekking service run by one dedicated local guide', 'About page hero subtitle'),
  ('about_story_title', 'My Story', 'About page story section title'),
  ('about_values_title', 'My Values', 'About page values section title'),
  ('about_values_subtitle', 'The principles that guide every trek I organize', 'About page values section subtitle'),
  ('about_guide_title', 'Meet Your Guide', 'About page guide section title'),
  ('about_guide_subtitle', 'A dedicated local trek leader focused on making your journey unforgettable', 'About page guide section subtitle'),
  ('contact_hero_title', 'Get in Touch', 'Contact page hero title'),
  ('contact_hero_description', 'Ready to start your Himalayan adventure? Contact me and I will help you plan the perfect trek.', 'Contact page hero subtitle'),
  ('footer_description', 'Your trusted solo guide to exploring the majestic Himalayas. Personally leading unforgettable trekking experiences since 2010.', 'Footer description text')
ON CONFLICT (key) DO NOTHING;

-- Insert default spam config
INSERT INTO public.spam_config (name, blocked_keywords, max_urls_allowed) VALUES
  ('default', ARRAY['viagra', 'casino', 'poker', 'bitcoin', 'crypto', 'forex', 'loan', 'weight loss', 'discount drugs'], 3)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.spam_config ADD COLUMN IF NOT EXISTS check_url_limit boolean NOT NULL DEFAULT true;
