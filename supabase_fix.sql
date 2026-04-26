-- 3. JOURNAL AUTHOR FIX (FINAL)
-- Run this to add the missing Author columns so you can save your stories!

alter table public.journal_entries 
add column if not exists author_name text default 'Ujwal Chhetri',
add column if not exists author_role text default 'Lead Trek Leader',
add column if not exists author_image text,
add column if not exists author_bio text;

-- FIXED: Use DROP then CREATE (PostgreSQL doesn't support IF NOT EXISTS for policies)
drop policy if exists "Allow authenticated users to manage journal" on public.journal_entries;

create policy "Allow authenticated users to manage journal"
on public.journal_entries
for all
to authenticated
using (true)
with check (true);
