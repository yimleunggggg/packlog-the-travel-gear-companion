-- Lock packlog_snapshots to authenticated user workspaces.
--
-- The browser client stores synced snapshots only under workspace `u:<auth.uid()>`.
-- Anonymous clients must not read or write shared/default workspaces.

ALTER TABLE public.packlog_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packlog_snapshots_select" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_insert" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_update" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_delete" ON public.packlog_snapshots;

CREATE POLICY "packlog_snapshots_select_own_workspace"
ON public.packlog_snapshots
FOR SELECT
TO authenticated
USING (workspace = 'u:' || auth.uid()::text);

CREATE POLICY "packlog_snapshots_insert_own_workspace"
ON public.packlog_snapshots
FOR INSERT
TO authenticated
WITH CHECK (workspace = 'u:' || auth.uid()::text);

CREATE POLICY "packlog_snapshots_update_own_workspace"
ON public.packlog_snapshots
FOR UPDATE
TO authenticated
USING (workspace = 'u:' || auth.uid()::text)
WITH CHECK (workspace = 'u:' || auth.uid()::text);

CREATE POLICY "packlog_snapshots_delete_own_workspace"
ON public.packlog_snapshots
FOR DELETE
TO authenticated
USING (workspace = 'u:' || auth.uid()::text);
