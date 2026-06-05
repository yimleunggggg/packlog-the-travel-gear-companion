-- packlog_snapshots contains each user's full app snapshot. Never expose a shared
-- workspace through the browser anon key; authenticated users may only access
-- their own `u:<auth.uid()>` row.

ALTER TABLE public.packlog_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packlog_snapshots_select" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_insert" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_update" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_delete" ON public.packlog_snapshots;

CREATE POLICY "packlog_snapshots_select"
ON public.packlog_snapshots
FOR SELECT
TO authenticated
USING (workspace = ('u:' || (SELECT auth.uid())::text));

CREATE POLICY "packlog_snapshots_insert"
ON public.packlog_snapshots
FOR INSERT
TO authenticated
WITH CHECK (workspace = ('u:' || (SELECT auth.uid())::text));

CREATE POLICY "packlog_snapshots_update"
ON public.packlog_snapshots
FOR UPDATE
TO authenticated
USING (workspace = ('u:' || (SELECT auth.uid())::text))
WITH CHECK (workspace = ('u:' || (SELECT auth.uid())::text));

CREATE POLICY "packlog_snapshots_delete"
ON public.packlog_snapshots
FOR DELETE
TO authenticated
USING (workspace = ('u:' || (SELECT auth.uid())::text));
