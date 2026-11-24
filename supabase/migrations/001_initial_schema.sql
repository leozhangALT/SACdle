create extension if not exists "pgcrypto";

create table if not exists teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams(id) on delete cascade,
  name       text not null,
  photo_url  text,
  created_at timestamptz not null default now()
);

create index if not exists members_team_id_idx on members(team_id);

create table if not exists clues (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references members(id) on delete cascade,
  type       text not null,
  value      text not null,
  created_at timestamptz not null default now()
);

create index if not exists clues_member_id_idx on clues(member_id);

-- Open RLS (no auth required)
alter table teams   enable row level security;
alter table members enable row level security;
alter table clues   enable row level security;

create policy "public_all_teams"   on teams   for all using (true) with check (true);
create policy "public_all_members" on members for all using (true) with check (true);
create policy "public_all_clues"   on clues   for all using (true) with check (true);
