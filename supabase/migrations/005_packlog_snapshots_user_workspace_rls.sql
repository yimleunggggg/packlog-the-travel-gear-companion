-- Lock snapshot sync to authenticated user-owned workspaces.
alter table public.packlog_snapshots enable row level security;

drop policy if exists "packlog_snapshots_select" on public.packlog_snapshots;
drop policy if exists "packlog_snapshots_insert" on public.packlog_snapshots;
drop policy if exists "packlog_snapshots_update" on public.packlog_snapshots;
drop policy if exists "packlog_snapshots_delete" on public.packlog_snapshots;

create policy "packlog_snapshots_select_own_workspace"
on public.packlog_snapshots for select
to authenticated
using (workspace = ('u:' || (select auth.uid())::text));

create policy "packlog_snapshots_insert_own_workspace"
on public.packlog_snapshots for insert
to authenticated
with check (workspace = ('u:' || (select auth.uid())::text));

create policy "packlog_snapshots_update_own_workspace"
on public.packlog_snapshots for update
to authenticated
using (workspace = ('u:' || (select auth.uid())::text))
with check (workspace = ('u:' || (select auth.uid())::text));

create policy "packlog_snapshots_delete_own_workspace"
on public.packlog_snapshots for delete
to authenticated
using (workspace = ('u:' || (select auth.uid())::text));
