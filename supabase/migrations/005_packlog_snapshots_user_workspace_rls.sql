-- packlog_snapshots：用户快照只能由所属登录用户读写。
-- 前端 workspace 固定为 `u:<auth.uid()>`；无登录用户不应写入 Supabase。

CREATE TABLE IF NOT EXISTS public.packlog_snapshots (
  workspace text PRIMARY KEY,
  snapshot jsonb NOT NULL,
  schema_version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.packlog_snapshots ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.packlog_snapshots FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packlog_snapshots TO authenticated;

DROP POLICY IF EXISTS "Users can select own packlog snapshots" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "Users can insert own packlog snapshots" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "Users can update own packlog snapshots" ON public.packlog_snapshots;
DROP POLICY IF EXISTS "Users can delete own packlog snapshots" ON public.packlog_snapshots;

CREATE POLICY "Users can select own packlog snapshots"
  ON public.packlog_snapshots
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) IS NOT NULL
    AND workspace = 'u:' || (select auth.uid())::text
  );

CREATE POLICY "Users can insert own packlog snapshots"
  ON public.packlog_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND workspace = 'u:' || (select auth.uid())::text
  );

CREATE POLICY "Users can update own packlog snapshots"
  ON public.packlog_snapshots
  FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) IS NOT NULL
    AND workspace = 'u:' || (select auth.uid())::text
  )
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND workspace = 'u:' || (select auth.uid())::text
  );

CREATE POLICY "Users can delete own packlog snapshots"
  ON public.packlog_snapshots
  FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) IS NOT NULL
    AND workspace = 'u:' || (select auth.uid())::text
  );
