-- Executar manualmente no Supabase somente após revisão.
create table if not exists public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.financial_categories enable row level security;
drop policy if exists "financial_categories_select_own" on public.financial_categories;
drop policy if exists "financial_categories_insert_own" on public.financial_categories;
drop policy if exists "financial_categories_update_own" on public.financial_categories;
drop policy if exists "financial_categories_delete_own" on public.financial_categories;
create policy "financial_categories_select_own" on public.financial_categories for select using (auth.uid() = user_id);
create policy "financial_categories_insert_own" on public.financial_categories for insert with check (auth.uid() = user_id);
create policy "financial_categories_update_own" on public.financial_categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "financial_categories_delete_own" on public.financial_categories for delete using (auth.uid() = user_id);

create index if not exists financial_categories_user_id_idx on public.financial_categories(user_id);
