-- Lock packlog_snapshots to the authenticated user's own workspace.
-- Browser clients must only read/write rows whose workspace is `u:<auth.uid()>`.
DO $$
BEGIN
  IF to_regclass('public.packlog_snapshots') IS NOT NULL THEN
    ALTER TABLE public.packlog_snapshots ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "packlog_snapshots_select" ON public.packlog_snapshots;
    DROP POLICY IF EXISTS "packlog_snapshots_insert" ON public.packlog_snapshots;
    DROP POLICY IF EXISTS "packlog_snapshots_update" ON public.packlog_snapshots;
    DROP POLICY IF EXISTS "packlog_snapshots_delete" ON public.packlog_snapshots;
    DROP POLICY IF EXISTS "packlog_snapshots_select_own" ON public.packlog_snapshots;
    DROP POLICY IF EXISTS "packlog_snapshots_insert_own" ON public.packlog_snapshots;
    DROP POLICY IF EXISTS "packlog_snapshots_update_own" ON public.packlog_snapshots;
    DROP POLICY IF EXISTS "packlog_snapshots_delete_own" ON public.packlog_snapshots;

    CREATE POLICY "packlog_snapshots_select_own"
    ON public.packlog_snapshots FOR SELECT
    TO authenticated
    USING (workspace = ('u:' || auth.uid()::text));

    CREATE POLICY "packlog_snapshots_insert_own"
    ON public.packlog_snapshots FOR INSERT
    TO authenticated
    WITH CHECK (workspace = ('u:' || auth.uid()::text));

    CREATE POLICY "packlog_snapshots_update_own"
    ON public.packlog_snapshots FOR UPDATE
    TO authenticated
    USING (workspace = ('u:' || auth.uid()::text))
    WITH CHECK (workspace = ('u:' || auth.uid()::text));

    CREATE POLICY "packlog_snapshots_delete_own"
    ON public.packlog_snapshots FOR DELETE
    TO authenticated
    USING (workspace = ('u:' || auth.uid()::text));
  END IF;
END $$;
