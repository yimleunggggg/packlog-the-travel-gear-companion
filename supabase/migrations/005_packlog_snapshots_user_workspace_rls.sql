-- Lock packlog_snapshots to the authenticated user's own workspace.
-- Frontend workspaces are always `u:<auth.uid()>`; anonymous clients must not read or write snapshots.

ALTER TABLE public.packlog_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packlog_snapshots_select" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_select"
ON public.packlog_snapshots
FOR SELECT
TO authenticated
USING (workspace = ('u:' || auth.uid()::text));

DROP POLICY IF EXISTS "packlog_snapshots_insert" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_insert"
ON public.packlog_snapshots
FOR INSERT
TO authenticated
WITH CHECK (workspace = ('u:' || auth.uid()::text));

DROP POLICY IF EXISTS "packlog_snapshots_update" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_update"
ON public.packlog_snapshots
FOR UPDATE
TO authenticated
USING (workspace = ('u:' || auth.uid()::text))
WITH CHECK (workspace = ('u:' || auth.uid()::text));

DROP POLICY IF EXISTS "packlog_snapshots_delete" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_delete"
ON public.packlog_snapshots
FOR DELETE
TO authenticated
USING (workspace = ('u:' || auth.uid()::text));
