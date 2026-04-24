# Idyllic Adventures Nepal

This project started from a Figma Make export and is now connected to Supabase-ready realtime data flows.

## What is live now

- Public pages read trek and notice data from Supabase when configured.
- Admin trek and notice actions write to Supabase using real Supabase Auth session.
- The app subscribes to Supabase Realtime, so updates appear automatically without manual refresh.
- If Supabase is not configured, the app falls back to local mock data.

## Quick start

1. Install dependencies.

```bash
npm install
```

2. Create a `.env` file in the project root and copy values from `.env.example`.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. In Supabase SQL Editor, run [supabase/schema.sql](supabase/schema.sql).

4. Create one admin account in Supabase Auth.
   - Supabase Dashboard > Authentication > Users > Add user.

5. Add that user as app admin (replace with real user id):

```sql
insert into public.app_admins (user_id)
values ('YOUR_AUTH_USER_UUID')
on conflict (user_id) do nothing;
```

6. Start development server.

```bash
npm run dev
```

## Admin auth and security

- Admin login uses Supabase email/password authentication.
- Public users can read treks and notices.
- Only authenticated users listed in `public.app_admins` can create, update, or delete treks and notices.
- Public page views are tracked in Supabase with live location analytics for the admin dashboard.

## Storage setup

- Create a public Supabase Storage bucket named `trek-images`.
- The Images admin page uploads files into that bucket and writes the public URL back to the trek record.
- If you replace an image from the Images page, the trek image URL is updated live through Realtime.

## Deploying on Supabase hosting

1. Build the project.

```bash
npm run build
```

2. Deploy the generated `dist` folder to Supabase hosting/static hosting.

3. Add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your hosting environment variables.

4. In production, keep `public.app_admins` limited to your own account only.

## Instant Email Alerts for New Inquiries

The app now sends new booking/contact/inquiry notifications directly from the database using `pg_net` and Resend.

1. In Supabase SQL Editor, run [supabase/schema.sql](supabase/schema.sql).

2. Store these vault secrets in Supabase:

```sql
insert into private.email_config (name, value)
values ('resend_api_key', 'your_resend_api_key')
on conflict (name) do update set value = excluded.value;

insert into private.email_config (name, value)
values ('alert_email_to', 'you@example.com')
on conflict (name) do update set value = excluded.value;

insert into private.email_config (name, value)
values ('alert_email_from', 'Idyllic Alerts <onboarding@resend.dev>')
on conflict (name) do update set value = excluded.value;
```

3. Submit a test inquiry from the Contact page. You should receive an alert email within seconds.

4. The admin inbox is visible in [src/app/pages/admin/AdminInquiriesPage.tsx](src/app/pages/admin/AdminInquiriesPage.tsx) and the dashboard shows live lead counts.
