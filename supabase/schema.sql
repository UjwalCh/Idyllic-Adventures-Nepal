create extension if not exists "pgcrypto";
create extension if not exists "pg_net";

create schema if not exists private;

create table if not exists private.email_config (
  name text primary key,
  value text not null
);

revoke all on table private.email_config from public;

create table if not exists public.treks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  duration text not null,
  difficulty text not null check (difficulty in ('Easy', 'Moderate', 'Challenging', 'Strenuous')),
  max_altitude text not null,
  best_season text not null,
  group_size text not null,
  price text not null,
  image text not null,
  featured boolean not null default false,
  highlights jsonb not null default '[]'::jsonb,
  itinerary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  date date not null default current_date,
  type text not null check (type in ('info', 'warning', 'success')),
  created_at timestamptz not null default now()
);

create table if not exists public.website_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('page_view', 'cta_click')),
  path text not null,
  referrer text,
  user_agent text,
  session_id text not null,
  country text,
  region text,
  city text,
  country_code text,
  location_label text,
  created_at timestamptz not null default now()
);

alter table public.website_events add column if not exists country text;
alter table public.website_events add column if not exists region text;
alter table public.website_events add column if not exists city text;
alter table public.website_events add column if not exists country_code text;
alter table public.website_events add column if not exists location_label text;

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_type text not null check (inquiry_type in ('booking', 'contact', 'inquiry')),
  status text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  name text not null,
  email text not null,
  phone text,
  trek text,
  people_count integer,
  preferred_date date,
  message text not null,
  source_path text,
  create table if not exists public.site_settings (
    key text primary key,
    value text not null,
    description text,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
  );

  create table if not exists public.spam_config (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    blocked_keywords text[] not null default '{}',
    max_urls_allowed integer not null default 3,
    check_url_limit boolean not null default true,
    check_disposable_emails boolean not null default true,
    use_honeypot boolean not null default true,
    enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  alter table public.spam_config add column if not exists check_url_limit boolean not null default true;

  create table if not exists public.submission_logs (
    id uuid primary key default gen_random_uuid(),
    ip_address text not null,
    inquiry_id uuid references public.inquiries(id) on delete set null,
    flagged boolean not null default false,
    spam_reason text,
    created_at timestamptz not null default now()
  );

  create index if not exists submission_logs_ip_created on public.submission_logs(ip_address, created_at);
  create index if not exists submission_logs_flagged on public.submission_logs(flagged);

  created_at timestamptz not null default now()
);

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function private.get_secret(secret_name text)
returns text
language sql
security definer
set search_path = public, extensions
as $$
  select value
  from private.email_config
  where name = secret_name
  limit 1;
$$;

revoke all on function private.get_secret(text) from public;

create or replace function public.notify_new_inquiry_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  resend_api_key text;
  alert_email_to text;
  alert_email_from text;
  payload jsonb;
begin
  resend_api_key := private.get_secret('resend_api_key');
  alert_email_to := private.get_secret('alert_email_to');
  alert_email_from := private.get_secret('alert_email_from');

  if coalesce(resend_api_key, '') = '' or coalesce(alert_email_to, '') = '' then
    return new;
  end if;

  payload := jsonb_build_object(
    'id', new.id,
    'inquiry_type', new.inquiry_type,
    'status', new.status,
    'name', new.name,
    'email', new.email,
    'phone', new.phone,
    'trek', new.trek,
    'people_count', new.people_count,
    'preferred_date', new.preferred_date,
    'message', new.message,
    'source_path', new.source_path,
    'created_at', new.created_at
  );

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || resend_api_key
    ),
    body := jsonb_build_object(
      'from', coalesce(alert_email_from, 'Idyllic Alerts <onboarding@resend.dev>'),
      'to', jsonb_build_array(alert_email_to),
      'subject', 'New ' || upper(new.inquiry_type) || ' lead from ' || new.name,
      'html', (
        '<h2>New Inquiry Received</h2>' ||
        '<p><strong>Type:</strong> ' || coalesce(new.inquiry_type, '') || '</p>' ||
        '<p><strong>Status:</strong> ' || coalesce(new.status, '') || '</p>' ||
        '<p><strong>Name:</strong> ' || coalesce(new.name, '') || '</p>' ||
        '<p><strong>Email:</strong> ' || coalesce(new.email, '') || '</p>' ||
        '<p><strong>Phone:</strong> ' || coalesce(new.phone, 'Not provided') || '</p>' ||
        '<p><strong>Trek:</strong> ' || coalesce(new.trek, 'General inquiry') || '</p>' ||
        '<p><strong>Group size:</strong> ' || coalesce(new.people_count::text, 'Not provided') || '</p>' ||
        '<p><strong>Preferred date:</strong> ' || coalesce(new.preferred_date::text, 'Not provided') || '</p>' ||
        '<p><strong>Source:</strong> ' || coalesce(new.source_path, 'Unknown') || '</p>' ||
        '<hr />' ||
        '<p><strong>Message</strong></p>' ||
        '<p>' || replace(coalesce(new.message, ''), E'\n', '<br />') || '</p>'
      ),
      'reply_to', new.email
    )
  );

  return new;
end;
$$;

drop trigger if exists inquiries_email_notification on public.inquiries;
create trigger inquiries_email_notification
after insert on public.inquiries
for each row
execute function public.notify_new_inquiry_email();

insert into storage.buckets (id, name, public)
values ('trek-images', 'trek-images', true)
on conflict (id) do update
set public = excluded.public;

alter table public.treks enable row level security;
alter table public.notices enable row level security;
alter table public.app_admins enable row level security;
alter table public.website_events enable row level security;
alter table public.inquiries enable row level security;
alter table public.site_settings enable row level security;
alter table public.spam_config enable row level security;
alter table public.submission_logs enable row level security;

drop policy if exists "Public read treks" on public.treks;
create policy "Public read treks"
  on public.treks
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read notices" on public.notices;
create policy "Public read notices"
  on public.notices
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated write treks" on public.treks;
drop policy if exists "Live edit write treks" on public.treks;
drop policy if exists "Admin write treks" on public.treks;
create policy "Admin write treks"
  on public.treks
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

drop policy if exists "Authenticated write notices" on public.notices;
drop policy if exists "Live edit write notices" on public.notices;
drop policy if exists "Admin write notices" on public.notices;
create policy "Admin write notices"
  on public.notices
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

drop policy if exists "Admin read own role" on public.app_admins;
create policy "Admin read own role"
  on public.app_admins
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Public insert website events" on public.website_events;
create policy "Public insert website events"
  on public.website_events
  for insert
  to anon, authenticated
  with check (
    event_type in ('page_view', 'cta_click')
    and char_length(path) > 0
    and char_length(path) <= 300
    and char_length(session_id) > 0
    and char_length(session_id) <= 120
  );

drop policy if exists "Admin read website events" on public.website_events;
create policy "Admin read website events"
  on public.website_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  );

drop policy if exists "Public insert inquiries" on public.inquiries;
create policy "Public insert inquiries"
  on public.inquiries
  for insert
  to anon, authenticated
  with check (
    inquiry_type in ('booking', 'contact', 'inquiry')
    and char_length(name) > 0
    and char_length(name) <= 120
    and char_length(email) > 3
    and char_length(email) <= 180
    and char_length(message) > 0
    and char_length(message) <= 5000
  );

drop policy if exists "Admin read inquiries" on public.inquiries;
create policy "Admin read inquiries"
  on public.inquiries
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  );

drop policy if exists "Admin update inquiries" on public.inquiries;
create policy "Admin update inquiries"
  on public.inquiries
  for update
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

drop policy if exists "Admin delete inquiries" on public.inquiries;
create policy "Admin delete inquiries"
  on public.inquiries
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  );

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

drop policy if exists "Admin read spam config" on public.spam_config;
create policy "Admin read spam config"
  on public.spam_config
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  );

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
  with check (char_length(ip_address) > 0 and char_length(ip_address) <= 120);

insert into public.spam_config (name, blocked_keywords, max_urls_allowed, check_url_limit, check_disposable_emails, use_honeypot, enabled)
values (
  'default',
  array['viagra','casino','forex','crypto','loan','free money','adult','porn'],
  3,
  true,
  true,
  true,
  true
)
on conflict (name) do nothing;

insert into public.site_settings (key, value, description)
values
  ('location', 'Pokhara, Nepal', 'Primary business location'),
  ('phone_1', '+977 1234567890', 'Primary phone number'),
  ('phone_2', '+977 9876543210', 'Secondary phone number'),
  ('email_main', 'info@idyllicadventures.com', 'Main contact email'),
  ('email_booking', 'booking@idyllicadventures.com', 'Booking email'),
  ('whatsapp_number', '+977 9876543210', 'WhatsApp contact number'),
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
  ('footer_description', 'Your trusted solo guide to exploring the majestic Himalayas. Personally leading unforgettable trekking experiences since 2010.', 'Footer company description')
on conflict (key) do nothing;

drop policy if exists "Public read trek images" on storage.objects;
create policy "Public read trek images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'trek-images');

drop policy if exists "Admin upload trek images" on storage.objects;
create policy "Admin upload trek images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'trek-images'
    and exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  );

drop policy if exists "Admin update trek images" on storage.objects;
create policy "Admin update trek images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'trek-images'
    and exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'trek-images'
    and exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  );

drop policy if exists "Admin delete trek images" on storage.objects;
create policy "Admin delete trek images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'trek-images'
    and exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  );

insert into public.app_admins (user_id)
values ('ee8fb43d-853c-48a4-971f-e7efaa4c50a9')
on conflict (user_id) do nothing;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'treks'
    ) then
      alter publication supabase_realtime add table public.treks;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'notices'
    ) then
      alter publication supabase_realtime add table public.notices;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'website_events'
    ) then
      alter publication supabase_realtime add table public.website_events;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'inquiries'
    ) then
      alter publication supabase_realtime add table public.inquiries;
    end if;
  end if;
end $$;
