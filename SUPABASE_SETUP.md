# Supabase Save Environment

## 1. Add Environment Variables

Create `.env` in project root:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## 2. Create Table and Policies

Run this SQL in Supabase SQL editor:

```sql
create table if not exists public.snake_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  mode text not null,
  score integer not null check (score >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, mode)
);

alter table public.snake_scores enable row level security;

create policy "users_can_read_scores"
on public.snake_scores
for select
to anon, authenticated
using (true);

create policy "users_can_insert_own_scores"
on public.snake_scores
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users_can_update_own_scores"
on public.snake_scores
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## 3. Restart Dev Server

After `.env` changes, restart `npm run dev`.
