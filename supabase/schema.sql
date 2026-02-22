-- DeepFlow Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  subscription_status text default 'free' check (subscription_status in ('free', 'trial', 'pro')),
  subscription_ends_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Profiles policies
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Goals (Life Goals)
create table goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category text check (category in ('career', 'health', 'finance', 'personal', 'relationships')),
  color text default '#3B82F6',
  target_date date,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table goals enable row level security;

-- Goals policies
create policy "Users can CRUD own goals" on goals
  for all using (auth.uid() = user_id);

-- Projects (belong to Goals)
create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  goal_id uuid references goals(id) on delete cascade,
  title text not null,
  description text,
  status text default 'active' check (status in ('active', 'completed', 'on_hold')),
  deadline date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table projects enable row level security;

-- Projects policies
create policy "Users can CRUD own projects" on projects
  for all using (auth.uid() = user_id);

-- Tasks (belong to Projects or Goals)
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  goal_id uuid references goals(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  is_completed boolean default false,
  completed_at timestamptz,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  is_inbox boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table tasks enable row level security;

-- Tasks policies
create policy "Users can CRUD own tasks" on tasks
  for all using (auth.uid() = user_id);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger goals_updated_at
  before update on goals
  for each row execute procedure update_updated_at();

create trigger projects_updated_at
  before update on projects
  for each row execute procedure update_updated_at();

create trigger tasks_updated_at
  before update on tasks
  for each row execute procedure update_updated_at();

-- Indexes for performance
create index goals_user_id_idx on goals(user_id);
create index projects_user_id_idx on projects(user_id);
create index projects_goal_id_idx on projects(goal_id);
create index tasks_user_id_idx on tasks(user_id);
create index tasks_project_id_idx on tasks(project_id);
create index tasks_goal_id_idx on tasks(goal_id);
create index tasks_due_date_idx on tasks(due_date);
create index tasks_is_completed_idx on tasks(is_completed);
