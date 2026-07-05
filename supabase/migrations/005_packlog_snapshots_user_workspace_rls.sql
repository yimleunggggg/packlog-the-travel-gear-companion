-- Persisted Packlog snapshots are user-scoped. The anon key is public in the
-- browser, so policies must never allow arbitrary workspace access.
create table if not exists packlog_snapshots (
  workspace text primary key,
  schema_version integer not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_packlog_snapshots_updated_at on packlog_snapshots(updated_at desc);

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

alter table packlog_snapshots enable row level security;

drop policy if exists "packlog_snapshots_select" on packlog_snapshots;
drop policy if exists "packlog_snapshots_insert" on packlog_snapshots;
drop policy if exists "packlog_snapshots_update" on packlog_snapshots;
drop policy if exists "packlog_snapshots_delete" on packlog_snapshots;

create policy "packlog_snapshots_select"
on packlog_snapshots for select
to authenticated
using (workspace = ('u:' || auth.uid()::text));

create policy "packlog_snapshots_insert"
on packlog_snapshots for insert
to authenticated
with check (workspace = ('u:' || auth.uid()::text));

create policy "packlog_snapshots_update"
on packlog_snapshots for update
to authenticated
using (workspace = ('u:' || auth.uid()::text))
with check (workspace = ('u:' || auth.uid()::text));

create policy "packlog_snapshots_delete"
on packlog_snapshots for delete
to authenticated
using (workspace = ('u:' || auth.uid()::text));
