-- 收紧 packlog_snapshots：每个认证用户只能读写自己的 u:<auth.uid()> 快照。
-- 匿名体验走浏览器 localStorage，不再使用共享的 Supabase default workspace。

ALTER TABLE public.packlog_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packlog_snapshots_select" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_insert" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_update" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_delete" ON public.packlog_snapshots;

CREATE POLICY "packlog_snapshots_select_own"
ON public.packlog_snapshots
FOR SELECT
TO authenticated
USING (workspace = ('u:' || auth.uid()::text));

CREATE POLICY "packlog_snapshots_insert_own"
ON public.packlog_snapshots
FOR INSERT
TO authenticated
WITH CHECK (workspace = ('u:' || auth.uid()::text));

CREATE POLICY "packlog_snapshots_update_own"
ON public.packlog_snapshots
FOR UPDATE
TO authenticated
USING (workspace = ('u:' || auth.uid()::text))
WITH CHECK (workspace = ('u:' || auth.uid()::text));

CREATE POLICY "packlog_snapshots_delete_own"
ON public.packlog_snapshots
FOR DELETE
TO authenticated
USING (workspace = ('u:' || auth.uid()::text));
