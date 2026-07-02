-- Screenshot to React - database schema
--
-- Apply this in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.
-- The script is idempotent, so it is safe to re-run.

-- ---------------------------------------------------------------------------
-- generations: one row per generated component (screenshot + code)
-- ---------------------------------------------------------------------------
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  image_path text,
  code text not null,
  framework text not null default 'react-tailwind',
  created_at timestamptz not null default now()
);

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

-- Row Level Security: each user can only touch their own rows.
alter table public.generations enable row level security;

drop policy if exists "select own generations" on public.generations;
create policy "select own generations"
  on public.generations for select
  using (auth.uid() = user_id);

drop policy if exists "insert own generations" on public.generations;
create policy "insert own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own generations" on public.generations;
create policy "update own generations"
  on public.generations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own generations" on public.generations;
create policy "delete own generations"
  on public.generations for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: private "screenshots" bucket, files namespaced by user id
--   path convention: <user_id>/<generation_id>.png
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', false)
on conflict (id) do nothing;

drop policy if exists "read own screenshots" on storage.objects;
create policy "read own screenshots"
  on storage.objects for select
  using (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "upload own screenshots" on storage.objects;
create policy "upload own screenshots"
  on storage.objects for insert
  with check (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "delete own screenshots" on storage.objects;
create policy "delete own screenshots"
  on storage.objects for delete
  using (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
