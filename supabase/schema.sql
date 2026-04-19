-- Notes app schema
-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  title text not null default '',
  content text not null default '',
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at on row change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger notes_updated_at
  before update on notes
  for each row execute procedure update_updated_at();

-- Enable Realtime for the notes table
alter publication supabase_realtime add table notes;

-- RLS: disable for now (personal app, no auth)
-- Enable and configure policies when you add auth
alter table notes disable row level security;
