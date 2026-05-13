-- Run this in your Supabase SQL editor

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  created_at timestamptz default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text check (plan in ('starter', 'daily', 'pro')),
  status text check (status in ('trialing', 'active', 'canceled', 'past_due', 'incomplete')),
  current_period_end timestamptz,
  created_at timestamptz default now()
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  topics text[] default '{}',
  delivery_time text default '07:00',
  updated_at timestamptz default now()
);

create table public.newsletter_cache (
  id uuid primary key default gen_random_uuid(),
  cluster_key text not null,
  content text not null,
  sent_date date not null default current_date,
  unique(cluster_key, sent_date)
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  insert into public.interests (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.interests enable row level security;
alter table public.newsletter_cache enable row level security;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can read own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can read own interests" on public.interests for select using (auth.uid() = user_id);
create policy "Users can update own interests" on public.interests for update using (auth.uid() = user_id);
create policy "Service role full access profiles" on public.profiles for all using (auth.role() = 'service_role');
create policy "Service role full access subscriptions" on public.subscriptions for all using (auth.role() = 'service_role');
create policy "Service role full access interests" on public.interests for all using (auth.role() = 'service_role');
create policy "Service role full access cache" on public.newsletter_cache for all using (auth.role() = 'service_role');
