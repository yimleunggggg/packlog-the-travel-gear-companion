-- Lock packlog_snapshots to the authenticated user's own workspace.
-- Browser clients use workspace = 'u:' || auth.uid(); anon users must stay in local storage.

ALTER TABLE public.packlog_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packlog_snapshots_select" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_insert" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_update" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_delete" ON public.packlog_snapshots;

CREATE POLICY "packlog_snapshots_select"
ON public.packlog_snapshots
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND workspace = ('u:' || auth.uid()::text));

CREATE POLICY "packlog_snapshots_insert"
ON public.packlog_snapshots
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND workspace = ('u:' || auth.uid()::text));

CREATE POLICY "packlog_snapshots_update"
ON public.packlog_snapshots
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND workspace = ('u:' || auth.uid()::text))
WITH CHECK (auth.uid() IS NOT NULL AND workspace = ('u:' || auth.uid()::text));

CREATE POLICY "packlog_snapshots_delete"
ON public.packlog_snapshots
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND workspace = ('u:' || auth.uid()::text));
