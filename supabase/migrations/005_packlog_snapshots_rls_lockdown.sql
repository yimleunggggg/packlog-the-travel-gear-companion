-- 收紧 packlog_snapshots：仅允许已登录用户读写自己的 u:<auth.uid()> 快照。
-- 访客数据保留在浏览器 localStorage，不再写入 Supabase 共享 workspace。

CREATE TABLE IF NOT EXISTS public.packlog_snapshots (
  workspace text PRIMARY KEY,
  schema_version integer NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_packlog_snapshots_updated_at
  ON public.packlog_snapshots(updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_timestamp_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_packlog_snapshots_updated_at ON public.packlog_snapshots;
CREATE TRIGGER trg_packlog_snapshots_updated_at
BEFORE UPDATE ON public.packlog_snapshots
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_updated_at();

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
