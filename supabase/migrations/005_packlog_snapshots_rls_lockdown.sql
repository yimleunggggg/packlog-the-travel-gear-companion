-- packlog_snapshots stores a user's full PACKLOG state.
-- Only authenticated users may read/write the workspace that matches their Supabase uid.

ALTER TABLE public.packlog_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packlog_snapshots_select" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_select"
ON public.packlog_snapshots FOR SELECT
TO authenticated
USING (
  (select auth.uid()) IS NOT NULL
  AND workspace = ('u:' || (select auth.uid())::text)
);

DROP POLICY IF EXISTS "packlog_snapshots_insert" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_insert"
ON public.packlog_snapshots FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) IS NOT NULL
  AND workspace = ('u:' || (select auth.uid())::text)
);

DROP POLICY IF EXISTS "packlog_snapshots_update" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_update"
ON public.packlog_snapshots FOR UPDATE
TO authenticated
USING (
  (select auth.uid()) IS NOT NULL
  AND workspace = ('u:' || (select auth.uid())::text)
)
WITH CHECK (
  (select auth.uid()) IS NOT NULL
  AND workspace = ('u:' || (select auth.uid())::text)
);

DROP POLICY IF EXISTS "packlog_snapshots_delete" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_delete"
ON public.packlog_snapshots FOR DELETE
TO authenticated
USING (
  (select auth.uid()) IS NOT NULL
  AND workspace = ('u:' || (select auth.uid())::text)
);
