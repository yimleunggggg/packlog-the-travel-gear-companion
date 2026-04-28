-- Packlog relational schema (v1)
-- Scope: no auth tables yet; user linkage to be added later.

create table if not exists trips (
  id text primary key,
  title text not null,
  start_date text not null,
  days integer not null check (days > 0),
  climate text not null,
  scenario text not null,
  phase text not null check (phase in ('PACK', 'REVIEW')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trip_destinations (
  id bigint generated always as identity primary key,
  trip_id text not null references trips(id) on delete cascade,
  city_id text not null,
  country_id text not null,
  region_id text not null,
  city_en text not null,
  city_zh text not null,
  country_flag text not null
);

create index if not exists idx_trip_destinations_trip_id on trip_destinations(trip_id);

create table if not exists trip_containers (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  code text not null,
  name text not null,
  name_zh text,
  type text not null,
  capacity_l double precision not null check (capacity_l >= 0),
  max_kg double precision not null check (max_kg >= 0),
  position integer not null default 0
);

create index if not exists idx_trip_containers_trip_id on trip_containers(trip_id);

create table if not exists gear_library (
  id text primary key,
  name text not null,
  name_en text,
  name_zh text,
  brand text,
  weight_g double precision not null check (weight_g >= 0),
  category text not null check (category in ('tech', 'apparel', 'doc', 'health', 'optic', 'misc')),
  description text not null default '',
  description_zh text,
  owned_since text not null,
  ownership text not null check (ownership in ('owned', 'wishlist', 'undecided')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gear_library_category on gear_library(category);
create unique index if not exists idx_gear_library_name_brand on gear_library(name, coalesce(brand, ''));

create table if not exists trip_items (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  container_id text not null references trip_containers(id) on delete cascade,
  gear_id text references gear_library(id) on delete set null,
  name text not null,
  name_en text,
  name_zh text,
  qty integer not null default 1 check (qty > 0),
  weight_g double precision not null default 0 check (weight_g >= 0),
  weight_source text check (weight_source in ('library', 'user', 'spec')),
  category text not null check (category in ('tech', 'apparel', 'doc', 'health', 'optic', 'misc')),
  status text not null check (status in ('todo', 'packed')),
  verdict text check (verdict in ('keep', 'drop', 'upgrade')),
  utility integer check (utility between 1 and 5),
  ownership text not null check (ownership in ('owned', 'wishlist', 'undecided')),
  brand text,
  model text,
  sku text,
  note text,
  position integer not null default 0
);

create index if not exists idx_trip_items_trip_id on trip_items(trip_id);
create index if not exists idx_trip_items_container_id on trip_items(container_id);
create index if not exists idx_trip_items_gear_id on trip_items(gear_id);

create table if not exists gear_reviews (
  id bigint generated always as identity primary key,
  gear_id text not null references gear_library(id) on delete cascade,
  trip_id text not null references trips(id) on delete cascade,
  trip_title text not null,
  review_date text not null,
  verdict text not null check (verdict in ('keep', 'drop', 'upgrade')),
  utility integer not null check (utility between 1 and 5),
  note text not null default ''
);

create index if not exists idx_gear_reviews_gear_id on gear_reviews(gear_id);
create index if not exists idx_gear_reviews_trip_id on gear_reviews(trip_id);

create table if not exists community_templates (
  id text primary key,
  author text not null,
  rating double precision not null default 0,
  cloned integer not null default 0,
  title text not null,
  title_zh text,
  scenario text not null,
  climate text not null,
  total_weight text not null,
  intro text not null,
  intro_zh text
);

create table if not exists community_template_items (
  id bigint generated always as identity primary key,
  template_id text not null references community_templates(id) on delete cascade,
  name text not null,
  name_zh text,
  weight_g double precision not null check (weight_g >= 0),
  qty integer not null default 1 check (qty > 0),
  category text not null check (category in ('tech', 'apparel', 'doc', 'health', 'optic', 'misc')),
  why text not null,
  why_zh text,
  position integer not null default 0
);

create index if not exists idx_template_items_template_id on community_template_items(template_id);

-- Snapshot table used by current repository implementation.
-- This table lets the app sync the full state now, while still keeping normalized tables for future incremental migration.
create table if not exists packlog_snapshots (
  workspace text primary key,
  schema_version integer not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_packlog_snapshots_updated_at on packlog_snapshots(updated_at desc);

-- Keep updated_at fresh on every update.
create or replace function set_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_packlog_snapshots_updated_at on packlog_snapshots;
create trigger trg_packlog_snapshots_updated_at
before update on packlog_snapshots
for each row execute function set_timestamp_updated_at();

-- RLS: open by default for anon/client access in early phase.
-- Tighten these policies once auth is enabled (attach user_id/workspace ownership).
alter table packlog_snapshots enable row level security;

drop policy if exists "packlog_snapshots_select" on packlog_snapshots;
create policy "packlog_snapshots_select"
on packlog_snapshots for select
to anon, authenticated
using (true);

drop policy if exists "packlog_snapshots_insert" on packlog_snapshots;
create policy "packlog_snapshots_insert"
on packlog_snapshots for insert
to anon, authenticated
with check (true);

drop policy if exists "packlog_snapshots_update" on packlog_snapshots;
create policy "packlog_snapshots_update"
on packlog_snapshots for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "packlog_snapshots_delete" on packlog_snapshots;
create policy "packlog_snapshots_delete"
on packlog_snapshots for delete
to anon, authenticated
using (true);
