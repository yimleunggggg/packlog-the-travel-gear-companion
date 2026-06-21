-- 收紧 packlog_snapshots：浏览器客户端只能访问自己的 `u:<auth.uid()>` 快照。
-- anon 不再拥有任何快照策略；service_role 仍可按 Supabase 默认行为绕过 RLS。

ALTER TABLE public.packlog_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packlog_snapshots_select" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_select"
ON public.packlog_snapshots FOR SELECT
TO authenticated
USING (workspace = ('u:' || auth.uid()::text));

DROP POLICY IF EXISTS "packlog_snapshots_insert" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_insert"
ON public.packlog_snapshots FOR INSERT
TO authenticated
WITH CHECK (workspace = ('u:' || auth.uid()::text));

DROP POLICY IF EXISTS "packlog_snapshots_update" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_update"
ON public.packlog_snapshots FOR UPDATE
TO authenticated
USING (workspace = ('u:' || auth.uid()::text))
WITH CHECK (workspace = ('u:' || auth.uid()::text));

DROP POLICY IF EXISTS "packlog_snapshots_delete" ON public.packlog_snapshots;
CREATE POLICY "packlog_snapshots_delete"
ON public.packlog_snapshots FOR DELETE
TO authenticated
USING (workspace = ('u:' || auth.uid()::text));
