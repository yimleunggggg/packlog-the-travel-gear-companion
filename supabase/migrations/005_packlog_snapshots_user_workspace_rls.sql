-- Lock packlog snapshots to the signed-in user's own workspace.
-- Anonymous sessions use browser storage and must not read or write shared cloud snapshots.

alter table packlog_snapshots enable row level security;

drop policy if exists "packlog_snapshots_select" on packlog_snapshots;
drop policy if exists "packlog_snapshots_insert" on packlog_snapshots;
drop policy if exists "packlog_snapshots_update" on packlog_snapshots;
drop policy if exists "packlog_snapshots_delete" on packlog_snapshots;
drop policy if exists "packlog_snapshots_select_own_workspace" on packlog_snapshots;
drop policy if exists "packlog_snapshots_insert_own_workspace" on packlog_snapshots;
drop policy if exists "packlog_snapshots_update_own_workspace" on packlog_snapshots;
drop policy if exists "packlog_snapshots_delete_own_workspace" on packlog_snapshots;

create policy "packlog_snapshots_select_own_workspace"
on packlog_snapshots for select
to authenticated
using (workspace = ('u:' || auth.uid()::text));

create policy "packlog_snapshots_insert_own_workspace"
on packlog_snapshots for insert
to authenticated
with check (workspace = ('u:' || auth.uid()::text));

create policy "packlog_snapshots_update_own_workspace"
on packlog_snapshots for update
to authenticated
using (workspace = ('u:' || auth.uid()::text))
with check (workspace = ('u:' || auth.uid()::text));

create policy "packlog_snapshots_delete_own_workspace"
on packlog_snapshots for delete
to authenticated
using (workspace = ('u:' || auth.uid()::text));
