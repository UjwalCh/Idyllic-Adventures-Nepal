-- 1) Verify admin role is present
select user_id, created_at
from public.app_admins
where user_id = 'ee8fb43d-853c-48a4-971f-e7efaa4c50a9';

-- 2) Optional: clear existing demo content before reseeding
-- delete from public.treks;
-- delete from public.notices;

-- 3) Seed treks only if table is empty
insert into public.treks (
  title,
  description,
  duration,
  difficulty,
  max_altitude,
  best_season,
  group_size,
  price,
  image,
  featured,
  highlights,
  itinerary
)
select
  'Everest Base Camp Trek',
  'Experience the ultimate Himalayan adventure with stunning views of Everest and classic Sherpa trail villages.',
  '14 Days',
  'Challenging',
  '5,364m / 17,598ft',
  'March-May, Sept-Nov',
  '1-8 people',
  '$1,450 per person',
  'https://images.unsplash.com/photo-1700556581867-58061f78bb76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  true,
  '["Witness sunrise over Everest","Visit Tengboche Monastery","Experience Sherpa culture"]'::jsonb,
  '[{"day":1,"title":"Arrival in Kathmandu","description":"Arrival, briefing, and gear check."},{"day":2,"title":"Fly to Lukla","description":"Scenic mountain flight and trek start."}]'::jsonb
where not exists (select 1 from public.treks)
union all
select
  'Annapurna Circuit Trek',
  'A legendary circuit through diverse terrain and cultures around the Annapurna massif.',
  '16 Days',
  'Challenging',
  '5,416m / 17,769ft',
  'March-May, Oct-Nov',
  '1-8 people',
  '$1,350 per person',
  'https://images.unsplash.com/photo-1700556581902-6aa21e96507c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  true,
  '["Cross Thorong La Pass","Visit Muktinath Temple","Walk varied climate zones"]'::jsonb,
  '[]'::jsonb
where not exists (select 1 from public.treks);

-- 4) Seed notices only if table is empty
insert into public.notices (title, message, date, type)
select
  'Bookings Open',
  'Current season bookings are now open. Contact us for custom dates and route plans.',
  current_date,
  'success'
where not exists (select 1 from public.notices)
union all
select
  'Travel Advisory',
  'Please confirm permit requirements before departure.',
  current_date - interval '2 day',
  'info'
where not exists (select 1 from public.notices);

-- 5) Quick visibility checks
select count(*) as trek_count from public.treks;
select count(*) as notice_count from public.notices;
