-- Lock packlog snapshots to the signed-in user's workspace.
-- Anonymous clients must not read or write the shared/default snapshot row.

create table if not exists public.packlog_snapshots (
  workspace text primary key,
  schema_version integer not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_packlog_snapshots_updated_at
on public.packlog_snapshots(updated_at desc);

alter table public.packlog_snapshots enable row level security;

drop policy if exists "packlog_snapshots_select" on public.packlog_snapshots;
drop policy if exists "packlog_snapshots_insert" on public.packlog_snapshots;
drop policy if exists "packlog_snapshots_update" on public.packlog_snapshots;
drop policy if exists "packlog_snapshots_delete" on public.packlog_snapshots;

create policy "packlog_snapshots_select_own_workspace"
on public.packlog_snapshots
for select
to authenticated
using (workspace = ('u:' || auth.uid()::text));

create policy "packlog_snapshots_insert_own_workspace"
on public.packlog_snapshots
for insert
to authenticated
with check (workspace = ('u:' || auth.uid()::text));

create policy "packlog_snapshots_update_own_workspace"
on public.packlog_snapshots
for update
to authenticated
using (workspace = ('u:' || auth.uid()::text))
with check (workspace = ('u:' || auth.uid()::text));

create policy "packlog_snapshots_delete_own_workspace"
on public.packlog_snapshots
for delete
to authenticated
using (workspace = ('u:' || auth.uid()::text));
