-- Lock snapshot persistence to the authenticated user's workspace.
-- Browser clients now only use Supabase snapshots for workspaces shaped as u:<auth.uid()>.

ALTER TABLE packlog_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packlog_snapshots_select" ON packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_insert" ON packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_update" ON packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_delete" ON packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_select_own_workspace" ON packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_insert_own_workspace" ON packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_update_own_workspace" ON packlog_snapshots;
DROP POLICY IF EXISTS "packlog_snapshots_delete_own_workspace" ON packlog_snapshots;

CREATE POLICY "packlog_snapshots_select_own_workspace"
ON packlog_snapshots FOR SELECT
TO authenticated
USING (workspace = ('u:' || auth.uid()::text));

CREATE POLICY "packlog_snapshots_insert_own_workspace"
ON packlog_snapshots FOR INSERT
TO authenticated
WITH CHECK (workspace = ('u:' || auth.uid()::text));

CREATE POLICY "packlog_snapshots_update_own_workspace"
ON packlog_snapshots FOR UPDATE
TO authenticated
USING (workspace = ('u:' || auth.uid()::text))
WITH CHECK (workspace = ('u:' || auth.uid()::text));

CREATE POLICY "packlog_snapshots_delete_own_workspace"
ON packlog_snapshots FOR DELETE
TO authenticated
USING (workspace = ('u:' || auth.uid()::text));
