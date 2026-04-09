-- ============================================================
-- ByteBoundless — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase Auth users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  plan text not null default 'free' check (plan in ('free', 'pro', 'agency')),
  searches_used integer not null default 0,
  searches_limit integer not null default 3,
  stripe_customer_id text,
  -- Profile fields (used in AI pitch generation)
  full_name text,
  company_name text,
  phone text,
  website text,
  portfolio_url text,
  location text,
  services text[] default '{}',
  years_experience integer,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- SCRAPE JOBS
-- ============================================================
create table public.scrape_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  query text not null,
  location text not null,
  options jsonb not null default '{"strict": false, "maxResults": 50, "enrich": true}',
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  phase text check (phase in ('collecting', 'extracting', 'enriching', 'scoring', 'done')),
  progress_current integer not null default 0,
  progress_total integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_scrape_jobs_user on public.scrape_jobs(user_id);
create index idx_scrape_jobs_status on public.scrape_jobs(status);

-- ============================================================
-- BUSINESSES
-- ============================================================
create table public.businesses (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references public.scrape_jobs(id) on delete cascade,
  name text not null,
  website text,
  phone text,
  address text,
  rating numeric(2,1),
  reviews integer,
  category text,
  unclaimed boolean not null default false,
  enrichment jsonb,
  lead_score integer not null default 0,
  lead_reasons jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index idx_businesses_job on public.businesses(job_id);
create index idx_businesses_score on public.businesses(lead_score desc);

-- ============================================================
-- SAVED LISTS
-- ============================================================
create table public.saved_lists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_saved_lists_user on public.saved_lists(user_id);

-- ============================================================
-- SAVED LIST ITEMS
-- ============================================================
create table public.saved_list_items (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid not null references public.saved_lists(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  status text not null default 'saved' check (status in ('saved', 'contacted', 'responded', 'closed')),
  notes text,
  contacted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(list_id, business_id)
);

-- ============================================================
-- LEAD PITCHES (AI cache)
-- ============================================================
create table public.lead_pitches (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade unique,
  pitch_angle text not null,
  improvement_suggestions text[] not null default '{}',
  draft_email text not null,
  generated_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — deny all by default
-- ============================================================

alter table public.profiles enable row level security;
alter table public.scrape_jobs enable row level security;
alter table public.businesses enable row level security;
alter table public.saved_lists enable row level security;
alter table public.saved_list_items enable row level security;
alter table public.lead_pitches enable row level security;

-- Profiles: users can read their own
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Scrape jobs: users can CRUD their own
create policy "Users can read own jobs"
  on public.scrape_jobs for select
  using (auth.uid() = user_id);

create policy "Users can create own jobs"
  on public.scrape_jobs for insert
  with check (auth.uid() = user_id);

-- Worker updates jobs via service_role key (bypasses RLS)

-- Businesses: users can read businesses from their own jobs
create policy "Users can read own businesses"
  on public.businesses for select
  using (
    exists (
      select 1 from public.scrape_jobs
      where scrape_jobs.id = businesses.job_id
      and scrape_jobs.user_id = auth.uid()
    )
  );

-- Saved lists: users can CRUD their own
create policy "Users can read own lists"
  on public.saved_lists for select
  using (auth.uid() = user_id);

create policy "Users can create own lists"
  on public.saved_lists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own lists"
  on public.saved_lists for update
  using (auth.uid() = user_id);

create policy "Users can delete own lists"
  on public.saved_lists for delete
  using (auth.uid() = user_id);

-- Saved list items: users can CRUD items in their own lists
create policy "Users can read own list items"
  on public.saved_list_items for select
  using (
    exists (
      select 1 from public.saved_lists
      where saved_lists.id = saved_list_items.list_id
      and saved_lists.user_id = auth.uid()
    )
  );

create policy "Users can create own list items"
  on public.saved_list_items for insert
  with check (
    exists (
      select 1 from public.saved_lists
      where saved_lists.id = saved_list_items.list_id
      and saved_lists.user_id = auth.uid()
    )
  );

create policy "Users can update own list items"
  on public.saved_list_items for update
  using (
    exists (
      select 1 from public.saved_lists
      where saved_lists.id = saved_list_items.list_id
      and saved_lists.user_id = auth.uid()
    )
  );

create policy "Users can delete own list items"
  on public.saved_list_items for delete
  using (
    exists (
      select 1 from public.saved_lists
      where saved_lists.id = saved_list_items.list_id
      and saved_lists.user_id = auth.uid()
    )
  );

-- Lead pitches: users can read pitches for businesses from their jobs
create policy "Users can read own pitches"
  on public.lead_pitches for select
  using (
    exists (
      select 1 from public.businesses
      join public.scrape_jobs on scrape_jobs.id = businesses.job_id
      where businesses.id = lead_pitches.business_id
      and scrape_jobs.user_id = auth.uid()
    )
  );

-- ============================================================
-- ADMIN HELPER (SECURITY DEFINER to avoid RLS recursion)
-- ============================================================
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Admin policies
create policy "Admins can read all profiles"
  on public.profiles for select using (public.is_admin());

create policy "Admins can update all profiles"
  on public.profiles for update using (public.is_admin());

create policy "Admins can read all jobs"
  on public.scrape_jobs for select using (public.is_admin());

create policy "Admins can read all businesses"
  on public.businesses for select using (public.is_admin());

-- ============================================================
-- REALTIME — enable for scrape_jobs progress
-- ============================================================
alter publication supabase_realtime add table public.scrape_jobs;
