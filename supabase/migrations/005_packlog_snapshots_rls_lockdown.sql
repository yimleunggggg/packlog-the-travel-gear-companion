-- 收紧 packlog_snapshots：快照只能由已登录用户访问自己的 workspace。
--
-- 当前前端使用 workspace = 'u:' || auth.uid()::text 存储用户快照。
-- anon / 其他用户不应读取、覆盖或删除这些完整状态快照。

ALTER TABLE public.packlog_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packlog_snapshots_select" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_select"
ON public.packlog_snapshots FOR SELECT
TO authenticated
USING (workspace = 'u:' || auth.uid()::text);

DROP POLICY IF EXISTS "packlog_snapshots_insert" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_insert"
ON public.packlog_snapshots FOR INSERT
TO authenticated
WITH CHECK (workspace = 'u:' || auth.uid()::text);

DROP POLICY IF EXISTS "packlog_snapshots_update" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_update"
ON public.packlog_snapshots FOR UPDATE
TO authenticated
USING (workspace = 'u:' || auth.uid()::text)
WITH CHECK (workspace = 'u:' || auth.uid()::text);

DROP POLICY IF EXISTS "packlog_snapshots_delete" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_delete"
ON public.packlog_snapshots FOR DELETE
TO authenticated
USING (workspace = 'u:' || auth.uid()::text);
